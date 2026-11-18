// ASHA Awaaz — transcription API route.  POST /api/transcribe
//
// THE WISPR SOCKET. Everything else in the app is built; this is the one
// function that goes live when Wispr access clears.
//
// Flow: browser records audio (useVoiceCapture, source "wispr") -> POSTs the
// raw audio bytes here -> this route calls Wispr's REST API server-side (the
// key never touches the browser) -> returns { transcript }.
//
// Mode resolution:
//   mock — no WISPR_API_KEY present, or ASHA_VOICE_MOCK=1  (default today)
//   live — WISPR_API_KEY set
//
// TO ACTIVATE: set WISPR_API_KEY in .env.local. If Wispr's request/response
// shape differs from the best-effort call below, this is the ONLY place to
// adjust it — confirm against https://api-docs.wisprflow.ai/rest_api_transcribe

import { getMockSample } from "../../lib/mockData";

export const runtime = "nodejs";

// Endpoint + field names are overridable via env so you can match Wispr's
// contract without editing code once the key arrives.
const WISPR_URL =
  process.env.WISPR_TRANSCRIBE_URL || "https://api.wisprflow.ai/api/v1/transcribe";

function mockMode(): boolean {
  if (process.env.ASHA_VOICE_MOCK === "1" || process.env.ASHA_VOICE_MOCK === "true")
    return true;
  return !process.env.WISPR_API_KEY;
}

function pickTranscript(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const k of ["transcript", "text", "result", "output"]) {
      if (typeof d[k] === "string") return d[k] as string;
    }
  }
  return "";
}

export async function POST(req: Request) {
  const lang = req.headers.get("x-lang") || "hi";

  try {
    if (mockMode()) {
      // Before Wispr is wired, return a canned transcript so the full pipeline
      // (record -> transcribe -> structure -> confirm) still runs end to end.
      return Response.json({ mode: "mock", transcript: getMockSample().transcript });
    }

    const audio = await req.arrayBuffer();
    if (!audio.byteLength) {
      return Response.json({ error: "empty_audio" }, { status: 400 });
    }

    // --- Wispr REST call (best-effort; finalize against the docs) ----------
    const res = await fetch(WISPR_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.WISPR_API_KEY as string}`,
        "content-type": req.headers.get("content-type") || "audio/webm",
        "x-language": lang,
      },
      body: audio,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: "wispr_failed", detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }

    const data = await res.json().catch(() => ({}));
    const transcript = pickTranscript(data);
    return Response.json({ mode: "live", transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : "transcribe_failed";
    return Response.json({ error: "transcribe_failed", detail: message }, {
      status: 502,
    });
  }
}
