import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./landing/landing.css";

export const metadata: Metadata = {
  title: "ASHA Awaaz | Swasth Nari, Sashakt Bharat",
  description:
    "Voice-first visit logging for India's ASHA workers. She speaks the visit in her own language; it becomes a structured record in the fields the health system already tracks, and a danger sign reaches the PHC the same day.",
};

export const viewport: Viewport = {
  themeColor: "#003153",
  width: "device-width",
  initialScale: 1,
};

// "Swasth Nari, Sashakt Bharat" across Indian languages.
// NOTE: verify each line with a native speaker before any public print use.
const MOTIF: { lang: string; text: string }[] = [
  { lang: "hi", text: "स्वस्थ नारी, सशक्त भारत" },
  { lang: "kn", text: "ಆರೋಗ್ಯವಂತ ನಾರಿ, ಸಶಕ್ತ ಭಾರತ" },
  { lang: "ta", text: "ஆரோக்கியமான பெண், வலிமையான பாரதம்" },
  { lang: "bn", text: "সুস্থ নারী, সশক্ত ভারত" },
  { lang: "te", text: "ఆరోగ్యవంతమైన స్త్రీ, శక్తివంతమైన భారత్" },
  { lang: "gu", text: "સ્વસ્થ નારી, સશક્ત ભારત" },
  { lang: "ml", text: "ആരോഗ്യമുള്ള സ്ത്രീ, ശക്തമായ ഭാരതം" },
  { lang: "pa", text: "ਸਿਹਤਮੰਦ ਨਾਰੀ, ਸਸ਼ਕਤ ਭਾਰਤ" },
  { lang: "or", text: "ସୁସ୍ଥ ନାରୀ, ସଶକ୍ତ ଭାରତ" },
  { lang: "ur", text: "صحت مند عورت، مضبوط بھارت" },
  { lang: "en", text: "A healthy woman, a stronger India" },
];

type Status = "live" | "next" | "pilot" | "scale";
const STATUS_LABEL: Record<Status, string> = {
  live: "Live now",
  next: "Building",
  pilot: "Pilot",
  scale: "At scale",
};

const SYSTEM: { stage: string; items: { name: string; note: string; status: Status }[] }[] = [
  {
    stage: "At the doorstep",
    items: [
      { name: "Speak the visit", note: "Hindi, Hinglish, dialect. No typing, no forms.", status: "live" },
      { name: "Two cohorts", note: "Pregnant women (ANC) and adolescent girls (RKSK / WIFS).", status: "live" },
      { name: "Read-back + voice correction", note: "The record is spoken back. She fixes only what was unclear.", status: "live" },
      { name: "Works without network", note: "Visits queue on the phone and sync when signal returns.", status: "live" },
      { name: "Kannada, Marathi, Bengali…", note: "Same schema, new language packs.", status: "pilot" },
      { name: "30+ women, new mothers, under-5", note: "Three more cohorts on the same engine.", status: "pilot" },
    ],
  },
  {
    stage: "The safety layer",
    items: [
      { name: "Never guesses", note: "Anything she did not say stays blank and is marked unclear.", status: "live" },
      { name: "Danger signs → refer", note: "High-risk signs trigger a PHC referral on the spot.", status: "live" },
      { name: "Swappable speech engine", note: "Dialect accuracy improves as engines improve. One setting, no rebuild.", status: "pilot" },
    ],
  },
  {
    stage: "At the PHC",
    items: [
      { name: "PHC dashboard", note: "Every visit, every danger sign, every pending follow-up.", status: "live" },
      { name: "Referral acknowledged", note: "The PHC marks a referral seen. The ASHA knows it landed.", status: "next" },
      { name: "Export in the register's fields", note: "RCH-style records, so nothing is typed twice.", status: "next" },
      { name: "Alert to ANM / Medical Officer", note: "High-risk cases pushed to a phone, not a pile.", status: "scale" },
      { name: "HMIS reporting", note: "Block and district roll-ups from records that already exist.", status: "scale" },
    ],
  },
];

export default function Home() {
  return (
    <div className="ln-root">
      {/* watermark motif behind everything */}
      <div className="ln-watermark" aria-hidden="true">
        {MOTIF.slice(0, 6).map((m) => (
          <span key={m.lang} lang={m.lang}>
            {m.text}
          </span>
        ))}
      </div>

      <header className="ln-nav">
        <Link href="/" className="ln-logo">
          ASHA <span>Awaaz</span>
        </Link>
        <nav className="ln-nav-links">
          <Link href="/dashboard">PHC dashboard</Link>
          <Link href="/visit" className="ln-btn ln-btn-sm">
            Try it live →
          </Link>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="ln-hero">
        <div className="ln-hero-copy">
          <p className="ln-eyebrow">
            <span lang="hi">स्वस्थ नारी, सशक्त भारत</span> A healthy woman, a stronger India
          </p>
          <h1 className="ln-h1">
            Phoolmati&apos;s headache
            <br />
            <em>shouldn&apos;t wait for a register.</em>
          </h1>
          <p className="ln-lede">
            ASHA Awaaz lets India&apos;s ASHA workers log a home visit by speaking, in Hindi, Hinglish or
            her own dialect. It becomes a structured record in the fields the health system already
            tracks, and a danger sign reaches the PHC the same day.
          </p>
          <div className="ln-cta-row">
            <Link href="/visit" className="ln-btn">
              Try the live demo →
            </Link>
            <Link href="/dashboard" className="ln-btn ln-btn-ghost">
              See the PHC view
            </Link>
          </div>
          <p className="ln-fineprint">Works on any phone browser · No login · Synthetic data only</p>
        </div>

        {/* phone mock of the real confirm screen */}
        <div className="ln-phone" aria-label="ASHA Awaaz confirm screen, example">
          <div className="ln-phone-notch" />
          <div className="ln-phone-body">
            <p className="ln-ph-title">जाँचिए — सही है?</p>
            <div className="ln-ph-refer">
              <strong>⚠ PHC रेफर कीजिए</strong>
              <span>तेज़ सिरदर्द · धुंधला दिखना</span>
            </div>
            <div className="ln-ph-unclear">
              <span>Follow-up</span>
              <b>UNCLEAR</b>
              <small>— नहीं बताया — she will be asked</small>
            </div>
            <dl className="ln-ph-grid">
              <div><dt>Name</dt><dd>Phoolmati</dd></div>
              <div><dt>Age</dt><dd>24 साल</dd></div>
              <div><dt>Week</dt><dd>26 सप्ताह</dd></div>
              <div><dt>BP</dt><dd>ज़्यादा</dd></div>
            </dl>
            <div className="ln-ph-btn">✓ पुष्टि करें और सेव करें</div>
          </div>
          <p className="ln-phone-cap">Spoken in a Bhojpuri accent. Structured in seconds.</p>
        </div>
      </section>

      {/* ── MOTIF BAND ───────────────────────────────────── */}
      <div className="ln-band" aria-label="Swasth Nari, Sashakt Bharat in Indian languages">
        <div className="ln-band-track">
          {[...MOTIF, ...MOTIF].map((m, i) => (
            <span key={i} lang={m.lang}>
              {m.text}
              <i aria-hidden="true">✦</i>
            </span>
          ))}
        </div>
      </div>

      {/* ── STORY ────────────────────────────────────────── */}
      <section className="ln-section">
        <p className="ln-kicker">The problem</p>
        <h2 className="ln-h2">
          The danger sign is heard at the door.
          <br />
          <em>It gets lost on the way to the PHC.</em>
        </h2>
        <ol className="ln-story">
          <li>
            <b>4 pm, the doorstep.</b> Phoolmati, 26 weeks pregnant, says her head has been pounding
            and her eyes are blurring. The ASHA hears it.
          </li>
          <li>
            <b>10 pm, the kitchen floor.</b> After cooking and the children, the ASHA copies the day&apos;s
            visits into registers by hand. Some details blur. Some wait for tomorrow.
          </li>
          <li>
            <b>Days later, the PHC.</b> The register reaches the facility. A warning that needed a
            same-day response arrives as a line in a ledger.
          </li>
        </ol>
        <p className="ln-story-turn">
          ASHA Awaaz removes the kitchen floor from the story. She speaks once, at the door. The record
          and the referral leave with her voice.
        </p>

        <div className="ln-stats">
          <div className="ln-stat">
            <span className="ln-stat-n">10 lakh+</span>
            <span className="ln-stat-l">ASHAs in position across India, the largest community health workforce we have</span>
            <a className="ln-src" href="https://www.nhsrcindia.org/sites/default/files/2023-09/ASHA_UPDATE_2023.pdf" target="_blank" rel="noreferrer">
              NHSRC, ASHA Update 2022–23
            </a>
          </div>
          <div className="ln-stat">
            <span className="ln-stat-n">52.2%</span>
            <span className="ln-stat-l">of pregnant women in India are anaemic</span>
            <a className="ln-src" href="https://pubmed.ncbi.nlm.nih.gov/37888841/" target="_blank" rel="noreferrer">
              NFHS-5 (2019–21)
            </a>
          </div>
          <div className="ln-stat">
            <span className="ln-stat-n">88</span>
            <span className="ln-stat-l">maternal deaths per lakh live births. The SDG target is under 70.</span>
            <a className="ln-src" href="https://website.rbi.org.in/documents/d/rbi/HSIS202425_T5" target="_blank" rel="noreferrer">
              SRS 2021–23, via RBI Handbook
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="ln-section ln-section-dark">
        <p className="ln-kicker">How it works</p>
        <h2 className="ln-h2">
          Three steps. <em>Zero typing.</em>
        </h2>
        <div className="ln-steps">
          <div className="ln-step">
            <span className="ln-step-n">1</span>
            <h3>She speaks</h3>
            <p>
              The way she would tell a colleague. Name, week, BP, iron tablets, what the woman
              complained of. In her own words, in her own accent.
            </p>
          </div>
          <div className="ln-step">
            <span className="ln-step-n">2</span>
            <h3>It reads back, she confirms</h3>
            <p>
              The record is spoken back in Hindi. Anything she did not say is marked unclear and
              asked again. The AI never fills a clinical field on its own.
            </p>
          </div>
          <div className="ln-step">
            <span className="ln-step-n">3</span>
            <h3>The PHC sees it today</h3>
            <p>
              A danger sign triggers a referral on the spot. The visit lands on the PHC dashboard as
              a structured record, ready for the registers the system already keeps.
            </p>
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────── */}
      <section className="ln-section">
        <p className="ln-kicker">Why a health official can trust it</p>
        <h2 className="ln-h2">
          What she didn&apos;t say <em>stays blank.</em>
        </h2>
        <div className="ln-trust">
          <div>
            <h3>No guessing, by design</h3>
            <p>
              Every field is re-checked in code after the AI. Unstated or out-of-range values are
              cleared and flagged. The ASHA, not the model, has the final word.
            </p>
          </div>
          <div>
            <h3>The system&apos;s own fields</h3>
            <p>
              High-risk pregnancy danger signs, IFA compliance, BP, gestational week; for adolescents,
              anaemia signs, WIFS and RKSK markers. No new forms for anyone to learn.
            </p>
          </div>
          <div>
            <h3>Privacy first</h3>
            <p>
              Built to the spirit of India&apos;s DPDP Act: keys stay on the server, the database is
              locked down, and this demo runs on synthetic data only.
            </p>
          </div>
          <div>
            <h3>Speech engines will improve. We plug in.</h3>
            <p>
              Dialect accuracy is the speech engine&apos;s job. Ours is turning imperfect text into a
              safe record. When a better engine ships, it is one setting to switch.
            </p>
          </div>
        </div>
      </section>

      {/* ── SYSTEM MAP ───────────────────────────────────── */}
      <section className="ln-section ln-section-tint">
        <p className="ln-kicker">The whole system, not one screen</p>
        <h2 className="ln-h2">
          From the doorstep <em>to the district.</em>
        </h2>
        <div className="ln-legend">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <span key={s} className="ln-pill" data-s={s}>
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <div className="ln-map">
          {SYSTEM.map((col, ci) => (
            <div key={col.stage} className="ln-map-col">
              <h3>
                <span>{String(ci + 1).padStart(2, "0")}</span> {col.stage}
              </h3>
              {col.items.map((it) => (
                <div key={it.name} className="ln-map-item" data-s={it.status}>
                  <div className="ln-map-top">
                    <b>{it.name}</b>
                    <span className="ln-pill" data-s={it.status}>
                      {STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  <p>{it.note}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── CLOSE ────────────────────────────────────────── */}
      <section className="ln-close">
        <p className="ln-close-hi" lang="hi">
          स्वस्थ नारी, सशक्त भारत
        </p>
        <p className="ln-close-en">A healthy woman, a stronger India.</p>
        <p className="ln-close-line">
          Built for impact. <em>Built for a greater Bharat.</em>
        </p>
        <Link href="/visit" className="ln-btn ln-btn-light">
          Log a visit by voice →
        </Link>
        <p className="ln-close-sub">From impression to impact.</p>
      </section>

      <footer className="ln-foot">
        <p>
          ASHA Awaaz · a technoelogy.com build for Scaler × Wispr Flow, Build for Bharat · Synthetic
          data only
        </p>
        <p className="ln-foot-src">
          Sources:{" "}
          <a href="https://www.nhsrcindia.org/sites/default/files/2023-09/ASHA_UPDATE_2023.pdf" target="_blank" rel="noreferrer">NHSRC ASHA Update 2022–23</a>{" · "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/37888841/" target="_blank" rel="noreferrer">NFHS-5 anaemia in pregnancy</a>{" · "}
          <a href="https://website.rbi.org.in/documents/d/rbi/HSIS202425_T5" target="_blank" rel="noreferrer">SRS maternal mortality (RBI HSIS)</a>{" · "}
          <a href="https://campaign.mohfw.gov.in" target="_blank" rel="noreferrer">Swasth Nari Sashakt Parivar Abhiyaan, MoHFW</a>
        </p>
      </footer>
    </div>
  );
}
