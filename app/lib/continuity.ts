// ASHA Awaaz — cross-visit check ("28 weeks last time, 22 now?").
//
// Each visit is validated on its own; this adds memory across visits. When
// the new note has a pregnancy week (or age), find the same woman's last saved
// visit, work out what the number should be today, and flag a big mismatch.
// It never changes the value itself: she decides, one tap.
//
// Limit: matches by name. Two women with the same name in one area can be
// confused. At scale: match by MCP card / RCH ID.

export const WEEK_TOLERANCE = 2; // weeks of slack (dates are spoken roughly)

export interface PastVisit {
  id: string;
  created_at: string;
  beneficiary_name: string | null;
  gestational_week?: number | null;
  record?: {
    cohort?: string;
    beneficiary?: { age?: { value?: number | null } };
  } | null;
}

export interface ContinuityFlag {
  field: "gestational_week" | "age";
  said: number;
  expected: number;
  prevValue: number;
  prevDate: string; // ISO
  daysAgo: number;
}

const DAY = 86_400_000;
const key = (s: string | null | undefined) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function checkContinuity(
  note: {
    visit_id: string;
    cohort: string;
    created_at: string;
    beneficiary: { name: string | null; age: { value: number | null }; gestational_week: number | null };
  },
  visits: PastVisit[],
): ContinuityFlag[] {
  const name = key(note.beneficiary.name);
  if (!name) return [];
  const now = new Date(note.created_at).getTime();

  const past = visits
    .filter(
      (v) =>
        v.id !== note.visit_id &&
        key(v.beneficiary_name) === name &&
        (v.record?.cohort ?? "pregnant") === note.cohort &&
        new Date(v.created_at).getTime() < now,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const flags: ContinuityFlag[] = [];

  // Pregnancy week: last week + whole weeks since.
  const said = note.beneficiary.gestational_week;
  const lastWeek = past.find((v) => typeof v.gestational_week === "number");
  if (note.cohort === "pregnant" && said != null && lastWeek) {
    const days = Math.floor((now - new Date(lastWeek.created_at).getTime()) / DAY);
    const expected = (lastWeek.gestational_week as number) + Math.floor(days / 7);
    if (Math.abs(said - expected) > WEEK_TOLERANCE && expected <= 45) {
      flags.push({
        field: "gestational_week",
        said,
        expected,
        prevValue: lastWeek.gestational_week as number,
        prevDate: lastWeek.created_at,
        daysAgo: days,
      });
    }
  }

  // Age: can't go down, and can't jump more than the years that passed (+1).
  const age = note.beneficiary.age.value;
  const lastAge = past.find((v) => typeof v.record?.beneficiary?.age?.value === "number");
  if (age != null && lastAge) {
    const prev = lastAge.record!.beneficiary!.age!.value as number;
    const days = Math.floor((now - new Date(lastAge.created_at).getTime()) / DAY);
    const years = Math.floor(days / 365);
    if (age < prev || age > prev + years + 1) {
      flags.push({
        field: "age",
        said: age,
        expected: prev + years,
        prevValue: prev,
        prevDate: lastAge.created_at,
        daysAgo: days,
      });
    }
  }
  return flags;
}
