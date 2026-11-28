import type { Metadata } from "next";
import Link from "next/link";
import PreviewShell from "./PreviewShell";
import { PREVIEWS } from "../lib/previews";

export const metadata: Metadata = { title: "ASHA Awaaz | Coming next" };

export default function NextIndex() {
  return (
    <PreviewShell>
      <div className="aa-card">
        <h1 className="aa-h1">आगे क्या आ रहा है</h1>
        <p className="aa-sub">
          Same voice, same safety rules, three more visits she already makes. Each one maps to an
          existing MoHFW form, so nothing new is added to her day.
        </p>
        <div className="aa-cohorts">
          {PREVIEWS.map((p) => (
            <Link key={p.slug} href={`/next/${p.slug}`} className="aa-cohort nx-link">
              <span className="aa-cohort-emoji" aria-hidden="true">{p.emoji}</span>
              <span className="aa-cohort-text">
                <span className="aa-cohort-title">{p.title}</span>
                <span className="aa-cohort-sub">{p.programme.split(" · ")[0]} · {p.titleEn.split(" · ")[1]}</span>
              </span>
              <span className="aa-cohort-go" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="aa-card">
        <h2 className="nx-h2">Also next</h2>
        <ul className="nx-list">
          <li><b>ಕನ್ನಡ / Kannada</b> voice notes, then more Sarvam languages after native-speaker checks</li>
          <li><b>Two-way referral</b>: PHC note back to the ASHA, not just “seen”</li>
          <li><b>Register sync</b>: push to the state RCH portal instead of a CSV download</li>
        </ul>
      </div>
      <p className="nx-back"><Link href="/visit">← Back to the live app</Link></p>
    </PreviewShell>
  );
}
