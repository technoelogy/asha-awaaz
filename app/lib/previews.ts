// ASHA Awaaz — "coming next" cohort previews.
//
// These are NOT live forms. Each preview shows what the next cohort will look
// like: what the ASHA says, what record comes out, and which rule runs in
// code (not AI). Every cohort maps to an existing MoHFW programme and form, so
// the pilot extends work she already does instead of adding a new one.

export interface PreviewField {
  label: string; // Hindi
  en: string;
  value: string;
  flag?: "risk" | "ok" | "unclear";
}

export interface CohortPreview {
  slug: "ncd" | "pnc" | "hbyc";
  emoji: string;
  title: string; // Hindi
  titleEn: string;
  programme: string; // official programme + form
  cadence: string; // when the ASHA does this visit
  said: string; // sample spoken note
  fields: PreviewField[];
  rule: { title: string; body: string };
  outcome: string; // what happens next (Hindi)
  outcomeEn: string;
}

export const PREVIEWS: CohortPreview[] = [
  {
    slug: "ncd",
    emoji: "👩",
    title: "30+ महिला",
    titleEn: "Women 30+ · NCD risk check",
    programme: "NP-NCD · CBAC form (Community Based Assessment Checklist), MoHFW",
    cadence: "Once a year, for every person aged 30+ in her area",
    said:
      "सुनीता देवी, 46 साल। रोज़ तंबाकू खाती हैं। कमर 88 सेंटीमीटर। हफ्ते में डेढ़ सौ मिनट से कम चलती हैं। माँ को शुगर थी।",
    fields: [
      { label: "उम्र", en: "Age 40–49", value: "1 अंक" },
      { label: "तंबाकू", en: "Tobacco daily", value: "2 अंक", flag: "risk" },
      { label: "शराब", en: "Alcohol", value: "—", flag: "unclear" },
      { label: "कमर", en: "Waist 81–90 cm", value: "1 अंक", flag: "risk" },
      { label: "शारीरिक गतिविधि", en: "Under 150 min/week", value: "1 अंक", flag: "risk" },
      { label: "परिवार में BP/शुगर", en: "Family history", value: "2 अंक", flag: "risk" },
    ],
    rule: {
      title: "Score is added in code, not by AI",
      body:
        "AI only fills the six answers. The CBAC total is plain arithmetic. An answer she didn't say stays 'not stated', never 0, so a missing question can't lower the risk.",
    },
    outcome: "कुल 7 अंक (4 से ज़्यादा) → BP और शुगर जाँच के लिए PHC भेजें",
    outcomeEn: "Total 7 (above 4) → refer for BP and sugar screening",
  },
  {
    slug: "pnc",
    emoji: "🤱",
    title: "नई माँ",
    titleEn: "New mother · home postnatal care",
    programme: "HBNC (Home Based Newborn Care), NHM",
    cadence: "Day 3, 7, 14, 21, 28 and 42 after a facility delivery",
    said:
      "रेखा, डिलीवरी को 7 दिन हुए। बच्चा ठीक से दूध नहीं पी रहा। बच्चे का वज़न 2.3 किलो। माँ को बुखार नहीं है।",
    fields: [
      { label: "डिलीवरी के बाद", en: "Day 7 · visit 2 of 6", value: "दिन 7", flag: "ok" },
      { label: "बच्चे का वज़न", en: "Baby weight", value: "2.3 किलो (2.5 से कम)", flag: "risk" },
      { label: "दूध पीना", en: "Feeding", value: "ठीक से नहीं पी रहा", flag: "risk" },
      { label: "माँ को बुखार", en: "Mother fever", value: "नहीं", flag: "ok" },
      { label: "माँ का खून बहना", en: "Mother bleeding", value: "—", flag: "unclear" },
    ],
    rule: {
      title: "Newborn danger sign = refer, every time",
      body:
        "'Not feeding well' is an HBNC danger sign. The refer banner and the PHC alert fire from a rule in code, the same path the pregnancy danger signs use today.",
    },
    outcome: "बच्चे को आज PHC दिखाएँ · अगली विज़िट दिन 14",
    outcomeEn: "Take the baby to PHC today · next visit day 14",
  },
  {
    slug: "hbyc",
    emoji: "🧒",
    title: "5 साल से छोटा बच्चा",
    titleEn: "Under-5 child · home young child care",
    programme: "HBYC (Home Based Care for Young Child), MoHFW",
    cadence: "At 3, 6, 9, 12 and 15 months",
    said:
      "आरव, 6 महीने का। आज से ऊपर का खाना शुरू किया। घर में ORS है। टीके पूरे हैं। वज़न 6.8 किलो।",
    fields: [
      { label: "उम्र", en: "6 months · visit 2 of 5", value: "6 महीने", flag: "ok" },
      { label: "ऊपर का खाना", en: "Complementary feeding", value: "शुरू", flag: "ok" },
      { label: "घर में ORS", en: "ORS at home", value: "हाँ", flag: "ok" },
      { label: "टीके", en: "Immunisation", value: "पूरे", flag: "ok" },
      { label: "वज़न", en: "Weight", value: "6.8 किलो", flag: "ok" },
      { label: "IFA सिरप", en: "IFA syrup", value: "—", flag: "unclear" },
    ],
    rule: {
      title: "Weight goes to the growth chart, not to AI",
      body:
        "AI records the number she said. Whether it is low for age is read from the WHO growth chart at the PHC. AI never classifies a child as underweight.",
    },
    outcome: "सब ठीक · IFA सिरप पूछें · अगली विज़िट 9 महीने पर",
    outcomeEn: "All fine · ask about IFA syrup · next visit at 9 months",
  },
];

export function previewBySlug(slug: string): CohortPreview | undefined {
  return PREVIEWS.find((p) => p.slug === slug);
}
