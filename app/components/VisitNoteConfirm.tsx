// ASHA Awaaz — confirm-and-correct screen (voice read-back + targeted re-ask).
//
// The record is spoken back to her in Hindi. Only fields the structuring pass
// marked "unclear" are flagged for correction, and she is asked about ONE
// field at a time — never a restart (brief's core failure-mode rule).
// Corrections are EXPLICIT (pick / re-speak), never a silent re-guess.
// Cohort-aware: the field list and the danger block follow note.cohort.
"use client";

import { useMemo, useState } from "react";
import {
  VisitNote,
  FieldName,
  DangerSignStatus,
  fieldsForCohort,
  isFieldSet,
  dangerSignNames,
  dangerSignStatus,
  setDangerSign,
  presentDangerSigns,
  AGE_YEARS_MIN,
  AGE_YEARS_MAX,
  GESTATIONAL_WEEK_MIN,
  GESTATIONAL_WEEK_MAX,
} from "../lib/schema";
import {
  speak,
  readBackSentence,
  askFieldSentence,
  speechSupported,
  fieldValueHi,
  FIELD_LABEL_EN,
  DANGER_LABEL_HI,
} from "../lib/voice";

interface Props {
  note: VisitNote;
  onChange: (note: VisitNote) => void;
  onConfirm: () => void;
  onRestart: () => void;
}

// Pick-button options (value -> Hindi label) for the coded fields. name / age /
// gestational_week are free input (handled separately); follow_up is boolean.
const FIELD_OPTIONS: Partial<Record<FieldName, { value: string; label: string }[]>> = {
  bp_status: [
    { value: "normal", label: "सामान्य" },
    { value: "high", label: "ज़्यादा" },
    { value: "low", label: "कम" },
    { value: "not_measured", label: "नहीं नापा" },
  ],
  iron_compliance: [
    { value: "taking", label: "ले रही है" },
    { value: "not_taking", label: "नहीं ले रही" },
    { value: "partial", label: "कभी-कभी" },
  ],
  in_school: [
    { value: "studying", label: "स्कूल जाती है" },
    { value: "dropped_out", label: "छूट गया" },
  ],
  periods_started: [
    { value: "yes", label: "हाँ" },
    { value: "no", label: "नहीं" },
  ],
  period_pattern: [
    { value: "regular", label: "नियमित" },
    { value: "irregular", label: "अनियमित" },
    { value: "very_heavy", label: "बहुत ज़्यादा" },
  ],
  menstrual_hygiene: [
    { value: "sanitary_pad", label: "सैनिटरी पैड" },
    { value: "cloth", label: "कपड़ा" },
    { value: "other", label: "अन्य" },
  ],
  ifa_compliance: [
    { value: "taking", label: "ले रही है" },
    { value: "not_taking", label: "नहीं ले रही" },
    { value: "partial", label: "कभी-कभी" },
  ],
  albendazole: [
    { value: "taken", label: "ली है" },
    { value: "not_taken", label: "नहीं ली" },
  ],
  pallor: [
    { value: "present", label: "है" },
    { value: "absent", label: "नहीं" },
  ],
  nutrition: [
    { value: "normal", label: "ठीक" },
    { value: "thin", label: "दुबली" },
    { value: "not_measured", label: "नहीं नापा" },
  ],
  marriage_pressure: [
    { value: "present", label: "है" },
    { value: "absent", label: "नहीं" },
  ],
};

// Write a chosen value into its storage location. Returns false on invalid.
function writeField(n: VisitNote, field: FieldName, value: string): boolean {
  switch (field) {
    case "name":
      n.beneficiary.name = value;
      return true;
    case "bp_status":
      n.assessment.bp_status = value as VisitNote["assessment"]["bp_status"];
      return true;
    case "iron_compliance":
      n.assessment.iron_compliance = value as VisitNote["assessment"]["iron_compliance"];
      return true;
    case "in_school":
      n.adolescent.in_school = value as VisitNote["adolescent"]["in_school"];
      return true;
    case "periods_started":
      n.adolescent.periods_started = value as VisitNote["adolescent"]["periods_started"];
      return true;
    case "period_pattern":
      n.adolescent.period_pattern = value as VisitNote["adolescent"]["period_pattern"];
      return true;
    case "menstrual_hygiene":
      n.adolescent.menstrual_hygiene = value as VisitNote["adolescent"]["menstrual_hygiene"];
      return true;
    case "ifa_compliance":
      n.adolescent.ifa_compliance = value as VisitNote["adolescent"]["ifa_compliance"];
      return true;
    case "albendazole":
      n.adolescent.albendazole = value as VisitNote["adolescent"]["albendazole"];
      return true;
    case "pallor":
      n.adolescent.pallor = value as DangerSignStatus;
      return true;
    case "nutrition":
      n.adolescent.nutrition = value as VisitNote["adolescent"]["nutrition"];
      return true;
    case "marriage_pressure":
      n.adolescent.marriage_pressure = value as DangerSignStatus;
      return true;
    case "follow_up":
      n.follow_up.needed = value === "true";
      return true;
    case "age": {
      const num = Math.round(Number(value.replace(/[^\d.]/g, "")));
      if (!Number.isFinite(num) || num < AGE_YEARS_MIN || num > AGE_YEARS_MAX)
        return false;
      n.beneficiary.age.value = num;
      return true;
    }
    case "gestational_week": {
      const num = Math.round(Number(value.replace(/[^\d.]/g, "")));
      if (
        !Number.isFinite(num) ||
        num < GESTATIONAL_WEEK_MIN ||
        num > GESTATIONAL_WEEK_MAX
      )
        return false;
      n.beneficiary.gestational_week = num;
      return true;
    }
  }
}

export default function VisitNoteConfirm({
  note,
  onChange,
  onConfirm,
  onRestart,
}: Props) {
  const fields = useMemo(() => fieldsForCohort(note.cohort), [note.cohort]);
  const uncertain = useMemo(
    () => new Set(note.uncertain_fields),
    [note.uncertain_fields],
  );

  // Apply an explicit correction, mark the field confirmed, recompute uncertain.
  function apply(f: FieldName, value: string | null) {
    const next: VisitNote = structuredClone(note);
    if (value !== null && !writeField(next, f, value)) return; // invalid -> stay uncertain
    next.field_confidence[f] = "high";
    next.uncertain_fields = fieldsForCohort(next.cohort).filter(
      (x) => next.field_confidence[x] === "unclear",
    );
    onChange(next);
  }

  const remaining = note.uncertain_fields.length;

  return (
    <div className="aa-card">
      <div className="aa-row" style={{ justifyContent: "space-between" }}>
        <h1 className="aa-h1">जाँचिए — सही है?</h1>
        {speechSupported() && (
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={() => speak(readBackSentence(note))}
            aria-label="Read the note aloud in Hindi"
          >
            🔊 सुनें
          </button>
        )}
      </div>
      <p className="aa-sub">
        <span className="aa-cohort-tag" data-cohort={note.cohort}>
          {note.cohort === "adolescent" ? "किशोरी (10–19)" : "गर्भवती (ANC)"}
        </span>{" "}
        {remaining > 0
          ? `${remaining} बात साफ़ नहीं थी — सिर्फ़ उन्हें ठीक कीजिए।`
          : "सब साफ़ है। नीचे पुष्टि कीजिए।"}
      </p>

      <ul className="aa-fieldlist">
        {fields.map((f) => {
          const isUncertain = uncertain.has(f);
          const set = isFieldSet(note, f);
          return (
            <li key={f} className="aa-fieldrow" data-uncertain={isUncertain}>
              <div style={{ flex: 1 }}>
                <div className="aa-fl">{FIELD_LABEL_EN[f]}</div>
                <div className="aa-fv" data-empty={!set}>
                  {set ? fieldValueHi(note, f) : "— नहीं बताया —"}
                </div>
                {isUncertain && (
                  <FieldFixer field={f} hasValue={set} apply={apply} />
                )}
              </div>
              <span className="aa-badge" data-c={note.field_confidence[f]}>
                {note.field_confidence[f]}
              </span>
            </li>
          );
        })}
      </ul>

      <DangerSignsBlock note={note} onChange={onChange} />

      <button type="button" className="aa-btn" onClick={onConfirm}>
        ✓ पुष्टि करें और सेव करें
      </button>
      <button
        type="button"
        className="aa-btn"
        data-variant="ghost"
        onClick={onRestart}
      >
        फिर से बोलें
      </button>

      <p className="aa-note">
        जो बात नहीं बताई गई वो खाली रहेगी — कुछ भी अंदाज़े से नहीं भरा जाता।
        <br />
        Unstated fields stay empty — never guessed (schema v{note.schema_version},
        clinical inference off).
      </p>
    </div>
  );
}

// --- per-field correction controls -------------------------------------
function FieldFixer({
  field,
  hasValue,
  apply,
}: {
  field: FieldName;
  hasValue: boolean;
  apply: (f: FieldName, value: string | null) => void;
}) {
  const [text, setText] = useState("");
  const options = FIELD_OPTIONS[field];
  const isText =
    field === "name" || field === "age" || field === "gestational_week";

  return (
    <div className="aa-reask">
      <div className="aa-row" style={{ justifyContent: "space-between" }}>
        <strong style={{ fontSize: "0.82rem" }}>जाँचिए / ठीक कीजिए</strong>
        {speechSupported() && (
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={() => speak(askFieldSentence(field))}
          >
            🔊 सवाल सुनें
          </button>
        )}
      </div>

      {hasValue && (
        <button
          type="button"
          className="aa-btn aa-btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => apply(field, null)}
        >
          ✓ ऊपर वाला सही है
        </button>
      )}

      {options && (
        <div className="aa-row" style={{ marginTop: 8, flexWrap: "wrap" }}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className="aa-btn aa-btn-sm"
              onClick={() => apply(field, o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {field === "follow_up" && (
        <div className="aa-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            onClick={() => apply(field, "true")}
          >
            ज़रूरी है
          </button>
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={() => apply(field, "false")}
          >
            ज़रूरी नहीं
          </button>
        </div>
      )}

      {isText && (
        <>
          <textarea
            className="aa-transcript"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              field === "name" ? "नाम दोबारा बोलिए (Wispr)…" : "संख्या बोलिए (Wispr)…"
            }
            dir="auto"
          />
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            style={{ marginTop: 8 }}
            disabled={!text.trim()}
            onClick={() => {
              apply(field, text.trim());
              setText("");
            }}
          >
            ठीक करें
          </button>
        </>
      )}
    </div>
  );
}

// --- danger-sign screening (cohort-aware) ------------------------------
function DangerSignsBlock({
  note,
  onChange,
}: {
  note: VisitNote;
  onChange: (note: VisitNote) => void;
}) {
  const signs = dangerSignNames(note.cohort);

  function setSign(sign: string, status: DangerSignStatus) {
    const next: VisitNote = structuredClone(note);
    setDangerSign(next, sign, status);
    onChange(next);
  }
  function markAllClear() {
    const next: VisitNote = structuredClone(note);
    for (const s of signs) {
      if (dangerSignStatus(next, s) === "unclear") setDangerSign(next, s, "absent");
    }
    onChange(next);
  }

  const present = presentDangerSigns(note);
  const unclear = signs.filter((s) => dangerSignStatus(note, s) === "unclear");

  return (
    <div className="aa-danger" data-alert={present.length > 0}>
      <div className="aa-row" style={{ justifyContent: "space-between" }}>
        <strong style={{ fontSize: "0.9rem" }}>खतरे के संकेत · danger signs</strong>
        {unclear.length > 0 && (
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={markAllClear}
          >
            सब ठीक हैं
          </button>
        )}
      </div>

      {present.length > 0 && (
        <p className="aa-danger-alert">
          ⚠ ज़्यादा जोखिम — PHC रेफर कीजिए (high-risk, refer)
        </p>
      )}

      <ul className="aa-danger-list">
        {signs.map((s) => {
          const status = dangerSignStatus(note, s);
          return (
            <li key={s} className="aa-danger-row" data-status={status}>
              <span className="aa-danger-name">{DANGER_LABEL_HI[s] ?? s}</span>
              <div className="aa-seg" role="group">
                <button
                  type="button"
                  aria-pressed={status === "present"}
                  data-danger="true"
                  onClick={() => setSign(s, "present")}
                >
                  है
                </button>
                <button
                  type="button"
                  aria-pressed={status === "absent"}
                  onClick={() => setSign(s, "absent")}
                >
                  नहीं
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {unclear.length > 0 && (
        <p className="aa-note" style={{ marginTop: 6 }}>
          {unclear.length} संकेत पूछे नहीं गए — हर एक पर है/नहीं चुनिए, या “सब ठीक हैं”।
        </p>
      )}
    </div>
  );
}
