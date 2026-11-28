// Shared referral rules for the ASHA app and the PHC dashboard.
// A referral = a confirmed visit with at least one danger sign "present".

export const OVERDUE_HOURS = 24;

export interface ReferralRow {
  id: string;
  created_at: string;
  beneficiary_name: string | null;
  record?: {
    cohort?: string;
    danger_signs?: Record<string, string>;
    adolescent_danger_signs?: Record<string, string>;
    referral?: { acknowledged_at?: string };
  } | null;
}

export const SIGN_HI: Record<string, string> = {
  severe_headache: "तेज़ सिरदर्द",
  blurred_vision: "धुंधला दिखना",
  swelling: "सूजन",
  bleeding: "खून आना",
  reduced_fetal_movement: "हलचल कम",
  severe_pallor: "बहुत पीलापन",
  breathlessness: "साँस फूलना",
  heavy_bleeding: "ज़्यादा खून",
};

export function presentSigns(r: ReferralRow): string[] {
  const ds =
    r.record?.cohort === "adolescent" ? r.record?.adolescent_danger_signs : r.record?.danger_signs;
  return Object.entries(ds ?? {})
    .filter(([, v]) => v === "present")
    .map(([k]) => k);
}

export const isReferral = (r: ReferralRow) => presentSigns(r).length > 0;
export const isSeen = (r: ReferralRow) => !!r.record?.referral?.acknowledged_at;

export function hoursWaiting(r: ReferralRow, now: number): number {
  const t = new Date(r.created_at).getTime();
  return isNaN(t) ? 0 : Math.max(0, (now - t) / 3_600_000);
}

export const isOverdue = (r: ReferralRow, now: number) =>
  isReferral(r) && !isSeen(r) && hoursWaiting(r, now) >= OVERDUE_HOURS;

export function waitText(hours: number): string {
  if (hours < 1) return "अभी";
  if (hours < 24) return `${Math.floor(hours)} घंटे`;
  return `${Math.floor(hours / 24)} दिन`;
}

export function waitTextEn(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Same woman, more than one unseen referral. Matched on name for the demo;
// a pilot would match on the RCH / MCP card ID.
export function unseenCountByName(rows: ReferralRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!isReferral(r) || isSeen(r)) continue;
    const k = (r.beneficiary_name ?? "").trim().toLowerCase();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
export const nameKey = (r: ReferralRow) => (r.beneficiary_name ?? "").trim().toLowerCase();

// One-tap WhatsApp reminder (click-to-chat: no API, no cost, any phone).
export function reminderLink(r: ReferralRow, hours: number, repeat: number): string {
  const signs = presentSigns(r).map((k) => SIGN_HI[k] ?? k).join(", ");
  const date = new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const lines = [
    "ASHA Awaaz · रेफ़रल रिमाइंडर",
    `${r.beneficiary_name ?? "—"} (${signs}) को ${date} को PHC रेफर किया था।`,
    `${waitText(hours)} से इंतज़ार, अभी तक देखा नहीं गया।`,
    repeat >= 2 ? `यह ${repeat} बार रेफर हो चुकी है।` : "",
    "कृपया आज देखें।",
  ].filter(Boolean);
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}
