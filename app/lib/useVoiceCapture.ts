// ASHA Awaaz — voice capture hook.
//
// The transcript has ONE source today and a different one at the hackathon.
// This hook makes that a single swappable setting so nothing downstream cares.
//
//   NEXT_PUBLIC_VOICE_SOURCE =
//     "browser" (default) — real speech-to-text in-browser (Chrome Web Speech
//                           API). Works TODAY, no Wispr, no key. Dev/testing.
//     "wispr"             — record audio -> POST /api/transcribe -> Wispr REST.
//                           The production socket. Flip to this when the key clears.
//     "mock"              — no mic; returns a canned transcript. Bulletproof demos.
//
// If unset and the browser has no Web Speech API, it falls back to "mock".
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VisitLanguage } from "./schema";
import { getMockSample } from "./mockData";

export type VoiceSource = "browser" | "wispr" | "mock";
export type CaptureStatus = "idle" | "recording" | "transcribing" | "error";

// --- minimal Web Speech API typings (not in standard lib.dom everywhere) ---
interface SpeechRecognitionAlt { transcript: string }
interface SpeechRecognitionResultLike { 0: SpeechRecognitionAlt; isFinal: boolean }
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function envVoiceSource(): VoiceSource | null {
  const env = process.env.NEXT_PUBLIC_VOICE_SOURCE as VoiceSource | undefined;
  return env === "browser" || env === "wispr" || env === "mock" ? env : null;
}

// Deterministic for SSR: the env value, else "browser". The real
// browser-capability probe runs AFTER mount (in the hook) so the first client
// render matches the server render — no hydration mismatch.
export function resolveVoiceSource(): VoiceSource {
  return envVoiceSource() ?? "browser";
}

export interface VoiceCapture {
  source: VoiceSource;
  status: CaptureStatus;
  elapsedMs: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<string>; // resolves with the transcript
  cancel: () => void;
}

export function useVoiceCapture(language: VisitLanguage): VoiceCapture {
  // Deterministic on server and client (env value, else "browser") so there is
  // no hydration mismatch. A browser without speech support gets a clear "use
  // Chrome" error at start() time rather than being silently downgraded.
  const [source] = useState<VoiceSource>(() => resolveVoiceSource());
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // refs for the active capture session
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    stopTimer();
    timerRef.current = setInterval(
      () => setElapsedMs(Date.now() - startedAtRef.current),
      200,
    );
  }, [stopTimer]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      stopTimer();
      recognitionRef.current?.abort();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  const start = useCallback(async () => {
    setError(null);
    finalTextRef.current = "";
    chunksRef.current = [];

    try {
      if (source === "browser") {
        const Ctor = getSpeechRecognition();
        if (!Ctor) throw new Error("no_speech_recognition");
        const rec = new Ctor();
        rec.lang = "hi-IN"; // Hindi + Hinglish both recognise best under hi-IN
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalTextRef.current += r[0].transcript;
          }
        };
        rec.onerror = (e) => setError(e.error || "speech_error");
        recognitionRef.current = rec;
        rec.start();
      } else if (source === "wispr") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRef.current = mr;
        mr.start();
      }
      // "mock": nothing to start.
      setStatus("recording");
      startTimer();
    } catch (e) {
      stopTimer();
      releaseStream();
      setStatus("error");
      const name = e instanceof Error ? e.message : "";
      setError(
        name === "no_speech_recognition"
          ? "इस ब्राउज़र में आवाज़ पहचान नहीं है — Chrome पर खोलें।"
          : name === "NotAllowedError" || /denied|permission/i.test(name)
            ? "माइक की अनुमति नहीं मिली।"
            : "माइक शुरू नहीं हो पाया।",
      );
      throw e;
    }
  }, [source, startTimer, stopTimer, releaseStream]);

  const stop = useCallback(async (): Promise<string> => {
    stopTimer();
    setStatus("transcribing");
    try {
      if (source === "browser") {
        const rec = recognitionRef.current;
        const text = await new Promise<string>((resolve) => {
          if (!rec) return resolve("");
          rec.onend = () => resolve(finalTextRef.current.trim());
          rec.stop();
          // safety: resolve even if onend never fires
          setTimeout(() => resolve(finalTextRef.current.trim()), 1500);
        });
        recognitionRef.current = null;
        setStatus("idle");
        return text;
      }

      if (source === "wispr") {
        const mr = mediaRef.current;
        const blob = await new Promise<Blob>((resolve) => {
          if (!mr) return resolve(new Blob());
          mr.onstop = () =>
            resolve(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }));
          mr.stop();
        });
        releaseStream();
        mediaRef.current = null;
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "content-type": blob.type || "audio/webm", "x-lang": language },
          body: blob,
        });
        if (!res.ok) throw new Error(`transcribe ${res.status}`);
        const data = (await res.json()) as { transcript?: string };
        setStatus("idle");
        return (data.transcript || "").trim();
      }

      // mock
      const sample = getMockSample();
      setStatus("idle");
      return sample.transcript;
    } catch (e) {
      setStatus("error");
      setError("आवाज़ को समझा नहीं जा सका।");
      releaseStream();
      throw e;
    }
  }, [source, language, stopTimer, releaseStream]);

  const cancel = useCallback(() => {
    stopTimer();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    mediaRef.current?.stop();
    mediaRef.current = null;
    releaseStream();
    setStatus("idle");
    setElapsedMs(0);
  }, [stopTimer, releaseStream]);

  return { source, status, elapsedMs, error, start, stop, cancel };
}
