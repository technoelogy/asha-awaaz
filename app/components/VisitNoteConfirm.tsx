// ASHA Awaaz — confirm-and-correct screen (voice read-back + targeted re-ask).
//
// The record is spoken back to her in Hindi. Only fields the structuring pass
// marked "unclear" are flagged for correction, and she is asked about ONE
// field at a time — never a restart (brief's core failure-mode rule).
// Corrections are EXPLICIT (pick / re-speak), never a silent re-guess.
// Cohort-aware: the field list and the danger block follow note.cohort.
"use client";

import { useMemo, useState } from "react";
import ContinuityCheck from "./ContinuityCheck";
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

  // Field the ASHA tapped to correct (e.g. a misheard name).
  const [editing, setEditing] = useState<FieldName | null>(null);

  // Apply an explicit correction, mark the field confirmed, recompute uncertain.
  function apply(f: FieldName, value: string | null) {
    setEditing(null);
    const next: VisitNote = structuredClone(note);
    if (value !== null && !writeField(next, f, value)) return; // invalid -> stay uncertain
    next.field_confidence[f] = "high";
    next.uncertain_fields = fieldsForCohort(next.cohort).filter(
      (x) => next.field_confidence[x] === "unclear",
    );
    onChange(next);
  }

  const remaining = note.uncertain_fields.length;
  const present = presentDangerSigns(note);
  const unclearFields = fields.filter((f) => uncertain.has(f));
  const clearFields = fields.filter((f) => !uncertain.has(f));

  return (
    <div className="aa-card aa-confirm">
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
          ? `${remaining} बात साफ़ नहीं थी — सिर्फ़ उसे ठीक कीजिए।`
          : "सब साफ़ है। पुष्टि कीजिए।"}
      </p>

      {/* What the engine actually heard: lets her spot a dropped "nahi". */}
      {note.transcript?.verbatim && (
        <details className="aa-heard">
          <summary>सुनी गई बात देखें · what was heard</summary>
          <p dir="auto">{note.transcript.verbatim}</p>
        </details>
      )}

      {/* Danger first: the referral is the most important thing on screen. */}
      {present.length > 0 && (
        <div className="aa-refer" role="alert">
          <strong>⚠ PHC रेफर कीजिए</strong>
          <span>
            {present.map((s) => DANGER_LABEL_HI[s] ?? s).join(" · ")}
          </span>
        </div>
      )}

      {/* Cross-visit memory: "28 weeks last time, 22 now?" */}
      <ContinuityCheck note={note} onFix={(f, v) => apply(f, String(v))} />

      {/* Only unclear fields take space: one at a time, with the fixer. */}
      {unclearFields.length > 0 && (
        <ul className="aa-fieldlist">
          {unclearFields.map((f) => {
            const set = isFieldSet(note, f);
            return (
              <li key={f} className="aa-fieldrow" data-uncertain="true">
                <div style={{ flex: 1 }}>
                  <div className="aa-fl">{FIELD_LABEL_EN[f]}</div>
                  <div className="aa-fv" data-empty={!set}>
                    {set ? fieldValueHi(note, f) : "— नहीं बताया —"}
                  </div>
                  <FieldFixer field={f} hasValue={set} apply={apply} />
                </div>
                <span className="aa-badge" data-c="unclear">
                  unclear
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Clear fields: compact grid. Tap any cell to correct a mis-hear. */}
      <dl className="aa-grid">
        {clearFields.map((f) => {
          const set = isFieldSet(note, f);
          return (
            <div
              key={f}
              className="aa-cell"
              role="button"
              tabIndex={0}
              data-editing={editing === f}
              aria-label={`Correct ${FIELD_LABEL_EN[f]}`}
              onClick={() => setEditing(editing === f ? null : f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setEditing(editing === f ? null : f);
              }}
            >
              <dt>
                {FIELD_LABEL_EN[f]} <span className="aa-edit">✎</span>
              </dt>
              <dd data-empty={!set}>{set ? fieldValueHi(note, f) : "—"}</dd>
            </div>
          );
        })}
      </dl>
      {editing && !uncertain.has(editing) && (
        <div className="aa-fieldrow aa-editbox" data-uncertain="true">
          <div className="aa-fl">{FIELD_LABEL_EN[editing]} · ठीक कीजिए</div>
          <FieldFixer
            key={editing}
            field={editing}
            hasValue={isFieldSet(note, editing)}
            apply={apply}
          />
        </div>
      )}
      <p className="aa-hint" style={{ textAlign: "left" }}>
        कुछ गलत सुना गया? उस खाने पर टैप करके ठीक कीजिए।
      </p>

      <DangerSignsBlock note={note} onChange={onChange} />

      <p className="aa-note">
        जो बात नहीं बताई गई वो खाली रहेगी, अंदाज़े से कुछ नहीं भरा जाता।
      </p>

      {/* Sticky action bar: confirm is always one thumb-tap away. */}
      <div className="aa-actions">
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
      </div>
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
      <div className="aa-row">
        {hasValue && (
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            onClick={() => apply(field, null)}
          >
            ✓ सही है
          </button>
        )}
        {speechSupported() && (
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={() => speak(askFieldSentence(field))}
            aria-label="Hear the question"
          >
            🔊 सवाल
          </button>
        )}
      </div>

      {options && (
        <div className="aa-row" style={{ marginTop: 8, flexWrap: "wrap" }}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className="aa-btn aa-btn-sm"
              data-variant="ghost"
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
            data-variant="ghost"
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
          <div className="aa-fixline">
          <input
            className="aa-transcript"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={field === "name" ? "या सही नाम बोलिए…" : "या संख्या बोलिए…"}
            dir="auto"
            inputMode={field === "name" ? "text" : "numeric"}
          />
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            disabled={!text.trim()}
            onClick={() => {
              apply(field, text.trim());
              setText("");
            }}
          >
            ठीक करें
          </button>
          </div>
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
