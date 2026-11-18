// ASHA Awaaz — Visit-Note Schema (v1.0, FROZEN for v1)
//
// The one principle: the structured JSON visit-note is the single source of
// truth. The PHC dashboard row, the JSON export, any future ABHA/HMIS push
// are all RENDERINGS of this — never the record itself.
//
// P1 critical path builds against this stable shape. Freeze before scaling.

export const SCHEMA_VERSION = "1.0";

// Hindi | Hinglish (code-switched). Wispr-native languages for this build.
export type VisitLanguage = "hi" | "hi-en";

// Per-field confidence. "unclear" is the signal that drives the targeted
// confirm-and-correct loop — only unclear fields get re-asked, never a restart.
export type Confidence = "high" | "medium" | "low" | "unclear";

// BP is NEVER a guessed clinical value. Enum is closed; anything the ASHA
// did not clearly state resolves to null (not_measured is only when she
// explicitly says it was not taken).
export type BpStatus = "normal" | "high" | "low" | "not_measured" | null;

// Iron/IFA tablet compliance, as reported by the ASHA.
export type IronCompliance = "taking" | "not_taking" | "partial" | null;

export type FieldName =
  | "name"
  | "age"
  | "gestational_week"
  | "bp_status"
  | "iron_compliance"
  | "follow_up";

export interface VisitNote {
  schema_version: string;
  visit_id: string;
  created_at: string; // ISO-8601
  source: "voice";
  language: VisitLanguage;

  asha: {
    asha_id: string | null;
    name: string | null;
    phc_id: string | null;
  };

  beneficiary: {
    name: string | null;
    age: { value: number | null; unit: "years" };
    gestational_week: number | null; // weeks of pregnancy, 1–45 or null
  };

  assessment: {
    bp_status: BpStatus;
    bp_reading: string | null; // verbatim only if she stated numbers e.g. "140/90"
    iron_compliance: IronCompliance;
    iron_compliance_verbatim: string | null;
  };

  follow_up: {
    needed: boolean | null;
    reason: string | null;
    by_date: string | null; // ISO-8601 date | null
  };

  transcript: {
    verbatim: string; // raw Wispr transcript, code-switch preserved as spoken
    language_detected: string | null;
  };

  // Per-field confidence from the structuring pass.
  field_confidence: Record<FieldName, Confidence>;

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

export const ALL_FIELDS: FieldName[] = [
  "name",
  "age",
  "gestational_week",
  "bp_status",
  "iron_compliance",
  "follow_up",
];

export const BP_STATUS_VALUES = ["normal", "high", "low", "not_measured"] as const;
export const IRON_COMPLIANCE_VALUES = ["taking", "not_taking", "partial"] as const;

// An empty, schema-valid visit-note. Every field null/empty = nothing guessed.
export function emptyVisitNote(
  language: VisitLanguage,
  verbatim: string,
): VisitNote {
  return {
    schema_version: SCHEMA_VERSION,
    visit_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    source: "voice",
    language,
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
    follow_up: { needed: null, reason: null, by_date: null },
    transcript: { verbatim, language_detected: null },
    field_confidence: {
      name: "unclear",
      age: "unclear",
      gestational_week: "unclear",
      bp_status: "unclear",
      iron_compliance: "unclear",
      follow_up: "unclear",
    },
    uncertain_fields: [],
    status: { confirmed_by_asha: false },
    compliance: { llm_clinical_inference: false, unstated_is_null: true },
  };
}
