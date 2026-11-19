// ASHA Awaaz — "who is this visit for?" picker.
//
// On a household visit the ASHA worker meets different people — a pregnant
// woman, an adolescent girl, a new mother. Each is a SEPARATE record with its
// own question set. She picks who this visit is for BEFORE speaking, so
// structuring, validation and the confirm screen all run cohort-aware.
"use client";

import { Cohort } from "../lib/schema";

interface Props {
  onPick: (cohort: Cohort) => void;
}

interface Option {
  cohort: Cohort | null; // null = roadmap (coming soon)
  emoji: string;
  title: string; // Hindi
  sub: string; // who / what
}

const OPTIONS: Option[] = [
  { cohort: "pregnant", emoji: "🤰", title: "गर्भवती महिला", sub: "ANC · pregnancy check" },
  { cohort: "adolescent", emoji: "👧", title: "किशोरी (10–19)", sub: "RKSK / WIFS · anaemia" },
  { cohort: null, emoji: "👩", title: "30+ महिला", sub: "NCD screening · जल्द आ रहा है" },
  { cohort: null, emoji: "🤱", title: "नई माँ", sub: "PNC · जल्द आ रहा है" },
  { cohort: null, emoji: "🧒", title: "5 साल से छोटा बच्चा", sub: "Growth · जल्द आ रहा है" },
];

export default function CohortPicker({ onPick }: Props) {
  return (
    <div className="aa-card">
      <h1 className="aa-h1">यह विज़िट किसके लिए?</h1>
      <p className="aa-sub">
        Who is this visit for? हर व्यक्ति का अलग रिकॉर्ड बनता है।
      </p>

      <div className="aa-cohorts">
        {OPTIONS.map((o) => {
          const live = o.cohort !== null;
          return (
            <button
              key={o.title}
              type="button"
              className="aa-cohort"
              data-live={live}
              disabled={!live}
              onClick={() => live && o.cohort && onPick(o.cohort)}
            >
              <span className="aa-cohort-emoji" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="aa-cohort-text">
                <span className="aa-cohort-title">{o.title}</span>
                <span className="aa-cohort-sub">{o.sub}</span>
              </span>
              {!live && <span className="aa-cohort-soon">जल्द</span>}
            </button>
          );
        })}
      </div>

      <p className="aa-note">
        अभी गर्भवती और किशोरी — दोनों का रिकॉर्ड बन सकता है। बाकी जल्द।
      </p>
    </div>
  );
}
