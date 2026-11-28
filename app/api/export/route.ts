// ASHA Awaaz — register export.  GET /api/export
//
// Downloads every confirmed visit as a CSV laid out in the fields a
// mother-and-child (RCH-style) register tracks, so a health centre can file
// or upload it without anyone re-typing a visit. UTF-8 with BOM so Excel
// renders Hindi names correctly.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rec = {
  cohort?: string;
  visit_id?: string;
  created_at?: string;
  language?: string;
  source?: string;
  beneficiary?: { name?: string | null; age?: { value?: number | null }; gestational_week?: number | null };
  assessment?: { bp_status?: string | null; iron_compliance?: string | null };
  adolescent?: { ifa_compliance?: string | null; pallor?: string | null; in_school?: string | null };
  follow_up?: { needed?: boolean | null };
  danger_signs?: Record<string, string>;
  adolescent_danger_signs?: Record<string, string>;
  uncertain_fields?: string[];
  referral?: { acknowledged_at?: string };
};

const DANGER_EN: Record<string, string> = {
  severe_headache: "Severe headache",
  blurred_vision: "Blurred vision",
  swelling: "Swelling of hands/face",
  bleeding: "Bleeding",
  reduced_fetal_movement: "Reduced fetal movement",
  severe_pallor: "Severe pallor",
  breathlessness: "Breathlessness",
  heavy_bleeding: "Heavy menstrual bleeding",
};

function cfg() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  let u = url.replace(/\/$/, "");
  if (!/^https?:\/\//.test(u)) u = u.includes(".") ? `https://${u}` : `https://${u}.supabase.co`;
  return { url: u, key };
}

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const yn = (b: boolean | null | undefined) => (b == null ? "Not stated" : b ? "Yes" : "No");
const nice = (v: string | null | undefined) => (v ? v.replace(/_/g, " ") : "Not stated");

export async function GET() {
  const c = cfg();
  let rows: { id: string; created_at: string; record: Rec | null }[] = [];
  if (c) {
    const res = await fetch(
      `${c.url}/rest/v1/visit_notes?select=id,created_at,record&order=created_at.desc&limit=1000`,
      { headers: { apikey: c.key, authorization: `Bearer ${c.key}` }, cache: "no-store" },
    );
    if (!res.ok) return Response.json({ error: "export_failed" }, { status: 502 });
    rows = await res.json();
  }

  const header = [
    "Visit date",
    "Visit ID",
    "Beneficiary type",
    "Name",
    "Age (years)",
    "Week of pregnancy",
    "BP status",
    "Iron / IFA tablets",
    "Danger signs present",
    "High risk (Y/N)",
    "Referred to PHC",
    "Referral seen by PHC",
    "Follow-up needed",
    "Not stated / unclear fields",
    "Captured by",
  ];

  const lines = rows.map((row) => {
    const r = row.record ?? {};
    const adol = r.cohort === "adolescent";
    const ds = (adol ? r.adolescent_danger_signs : r.danger_signs) ?? {};
    const present = Object.keys(ds).filter((k) => ds[k] === "present");
    const referred = present.length > 0;
    const seen = r.referral?.acknowledged_at;
    return [
      new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      row.id,
      adol ? "Adolescent girl (RKSK/WIFS)" : "Pregnant woman (ANC)",
      r.beneficiary?.name ?? "Not stated",
      r.beneficiary?.age?.value ?? "Not stated",
      adol ? "N/A" : (r.beneficiary?.gestational_week ?? "Not stated"),
      adol ? "N/A" : nice(r.assessment?.bp_status),
      nice(adol ? r.adolescent?.ifa_compliance : r.assessment?.iron_compliance),
      present.map((k) => DANGER_EN[k] ?? k).join("; ") || "None stated",
      referred ? "Y" : "N",
      referred ? "Yes" : "No",
      referred ? (seen ? new Date(seen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Pending") : "N/A",
      yn(r.follow_up?.needed),
      (r.uncertain_fields ?? []).join("; ") || "None",
      `ASHA Awaaz (${r.source ?? "voice"}, ${r.language ?? "hi"})`,
    ]
      .map(cell)
      .join(",");
  });

  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="asha-awaaz-register-${date}.csv"`,
    },
  });
}
