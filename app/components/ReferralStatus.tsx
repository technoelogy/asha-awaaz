"use client";

// The ASHA's side of the referral loop: her recent referrals, whether the PHC
// has seen each one, how long it has waited, repeat referrals of the same
// woman, and a one-tap WhatsApp reminder when a referral is overdue or repeated.

import { useEffect, useState } from "react";
import {
  OVERDUE_HOURS,
  SIGN_HI,
  hoursWaiting,
  isReferral,
  isSeen,
  nameKey,
  presentSigns,
  reminderLink,
  unseenCountByName,
  waitText,
  type ReferralRow,
} from "../lib/referrals";

function when(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function ReferralStatus() {
  const [all, setAll] = useState<ReferralRow[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/visits", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { mode?: string; visits?: ReferralRow[] }) => {
        if (!active || data.mode !== "live") return;
        setAll((data.visits ?? []).filter(isReferral));
        setNow(Date.now());
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (all.length === 0) return null;
  const repeats = unseenCountByName(all);
  const rows = all.slice(0, 3);
  const waiting = all.filter((r) => !isSeen(r)).length;

  return (
    <section className="aa-card aa-refs" aria-label="My referrals">
      <p className="aa-refs-title">
        मेरे रेफ़रल <span>· My referrals</span>
        {waiting > 0 && <em className="aa-refs-count">{waiting} इंतज़ार में</em>}
      </p>
      <ul>
        {rows.map((r) => {
          const seen = r.record?.referral?.acknowledged_at;
          const hrs = hoursWaiting(r, now);
          const overdue = !seen && hrs >= OVERDUE_HOURS;
          const repeat = seen ? 0 : (repeats.get(nameKey(r)) ?? 0);
          const state = seen ? "seen" : overdue ? "overdue" : "waiting";
          return (
            <li key={r.id} data-state={state}>
              <div className="aa-refs-row">
                <span className="aa-refs-who">
                  <b>{r.beneficiary_name ?? "—"}</b>
                  <small>
                    {when(r.created_at)} · {presentSigns(r).map((k) => SIGN_HI[k] ?? k).join(" · ")}
                  </small>
                </span>
                <span className="aa-refs-status">
                  {seen
                    ? `✓ PHC ने देखा · ${when(seen)}`
                    : overdue
                      ? `⚠ ${waitText(hrs)} से इंतज़ार`
                      : `⏳ ${waitText(hrs)} से इंतज़ार`}
                </span>
              </div>
              {repeat >= 2 && (
                <p className="aa-refs-flag">🔁 {repeat} बार रेफर · अब तक नहीं देखा</p>
              )}
              {(overdue || repeat >= 2) && (
                <a className="aa-refs-remind" href={reminderLink(r, hrs, repeat)} target="_blank" rel="noreferrer">
                  📲 PHC को याद दिलाएँ
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <p className="aa-refs-note">24 घंटे में न देखा जाए तो लाल हो जाता है।</p>
    </section>
  );
}
