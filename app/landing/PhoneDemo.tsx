"use client";

// Animated walkthrough of the real app: speak → structure → confirm → saved.
// Auto-advances; pauses on hover; tap a step to jump. Reduced motion = static.

import { useEffect, useState } from "react";

const STEPS = [
  { t: "She speaks", d: "In her own words and accent. No typing, no forms." },
  { t: "It becomes a record", d: "Name, week, BP, iron tablets, danger signs, sorted in seconds." },
  { t: "She checks and confirms", d: "It is read back to her. Anything unclear is asked again, never guessed." },
  { t: "The health centre knows today", d: "A danger sign alerts the Primary Health Centre (PHC) the same day." },
];

export default function PhoneDemo() {
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) return;
    const id = window.setInterval(() => setStage((s) => (s + 1) % STEPS.length), 3200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="ln-demo" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ol className="ln-demo-steps">
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <button type="button" data-on={stage === i} onClick={() => setStage(i)}>
              <span className="ln-demo-n">{i + 1}</span>
              <span>
                <b>{s.t}</b>
                <small>{s.d}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="ln-phone" data-stage={stage}>
        <div className="ln-phone-notch" />
        <div className="ln-phone-body">
          {stage === 0 && (
            <div className="ln-scr ln-scr-speak">
              <p className="ln-ph-title">नई विज़िट दर्ज करें</p>
              <div className="ln-mic">
                <span className="ln-mic-dot">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                </span>
                <span className="ln-bars" aria-hidden="true">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <i key={i} style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </span>
                <small>सुन रहे हैं…</small>
              </div>
              <p className="ln-transcript">
                &ldquo;Naam Phoolmati, umar chaubis baras. Garbh ke chhabbis hafta. BP high raha. Sir mein tej
                dard ha aur aankh dhundhla lagela…&rdquo;
              </p>
            </div>
          )}
          {stage === 1 && (
            <div className="ln-scr ln-scr-think">
              <div className="ln-spinner" />
              <p className="ln-ph-title">समझ रहे हैं…</p>
              <small>Turning her words into a structured record</small>
              <div className="ln-skel"><i /><i /><i /><i /></div>
            </div>
          )}
          {stage === 2 && (
            <div className="ln-scr">
              <p className="ln-ph-title">जाँचिए — सही है?</p>
              <div className="ln-ph-refer">
                <strong>⚠ PHC रेफर कीजिए</strong>
                <span>तेज़ सिरदर्द · धुंधला दिखना</span>
              </div>
              <div className="ln-ph-unclear">
                <span>Follow-up</span>
                <b>UNCLEAR</b>
                <small>Not said, so not guessed. She is asked.</small>
              </div>
              <dl className="ln-ph-grid">
                <div><dt>Name</dt><dd>Phoolmati</dd></div>
                <div><dt>Age</dt><dd>24 साल</dd></div>
                <div><dt>Week</dt><dd>26 सप्ताह</dd></div>
                <div><dt>BP</dt><dd>ज़्यादा</dd></div>
              </dl>
              <div className="ln-ph-btn">✓ पुष्टि करें और सेव करें</div>
            </div>
          )}
          {stage === 3 && (
            <div className="ln-scr ln-scr-done">
              <div className="ln-done-ring">✓</div>
              <p className="ln-ph-title">विज़िट सेव हो गई</p>
              <small>Visit saved · health centre alerted</small>
              <div className="ln-alert">
                <b>PHC dashboard</b>
                <span>Phoolmati · 26 wk · ⚠ severe headache, blurred vision</span>
                <em>Refer today</em>
              </div>
            </div>
          )}
        </div>
        <p className="ln-phone-cap">The real app, step {stage + 1} of 4 · hover to pause</p>
      </div>
    </div>
  );
}
