// ASHA Awaaz — eval runner.
//
//   npm run eval                 guard cases, offline, no key needed
//   npm run eval:live            live cases against BASE_URL (default: the
//                                deployed site) — real model + validator
//
// Exit code 1 if any case fails, so it can gate a deploy.

import { writeFileSync, mkdirSync } from "node:fs";
import { enforceGuardrails } from "../app/lib/validator";
import type { VisitNote } from "../app/lib/schema";
import { checkTranscript } from "../app/lib/inputCheck";
import { checkContinuity } from "../app/lib/continuity";
import { GUARD_CASES, LIVE_CASES, INPUT_CASES, CONTINUITY_CASES, CONTINUITY_PAST, type EvalCase } from "./cases";

const live = process.argv.includes("--live");
const BASE_URL = (process.env.BASE_URL || "https://asha-awaaz.vercel.app").replace(/\/$/, "");

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

function check(c: EvalCase, note: VisitNote): string[] {
  const misses: string[] = [];
  for (const [path, want] of Object.entries(c.expect)) {
    const got = get(note, path);
    if (got !== want) misses.push(`${path}: want ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }
  for (const f of c.uncertain ?? []) {
    if (!note.uncertain_fields.includes(f as never)) misses.push(`${f}: should be asked (uncertain), was not`);
  }
  return misses;
}

async function runOne(c: EvalCase): Promise<{ note: VisitNote; ms: number }> {
  const t0 = Date.now();
  if (!live) {
    return { note: enforceGuardrails(c.raw ?? {}, c.cohort, "hi-en", c.transcript), ms: Date.now() - t0 };
  }
  const res = await fetch(`${BASE_URL}/api/structure`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transcript: c.transcript, cohort: c.cohort, language: "hi-en" }),
  });
  const body = (await res.json()) as { mode?: string; visitNote?: VisitNote; error?: string };
  if (!body.visitNote) throw new Error(body.error || `HTTP ${res.status}`);
  if (body.mode !== "live") throw new Error(`server is in ${body.mode} mode, not live`);
  return { note: body.visitNote, ms: Date.now() - t0 };
}

async function main() {
  const cases = live ? LIVE_CASES : GUARD_CASES;
  console.log(`\nASHA Awaaz evals · ${live ? `LIVE (${BASE_URL})` : "GUARDS (offline)"} · ${cases.length} cases\n`);
  const rows: { id: string; why: string; pass: boolean; ms: number; misses: string[] }[] = [];

  for (const c of cases) {
    try {
      const { note, ms } = await runOne(c);
      const misses = check(c, note);
      rows.push({ id: c.id, why: c.why, pass: misses.length === 0, ms, misses });
    } catch (e) {
      rows.push({ id: c.id, why: c.why, pass: false, ms: 0, misses: [String(e instanceof Error ? e.message : e)] });
    }
    const r = rows[rows.length - 1];
    console.log(`${r.pass ? "✅" : "❌"} ${r.id.padEnd(28)} ${live ? `${r.ms} ms`.padStart(8) : ""}  ${r.why}`);
    for (const m of r.misses) console.log(`     ↳ ${m}`);
  }

  if (!live) {
    console.log("\nInput check (before the AI)");
    for (const c of INPUT_CASES) {
      const v = checkTranscript(c.text);
      const pass = v.ok === c.ok;
      rows.push({ id: `input-${c.id}`, why: `${c.ok ? "let through" : "block"}: "${c.text}"`, pass, ms: 0, misses: pass ? [] : [`want ok=${c.ok}, got ok=${v.ok}`] });
      console.log(`${pass ? "✅" : "❌"} input-${c.id.padEnd(22)} ${c.ok ? "let through" : "block"}: "${c.text}"`);
    }
  }

  if (!live) {
    console.log("\nCross-visit check (memory across visits)");
    for (const c of CONTINUITY_CASES) {
      const got = checkContinuity(
        { visit_id: "new", cohort: "pregnant", created_at: "2026-11-28T10:00:00Z",
          beneficiary: { name: c.name, age: { value: c.age }, gestational_week: c.week } },
        CONTINUITY_PAST,
      );
      const fields = got.map((f) => f.field).sort().join(",");
      const misses: string[] = [];
      if (fields !== [...c.flags].sort().join(",")) misses.push(`want flags [${c.flags}], got [${fields}]`);
      if (c.expectedWeek != null) {
        const w = got.find((f) => f.field === "gestational_week")?.expected;
        if (w !== c.expectedWeek) misses.push(`want expected week ${c.expectedWeek}, got ${w}`);
      }
      rows.push({ id: `continuity-${c.id}`, why: c.why, pass: misses.length === 0, ms: 0, misses });
      console.log(`${misses.length ? "❌" : "✅"} continuity-${c.id.padEnd(17)} ${c.why}`);
      for (const m of misses) console.log(`     ↳ ${m}`);
    }
  }

  const passed = rows.filter((r) => r.pass).length;
  console.log(`\n${passed}/${rows.length} passed\n`);

  mkdirSync("evals/results", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `evals/results/${live ? "live" : "guards"}.json`,
    JSON.stringify({ run_at: stamp, mode: live ? "live" : "guards", base_url: live ? BASE_URL : null, passed, total: rows.length, rows }, null, 2),
  );
  process.exit(passed === rows.length ? 0 : 1);
}

main();
