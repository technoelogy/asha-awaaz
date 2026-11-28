// ASHA Awaaz — eval cases.
//
// Two layers:
//  GUARD cases  — offline, no key. We hand the validator a transcript plus a
//                 deliberately WRONG model output (the mistakes we actually saw
//                 in voice testing, G1–G11) and check the code catches it.
//  LIVE cases   — real transcripts through the deployed /api/structure (real
//                 model + validator). Checks the end-to-end record.
//
// `expect` maps a dotted path in the VisitNote to the value it must have.
// `uncertain` lists fields that MUST be in uncertain_fields (she is asked).

import type { Cohort } from "../app/lib/schema";

export interface EvalCase {
  id: string;
  why: string; // the glitch or rule this protects
  cohort: Cohort;
  transcript: string;
  raw?: Record<string, unknown>; // guard cases only: the model's (wrong) output
  expect: Record<string, unknown>;
  uncertain?: string[];
}

export const GUARD_CASES: EvalCase[] = [
  {
    id: "G2-followup-inferred",
    why: "AI guessed a follow-up from a danger sign; she never said it",
    cohort: "pregnant",
    transcript: "Phoolmati, 26 saal, 30 hafte. Sir mein bahut dard hai.",
    raw: { danger_signs: { severe_headache: "present" }, follow_up: { needed: true } },
    expect: { "follow_up.needed": null, "danger_signs.severe_headache": "present" },
    uncertain: ["follow_up"],
  },
  {
    id: "followup-spoken",
    why: "A follow-up she did say must be kept",
    cohort: "pregnant",
    transcript: "Sunita, 24 saal. Agle hafte dobara aana hai.",
    raw: { follow_up: { needed: true }, field_confidence: { follow_up: "high" } },
    expect: { "follow_up.needed": true },
  },
  {
    id: "G6-iron-negation-flip",
    why: "Noise dropped meaning: 'goli nahi le rahi' saved as taking",
    cohort: "pregnant",
    transcript: "Iron ki goli nahi le rahi, ulti hoti hai.",
    raw: { assessment: { iron_compliance: "taking" }, field_confidence: { iron_compliance: "high" } },
    expect: { "assessment.iron_compliance": null },
    uncertain: ["iron_compliance"],
  },
  {
    id: "iron-taking-true",
    why: "A true 'taking' must not be cleared by the negation guard",
    cohort: "pregnant",
    transcript: "Iron ki goli roz le rahi hai.",
    raw: { assessment: { iron_compliance: "taking" }, field_confidence: { iron_compliance: "high" } },
    expect: { "assessment.iron_compliance": "taking" },
  },
  {
    id: "G8-goli-misheard",
    why: "Engine wrote गली for goli; the negation still sits next to आयरन",
    cohort: "pregnant",
    transcript: "आयरन की गली नहीं ले रही।",
    raw: { assessment: { iron_compliance: "taking" }, field_confidence: { iron_compliance: "high" } },
    expect: { "assessment.iron_compliance": null },
    uncertain: ["iron_compliance"],
  },
  {
    id: "G9-invented-danger-sign",
    why: "AI flagged reduced baby movement; nobody spoke of movement",
    cohort: "pregnant",
    transcript: "Rekha, 22 saal, 34 hafte. BP normal tha.",
    raw: { danger_signs: { reduced_fetal_movement: "present" } },
    expect: { "danger_signs.reduced_fetal_movement": "unclear" },
  },
  {
    id: "danger-sign-spoken",
    why: "A danger sign she said must stay present (refer banner fires)",
    cohort: "pregnant",
    transcript: "Pairon mein bahut sujan hai aur aankhon ke aage dhundh.",
    raw: { danger_signs: { swelling: "present", blurred_vision: "present" } },
    expect: { "danger_signs.swelling": "present", "danger_signs.blurred_vision": "present" },
  },
  {
    id: "danger-absent-unspoken",
    why: "A sign never asked about must not be saved as 'absent' (silent miss)",
    cohort: "pregnant",
    transcript: "Kamla, 25 saal, 20 hafte. BP normal.",
    raw: { danger_signs: { bleeding: "absent", swelling: "absent" } },
    expect: { "danger_signs.bleeding": "unclear", "danger_signs.swelling": "unclear" },
  },
  {
    id: "danger-absent-blanket",
    why: "'Koi takleef nahi' is a real answer: absent may stay",
    cohort: "pregnant",
    transcript: "Kamla, 25 saal. Koi takleef nahi hai, sab theek hai.",
    raw: { danger_signs: { bleeding: "absent", swelling: "absent" } },
    expect: { "danger_signs.bleeding": "absent", "danger_signs.swelling": "absent" },
  },
  {
    id: "G11-nutrition-inferred",
    why: "AI called her 'thin' from pallor; nutrition was never discussed",
    cohort: "adolescent",
    transcript: "Pooja, 15 saal. Chehra peela lag raha hai, kamzori hai.",
    raw: { adolescent: { nutrition: "thin", pallor: "present" }, field_confidence: { nutrition: "high" } },
    expect: { "adolescent.nutrition": null, "adolescent.pallor": "present" },
    uncertain: ["nutrition"],
  },
  {
    id: "nutrition-spoken",
    why: "Nutrition she described must be kept",
    cohort: "adolescent",
    transcript: "Pooja, 15 saal, bahut dubli patli hai.",
    raw: { adolescent: { nutrition: "thin" }, field_confidence: { nutrition: "high" } },
    expect: { "adolescent.nutrition": "thin" },
  },
  {
    id: "adolescent-ifa-negation",
    why: "Weekly blue tablet not taken must not save as taking",
    cohort: "adolescent",
    transcript: "Neeli goli school mein milti hai par nahi khati.",
    raw: { adolescent: { ifa_compliance: "taking" }, field_confidence: { ifa_compliance: "high" } },
    expect: { "adolescent.ifa_compliance": null },
    uncertain: ["ifa_compliance"],
  },
  {
    id: "week-out-of-range",
    why: "Misheard number: week 60 is impossible, so ask, don't save",
    cohort: "pregnant",
    transcript: "Saath hafte.",
    raw: { beneficiary: { gestational_week: 60 }, field_confidence: { gestational_week: "high" } },
    expect: { "beneficiary.gestational_week": null },
    uncertain: ["gestational_week"],
  },
  {
    id: "off-list-value",
    why: "AI invented a BP category outside the form's options",
    cohort: "pregnant",
    transcript: "BP thoda upar tha.",
    raw: { assessment: { bp_status: "slightly_high" }, field_confidence: { bp_status: "high" } },
    expect: { "assessment.bp_status": null },
    uncertain: ["bp_status"],
  },
  {
    id: "G7-nothing-captured",
    why: "Reel noise / garbage: model returns nothing. Nothing may be invented",
    cohort: "pregnant",
    transcript: "",
    raw: {},
    expect: {
      "beneficiary.name": null,
      "danger_signs.bleeding": "unclear",
      "compliance.llm_clinical_inference": false,
    },
    uncertain: ["name", "age", "gestational_week", "bp_status", "iron_compliance"],
  },
];

// Live cases: real model, real validator, via the deployed API.
export const LIVE_CASES: EvalCase[] = [
  {
    id: "L1-clean-hinglish",
    why: "Happy path, all fields spoken",
    cohort: "pregnant",
    transcript:
      "Sunita Devi, umar 24 saal, 28th week chal raha hai. BP normal tha. Iron ki goli regular le rahi hai. Koi sir dard nahi, sujan nahi, bleeding nahi, baby ki movement theek hai.",
    expect: {
      "beneficiary.name": "Sunita Devi",
      "beneficiary.age.value": 24,
      "beneficiary.gestational_week": 28,
      "assessment.bp_status": "normal",
      "assessment.iron_compliance": "taking",
      "danger_signs.severe_headache": "absent",
    },
  },
  {
    id: "L2-danger-no-followup",
    why: "Danger sign spoken, follow-up NOT spoken (G2 end to end)",
    cohort: "pregnant",
    transcript: "Phoolmati, 26 saal, 30 hafte. Sir mein bahut dard hai aur aankhon ke aage dhundhla dikhta hai.",
    expect: {
      "danger_signs.severe_headache": "present",
      "danger_signs.blurred_vision": "present",
      "follow_up.needed": null,
    },
  },
  {
    id: "L3-iron-not-taking",
    why: "Negation must survive end to end (G6)",
    cohort: "pregnant",
    transcript: "Rekha, 22 saal, 18 hafte. Iron ki goli nahi le rahi, ulti hoti hai. BP normal.",
    expect: { "assessment.iron_compliance": "not_taking" },
  },
  {
    id: "L4-pure-hindi",
    why: "Pure Hindi in Devanagari, as Sarvam returns it",
    cohort: "pregnant",
    transcript: "कमला, उम्र पच्चीस साल, बीस हफ्ते की गर्भवती। बीपी ठीक था। पैरों में सूजन है।",
    expect: {
      "beneficiary.age.value": 25,
      "beneficiary.gestational_week": 20,
      "assessment.bp_status": "normal",
      "danger_signs.swelling": "present",
    },
  },
  {
    id: "L5-unstated-stays-blank",
    why: "Only name and age said: nothing else may be filled",
    cohort: "pregnant",
    transcript: "Geeta, 30 saal.",
    expect: {
      "beneficiary.name": "Geeta",
      "assessment.bp_status": null,
      "assessment.iron_compliance": null,
      "beneficiary.gestational_week": null,
    },
    uncertain: ["bp_status", "iron_compliance", "gestational_week"],
  },
  {
    id: "L6-adolescent-pallor-only",
    why: "Pallor spoken, nutrition not (G11 end to end)",
    cohort: "adolescent",
    transcript: "Pooja, 15 saal, school jaati hai. Chehra peela lag raha hai. Neeli goli har hafte le rahi hai.",
    expect: {
      "adolescent.in_school": "studying",
      "adolescent.pallor": "present",
      "adolescent.ifa_compliance": "taking",
      "adolescent.nutrition": null,
    },
  },
  {
    id: "L7-adolescent-heavy-bleeding",
    why: "Adolescent refer-trigger spoken",
    cohort: "adolescent",
    transcript: "Anjali, 16 saal. Mahwari mein bahut zyada khoon jaata hai, saat din tak.",
    expect: { "adolescent_danger_signs.heavy_bleeding": "present" },
  },
];

// Input check (before the AI): text that must be blocked vs. let through.
export const INPUT_CASES: { id: string; text: string; ok: boolean }[] = [
  { id: "mash-short", text: "asdfgh", ok: false },
  { id: "mash-long", text: "asdf jkl qwrt zxcv bnm", ok: false },
  { id: "repeat-noise", text: "aaaaaa hhhhhh mmmmmm", ok: false },
  { id: "lone-name", text: "Phoolmati", ok: false },
  { id: "short-real", text: "Sunita 24 saal", ok: true },
  { id: "hinglish-note", text: "Rekha, 22 saal, 18 hafte. Iron ki goli nahi le rahi.", ok: true },
  { id: "pure-hindi", text: "कमला, उम्र पच्चीस साल, बीस हफ्ते।", ok: true },
  { id: "garbled-but-real", text: "Phoolmati 26 sal tees hafte sir dard", ok: true },
];

// Cross-visit check: same woman, earlier visit on record.
const PAST = [
  { id: "p1", created_at: "2026-11-12T10:00:00Z", beneficiary_name: "Phoolmati", gestational_week: 28,
    record: { cohort: "pregnant", beneficiary: { age: { value: 26 } } } },
];
export const CONTINUITY_CASES: {
  id: string; why: string; name: string; week: number | null; age: number | null;
  flags: string[]; expectedWeek?: number;
}[] = [
  { id: "week-mismatch", why: "28 wk on 12 Nov, says 22 on 28 Nov → ask (expect 30)", name: "Phoolmati", week: 22, age: 26, flags: ["gestational_week"], expectedWeek: 30 },
  { id: "week-consistent", why: "28 wk + 16 days, says 30 → no question", name: "Phoolmati", week: 30, age: 26, flags: [] },
  { id: "week-within-slack", why: "says 31 (1 off) → no question", name: "Phoolmati", week: 31, age: 26, flags: [] },
  { id: "name-case-space", why: "'phoolmati ' matches 'Phoolmati'", name: " phoolmati ", week: 22, age: 26, flags: ["gestational_week"] },
  { id: "age-went-down", why: "26 last time, says 24 → ask", name: "Phoolmati", week: 30, age: 24, flags: ["age"] },
  { id: "first-visit", why: "No earlier visit → nothing to compare", name: "Sunita", week: 22, age: 24, flags: [] },
];
export { PAST as CONTINUITY_PAST };
