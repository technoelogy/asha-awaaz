// ASHA Awaaz — mock-mode fixtures.
//
// Mock-first approach: the whole path (capture -> structure -> JSON ->
// confirm) runs in mock mode with no API key and no network.
//
// Each sample pairs a realistic Hindi/Hinglish transcript with the RAW model
// output it should produce. The raw output is run through the SAME validator
// as the live path, so mock mode exercises the real guardrails — the uncertain
// fields below surface in the confirm-and-correct screen exactly as live.

import { VisitLanguage } from "./schema";

export interface MockSample {
  id: string;
  label: string; // shown in the dev sample picker
  language: VisitLanguage;
  transcript: string;
  // Raw, pre-validation model output (deliberately includes the shape the
  // model returns, including any "unclear" it would flag).
  rawModelOutput: Record<string, unknown>;
}

export const MOCK_SAMPLES: MockSample[] = [
  {
    id: "clean-hinglish",
    label: "Clean · Hinglish · all fields clear",
    language: "hi-en",
    transcript:
      "Sunita Devi, umar 24 saal, pregnancy ka 28th week chal raha hai. BP normal tha. Iron ki goli regular le rahi hai. Next month follow-up ke liye bulana hai.",
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
    label: "Noisy · BP field unclear (baby crying)",
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
    label: "Bhojpuri-accented Hindi · name uncertain",
    language: "hi",
    transcript:
      "Naam... Phoolmati ha, umar chaubis baras. Garbh ke chhabbis hafta. BP high raha, upar wala number bahut zyada. Iron goli naikhe le rahali.",
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
      follow_up: {
        needed: true,
        reason: "High BP — needs review",
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
];

export function getMockSample(id?: string): MockSample {
  if (id) {
    const found = MOCK_SAMPLES.find((s) => s.id === id);
    if (found) return found;
  }
  return MOCK_SAMPLES[0];
}
