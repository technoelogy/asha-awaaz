// ASHA Awaaz — structuring API route.  POST /api/structure
//
// Next.js App Router handler, mock mode first, same validator on both paths.
// Live calls go straight to the Anthropic Messages API via fetch (no SDK
// dependency). Mock mode needs no API key and no network.
//
// Mode resolution:
//   mock  — ASHA_MOCK=1, or no ANTHROPIC_API_KEY present  (default for demo)
//   live  — ANTHROPIC_API_KEY set and ASHA_MOCK != 1
//
// Model: ASHA_MODEL env var. Start on Haiku; bump to Sonnet only if field
// extraction misses. Set ASHA_MODEL to your Haiku model string before the
// live demo.

import { enforceGuardrails } from "../../lib/validator";
import {
  STRUCTURE_SYSTEM_PROMPT,
  buildUserMessage,
} from "../../lib/structurePrompt";
import { getMockSample } from "../../lib/mockData";
import { VisitLanguage } from "../../lib/schema";

export const runtime = "nodejs";

const DEFAULT_MODEL = "claude-haiku-4-5"; // override with ASHA_MODEL
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface StructureRequest {
  transcript?: string;
  language?: VisitLanguage;
  mockSampleId?: string;
}

function isMockMode(): boolean {
  if (process.env.ASHA_MOCK === "1" || process.env.ASHA_MOCK === "true")
    return true;
  return !process.env.ANTHROPIC_API_KEY;
}

// Pull a JSON object out of the model's text, tolerating stray prose or a
// ```json fence. Returns {} on failure (validator then yields an all-unclear
// note — safe: nothing guessed).
function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return {};
  }
}

async function callAnthropic(
  verbatim: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.ASHA_MODEL || DEFAULT_MODEL,
      max_tokens: 1024,
      temperature: 0, // deterministic structuring, no creative gap-filling
      system: STRUCTURE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(verbatim) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    data.content?.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("") ??
    "";
  return extractJson(text);
}

export async function POST(req: Request) {
  let body: StructureRequest;
  try {
    body = (await req.json()) as StructureRequest;
  } catch {
    return Response.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const language: VisitLanguage = body.language === "hi" ? "hi" : "hi-en";
  const mock = isMockMode();

  try {
    if (mock) {
      // Sample id -> canned raw output. No sample (free transcript) -> the
      // validator yields an all-unclear note, which is the honest result:
      // mock mode cannot structure arbitrary speech without the model.
      const sample = body.mockSampleId
        ? getMockSample(body.mockSampleId)
        : null;
      const verbatim =
        body.transcript?.trim() || sample?.transcript || "";
      const raw = sample ? sample.rawModelOutput : {};
      const visitNote = enforceGuardrails(raw, language, verbatim);
      return Response.json({ mode: "mock", visitNote });
    }

    const verbatim = body.transcript?.trim();
    if (!verbatim) {
      return Response.json({ error: "empty_transcript" }, { status: 400 });
    }
    const raw = await callAnthropic(verbatim);
    const visitNote = enforceGuardrails(raw, language, verbatim);
    return Response.json({ mode: "live", visitNote });
  } catch (err) {
    const message = err instanceof Error ? err.message : "structuring_failed";
    return Response.json({ error: "structuring_failed", detail: message }, {
      status: 502,
    });
  }
}
