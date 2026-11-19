// ASHA Awaaz — voice read-back helpers (the "voice confirm" layer).
//
// The ASHA worker never reads a screen under pressure — the confirmed note is
// spoken back to her in Hindi so she can verify by ear. Uses the browser
// SpeechSynthesis API (hi-IN voice when available). Guarded for SSR + for
// browsers without a Hindi voice (falls back to default voice).
"use client";

import {
  VisitNote,
  FieldName,
  fieldsForCohort,
  dangerSignNames,
  dangerSignStatus,
} from "./schema";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickHindiVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "hi-IN") ||
    voices.find((v) => v.lang?.startsWith("hi")) ||
    null
  );
}

export function speak(text: string): void {
  if (!speechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickHindiVoice();
  if (voice) u.voice = voice;
  u.lang = "hi-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

// --- field labels (Hindi + English) — every field, both cohorts -----------

const FIELD_LABEL_HI: Record<FieldName, string> = {
  name: "नाम",
  age: "उम्र",
  gestational_week: "गर्भावस्था सप्ताह",
  bp_status: "बी पी",
  iron_compliance: "आयरन की गोली",
  in_school: "स्कूल",
  periods_started: "माहवारी शुरू",
  period_pattern: "माहवारी कैसी",
  menstrual_hygiene: "पैड / कपड़ा",
  ifa_compliance: "आयरन (ब्लू गोली)",
  albendazole: "कृमि की दवा",
  pallor: "पीलापन / कमज़ोरी",
  nutrition: "पोषण",
  marriage_pressure: "शादी का दबाव",
  follow_up: "फ़ॉलो अप",
};

export const FIELD_LABEL_EN: Record<FieldName, string> = {
  name: "Name",
  age: "Age",
  gestational_week: "Gestational week",
  bp_status: "BP",
  iron_compliance: "Iron tablets",
  in_school: "In school",
  periods_started: "Periods started",
  period_pattern: "Period pattern",
  menstrual_hygiene: "Menstrual hygiene",
  ifa_compliance: "IFA (blue tablet)",
  albendazole: "Deworming",
  pallor: "Pallor / weakness",
  nutrition: "Nutrition",
  marriage_pressure: "Marriage pressure",
  follow_up: "Follow-up",
};

// Hindi value phrasing per field (for display + read-back). Returns a short
// human phrase, or "नहीं बताया" when unset.
export function fieldValueHi(note: VisitNote, field: FieldName): string {
  const UNSET = "नहीं बताया";
  const a = note.adolescent;
  switch (field) {
    case "name":
      return note.beneficiary.name ?? UNSET;
    case "age":
      return note.beneficiary.age.value != null
        ? `${note.beneficiary.age.value} साल`
        : UNSET;
    case "gestational_week":
      return note.beneficiary.gestational_week != null
        ? `${note.beneficiary.gestational_week} सप्ताह`
        : UNSET;
    case "bp_status":
      return note.assessment.bp_status
        ? { normal: "सामान्य", high: "ज़्यादा", low: "कम", not_measured: "नहीं नापा" }[
            note.assessment.bp_status
          ]
        : UNSET;
    case "iron_compliance":
      return note.assessment.iron_compliance
        ? { taking: "ले रही है", not_taking: "नहीं ले रही", partial: "कभी-कभी" }[
            note.assessment.iron_compliance
          ]
        : UNSET;
    case "in_school":
      return a.in_school
        ? { studying: "स्कूल जाती है", dropped_out: "स्कूल छूट गया" }[a.in_school]
        : UNSET;
    case "periods_started":
      return a.periods_started
        ? { yes: "हाँ", no: "नहीं" }[a.periods_started]
        : UNSET;
    case "period_pattern":
      return a.period_pattern
        ? { regular: "नियमित", irregular: "अनियमित", very_heavy: "बहुत ज़्यादा" }[
            a.period_pattern
          ]
        : UNSET;
    case "menstrual_hygiene":
      return a.menstrual_hygiene
        ? { sanitary_pad: "सैनिटरी पैड", cloth: "कपड़ा", other: "अन्य" }[
            a.menstrual_hygiene
          ]
        : UNSET;
    case "ifa_compliance":
      return a.ifa_compliance
        ? { taking: "ले रही है", not_taking: "नहीं ले रही", partial: "कभी-कभी" }[
            a.ifa_compliance
          ]
        : UNSET;
    case "albendazole":
      return a.albendazole
        ? { taken: "ली है", not_taken: "नहीं ली" }[a.albendazole]
        : UNSET;
    case "pallor":
      return a.pallor === "present" ? "है" : a.pallor === "absent" ? "नहीं" : UNSET;
    case "nutrition":
      return a.nutrition
        ? { normal: "ठीक", thin: "दुबली", not_measured: "नहीं नापा" }[a.nutrition]
        : UNSET;
    case "marriage_pressure":
      return a.marriage_pressure === "present"
        ? "है"
        : a.marriage_pressure === "absent"
          ? "नहीं"
          : UNSET;
    case "follow_up":
      return note.follow_up.needed == null
        ? UNSET
        : note.follow_up.needed
          ? "ज़रूरी है"
          : "ज़रूरी नहीं";
  }
}

// Hindi labels for danger signs, both cohorts.
export const DANGER_LABEL_HI: Record<string, string> = {
  // pregnant (HRP)
  severe_headache: "तेज़ सिरदर्द",
  blurred_vision: "धुंधला दिखना",
  swelling: "हाथ/मुँह सूजन",
  bleeding: "खून आना",
  reduced_fetal_movement: "बच्चे की हलचल कम",
  // adolescent (severe anaemia / bleeding)
  severe_pallor: "बहुत पीलापन",
  breathlessness: "साँस फूलना",
  heavy_bleeding: "ज़्यादा रक्तस्राव",
};

// Full spoken read-back of the whole note, in Hindi. Present danger signs are
// spoken last, flagged as khatra (danger), so she confirms them by ear.
export function readBackSentence(note: VisitNote): string {
  const parts = fieldsForCohort(note.cohort).map(
    (f) => `${FIELD_LABEL_HI[f]}: ${fieldValueHi(note, f)}`,
  );
  const present = dangerSignNames(note.cohort)
    .filter((s) => dangerSignStatus(note, s) === "present")
    .map((s) => DANGER_LABEL_HI[s] ?? s);
  if (present.length) {
    parts.push(`खतरे के संकेत: ${present.join(", ")}`);
  }
  return parts.join("। ") + "।";
}

// Spoken question for a single unclear field (targeted re-ask, no restart).
export function askFieldSentence(field: FieldName): string {
  const q: Record<FieldName, string> = {
    name: "मरीज़ का नाम दोबारा बोलिए।",
    age: "उम्र दोबारा बोलिए।",
    gestational_week: "गर्भावस्था कौन सा सप्ताह है, दोबारा बोलिए।",
    bp_status: "बी पी कैसा था — सामान्य, ज़्यादा, या कम? दोबारा बोलिए।",
    iron_compliance: "आयरन की गोली ले रही है या नहीं? दोबारा बोलिए।",
    in_school: "स्कूल जाती है या छूट गया? दोबारा बोलिए।",
    periods_started: "माहवारी शुरू हुई है या नहीं? दोबारा बोलिए।",
    period_pattern: "माहवारी कैसी है — नियमित, अनियमित, या बहुत ज़्यादा? दोबारा बोलिए।",
    menstrual_hygiene: "पैड इस्तेमाल करती है या कपड़ा? दोबारा बोलिए।",
    ifa_compliance: "ब्लू आयरन गोली ले रही है या नहीं? दोबारा बोलिए।",
    albendazole: "कृमि की दवा ली है या नहीं? दोबारा बोलिए।",
    pallor: "पीलापन या कमज़ोरी है या नहीं? दोबारा बोलिए।",
    nutrition: "पोषण कैसा है — ठीक या दुबली? दोबारा बोलिए।",
    marriage_pressure: "शादी का कोई दबाव है या नहीं? दोबारा बोलिए।",
    follow_up: "फ़ॉलो अप ज़रूरी है या नहीं? दोबारा बोलिए।",
  };
  return q[field];
}
