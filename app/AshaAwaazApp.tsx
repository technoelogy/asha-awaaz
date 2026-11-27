// ASHA Awaaz — P1 orchestrator.
// Flow: capture (Wispr) -> structure (Claude/Haiku, mock-first) -> confirm &
// correct (voice) -> queue locally. No datastore, no dashboard (deferred).
"use client";

import { useEffect, useState } from "react";
import MicCapture from "./components/MicCapture";
import VisitNoteConfirm from "./components/VisitNoteConfirm";
import CohortPicker from "./components/CohortPicker";
import { VisitNote, VisitLanguage, Cohort } from "./lib/schema";
import { structureTranscript } from "./lib/client";
import { enqueue, pendingCount, isOnline, drain } from "./lib/queue";
import { speak, readBackSentence, stopSpeaking } from "./lib/voice";

type Stage = "picker" | "capture" | "structuring" | "confirm" | "saved";

export default function AshaAwaazApp() {
  const [stage, setStage] = useState<Stage>("picker");
  const [cohort, setCohort] = useState<Cohort>("pregnant");
  const [note, setNote] = useState<VisitNote | null>(null);
  const [mode, setMode] = useState<"mock" | "live">("mock");
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [keyNotSet, setKeyNotSet] = useState(false);

  // Which services are configured. Without an AI key the app still runs on
  // built-in demo samples, and says so instead of failing.
  useEffect(() => {
    let active = true;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { structuring?: string }) => {
        if (!active) return;
        setMode(s.structuring === "live" ? "live" : "mock");
        setKeyNotSet(s.structuring !== "live");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Network awareness + queue drain on reconnect.
  useEffect(() => {
    const sync = () => {
      const up = isOnline();
      setOnline(up);
      setPending(pendingCount());
      if (up) drain().then(() => setPending(pendingCount()));
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  function pickCohort(c: Cohort) {
    setCohort(c);
    setError(null);
    setStage("capture");
  }

  async function handleStructure(args: {
    transcript: string;
    language: VisitLanguage;
    mockSampleId?: string;
  }) {
    setError(null);
    setStage("structuring");
    try {
      const { visitNote, mode } = await structureTranscript({ ...args, cohort });
      setNote(visitNote);
      setMode(mode);
      setStage("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "कुछ गड़बड़ हुई");
      setStage("capture");
    }
  }

  function handleConfirm() {
    if (!note) return;
    const confirmed: VisitNote = {
      ...note,
      status: { confirmed_by_asha: true },
    };
    enqueue(confirmed);
    setNote(confirmed);
    setPending(pendingCount());
    if (online) drain().then(() => setPending(pendingCount()));
    setStage("saved");
  }

  // "फिर से बोलें" — re-capture for the SAME beneficiary cohort.
  function reset() {
    stopSpeaking();
    setNote(null);
    setError(null);
    setStage("capture");
  }

  // "+ नई विज़िट" — new beneficiary, choose who it's for again.
  function startNew() {
    stopSpeaking();
    setNote(null);
    setError(null);
    setStage("picker");
  }

  return (
    <div className="aa-root">
      <div className="aa-shell">
        <div className="aa-topbar">
          <div>
            <div className="aa-wordmark">
              ASHA <span>Awaaz</span>
            </div>
            <div className="aa-tagline">बोलिए, लिखना नहीं · voice visit log</div>
          </div>
          <div className="aa-row">
            <span className="aa-chip" data-mode={mode}>
              <span className="aa-dot" />
              {mode === "mock" ? "Demo" : "Live"}
            </span>
            {!online && (
              <span className="aa-chip" data-net="offline">
                <span className="aa-dot" />
                ऑफ़लाइन
              </span>
            )}
          </div>
        </div>

        {keyNotSet && (stage === "picker" || stage === "capture") && (
          <p className="aa-keynote" role="status">
            AI key not set: the built-in demo samples work fully. To structure
            your own speech, set <code>ANTHROPIC_API_KEY</code> (see README).
          </p>
        )}

        {stage === "picker" && <CohortPicker onPick={pickCohort} />}

        {stage === "capture" && (
          <>
            <button
              type="button"
              className="aa-btn aa-btn-sm"
              data-variant="ghost"
              style={{ alignSelf: "flex-start", marginBottom: 4 }}
              onClick={startNew}
            >
              ← किसके लिए बदलें
            </button>
            <MicCapture
              cohort={cohort}
              onStructure={handleStructure}
              busy={false}
            />
            {error && <p className="aa-error">{error}</p>}
          </>
        )}

        {stage === "structuring" && (
          <div className="aa-card">
            <h1 className="aa-h1">समझ रहे हैं…</h1>
            <p className="aa-sub">Structuring the visit note. एक पल रुकिए।</p>
          </div>
        )}

        {stage === "confirm" && note && (
          <VisitNoteConfirm
            note={note}
            onChange={setNote}
            onConfirm={handleConfirm}
            onRestart={reset}
          />
        )}

        {stage === "saved" && note && (
          <div className="aa-card">
            <div className="aa-success-ring" aria-hidden="true">
              ✓
            </div>
            <h1 className="aa-h1" style={{ textAlign: "center" }}>
              {online ? "विज़िट सेव हो गई" : "विज़िट कतार में है"}
            </h1>
            <p className="aa-sub" style={{ textAlign: "center" }}>
              {online
                ? "Visit saved. PHC record updated."
                : "नेटवर्क आते ही अपने-आप भेज दी जाएगी।"}
              {pending > 0 && ` (${pending} कतार में)`}
            </p>
            <button
              type="button"
              className="aa-btn"
              data-variant="ghost"
              onClick={() => speak(readBackSentence(note))}
            >
              🔊 दोबारा सुनें
            </button>
            <button type="button" className="aa-btn" onClick={startNew}>
              + नई विज़िट
            </button>
          </div>
        )}

        <p className="aa-footer">
          ASHA Awaaz · a technoelogy.com build · voice-first visit logging for
          India&apos;s ASHA workers.
          <br />
          Synthetic data only · structured record is the source of truth.
          <br />
          <a href="/dashboard" style={{ color: "var(--aa-brand-ink)" }}>
            PHC Dashboard →
          </a>
        </p>
      </div>
    </div>
  );
}
