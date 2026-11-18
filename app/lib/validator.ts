// ASHA Awaaz — in-code validator / guardrail layer.
//
// Non-negotiable guardrails, baked structurally — not left to the prompt.
// The model's raw output is UNTRUSTED. This layer clamps it to the frozen
// schema before anything downstream sees it.
//
// Guarantees enforced here, regardless of what the model returned:
//   1. No inferred clinical values. Unstated field = null, never guessed.
//   2. Closed enums for bp_status / iron_compliance. Off-enum => null.
//   3. Numbers out of plausible range => null + marked uncertain.
//   4. compliance.llm_clinical_inference is hard false, always.
//   5. uncertain_fields is RECOMPUTED here — the loop asks only about these.

import {
  VisitNote,
  VisitLanguage,
  FieldName,
  Confidence,
  BpStatus,
  IronCompliance,
  emptyVisitNote,
  ALL_FIELDS,
  BP_STATUS_VALUES,
  IRON_COMPLIANCE_VALUES,
  GESTATIONAL_WEEK_MIN,
  GESTATIONAL_WEEK_MAX,
  AGE_YEARS_MIN,
  AGE_YEARS_MAX,
} from "./schema";

// Shape we expect back from the structuring model (all optional / unknown).
type RawModelOutput = Record<string, unknown>;

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function asInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

function asConfidence(v: unknown): Confidence {
  return v === "high" || v === "medium" || v === "low" || v === "unclear"
    ? v
    : "unclear";
}

function clampEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : null;
}

function nested(obj: RawModelOutput, key: string): RawModelOutput {
  const v = obj[key];
  return v && typeof v === "object" ? (v as RawModelOutput) : {};
}

/**
 * Take the model's raw JSON and return a schema-valid, guardrail-enforced
 * VisitNote. Nothing here trusts the model: every field is re-derived, every
 * value is clamped, and uncertain_fields is recomputed from scratch.
 */
export function enforceGuardrails(
  raw: RawModelOutput,
  language: VisitLanguage,
  verbatim: string,
): VisitNote {
  const note = emptyVisitNote(language, verbatim);

  const beneficiary = nested(raw, "beneficiary");
  const assessment = nested(raw, "assessment");
  const followUp = nested(raw, "follow_up");
  const rawConf = nested(raw, "field_confidence");
  const transcript = nested(raw, "transcript");

  // Confidence the model claimed, per field (defaults to unclear).
  const claimedConf: Record<FieldName, Confidence> = {
    name: asConfidence(rawConf.name),
    age: asConfidence(rawConf.age),
    gestational_week: asConfidence(rawConf.gestational_week),
    bp_status: asConfidence(rawConf.bp_status),
    iron_compliance: asConfidence(rawConf.iron_compliance),
    follow_up: asConfidence(rawConf.follow_up),
  };

  // Fields the validator itself forced to null because the value was
  // off-enum or out of range — these get escalated to "unclear".
  const forcedUncertain = new Set<FieldName>();

  // --- beneficiary.name ----------------------------------------------------
  note.beneficiary.name = asString(beneficiary.name);

  // --- beneficiary.age -----------------------------------------------------
  const ageObj = nested(beneficiary, "age");
  const ageVal = asInt(ageObj.value ?? beneficiary.age);
  if (ageVal !== null && (ageVal < AGE_YEARS_MIN || ageVal > AGE_YEARS_MAX)) {
    note.beneficiary.age.value = null; // implausible -> drop, don't guess
    if (claimedConf.age !== "unclear") forcedUncertain.add("age");
  } else {
    note.beneficiary.age.value = ageVal;
  }

  // --- beneficiary.gestational_week ---------------------------------------
  const gw = asInt(beneficiary.gestational_week);
  if (gw !== null && (gw < GESTATIONAL_WEEK_MIN || gw > GESTATIONAL_WEEK_MAX)) {
    note.beneficiary.gestational_week = null;
    if (claimedConf.gestational_week !== "unclear")
      forcedUncertain.add("gestational_week");
  } else {
    note.beneficiary.gestational_week = gw;
  }

  // --- assessment.bp_status (closed enum, no inference) -------------------
  const bp = clampEnum<Exclude<BpStatus, null>>(
    assessment.bp_status,
    BP_STATUS_VALUES,
  );
  note.assessment.bp_status = bp;
  if (bp === null && assessment.bp_status != null && claimedConf.bp_status !== "unclear") {
    forcedUncertain.add("bp_status"); // model said something off-enum
  }
  note.assessment.bp_reading = asString(assessment.bp_reading);

  // --- assessment.iron_compliance (closed enum) --------------------------
  const iron = clampEnum<Exclude<IronCompliance, null>>(
    assessment.iron_compliance,
    IRON_COMPLIANCE_VALUES,
  );
  note.assessment.iron_compliance = iron;
  if (
    iron === null &&
    assessment.iron_compliance != null &&
    claimedConf.iron_compliance !== "unclear"
  ) {
    forcedUncertain.add("iron_compliance");
  }
  note.assessment.iron_compliance_verbatim = asString(
    assessment.iron_compliance_verbatim,
  );

  // --- follow_up -----------------------------------------------------------
  const needed = followUp.needed;
  note.follow_up.needed =
    typeof needed === "boolean" ? needed : null;
  note.follow_up.reason = asString(followUp.reason);
  note.follow_up.by_date = asString(followUp.by_date);

  // --- transcript ----------------------------------------------------------
  note.transcript.language_detected = asString(transcript.language_detected);

  // --- recompute field_confidence & uncertain_fields ---------------------
  // A field is "set" if it carries a real value after clamping. A set field
  // keeps its claimed confidence (min "low"); an unset field is unclear.
  const isSet: Record<FieldName, boolean> = {
    name: note.beneficiary.name !== null,
    age: note.beneficiary.age.value !== null,
    gestational_week: note.beneficiary.gestational_week !== null,
    bp_status: note.assessment.bp_status !== null,
    iron_compliance: note.assessment.iron_compliance !== null,
    follow_up: note.follow_up.needed !== null,
  };

  for (const f of ALL_FIELDS) {
    // Honor the model's own "unclear" flag even when it supplied a value —
    // a flagged value is a suggestion to confirm, never a silent accept.
    if (forcedUncertain.has(f) || claimedConf[f] === "unclear") {
      note.field_confidence[f] = "unclear";
    } else if (isSet[f]) {
      note.field_confidence[f] = claimedConf[f];
    } else {
      note.field_confidence[f] = "unclear";
    }
  }

  // The confirm-and-correct loop targets exactly these.
  note.uncertain_fields = ALL_FIELDS.filter(
    (f) => note.field_confidence[f] === "unclear",
  );

  // Hard-assert the compliance posture — never trust the model's copy.
  note.compliance = { llm_clinical_inference: false, unstated_is_null: true };

  return note;
}
