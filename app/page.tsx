import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/tiro-devanagari-hindi/400.css";
import "@fontsource/tiro-devanagari-hindi/400-italic.css";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/600.css";
import "@fontsource/mukta/800.css";
import "./landing/landing.css";
import HeroIllustration from "./landing/HeroIllustration";
import PhoneDemo from "./landing/PhoneDemo";

export const metadata: Metadata = {
  title: "ASHA Awaaz | स्वस्थ नारी, सशक्त भारत",
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
  { lang: "pa", text: "ਸਿਹਤਮੰਦ ਔਰਤ, ਸਸ਼ਕਤ ਭਾਰਤ" },
  { lang: "or", text: "ସୁସ୍ଥ ନାରୀ, ସଶକ୍ତ ଭାରତ" },
  { lang: "ur", text: "صحت مند عورت، مضبوط بھارت" },
  { lang: "en", text: "A healthy woman, a stronger Bharat" },
];

type Status = "live" | "next" | "pilot" | "scale";
const STATUS_LABEL: Record<Status, string> = {
  live: "Live now",
  next: "Building",
  pilot: "Pilot",
  scale: "At scale",
};

const SYSTEM: {
  stage: string;
  items: { name: string; note: string; status: Status }[];
}[] = [
  {
    stage: "At the doorstep",
    items: [
      {
        name: "Speak the visit",
        note: "Hindi, Hinglish, dialect. No typing, no forms.",
        status: "live",
      },
      {
        name: "Two cohorts",
        note: "Pregnant women and adolescent girls (10–19), each with their own checklist.",
        status: "live",
      },
      {
        name: "Read-back + voice correction",
        note: "The record is spoken back. She fixes only what was unclear.",
        status: "live",
      },
      {
        name: "Works without network",
        note: "Visits queue on the phone and sync when signal returns.",
        status: "live",
      },
      {
        name: "Kannada, Marathi, Bengali…",
        note: "Same schema, new language packs.",
        status: "pilot",
      },
      {
        name: "30+ women, new mothers, under-5",
        note: "Three more cohorts on the same engine.",
        status: "pilot",
      },
    ],
  },
  {
    stage: "The safety layer",
    items: [
      {
        name: "Never guesses",
        note: "Anything she did not say stays blank and is marked unclear.",
        status: "live",
      },
      {
        name: "Danger signs → refer",
        note: "High-risk signs trigger a PHC referral on the spot.",
        status: "live",
      },
      {
        name: "Swappable speech engine",
        note: "Dialect accuracy improves as engines improve. One setting, no rebuild.",
        status: "pilot",
      },
    ],
  },
  {
    stage: "At the health centre",
    items: [
      {
        name: "Health centre dashboard",
        note: "The Primary Health Centre (PHC) sees every visit, every danger sign, every pending follow-up.",
        status: "live",
      },
      {
        name: "Referral acknowledged",
        note: "The health centre marks a referral seen. The ASHA knows it landed.",
        status: "live",
      },
      {
        name: "Export in the register's fields",
        note: "Records in the government's mother-and-child register format (RCH), so nothing is typed twice.",
        status: "live",
      },
      {
        name: "Alert to the nurse and doctor",
        note: "High-risk cases reach the ANM (nurse-midwife) and Medical Officer on their phones.",
        status: "scale",
      },
      {
        name: "District reporting",
        note: "Block and district totals for the government's health reporting system (HMIS) from records that already exist.",
        status: "scale",
      },
    ],
  },
];

export default function Home() {
  return (
    <div className="ln-root">
      <div className="ln-fold">
        <div className="ln-watermark" aria-hidden="true">
          {MOTIF.map((m) => (
            <span key={m.lang} lang={m.lang}>
              {m.text}
            </span>
          ))}
        </div>
        <header className="ln-nav">
          <div className="ln-brand">
            <Link href="/" className="ln-logo" aria-label="ASHA Awaaz home">
              ASHA <span>Awaaz</span>
            </Link>
            <span className="ln-brand-line" lang="hi">
              स्वस्थ नारी, सशक्त भारत
            </span>
          </div>
          <nav className="ln-nav-links">
            <Link href="/dashboard" title="Primary Health Centre dashboard">
              Health centre view
            </Link>
            <Link href="/visit" className="ln-btn ln-btn-sm">
              Try it live →
            </Link>
          </nav>
        </header>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="ln-hero">
          <div className="ln-hero-copy">
            <h1 className="ln-h1">
              ASHA Awaaz
              <br />
              <em>for a healthy woman, a stronger Bharat.</em>
            </h1>
            <p className="ln-lede">
              India&apos;s 10 lakh+ ASHA workers visit pregnant women at their
              doorstep. ASHA Awaaz lets her log that visit <b>by speaking</b>,
              in Hindi, Hinglish or her own dialect. The record, and any danger
              sign, reaches the Primary Health Centre (PHC) the same day.
            </p>
            <div className="ln-cta-row">
              <Link href="/visit" className="ln-btn">
                Try the live demo →
              </Link>
              <a href="#how" className="ln-btn ln-btn-ghost">
                See how it works
              </a>
            </div>
          </div>
          <div className="ln-illus-wrap">
            <HeroIllustration />
            <p className="ln-illus-cap">
              <b>ASHA</b> = Accredited Social Health Activist, the village
              health worker. <b>Awaaz</b> = voice.
            </p>
          </div>
        </section>
      </div>

      {/* ── PROBLEM: TODAY vs WITH ─────────────────────────── */}
      <section className="ln-section">
        <p className="ln-kicker">The problem</p>
        <h2 className="ln-h2">
          She hears the danger sign at the door.
          <br />
          <em className="ln-red">The health centre hears it days later.</em>
        </h2>
        <div className="ln-compare">
          <div className="ln-col ln-col-today">
            <h3>Today</h3>
            <ol>
              <li>
                <b>The visit.</b> Phoolmati, 26 weeks pregnant, tells the ASHA
                her head is pounding and her vision is blurring. Both are
                warning signs.
              </li>
              <li>
                <b>The paperwork.</b> The ASHA writes each visit into paper
                registers by hand, often late at night after her own housework.
              </li>
              <li>
                <b>The wait.</b> The registers reach the health centre only at
                the next meeting. A warning that needed action today arrives as
                a line in a ledger.
              </li>
            </ol>
          </div>
          <div className="ln-col ln-col-with">
            <h3>With ASHA Awaaz</h3>
            <ol>
              <li>
                <b>The visit.</b> Same doorstep, same conversation.
              </li>
              <li>
                <b>She speaks, once.</b> A minute into her phone, in her own
                words. It is read back; she confirms.
              </li>
              <li>
                <b>The same day.</b> The danger sign flags a referral, and the
                health centre sees it on its dashboard.
              </li>
            </ol>
          </div>
        </div>

        <div className="ln-stats">
          <div className="ln-stat">
            <span className="ln-stat-n">10 lakh+</span>
            <span className="ln-stat-l">
              ASHA workers across India, the largest community health workforce
              we have
            </span>
            <a
              className="ln-src"
              href="https://www.nhsrcindia.org/sites/default/files/2023-09/ASHA_UPDATE_2023.pdf"
              target="_blank"
              rel="noreferrer"
            >
              NHSRC, ASHA Update 2022–23
            </a>
          </div>
          <div className="ln-stat">
            <span className="ln-stat-n">52.2%</span>
            <span className="ln-stat-l">
              of pregnant women in India are anaemic
            </span>
            <a
              className="ln-src"
              href="https://pubmed.ncbi.nlm.nih.gov/37888841/"
              target="_blank"
              rel="noreferrer"
            >
              National Family Health Survey (NFHS-5)
            </a>
          </div>
          <div className="ln-stat">
            <span className="ln-stat-n">88</span>
            <span className="ln-stat-l">
              mothers die per lakh live births. The global goal is under 70.
            </span>
            <a
              className="ln-src"
              href="https://website.rbi.org.in/documents/d/rbi/HSIS202425_T5"
              target="_blank"
              rel="noreferrer"
            >
              Sample Registration System 2021–23, via RBI
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: live phone ─────────────────────── */}
      <section id="how" className="ln-section ln-section-dark">
        <p className="ln-kicker">How it works</p>
        <h2 className="ln-h2">
          One minute of speaking. <em>Zero typing.</em>
        </h2>
        <PhoneDemo />
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
              Every field is re-checked in code after the AI. Anything unstated
              or out of range is cleared and flagged. The ASHA, not the model,
              has the final word.
            </p>
          </div>
          <div>
            <h3>The checklists she already uses</h3>
            <p>
              Pregnancy danger signs, BP, iron tablets, week of pregnancy; for
              adolescent girls, anaemia signs and the weekly iron tablet. No new
              forms for anyone to learn.
            </p>
          </div>
          <div>
            <h3>Privacy first</h3>
            <p>
              Built to the spirit of India&apos;s data protection law (DPDP
              Act): keys stay on the server, the database is locked down, and
              this demo runs on synthetic data only.
            </p>
          </div>
          <div>
            <h3>Speech engines will improve. We plug in.</h3>
            <p>
              Understanding every dialect is the speech engine&apos;s job. Ours
              is turning imperfect text into a safe record. When a better engine
              ships, it is one setting to switch.
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
          {(Object.keys(STATUS_LABEL) as Status[])
            .filter((s) => SYSTEM.some((c) => c.items.some((i) => i.status === s)))
            .map((s) => (
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
        <div className="ln-watermark ln-watermark-dark" aria-hidden="true">
          {MOTIF.slice(1, 5).map((m) => (
            <span key={m.lang} lang={m.lang}>
              {m.text}
            </span>
          ))}
        </div>
        <p className="ln-close-hi" lang="hi">
          स्वस्थ नारी, सशक्त भारत
        </p>
        <p className="ln-close-en">A healthy woman, a stronger Bharat.</p>
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
          ASHA Awaaz · built by Noel Gomes, technoelogy.com · for Scaler × Wispr
          Flow, Build for Bharat · Synthetic data only
        </p>
        <p className="ln-foot-src">
          Sources:{" "}
          <a
            href="https://www.nhsrcindia.org/sites/default/files/2023-09/ASHA_UPDATE_2023.pdf"
            target="_blank"
            rel="noreferrer"
          >
            NHSRC ASHA Update 2022–23
          </a>
          {" · "}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/37888841/"
            target="_blank"
            rel="noreferrer"
          >
            NFHS-5 anaemia in pregnancy
          </a>
          {" · "}
          <a
            href="https://website.rbi.org.in/documents/d/rbi/HSIS202425_T5"
            target="_blank"
            rel="noreferrer"
          >
            SRS maternal mortality (RBI HSIS)
          </a>
          {" · "}
          <a
            href="https://campaign.mohfw.gov.in"
            target="_blank"
            rel="noreferrer"
          >
            Swasth Nari Sashakt Parivar Abhiyaan, MoHFW
          </a>
        </p>
      </footer>
    </div>
  );
}
