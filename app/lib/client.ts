// ASHA Awaaz — client-side helper to call the structuring route.
"use client";

import { VisitNote, VisitLanguage } from "./schema";

export interface StructureResult {
  mode: "mock" | "live";
  visitNote: VisitNote;
}

export async function structureTranscript(params: {
  transcript: string;
  language: VisitLanguage;
  mockSampleId?: string;
}): Promise<StructureResult> {
  const res = await fetch("/api/structure", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `HTTP ${res.status}`);
  }
  return (await res.json()) as StructureResult;
}
