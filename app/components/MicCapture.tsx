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

import { useRef, useState } from "react";
import { VisitLanguage } from "../lib/schema";
import { MOCK_SAMPLES } from "../lib/mockData";
import { useVoiceCapture } from "../lib/useVoiceCapture";

interface Props {
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
  mock: "डेमो मोड — नीचे सैंपल चुनें",
};

export default function MicCapture({ onStructure, busy }: Props) {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<VisitLanguage>("hi-en");
  const [sampleId, setSampleId] = useState<string | undefined>(undefined);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceCapture(language);

  const recording = voice.status === "recording";
  const transcribing = voice.status === "transcribing";

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
  }

  function handleEdit(v: string) {
    setTranscript(v);
    setSampleId(undefined);
  }

  const canStructure = transcript.trim().length > 0 && !busy && !transcribing;

  const micLabel = recording
    ? `सुन रहे हैं… ${fmt(voice.elapsedMs)} · रोकने के लिए टैप करें`
    : transcribing
      ? "समझ रहे हैं…"
      : "बोलने के लिए टैप करें";

  return (
    <div className="aa-card">
      <h1 className="aa-h1">नई विज़िट दर्ज करें</h1>
      <p className="aa-sub">Log a visit — बस बोलिए, टाइप मत कीजिए।</p>

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
        onClick={() =>
          onStructure({ transcript: transcript.trim(), language, mockSampleId: sampleId })
        }
      >
        {busy ? "समझ रहे हैं…" : "समझें और जाँचें →"}
      </button>

      <div className="aa-samples">
        <div className="aa-samples-head">Demo samples (mock)</div>
        {MOCK_SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="aa-sample"
            onClick={() => handleSample(s.id, s.transcript)}
          >
            {s.label}
            <small>{s.transcript}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
