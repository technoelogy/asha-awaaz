// ASHA Awaaz — confirm-and-correct screen (voice read-back + targeted re-ask).
//
// The record is spoken back to her in Hindi. Only fields the structuring pass
// marked "unclear" are flagged for correction, and she is asked about ONE
// field at a time — never a restart (brief's core failure-mode rule).
// Corrections are EXPLICIT (pick / re-speak), never a silent re-guess.
"use client";

import { useMemo, useState } from "react";
import {
  VisitNote,
  FieldName,
  ALL_FIELDS,
  BP_STATUS_VALUES,
  IRON_COMPLIANCE_VALUES,
  GESTATIONAL_WEEK_MIN,
  GESTATIONAL_WEEK_MAX,
  AGE_YEARS_MIN,
  AGE_YEARS_MAX,
} from "../lib/schema";
import {
  speak,
  readBackSentence,
  askFieldSentence,
  speechSupported,
  FIELD_LABEL_EN,
} from "../lib/voice";

interface Props {
  note: VisitNote;
  onChange: (note: VisitNote) => void;
  onConfirm: () => void;
  onRestart: () => void;
}

const BP_HI_LABEL: Record<string, string> = {
  normal: "सामान्य",
  high: "ज़्यादा",
  low: "कम",
  not_measured: "नहीं नापा",
};
const IRON_HI_LABEL: Record<string, string> = {
  taking: "ले रही है",
  not_taking: "नहीं ले रही",
  partial: "कभी-कभी",
};

function displayValue(note: VisitNote, f: FieldName): string | null {
  switch (f) {
    case "name":
      return note.beneficiary.name;
    case "age":
      return note.beneficiary.age.value != null
        ? `${note.beneficiary.age.value} yrs`
        : null;
    case "gestational_week":
      return note.beneficiary.gestational_week != null
        ? `Week ${note.beneficiary.gestational_week}`
        : null;
    case "bp_status":
      return note.assessment.bp_status
        ? BP_HI_LABEL[note.assessment.bp_status]
        : null;
    case "iron_compliance":
      return note.assessment.iron_compliance
        ? IRON_HI_LABEL[note.assessment.iron_compliance]
        : null;
    case "follow_up":
      return note.follow_up.needed == null
        ? null
        : note.follow_up.needed
          ? "ज़रूरी"
          : "ज़रूरी नहीं";
  }
}

export default function VisitNoteConfirm({
  note,
  onChange,
  onConfirm,
  onRestart,
}: Props) {
  const uncertain = useMemo(
    () => new Set(note.uncertain_fields),
    [note.uncertain_fields],
  );

  // Apply an explicit correction, mark the field confirmed, recompute uncertain.
  function apply(f: FieldName, mutate: (n: VisitNote) => boolean) {
    const next: VisitNote = structuredClone(note);
    const ok = mutate(next);
    if (!ok) return; // invalid input -> leave field uncertain
    next.field_confidence[f] = "high";
    next.uncertain_fields = ALL_FIELDS.filter(
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
        {remaining > 0
          ? `${remaining} बात साफ़ नहीं थी — सिर्फ़ उन्हें ठीक कीजिए।`
          : "सब साफ़ है। नीचे पुष्टि कीजिए।"}
      </p>

      <ul className="aa-fieldlist">
        {ALL_FIELDS.map((f) => {
          const isUncertain = uncertain.has(f);
          const value = displayValue(note, f);
          return (
            <li
              key={f}
              className="aa-fieldrow"
              data-uncertain={isUncertain}
            >
              <div style={{ flex: 1 }}>
                <div className="aa-fl">{FIELD_LABEL_EN[f]}</div>
                <div className="aa-fv" data-empty={value == null}>
                  {value ?? "— नहीं बताया —"}
                </div>
                {isUncertain && (
                  <FieldFixer
                    field={f}
                    hasValue={value != null}
                    apply={apply}
                  />
                )}
              </div>
              <span className="aa-badge" data-c={note.field_confidence[f]}>
                {note.field_confidence[f]}
              </span>
            </li>
          );
        })}
      </ul>

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
  apply: (f: FieldName, mutate: (n: VisitNote) => boolean) => void;
}) {
  const [text, setText] = useState("");

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
          onClick={() => apply(field, () => true)}
        >
          ✓ ऊपर वाला सही है
        </button>
      )}

      {field === "bp_status" && (
        <div className="aa-row" style={{ marginTop: 8 }}>
          {BP_STATUS_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              className="aa-btn aa-btn-sm"
              onClick={() => apply(field, (n) => ((n.assessment.bp_status = v), true))}
            >
              {BP_HI_LABEL[v]}
            </button>
          ))}
        </div>
      )}

      {field === "iron_compliance" && (
        <div className="aa-row" style={{ marginTop: 8 }}>
          {IRON_COMPLIANCE_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              className="aa-btn aa-btn-sm"
              onClick={() =>
                apply(field, (n) => ((n.assessment.iron_compliance = v), true))
              }
            >
              {IRON_HI_LABEL[v]}
            </button>
          ))}
        </div>
      )}

      {field === "follow_up" && (
        <div className="aa-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            onClick={() => apply(field, (n) => ((n.follow_up.needed = true), true))}
          >
            ज़रूरी है
          </button>
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            data-variant="ghost"
            onClick={() => apply(field, (n) => ((n.follow_up.needed = false), true))}
          >
            ज़रूरी नहीं
          </button>
        </div>
      )}

      {(field === "name" ||
        field === "age" ||
        field === "gestational_week") && (
        <>
          <textarea
            className="aa-transcript"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              field === "name"
                ? "नाम दोबारा बोलिए (Wispr)…"
                : "संख्या बोलिए (Wispr)…"
            }
            dir="auto"
          />
          <button
            type="button"
            className="aa-btn aa-btn-sm"
            style={{ marginTop: 8 }}
            disabled={!text.trim()}
            onClick={() => {
              const t = text.trim();
              apply(field, (n) => {
                if (field === "name") {
                  n.beneficiary.name = t;
                  return true;
                }
                const num = Math.round(Number(t.replace(/[^\d.]/g, "")));
                if (!Number.isFinite(num)) return false;
                if (field === "age") {
                  if (num < AGE_YEARS_MIN || num > AGE_YEARS_MAX) return false;
                  n.beneficiary.age.value = num;
                } else {
                  if (num < GESTATIONAL_WEEK_MIN || num > GESTATIONAL_WEEK_MAX)
                    return false;
                  n.beneficiary.gestational_week = num;
                }
                return true;
              });
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
