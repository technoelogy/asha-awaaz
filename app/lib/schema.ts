// ASHA Awaaz — Visit-Note Schema (v1.1, cohort-aware)
//
// The one principle: the structured JSON visit-note is the single source of
// truth. The PHC dashboard row, the JSON export, any future ABHA/HMIS push
// are all RENDERINGS of this — never the record itself.
//
// v1.1 adds `cohort`. One visit = one beneficiary in one cohort. The pregnant
// (ANC) shape is unchanged from v1.0 and frozen. The adolescent-girl shape is
// added alongside; a note carries only the block its cohort uses, the other
// stays at defaults. Who-is-this-visit-for is chosen BEFORE voice capture, so
// structuring/validation/confirm all run cohort-aware.

export const SCHEMA_VERSION = "1.1";

// The live cohorts in v1.1. (Women 30+, new mother, child under 5 = roadmap.)
export type Cohort = "pregnant" | "adolescent";

// Hindi | Hinglish (code-switched). Wispr-native languages for this build.
export type VisitLanguage = "hi" | "hi-en";

// Per-field confidence. "unclear" is the signal that drives the targeted
// confirm-and-correct loop — only unclear fields get re-asked, never a restart.
export type Confidence = "high" | "medium" | "low" | "unclear";

// Tri-state, never guessed: present (reported) | absent (explicitly denied) |
// unclear (not mentioned — the confirm screen asks). Used by danger signs and
// by the adolescent pallor / marriage-pressure observations.
export type TriState = "present" | "absent" | "unclear";
export type DangerSignStatus = TriState;

// ----- pregnant (ANC) assessment enums ----------------------------------
export type BpStatus = "normal" | "high" | "low" | "not_measured" | null;
export type IronCompliance = "taking" | "not_taking" | "partial" | null;

export type DangerSignName =
  | "severe_headache"
  | "blurred_vision"
  | "swelling"
  | "bleeding"
  | "reduced_fetal_movement";

// ----- adolescent-girl (RKSK / WIFS) enums ------------------------------
export type SchoolStatus = "studying" | "dropped_out" | null;
export type YesNo = "yes" | "no" | null;
export type PeriodPattern = "regular" | "irregular" | "very_heavy" | null;
export type MenstrualHygiene = "sanitary_pad" | "cloth" | "other" | null;
export type AlbendazoleStatus = "taken" | "not_taken" | null;
export type NutritionStatus = "normal" | "thin" | "not_measured" | null;

// Adolescent refer-triggers (severe anaemia / bleeding). Tri-state like ANC.
export type AdolescentDangerSignName =
  | "severe_pallor"
  | "breathlessness"
  | "heavy_bleeding";

// ----- field-name unions, per cohort ------------------------------------
export type PregnantFieldName =
  | "name"
  | "age"
  | "gestational_week"
  | "bp_status"
  | "iron_compliance"
  | "follow_up";

export type AdolescentFieldName =
  | "name"
  | "age"
  | "in_school"
  | "periods_started"
  | "period_pattern"
  | "menstrual_hygiene"
  | "ifa_compliance"
  | "albendazole"
  | "pallor"
  | "nutrition"
  | "marriage_pressure"
  | "follow_up";

export type FieldName = PregnantFieldName | AdolescentFieldName;

export interface VisitNote {
  schema_version: string;
  visit_id: string;
  created_at: string; // ISO-8601
  source: "voice";
  language: VisitLanguage;
  cohort: Cohort;

  asha: {
    asha_id: string | null;
    name: string | null;
    phc_id: string | null;
  };

  beneficiary: {
    name: string | null;
    age: { value: number | null; unit: "years" };
    gestational_week: number | null; // pregnant only; null otherwise
  };

  // Pregnant (ANC) assessment. Unused (defaults) for adolescent notes.
  assessment: {
    bp_status: BpStatus;
    bp_reading: string | null; // verbatim only if she stated numbers e.g. "140/90"
    iron_compliance: IronCompliance;
    iron_compliance_verbatim: string | null;
  };

  // HRP danger-sign screening (ANC). Each sign present | absent | unclear.
  danger_signs: Record<DangerSignName, DangerSignStatus>;

  // Adolescent-girl assessment (RKSK / WIFS). Unused (defaults) for pregnant.
  adolescent: {
    in_school: SchoolStatus;
    periods_started: YesNo;
    period_pattern: PeriodPattern;
    menstrual_hygiene: MenstrualHygiene;
    ifa_compliance: IronCompliance; // weekly blue IFA tablet (WIFS)
    albendazole: AlbendazoleStatus; // six-monthly deworming
    pallor: TriState; // routine pallor / weakness observation
    nutrition: NutritionStatus;
    marriage_pressure: TriState; // asked privately where appropriate
  };

  // Adolescent refer-triggers. Unused (defaults) for pregnant.
  adolescent_danger_signs: Record<AdolescentDangerSignName, DangerSignStatus>;

  follow_up: {
    needed: boolean | null;
    reason: string | null;
    by_date: string | null; // ISO-8601 date | null
  };

  transcript: {
    verbatim: string; // raw Wispr transcript, code-switch preserved as spoken
    language_detected: string | null;
  };

  // Per-field confidence from the structuring pass (cohort fields only).
  field_confidence: Partial<Record<FieldName, Confidence>>;

  // Drives the confirm-and-correct screen: she is asked ONLY about these,
  // one field at a time, never the whole note.
  uncertain_fields: FieldName[];

  status: {
    confirmed_by_asha: boolean;
  };

  // Guardrails baked into the record, not left to the prompt.
  compliance: {
    llm_clinical_inference: false; // hard false — the model structures, never fills gaps
    unstated_is_null: true;
  };
}

// Plausibility bounds — used by the validator to reject out-of-range numbers
// (they become null + uncertain, never a silent guess).
export const GESTATIONAL_WEEK_MIN = 1;
export const GESTATIONAL_WEEK_MAX = 45;
export const AGE_YEARS_MIN = 10;
export const AGE_YEARS_MAX = 60; // maternal-health beneficiary band

export const PREGNANT_FIELDS: PregnantFieldName[] = [
  "name",
  "age",
  "gestational_week",
  "bp_status",
  "iron_compliance",
  "follow_up",
];

export const ADOLESCENT_FIELDS: AdolescentFieldName[] = [
  "name",
  "age",
  "in_school",
  "periods_started",
  "period_pattern",
  "menstrual_hygiene",
  "ifa_compliance",
  "albendazole",
  "pallor",
  "nutrition",
  "marriage_pressure",
  "follow_up",
];

export function fieldsForCohort(cohort: Cohort): FieldName[] {
  return cohort === "adolescent" ? ADOLESCENT_FIELDS : PREGNANT_FIELDS;
}

// Enum value sets (also used by the validator to clamp off-enum => null).
export const BP_STATUS_VALUES = ["normal", "high", "low", "not_measured"] as const;
export const IRON_COMPLIANCE_VALUES = ["taking", "not_taking", "partial"] as const;
export const SCHOOL_VALUES = ["studying", "dropped_out"] as const;
export const YESNO_VALUES = ["yes", "no"] as const;
export const PERIOD_PATTERN_VALUES = ["regular", "irregular", "very_heavy"] as const;
export const HYGIENE_VALUES = ["sanitary_pad", "cloth", "other"] as const;
export const ALBENDAZOLE_VALUES = ["taken", "not_taken"] as const;
export const NUTRITION_VALUES = ["normal", "thin", "not_measured"] as const;
export const TRISTATE_VALUES = ["present", "absent", "unclear"] as const;
export const DANGER_SIGN_VALUES = TRISTATE_VALUES;

export const DANGER_SIGNS: DangerSignName[] = [
  "severe_headache",
  "blurred_vision",
  "swelling",
  "bleeding",
  "reduced_fetal_movement",
];

export const ADOLESCENT_DANGER_SIGNS: AdolescentDangerSignName[] = [
  "severe_pallor",
  "breathlessness",
  "heavy_bleeding",
];

function emptyDangerSigns(): Record<DangerSignName, DangerSignStatus> {
  return {
    severe_headache: "unclear",
    blurred_vision: "unclear",
    swelling: "unclear",
    bleeding: "unclear",
    reduced_fetal_movement: "unclear",
  };
}

function emptyAdolescentDanger(): Record<AdolescentDangerSignName, DangerSignStatus> {
  return {
    severe_pallor: "unclear",
    breathlessness: "unclear",
    heavy_bleeding: "unclear",
  };
}

// Active danger-sign set for a note (so confirm/voice/dashboard stay cohort-aware
// without duplicating the pregnant-vs-adolescent branch everywhere).
export function dangerSignNames(cohort: Cohort): string[] {
  return cohort === "adolescent" ? ADOLESCENT_DANGER_SIGNS : DANGER_SIGNS;
}

export function dangerSignStatus(note: VisitNote, sign: string): DangerSignStatus {
  if (note.cohort === "adolescent") {
    return note.adolescent_danger_signs[sign as AdolescentDangerSignName] ?? "unclear";
  }
  return note.danger_signs[sign as DangerSignName] ?? "unclear";
}

export function setDangerSign(
  note: VisitNote,
  sign: string,
  status: DangerSignStatus,
): void {
  if (note.cohort === "adolescent") {
    note.adolescent_danger_signs[sign as AdolescentDangerSignName] = status;
  } else {
    note.danger_signs[sign as DangerSignName] = status;
  }
}

export function presentDangerSigns(note: VisitNote): string[] {
  return dangerSignNames(note.cohort).filter(
    (s) => dangerSignStatus(note, s) === "present",
  );
}

// ----- unified field get/set (one place maps field -> storage location) ----
// Keeps validator, confirm UI and voice read-back from each re-deriving the
// field->location mapping. Returns the underlying stored value, or null.
export function fieldRawValue(
  note: VisitNote,
  field: FieldName,
): string | number | boolean | null {
  switch (field) {
    case "name":
      return note.beneficiary.name;
    case "age":
      return note.beneficiary.age.value;
    case "gestational_week":
      return note.beneficiary.gestational_week;
    case "bp_status":
      return note.assessment.bp_status;
    case "iron_compliance":
      return note.assessment.iron_compliance;
    case "in_school":
      return note.adolescent.in_school;
    case "periods_started":
      return note.adolescent.periods_started;
    case "period_pattern":
      return note.adolescent.period_pattern;
    case "menstrual_hygiene":
      return note.adolescent.menstrual_hygiene;
    case "ifa_compliance":
      return note.adolescent.ifa_compliance;
    case "albendazole":
      return note.adolescent.albendazole;
    case "pallor":
      return note.adolescent.pallor === "unclear" ? null : note.adolescent.pallor;
    case "nutrition":
      return note.adolescent.nutrition;
    case "marriage_pressure":
      return note.adolescent.marriage_pressure === "unclear"
        ? null
        : note.adolescent.marriage_pressure;
    case "follow_up":
      return note.follow_up.needed;
  }
}

export function isFieldSet(note: VisitNote, field: FieldName): boolean {
  return fieldRawValue(note, field) !== null;
}

// An empty, schema-valid visit-note for a cohort. Every field null/empty =
// nothing guessed.
export function emptyVisitNote(
  cohort: Cohort,
  language: VisitLanguage,
  verbatim: string,
): VisitNote {
  const field_confidence: Partial<Record<FieldName, Confidence>> = {};
  for (const f of fieldsForCohort(cohort)) field_confidence[f] = "unclear";

  return {
    schema_version: SCHEMA_VERSION,
    visit_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    source: "voice",
    language,
    cohort,
    asha: { asha_id: null, name: null, phc_id: null },
    beneficiary: {
      name: null,
      age: { value: null, unit: "years" },
      gestational_week: null,
    },
    assessment: {
      bp_status: null,
      bp_reading: null,
      iron_compliance: null,
      iron_compliance_verbatim: null,
    },
    danger_signs: emptyDangerSigns(),
    adolescent: {
      in_school: null,
      periods_started: null,
      period_pattern: null,
      menstrual_hygiene: null,
      ifa_compliance: null,
      albendazole: null,
      pallor: "unclear",
      nutrition: null,
      marriage_pressure: "unclear",
    },
    adolescent_danger_signs: emptyAdolescentDanger(),
    follow_up: { needed: null, reason: null, by_date: null },
    transcript: { verbatim, language_detected: null },
    field_confidence,
    uncertain_fields: [],
    status: { confirmed_by_asha: false },
    compliance: { llm_clinical_inference: false, unstated_is_null: true },
  };
}
