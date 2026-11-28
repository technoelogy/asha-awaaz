// ASHA Awaaz — voice capture.
//
// The mic button records real audio and fills the transcript field. Where the
// transcript actually comes from is one swappable setting (useVoiceCapture):
//   browser — in-browser speech-to-text (works today, Chrome)
//   wispr   — record -> POST /api/transcribe -> Wispr REST (the production socket)
//   mock    — canned transcript (bulletproof demos)
// The textarea stays editable (she/he can fix a mis-hear by hand) and the demo
// sample chips still work. Nothing downstream of the transcript changes.
"use client";

import { checkTranscript } from "../lib/inputCheck";
import { useEffect, useRef, useState } from "react";
import { VisitLanguage, Cohort } from "../lib/schema";
import { MOCK_SAMPLES } from "../lib/mockData";
import { useVoiceCapture, hasBrowserSpeech } from "../lib/useVoiceCapture";

interface Props {
  cohort: Cohort;
  // No AI key: put demo samples first so the main action never looks dead.
  demoFirst?: boolean;
  onStructure: (args: {
    transcript: string;
    language: VisitLanguage;
    mockSampleId?: string;
  }) => void;
  busy: boolean;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const SOURCE_HINT: Record<string, string> = {
  browser: "बोलिए — Chrome में आवाज़ से लिखेगा",
  wispr: "Wispr से हिंदी या हिंग्लिश में बोलिए",
  sarvam: "Sarvam · भारतीय भाषाओं का इंजन · 30 सेकंड तक",
  mock: "डेमो मोड — नीचे सैंपल चुनें",
};

export default function MicCapture({
  cohort,
  demoFirst = false,
  onStructure,
  busy,
}: Props) {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<VisitLanguage>("hi-en");
  const [sampleId, setSampleId] = useState<string | undefined>(undefined);
  const [inputError, setInputError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Sarvam takes ≤30 s per request; the hook auto-stops and hands back the text.
  const voice = useVoiceCapture(language, (text) => {
    if (text) {
      setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      setSampleId(undefined);
    }
  });
  const [sarvamReady, setSarvamReady] = useState(false);

  // Offer the Sarvam engine only when the server has a key for it.
  useEffect(() => {
    let active = true;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { speech?: { sarvam?: boolean } }) => {
        if (!active) return;
        const ready = !!d.speech?.sarvam;
        setSarvamReady(ready);
        // No in-browser speech (e.g. many non-Chrome phone browsers): use Sarvam.
        if (ready && !hasBrowserSpeech()) voice.setSource("sarvam");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Only show demo samples for the cohort being logged.
  const samples = MOCK_SAMPLES.filter((s) => s.cohort === cohort);

  const recording = voice.status === "recording";
  const transcribing = voice.status === "transcribing";
  const capped = voice.source === "sarvam";

  async function handleMicTap() {
    if (recording) {
      try {
        const text = await voice.stop();
        if (text) {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setSampleId(undefined); // live capture -> structure as free text
        }
      } catch {
        /* error surfaced via voice.error */
      }
    } else if (voice.status === "idle" || voice.status === "error") {
      if (voice.source === "mock") {
        taRef.current?.focus(); // nothing to record; nudge toward samples/typing
        return;
      }
      try {
        await voice.start();
      } catch {
        /* error surfaced via voice.error */
      }
    }
  }

  function handleSample(id: string, text: string) {
    setTranscript(text);
    setSampleId(id);
    setInputError(null);
  }

  function handleEdit(v: string) {
    setTranscript(v);
    setSampleId(undefined);
    setInputError(null);
  }

  // Block keyboard mash / noise before the AI is called (samples skip this).
  function submit() {
    const text = transcript.trim();
    if (!sampleId) {
      const verdict = checkTranscript(text);
      if (!verdict.ok) {
        setInputError(verdict.message);
        return;
      }
    }
    setInputError(null);
    onStructure({ transcript: text, language, mockSampleId: sampleId });
  }

  const canStructure = transcript.trim().length > 0 && !busy && !transcribing;

  const micLabel = recording
    ? `सुन रहे हैं… ${fmt(voice.elapsedMs)}${capped ? " / 0:29" : ""} · रोकने के लिए टैप करें`
    : transcribing
      ? "समझ रहे हैं…"
      : "बोलने के लिए टैप करें";

  const samplesBlock = (
    <div className="aa-samples" data-first={demoFirst}>
      <div className="aa-samples-head">
        {demoFirst
          ? "एक सैंपल चुनिए · Tap a sample to try"
          : "Demo samples"}
      </div>
      {samples.map((s) => (
        <button
          key={s.id}
          type="button"
          className="aa-sample"
          data-picked={sampleId === s.id}
          onClick={() => handleSample(s.id, s.transcript)}
        >
          {s.label}
          <small>{s.transcript}</small>
        </button>
      ))}
    </div>
  );

  return (
    <div className="aa-card">
      <h1 className="aa-h1">नई विज़िट दर्ज करें</h1>
      <p className="aa-sub">बस बोलिए। ज़रूरत हो तो नीचे लिख भी सकती हैं।</p>

      {demoFirst && samplesBlock}

      <button
        type="button"
        className="aa-mic"
        data-recording={recording}
        onClick={handleMicTap}
        aria-pressed={recording}
        disabled={transcribing}
      >
        <span className="aa-mic-ring" aria-hidden="true">
          {recording ? "■" : transcribing ? "…" : "🎙"}
        </span>
        <span className="aa-mic-label">{micLabel}</span>
        <span className="aa-mic-hint">
          {SOURCE_HINT[voice.source] ?? SOURCE_HINT.wispr}
        </span>
      </button>

      {sarvamReady && (
        <div className="aa-row aa-engine">
          <span className="aa-field-label" style={{ margin: 0 }}>आवाज़ इंजन</span>
          <div className="aa-seg" role="group" aria-label="speech engine">
            <button
              type="button"
              aria-pressed={voice.source === "browser"}
              disabled={recording || transcribing}
              onClick={() => voice.setSource("browser")}
            >
              Chrome
            </button>
            <button
              type="button"
              aria-pressed={voice.source === "sarvam"}
              disabled={recording || transcribing}
              onClick={() => voice.setSource("sarvam")}
            >
              Sarvam
            </button>
          </div>
        </div>
      )}

      {voice.error && <p className="aa-error">{voice.error}</p>}

      <div className="aa-field-label">सुनी गई बात (transcript)</div>
      <textarea
        ref={taRef}
        className="aa-transcript"
        value={transcript}
        onChange={(e) => handleEdit(e.target.value)}
        placeholder="उदाहरण: सुनीता देवी, उम्र 24 साल, 28वां हफ़्ता, बी पी नॉर्मल, आयरन गोली ले रही है…"
        dir="auto"
      />

      <div className="aa-row" style={{ marginTop: 12 }}>
        <span className="aa-field-label" style={{ margin: 0 }}>भाषा</span>
        <div className="aa-seg" role="group" aria-label="language">
          <button
            type="button"
            aria-pressed={language === "hi"}
            onClick={() => setLanguage("hi")}
          >
            हिंदी
          </button>
          <button
            type="button"
            aria-pressed={language === "hi-en"}
            onClick={() => setLanguage("hi-en")}
          >
            Hinglish
          </button>
        </div>
      </div>

      <button
        type="button"
        className="aa-btn"
        disabled={!canStructure}
        onClick={submit}
      >
        {busy ? "समझ रहे हैं…" : "समझें और जाँचें →"}
      </button>
      {inputError && (
        <p className="aa-error" role="alert">
          {inputError}
        </p>
      )}
      {!canStructure && !busy && (
        <p className="aa-hint">
          {demoFirst
            ? "ऊपर एक सैंपल चुनिए, फिर यह बटन चालू होगा।"
            : "पहले बोलिए या नीचे एक सैंपल चुनिए।"}
        </p>
      )}

      {!demoFirst && samplesBlock}
    </div>
  );
}
