// ASHA Awaaz — mock-mode fixtures.
//
// Mock-first approach: the whole path (capture -> structure -> JSON ->
// confirm) runs in mock mode with no API key and no network.
//
// Each sample pairs a realistic Hindi/Hinglish transcript with the RAW model
// output it should produce. The raw output is run through the SAME validator
// as the live path, so mock mode exercises the real guardrails — the uncertain
// fields below surface in the confirm-and-correct screen exactly as live.

import { VisitLanguage, Cohort } from "./schema";

export interface MockSample {
  id: string;
  label: string; // shown in the dev sample picker
  cohort: Cohort;
  language: VisitLanguage;
  transcript: string;
  // Raw, pre-validation model output (deliberately includes the shape the
  // model returns, including any "unclear" it would flag).
  rawModelOutput: Record<string, unknown>;
}

export const MOCK_SAMPLES: MockSample[] = [
  {
    id: "clean-hinglish",
    label: "गर्भवती · Clean · Hinglish · all fields clear",
    cohort: "pregnant",
    language: "hi-en",
    transcript:
      "Sunita Devi, umar 24 saal, pregnancy ka 28th week chal raha hai. BP normal tha. Iron ki goli regular le rahi hai. Koi sir dard nahi, sujan nahi, bleeding nahi, baby ki movement theek hai. Next month follow-up ke liye bulana hai.",
    rawModelOutput: {
      beneficiary: {
        name: "Sunita Devi",
        age: { value: 24, unit: "years" },
        gestational_week: 28,
      },
      assessment: {
        bp_status: "normal",
        bp_reading: null,
        iron_compliance: "taking",
        iron_compliance_verbatim: "Iron ki goli regular le rahi hai",
      },
      danger_signs: {
        severe_headache: "absent",
        blurred_vision: "absent",
        swelling: "absent",
        bleeding: "absent",
        reduced_fetal_movement: "absent",
      },
      follow_up: {
        needed: true,
        reason: "Routine antenatal follow-up next month",
        by_date: null,
      },
      transcript: { language_detected: "hi-en" },
      field_confidence: {
        name: "high",
        age: "high",
        gestational_week: "high",
        bp_status: "high",
        iron_compliance: "high",
        follow_up: "high",
      },
    },
  },
  {
    id: "noisy-bp",
    label: "गर्भवती · Noisy · BP field unclear (baby crying)",
    cohort: "pregnant",
    language: "hi",
    transcript:
      "Rekha, umar lagbhag bees saal. Pregnancy saat mahina... [bachcha ro raha hai] ...BP... theek se sunai nahi diya. Iron goli le rahi hai lekin roz nahi.",
    rawModelOutput: {
      beneficiary: {
        name: "Rekha",
        age: { value: 20, unit: "years" },
        gestational_week: 30,
      },
      assessment: {
        bp_status: null, // obscured by noise -> unclear, NOT guessed
        bp_reading: null,
        iron_compliance: "partial",
        iron_compliance_verbatim: "Iron goli le rahi hai lekin roz nahi",
      },
      danger_signs: {
        severe_headache: "unclear",
        blurred_vision: "unclear",
        swelling: "unclear",
        bleeding: "unclear",
        reduced_fetal_movement: "unclear",
      },
      follow_up: { needed: null, reason: null, by_date: null },
      transcript: { language_detected: "hi" },
      field_confidence: {
        name: "high",
        age: "medium", // "lagbhag bees" = approximately 20
        gestational_week: "medium", // "saat mahina" -> ~30 weeks, approximate
        bp_status: "unclear", // noise
        iron_compliance: "high",
        follow_up: "unclear", // not stated
      },
    },
  },
  {
    id: "bhojpuri-accent",
    label: "गर्भवती · Bhojpuri accent · HIGH-RISK (refer)",
    cohort: "pregnant",
    language: "hi",
    transcript:
      "Naam... Phoolmati ha, umar chaubis baras. Garbh ke chhabbis hafta. BP high raha, upar wala number bahut zyada. Sir mein tej dard ha aur aankh dhundhla lagela. Iron goli naikhe le rahali.",
    rawModelOutput: {
      beneficiary: {
        name: "Phoolmati",
        age: { value: 24, unit: "years" },
        gestational_week: 26,
      },
      assessment: {
        bp_status: "high",
        bp_reading: null,
        iron_compliance: "not_taking",
        iron_compliance_verbatim: "Iron goli naikhe le rahali",
      },
      danger_signs: {
        severe_headache: "present",
        blurred_vision: "present",
        swelling: "unclear",
        bleeding: "unclear",
        reduced_fetal_movement: "unclear",
      },
      follow_up: {
        needed: true,
        reason: "High BP with headache and blurred vision — refer",
        by_date: null,
      },
      transcript: { language_detected: "hi" },
      field_confidence: {
        name: "unclear", // accent made the name hard to catch
        age: "high",
        gestational_week: "high",
        bp_status: "high",
        iron_compliance: "high",
        follow_up: "medium",
      },
    },
  },
  {
    id: "adolescent-clean",
    label: "किशोरी · Clean · in school, IFA on track",
    cohort: "adolescent",
    language: "hi-en",
    transcript:
      "Kumari Anjali, umar 15 saal, school jaati hai. Mahwari shuru ho gayi hai, regular aati hai, sanitary pad use karti hai. Blue iron goli har hafte le rahi hai, albendazole bhi li thi. Koi kamzori ya palepan nahi, khana theek hai. Shaadi ki koi baat nahi.",
    rawModelOutput: {
      beneficiary: {
        name: "Kumari Anjali",
        age: { value: 15, unit: "years" },
      },
      adolescent: {
        in_school: "studying",
        periods_started: "yes",
        period_pattern: "regular",
        menstrual_hygiene: "sanitary_pad",
        ifa_compliance: "taking",
        albendazole: "taken",
        pallor: "absent",
        nutrition: "normal",
        marriage_pressure: "absent",
      },
      adolescent_danger_signs: {
        severe_pallor: "absent",
        breathlessness: "absent",
        heavy_bleeding: "absent",
      },
      follow_up: {
        needed: false,
        reason: "Routine — on track with WIFS",
        by_date: null,
      },
      transcript: { language_detected: "hi-en" },
      field_confidence: {
        name: "high",
        age: "high",
        in_school: "high",
        periods_started: "high",
        period_pattern: "high",
        menstrual_hygiene: "high",
        ifa_compliance: "high",
        albendazole: "high",
        pallor: "high",
        nutrition: "high",
        marriage_pressure: "high",
        follow_up: "high",
      },
    },
  },
  {
    id: "adolescent-anemia",
    label: "किशोरी · HIGH-RISK · severe anaemia (refer)",
    cohort: "adolescent",
    language: "hi",
    transcript:
      "Guddi, umar 16 saal, school chhoot gaya. Mahwari bahut zyada aati hai, kapda istemal karti hai. Blue goli nahi le rahi. Bahut kamzor aur chehra peela, thodi door chalne par saans phoolti hai. Dubli-patli hai. Ghar mein shaadi ki baat chal rahi hai.",
    rawModelOutput: {
      beneficiary: {
        name: "Guddi",
        age: { value: 16, unit: "years" },
      },
      adolescent: {
        in_school: "dropped_out",
        periods_started: "yes",
        period_pattern: "very_heavy",
        menstrual_hygiene: "cloth",
        ifa_compliance: "not_taking",
        albendazole: "not_taken",
        pallor: "present",
        nutrition: "thin",
        marriage_pressure: "present",
      },
      adolescent_danger_signs: {
        severe_pallor: "present",
        breathlessness: "present",
        heavy_bleeding: "present",
      },
      follow_up: {
        needed: true,
        reason: "Severe pallor + breathlessness + heavy bleeding — refer",
        by_date: null,
      },
      transcript: { language_detected: "hi" },
      field_confidence: {
        name: "high",
        age: "high",
        in_school: "high",
        periods_started: "high",
        period_pattern: "high",
        menstrual_hygiene: "high",
        ifa_compliance: "high",
        albendazole: "high",
        pallor: "high",
        nutrition: "high",
        marriage_pressure: "high",
        follow_up: "high",
      },
    },
  },
];

export function getMockSample(id?: string): MockSample {
  if (id) {
    const found = MOCK_SAMPLES.find((s) => s.id === id);
    if (found) return found;
  }
  return MOCK_SAMPLES[0];
}
