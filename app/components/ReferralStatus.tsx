"use client";

// The ASHA's side of the referral loop: her recent referrals and whether the
// PHC has seen each one. Reads /api/visits; renders nothing in local mode or
// when there are no referrals.

import { useEffect, useState } from "react";

interface Row {
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

function referred(r: Row): boolean {
  const ds =
    r.record?.cohort === "adolescent" ? r.record?.adolescent_danger_signs : r.record?.danger_signs;
  return !!ds && Object.values(ds).includes("present");
}

const SIGN_HI: Record<string, string> = {
  severe_headache: "तेज़ सिरदर्द",
  blurred_vision: "धुंधला दिखना",
  swelling: "सूजन",
  bleeding: "खून आना",
  reduced_fetal_movement: "हलचल कम",
  severe_pallor: "बहुत पीलापन",
  breathlessness: "साँस फूलना",
  heavy_bleeding: "ज़्यादा खून",
};

function signs(r: Row): string {
  const ds =
    r.record?.cohort === "adolescent" ? r.record?.adolescent_danger_signs : r.record?.danger_signs;
  return Object.entries(ds ?? {})
    .filter(([, v]) => v === "present")
    .map(([k]) => SIGN_HI[k] ?? k)
    .join(" · ");
}

function when(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function ReferralStatus() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/visits", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { mode?: string; visits?: Row[] }) => {
        if (!active || data.mode !== "live") return;
        setRows((data.visits ?? []).filter(referred).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="aa-card aa-refs" aria-label="My referrals">
      <p className="aa-refs-title">
        मेरे रेफ़रल <span>· My referrals</span>
      </p>
      <ul>
        {rows.map((r) => {
          const seen = r.record?.referral?.acknowledged_at;
          return (
            <li key={r.id} data-seen={!!seen}>
              <span className="aa-refs-who">
                <b>{r.beneficiary_name ?? "—"}</b>
                <small>
                  {when(r.created_at)} · {signs(r)}
                </small>
              </span>
              <span className="aa-refs-status">
                {seen ? `✓ PHC ने देखा · ${when(seen)}` : "⏳ PHC को भेजा · इंतज़ार"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
