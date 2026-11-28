// ASHA Awaaz — "28 weeks last time, 22 now?" on the confirm screen.
// Loads her past visits once, compares, and offers two taps: keep or correct.
"use client";

import { useEffect, useState } from "react";
import { checkContinuity, type ContinuityFlag, type PastVisit } from "../lib/continuity";
import type { VisitNote } from "../lib/schema";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function ContinuityCheck({
  note,
  onFix,
}: {
  note: VisitNote;
  onFix: (field: "gestational_week" | "age", value: number) => void;
}) {
  const [visits, setVisits] = useState<PastVisit[] | null>(null);
  const [kept, setKept] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch("/api/visits", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { visits?: PastVisit[] }) => {
        if (alive) setVisits(d.visits ?? []);
      })
      .catch(() => {
        if (alive) setVisits([]); // offline: skip the check, never block saving
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!visits) return null;
  const flags = checkContinuity(note, visits).filter((f) => !kept.has(`${f.field}:${f.said}`));
  if (flags.length === 0) return null;

  return (
    <div className="aa-continuity" role="alert">
      {flags.map((f: ContinuityFlag) => {
        const unit = f.field === "gestational_week" ? "हफ्ते" : "साल";
        const what = f.field === "gestational_week" ? "गर्भ" : "उम्र";
        return (
          <div key={f.field} className="aa-continuity-row">
            <p>
              <b>पिछली विज़िट ({fmtDate(f.prevDate)})</b> में {what} {f.prevValue} {unit} {f.field === "age" ? "थी" : "था"}।{" "}
              {f.field === "gestational_week"
                ? `${f.daysAgo} दिन बाद अब लगभग ${f.expected} ${unit} होना चाहिए।`
                : `उम्र कम नहीं हो सकती।`}{" "}
              <b>
                {f.said} {unit} सही है?
              </b>
            </p>
            <div className="aa-row">
              <button
                type="button"
                className="aa-btn aa-btn-sm"
                data-variant="ghost"
                onClick={() => setKept(new Set(kept).add(`${f.field}:${f.said}`))}
              >
                हाँ, {f.said} सही है
              </button>
              <button type="button" className="aa-btn aa-btn-sm" onClick={() => onFix(f.field, f.expected)}>
                {f.expected} करें
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
