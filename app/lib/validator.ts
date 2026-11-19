// ASHA Awaaz — in-code validator / guardrail layer.
//
// Non-negotiable guardrails, baked structurally — not left to the prompt.
// The model's raw output is UNTRUSTED. This layer clamps it to the frozen
// schema before anything downstream sees it.
//
// Guarantees enforced here, regardless of what the model returned:
//   1. No inferred clinical values. Unstated field = null, never guessed.
//   2. Closed enums for every coded field. Off-enum => null.
//   3. Numbers out of plausible range => null + marked uncertain.
//   4. compliance.llm_clinical_inference is hard false, always.
//   5. uncertain_fields is RECOMPUTED here over the cohort's fields only.

import {
  VisitNote,
  VisitLanguage,
  Cohort,
  FieldName,
  Confidence,
  BpStatus,
  IronCompliance,
  SchoolStatus,
  YesNo,
  PeriodPattern,
  MenstrualHygiene,
  AlbendazoleStatus,
  NutritionStatus,
  TriState,
  DangerSignStatus,
  emptyVisitNote,
  fieldsForCohort,
  isFieldSet,
  BP_STATUS_VALUES,
  IRON_COMPLIANCE_VALUES,
  SCHOOL_VALUES,
  YESNO_VALUES,
  PERIOD_PATTERN_VALUES,
  HYGIENE_VALUES,
  ALBENDAZOLE_VALUES,
  NUTRITION_VALUES,
  TRISTATE_VALUES,
  DANGER_SIGNS,
  ADOLESCENT_DANGER_SIGNS,
  DANGER_SIGN_VALUES,
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
 * VisitNote for the given cohort. Nothing here trusts the model: every field is
 * re-derived, every value is clamped, and uncertain_fields is recomputed.
 */
export function enforceGuardrails(
  raw: RawModelOutput,
  cohort: Cohort,
  language: VisitLanguage,
  verbatim: string,
): VisitNote {
  const note = emptyVisitNote(cohort, language, verbatim);

  const beneficiary = nested(raw, "beneficiary");
  const followUp = nested(raw, "follow_up");
  const rawConf = nested(raw, "field_confidence");
  const transcript = nested(raw, "transcript");

  const fields = fieldsForCohort(cohort);
  const claimedConf: Partial<Record<FieldName, Confidence>> = {};
  for (const f of fields) claimedConf[f] = asConfidence(rawConf[f]);

  // Fields the validator itself forced to null (off-enum / out of range).
  const forcedUncertain = new Set<FieldName>();

  // --- shared: beneficiary.name / age -------------------------------------
  note.beneficiary.name = asString(beneficiary.name);

  const ageObj = nested(beneficiary, "age");
  const ageVal = asInt(ageObj.value ?? beneficiary.age);
  if (ageVal !== null && (ageVal < AGE_YEARS_MIN || ageVal > AGE_YEARS_MAX)) {
    note.beneficiary.age.value = null; // implausible -> drop, don't guess
    if (claimedConf.age !== "unclear") forcedUncertain.add("age");
  } else {
    note.beneficiary.age.value = ageVal;
  }

  // --- shared: follow_up ---------------------------------------------------
  const needed = followUp.needed;
  note.follow_up.needed = typeof needed === "boolean" ? needed : null;
  note.follow_up.reason = asString(followUp.reason);
  note.follow_up.by_date = asString(followUp.by_date);

  // --- transcript ----------------------------------------------------------
  note.transcript.language_detected = asString(transcript.language_detected);

  if (cohort === "pregnant") {
    const assessment = nested(raw, "assessment");

    // gestational_week (plausibility bounds)
    const gw = asInt(beneficiary.gestational_week);
    if (gw !== null && (gw < GESTATIONAL_WEEK_MIN || gw > GESTATIONAL_WEEK_MAX)) {
      note.beneficiary.gestational_week = null;
      if (claimedConf.gestational_week !== "unclear")
        forcedUncertain.add("gestational_week");
    } else {
      note.beneficiary.gestational_week = gw;
    }

    // bp_status (closed enum, no inference)
    const bp = clampEnum<Exclude<BpStatus, null>>(
      assessment.bp_status,
      BP_STATUS_VALUES,
    );
    note.assessment.bp_status = bp;
    if (bp === null && assessment.bp_status != null && claimedConf.bp_status !== "unclear") {
      forcedUncertain.add("bp_status");
    }
    note.assessment.bp_reading = asString(assessment.bp_reading);

    // iron_compliance (closed enum)
    const iron = clampEnum<Exclude<IronCompliance, null>>(
      assessment.iron_compliance,
      IRON_COMPLIANCE_VALUES,
    );
    note.assessment.iron_compliance = iron;
    if (iron === null && assessment.iron_compliance != null && claimedConf.iron_compliance !== "unclear") {
      forcedUncertain.add("iron_compliance");
    }
    note.assessment.iron_compliance_verbatim = asString(
      assessment.iron_compliance_verbatim,
    );

    // HRP danger signs — each clamped to present|absent|unclear, never inferred.
    const rawDanger = nested(raw, "danger_signs");
    for (const sign of DANGER_SIGNS) {
      const v = clampEnum<DangerSignStatus>(rawDanger[sign], DANGER_SIGN_VALUES);
      note.danger_signs[sign] = v ?? "unclear";
    }
  } else {
    // --- adolescent (RKSK / WIFS) -----------------------------------------
    const ado = nested(raw, "adolescent");
    const a = note.adolescent;

    a.in_school = clampEnum<Exclude<SchoolStatus, null>>(ado.in_school, SCHOOL_VALUES);
    if (a.in_school === null && ado.in_school != null && claimedConf.in_school !== "unclear")
      forcedUncertain.add("in_school");

    a.periods_started = clampEnum<Exclude<YesNo, null>>(ado.periods_started, YESNO_VALUES);
    if (a.periods_started === null && ado.periods_started != null && claimedConf.periods_started !== "unclear")
      forcedUncertain.add("periods_started");

    a.period_pattern = clampEnum<Exclude<PeriodPattern, null>>(ado.period_pattern, PERIOD_PATTERN_VALUES);
    if (a.period_pattern === null && ado.period_pattern != null && claimedConf.period_pattern !== "unclear")
      forcedUncertain.add("period_pattern");

    a.menstrual_hygiene = clampEnum<Exclude<MenstrualHygiene, null>>(ado.menstrual_hygiene, HYGIENE_VALUES);
    if (a.menstrual_hygiene === null && ado.menstrual_hygiene != null && claimedConf.menstrual_hygiene !== "unclear")
      forcedUncertain.add("menstrual_hygiene");

    a.ifa_compliance = clampEnum<Exclude<IronCompliance, null>>(ado.ifa_compliance, IRON_COMPLIANCE_VALUES);
    if (a.ifa_compliance === null && ado.ifa_compliance != null && claimedConf.ifa_compliance !== "unclear")
      forcedUncertain.add("ifa_compliance");

    a.albendazole = clampEnum<Exclude<AlbendazoleStatus, null>>(ado.albendazole, ALBENDAZOLE_VALUES);
    if (a.albendazole === null && ado.albendazole != null && claimedConf.albendazole !== "unclear")
      forcedUncertain.add("albendazole");

    a.pallor = clampEnum<TriState>(ado.pallor, TRISTATE_VALUES) ?? "unclear";

    a.nutrition = clampEnum<Exclude<NutritionStatus, null>>(ado.nutrition, NUTRITION_VALUES);
    if (a.nutrition === null && ado.nutrition != null && claimedConf.nutrition !== "unclear")
      forcedUncertain.add("nutrition");

    a.marriage_pressure = clampEnum<TriState>(ado.marriage_pressure, TRISTATE_VALUES) ?? "unclear";

    // Adolescent refer-triggers — each clamped, never inferred.
    const rawDanger = nested(raw, "adolescent_danger_signs");
    for (const sign of ADOLESCENT_DANGER_SIGNS) {
      const v = clampEnum<DangerSignStatus>(rawDanger[sign], DANGER_SIGN_VALUES);
      note.adolescent_danger_signs[sign] = v ?? "unclear";
    }
  }

  // --- recompute field_confidence & uncertain_fields (cohort fields) ------
  for (const f of fields) {
    if (forcedUncertain.has(f) || claimedConf[f] === "unclear") {
      note.field_confidence[f] = "unclear";
    } else if (isFieldSet(note, f)) {
      note.field_confidence[f] = claimedConf[f];
    } else {
      note.field_confidence[f] = "unclear";
    }
  }

  note.uncertain_fields = fields.filter(
    (f) => note.field_confidence[f] === "unclear",
  );

  // Hard-assert the compliance posture — never trust the model's copy.
  note.compliance = { llm_clinical_inference: false, unstated_is_null: true };

  return note;
}
