// ASHA Awaaz — PHC dashboard (read view).
//
// The output half: every confirmed visit note rolls up here for a PHC
// supervisor. Reads /api/visits (denormalised columns + the full `record`
// jsonb) and surfaces the at-risk signals — danger signs, high BP, iron/IFA
// not taken, follow-ups due — cohort-aware, so a pregnant woman and an
// adolescent girl each show the signals that matter for her.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import "./dashboard.css";

type Cohort = "pregnant" | "adolescent";

// The denormalised columns, plus the full record for cohort-aware derivation.
interface VisitRow {
  id: string;
  created_at: string;
  beneficiary_name: string | null;
  gestational_week: number | null;
  bp_status: string | null;
  iron_compliance: string | null;
  follow_up_needed: boolean | null;
  record?: {
    cohort?: Cohort;
    beneficiary?: { age?: { value?: number | null } };
    assessment?: { bp_status?: string | null; iron_compliance?: string | null };
    adolescent?: { ifa_compliance?: string | null; pallor?: string | null };
    danger_signs?: Record<string, string>;
    adolescent_danger_signs?: Record<string, string>;
  } | null;
}

type LoadState = "loading" | "live" | "local" | "error";

const BP_LABEL: Record<string, string> = {
  normal: "Normal",
  high: "High",
  low: "Low",
  not_measured: "Not measured",
};
const IRON_LABEL: Record<string, string> = {
  taking: "Taking",
  not_taking: "Not taking",
  partial: "Partial",
};

// Short Hindi-script labels for danger signs flagged on a row (both cohorts).
const DANGER_SHORT: Record<string, string> = {
  severe_headache: "सिरदर्द",
  blurred_vision: "धुंधला",
  swelling: "सूजन",
  bleeding: "रक्तस्राव",
  reduced_fetal_movement: "हलचल कम",
  severe_pallor: "पीलापन",
  breathlessness: "साँस",
  heavy_bleeding: "रक्तस्राव",
};

function cohortOf(r: VisitRow): Cohort {
  return r.record?.cohort === "adolescent" ? "adolescent" : "pregnant";
}

// Names of danger signs marked "present", from whichever cohort set applies.
function presentDangers(r: VisitRow): string[] {
  const ds =
    cohortOf(r) === "adolescent"
      ? r.record?.adolescent_danger_signs
      : r.record?.danger_signs;
  if (!ds) return [];
  return Object.keys(ds).filter((k) => ds[k] === "present");
}

// Iron/IFA compliance, cohort-aware (pregnant → iron, adolescent → blue IFA).
function ironStatus(r: VisitRow): string | null {
  return cohortOf(r) === "adolescent"
    ? (r.record?.adolescent?.ifa_compliance ?? null)
    : (r.record?.assessment?.iron_compliance ?? r.iron_compliance ?? null);
}

// Short cohort-appropriate detail cell.
function detailOf(r: VisitRow): string {
  if (cohortOf(r) === "adolescent") {
    const age = r.record?.beneficiary?.age?.value;
    const pallor = r.record?.adolescent?.pallor;
    const bits = [age != null ? `${age}y` : null, pallor === "present" ? "pallor" : null].filter(
      Boolean,
    );
    return bits.length ? bits.join(" · ") : "—";
  }
  const parts = [
    r.gestational_week != null ? `Week ${r.gestational_week}` : null,
    r.bp_status ? BP_LABEL[r.bp_status] ?? r.bp_status : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DashboardPage() {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/visits", { cache: "no-store" });
      const data = (await res.json()) as { mode?: string; visits?: VisitRow[] };
      setRows(data.visits ?? []);
      setState(data.mode === "live" ? "live" : "local");
    } catch {
      setState("error");
    }
  }, []);

  // Initial fetch on mount. setState runs in the promise callback (after the
  // request resolves), not synchronously in the effect.
  useEffect(() => {
    let active = true;
    fetch("/api/visits", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { mode?: string; visits?: VisitRow[] }) => {
        if (!active) return;
        setRows(data.visits ?? []);
        setState(data.mode === "live" ? "live" : "local");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const total = rows.length;
  const danger = rows.filter((r) => presentDangers(r).length > 0).length;
  const highBp = rows.filter((r) => r.bp_status === "high").length;
  const noIron = rows.filter((r) => ironStatus(r) === "not_taking").length;
  const followUps = rows.filter((r) => r.follow_up_needed === true).length;

  return (
    <div className="phc-root">
      <div className="phc-shell">
        <header className="phc-top">
          <div>
            <h1 className="phc-title">PHC Dashboard</h1>
            <p className="phc-sub">ASHA visit log · maternal & adolescent health</p>
          </div>
          <div className="phc-actions">
            <span className="phc-chip" data-state={state}>
              <span className="phc-dot" />
              {state === "live"
                ? "Live"
                : state === "loading"
                  ? "Loading…"
                  : state === "error"
                    ? "Error"
                    : "No datastore"}
            </span>
            <button type="button" className="phc-btn" onClick={load}>
              ↻ Refresh
            </button>
          </div>
        </header>

        <section className="phc-tiles">
          <Tile label="Visits logged" value={total} />
          <Tile label="Danger signs" value={danger} tone={danger ? "warn" : "ok"} />
          <Tile label="High BP" value={highBp} tone={highBp ? "warn" : "ok"} />
          <Tile label="Iron/IFA not taken" value={noIron} tone={noIron ? "warn" : "ok"} />
          <Tile label="Follow-ups due" value={followUps} tone={followUps ? "info" : "ok"} />
        </section>

        {state === "loading" ? (
          <p className="phc-empty">Loading visits…</p>
        ) : rows.length === 0 ? (
          <p className="phc-empty">
            No visits logged yet. Confirm a visit in the{" "}
            <Link href="/">ASHA Awaaz app</Link> and it appears here.
          </p>
        ) : (
          <div className="phc-tablewrap">
            <table className="phc-table">
              <thead>
                <tr>
                  <th>Beneficiary</th>
                  <th>For</th>
                  <th>Danger signs</th>
                  <th>Detail</th>
                  <th>Iron / IFA</th>
                  <th>Follow-up</th>
                  <th>Logged</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const dangers = presentDangers(r);
                  const cohort = cohortOf(r);
                  const iron = ironStatus(r);
                  const atRisk =
                    dangers.length > 0 ||
                    r.bp_status === "high" ||
                    iron === "not_taking" ||
                    r.follow_up_needed === true;
                  return (
                    <tr key={r.id} data-risk={atRisk} data-danger={dangers.length > 0}>
                      <td className="phc-name">{r.beneficiary_name ?? "—"}</td>
                      <td>
                        <span className="phc-cohort" data-cohort={cohort}>
                          {cohort === "adolescent" ? "किशोरी" : "गर्भवती"}
                        </span>
                      </td>
                      <td>
                        {dangers.length > 0 ? (
                          <span className="phc-danger-cell">
                            {dangers.map((d) => (
                              <span key={d} className="phc-pill" data-tone="danger">
                                {DANGER_SHORT[d] ?? d}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="phc-muted">—</span>
                        )}
                      </td>
                      <td>{detailOf(r)}</td>
                      <td>
                        {iron ? (
                          <span
                            className="phc-pill"
                            data-tone={
                              iron === "not_taking"
                                ? "warn"
                                : iron === "partial"
                                  ? "info"
                                  : "ok"
                            }
                          >
                            {IRON_LABEL[iron] ?? iron}
                          </span>
                        ) : (
                          <span className="phc-muted">—</span>
                        )}
                      </td>
                      <td>
                        {r.follow_up_needed == null ? (
                          <span className="phc-muted">—</span>
                        ) : r.follow_up_needed ? (
                          <span className="phc-pill" data-tone="info">Due</span>
                        ) : (
                          <span className="phc-muted">No</span>
                        )}
                      </td>
                      <td className="phc-muted">{fmtDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="phc-footer">
          <Link href="/">← Back to ASHA Awaaz</Link>
          <span>Synthetic data only · structured record is the source of truth</span>
        </footer>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "ok",
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "info";
}) {
  return (
    <div className="phc-tile" data-tone={tone}>
      <div className="phc-tile-value">{value}</div>
      <div className="phc-tile-label">{label}</div>
    </div>
  );
}
