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
  BpStatus,
  IronCompliance,
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

// --- Hindi labels / value phrasing for read-back -------------------------

const FIELD_LABEL_HI: Record<FieldName, string> = {
  name: "नाम",
  age: "उम्र",
  gestational_week: "गर्भावस्था सप्ताह",
  bp_status: "बी पी",
  iron_compliance: "आयरन की गोली",
  follow_up: "फ़ॉलो अप",
};

export const FIELD_LABEL_EN: Record<FieldName, string> = {
  name: "Name",
  age: "Age",
  gestational_week: "Gestational week",
  bp_status: "BP",
  iron_compliance: "Iron tablets",
  follow_up: "Follow-up",
};

const BP_HI: Record<Exclude<BpStatus, null>, string> = {
  normal: "सामान्य",
  high: "ज़्यादा",
  low: "कम",
  not_measured: "नहीं नापा गया",
};

const IRON_HI: Record<Exclude<IronCompliance, null>, string> = {
  taking: "ले रही है",
  not_taking: "नहीं ले रही",
  partial: "कभी-कभी ले रही है",
};

function valuePhraseHi(note: VisitNote, field: FieldName): string {
  switch (field) {
    case "name":
      return note.beneficiary.name ?? "नहीं बताया";
    case "age":
      return note.beneficiary.age.value != null
        ? `${note.beneficiary.age.value} साल`
        : "नहीं बताया";
    case "gestational_week":
      return note.beneficiary.gestational_week != null
        ? `${note.beneficiary.gestational_week} सप्ताह`
        : "नहीं बताया";
    case "bp_status":
      return note.assessment.bp_status
        ? BP_HI[note.assessment.bp_status]
        : "नहीं बताया";
    case "iron_compliance":
      return note.assessment.iron_compliance
        ? IRON_HI[note.assessment.iron_compliance]
        : "नहीं बताया";
    case "follow_up":
      return note.follow_up.needed == null
        ? "नहीं बताया"
        : note.follow_up.needed
          ? "ज़रूरी है"
          : "ज़रूरी नहीं";
  }
}

// Full spoken read-back of the whole note, in Hindi.
export function readBackSentence(note: VisitNote): string {
  const parts = (Object.keys(FIELD_LABEL_HI) as FieldName[]).map(
    (f) => `${FIELD_LABEL_HI[f]}: ${valuePhraseHi(note, f)}`,
  );
  return parts.join("। ") + "।";
}

// Spoken question for a single unclear field (targeted re-ask, no restart).
export function askFieldSentence(field: FieldName): string {
  const q: Record<FieldName, string> = {
    name: "मरीज़ का नाम दोबारा बोलिए।",
    age: "उम्र दोबारा बोलिए।",
    gestational_week: "गर्भावस्था कौन सा सप्ताह है, दोबारा बोलिए।",
    bp_status: "बी पी कैसा था — सामान्य, ज़्यादा, या कम? दोबारा बोलिए।",
    iron_compliance:
      "आयरन की गोली ले रही है या नहीं? दोबारा बोलिए।",
    follow_up: "फ़ॉलो अप ज़रूरी है या नहीं? दोबारा बोलिए।",
  };
  return q[field];
}
