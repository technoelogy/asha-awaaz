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
// Words that mean she actually spoke about a follow-up / next visit.
const FOLLOW_UP_CUES =
  /follow|फ़ॉलो|फॉलो|दोबारा|dobara|phir se|फिर से|agle|अगले|agla|अगला|bulana|बुलाना|bulaya|बुलाया|next (visit|month|week)|check.?up|चेकअप|जाँच|जांच|jaanch|jaanch|milna|मिलना|aana hai|आना है|revisit/i;

// Negation next to an iron / IFA mention ("goli nahi le rahi", "आयरन नहीं").
// If the transcript says "not" but the model says "taking", they contradict:
// clear the field and ask her, never pick one.
const IRON_WORD = "(iron|आयरन|goli|गोली|tablet|टैबलेट|ifa|blue|नीली|लाल)";
const NEG_WORD = "(nahi|nahin|नहीं|नही|na |ना |mat|मत|band|बंद|chhod|छोड़)";
const IRON_NEGATED = new RegExp(
  `${IRON_WORD}[^.।\\n]{0,30}${NEG_WORD}|${NEG_WORD}[^.।\\n]{0,15}${IRON_WORD}`,
  "i",
);
function contradictsTaking(value: string | null, verbatim: string): boolean {
  return value === "taking" && IRON_NEGATED.test(verbatim);
}

// Evidence check for danger signs: a sign can only be "present" if the
// transcript actually mentions it. The model once flagged "reduced fetal
// movement" when nobody spoke of the baby moving. No evidence -> "unclear".
const DANGER_CUES: Record<string, RegExp> = {
  severe_headache: /\bsir\b|\bsar\b|sardard|sirdard|सिर|सर |सर$|सरदर्द|सिरदर्द|headache|head ?ache/i,
  blurred_vision: /dhundh|धुंध|धुँध|blur|aankh|आंख|आँख|nazar|नज़र|नजर|dikh|दिख/i,
  swelling: /sujan|soojan|सूजन|सूज|swell|phool ga|फूल ग|फूल रहे|फूले/i,
  bleeding: /khoon|खून|bleed|ब्लीड|rakt|रक्त|blood/i,
  reduced_fetal_movement: /halchal|हलचल|hil|हिल|harkat|हरकत|movement|move|kick|किक|pet mein bachch|पेट में बच्च/i,
  severe_pallor: /peel|पील|pale|safed|सफ़ेद|सफेद|pallor|chehr|चेहर|khoon ki kami|खून की कमी/i,
  breathlessness: /saans|साँस|सांस|breath|haanf|हांफ|हाँफ|phoolti|फूलती/i,
  heavy_bleeding: /mahwari|माहवारी|महावारी|period|पीरियड|khoon|खून|bleed|blood/i,
};
const NUTRITION_CUES =
  /dubl|दुबल|दुबली|patl|पतल|thin|wajan|वजन|वज़न|weight|kha(na|ti|ate)|खाना|खाती|poshan|पोषण|nutrition|moti|मोटी|healthy|swasth|स्वस्थ|sehat|सेहत|kuposh|कुपोष/i;

// A blanket "no problems" answer. Lets "absent" stand for signs she didn't
// name one by one. Without this or the sign's own word, "absent" is a guess
// (eval G12: model marked unasked signs absent) -> "unclear", she is asked.
const ALL_CLEAR_CUES =
  /koi (bhi )?(takleef|taklif|dikkat|pareshani|problem|samasya|lakshan)|कोई (भी )?(तकलीफ़|तकलीफ|दिक्कत|परेशानी|समस्या|लक्षण|प्रॉब्लम)|sab (theek|thik|normal)|सब (ठीक|नॉर्मल)|no (problem|complaint|danger)|all (fine|normal)/i;

/** Status a danger sign may keep: present/absent need words behind them. */
function evidenced(v: DangerSignStatus | null, sign: string, verbatim: string): DangerSignStatus {
  if (v === "present") return hasEvidence(sign, verbatim) ? "present" : "unclear";
  if (v === "absent") return hasEvidence(sign, verbatim) || ALL_CLEAR_CUES.test(verbatim) ? "absent" : "unclear";
  return "unclear";
}

function hasEvidence(sign: string, verbatim: string): boolean {
  const re = DANGER_CUES[sign];
  return re ? re.test(verbatim) : true;
}

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
  // Models tend to infer "follow-up needed" from a danger sign. Accept a value
  // only if the transcript actually mentions a follow-up / next visit.
  const needed = followUp.needed;
  const mentionsFollowUp = FOLLOW_UP_CUES.test(verbatim);
  note.follow_up.needed = typeof needed === "boolean" && mentionsFollowUp ? needed : null;
  if (typeof needed === "boolean" && !mentionsFollowUp && claimedConf.follow_up !== "unclear") {
    forcedUncertain.add("follow_up");
  }
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
    if (contradictsTaking(iron, verbatim)) {
      note.assessment.iron_compliance = null;
      forcedUncertain.add("iron_compliance");
    }
    note.assessment.iron_compliance_verbatim = asString(
      assessment.iron_compliance_verbatim,
    );

    // HRP danger signs — each clamped to present|absent|unclear, never inferred.
    const rawDanger = nested(raw, "danger_signs");
    for (const sign of DANGER_SIGNS) {
      const v = clampEnum<DangerSignStatus>(rawDanger[sign], DANGER_SIGN_VALUES);
      note.danger_signs[sign] = evidenced(v, sign, verbatim);
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
    if (contradictsTaking(a.ifa_compliance, verbatim)) {
      a.ifa_compliance = null;
      forcedUncertain.add("ifa_compliance");
    }

    a.albendazole = clampEnum<Exclude<AlbendazoleStatus, null>>(ado.albendazole, ALBENDAZOLE_VALUES);
    if (a.albendazole === null && ado.albendazole != null && claimedConf.albendazole !== "unclear")
      forcedUncertain.add("albendazole");

    a.pallor = clampEnum<TriState>(ado.pallor, TRISTATE_VALUES) ?? "unclear";

    a.nutrition = clampEnum<Exclude<NutritionStatus, null>>(ado.nutrition, NUTRITION_VALUES);
    if (a.nutrition === null && ado.nutrition != null && claimedConf.nutrition !== "unclear")
      forcedUncertain.add("nutrition");
    // Nutrition must be spoken about, not inferred from pallor/weakness (test 6).
    if (a.nutrition !== null && !NUTRITION_CUES.test(verbatim)) {
      a.nutrition = null;
      forcedUncertain.add("nutrition");
    }

    a.marriage_pressure = clampEnum<TriState>(ado.marriage_pressure, TRISTATE_VALUES) ?? "unclear";

    // Adolescent refer-triggers — each clamped, never inferred.
    const rawDanger = nested(raw, "adolescent_danger_signs");
    for (const sign of ADOLESCENT_DANGER_SIGNS) {
      const v = clampEnum<DangerSignStatus>(rawDanger[sign], DANGER_SIGN_VALUES);
      note.adolescent_danger_signs[sign] = evidenced(v, sign, verbatim);
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
