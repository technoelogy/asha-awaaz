# ASHA Awaaz

Voice-first visit logging for India's ASHA workers. She speaks her post-visit
note in Hindi or Hinglish; it becomes a structured record she confirms by ear.
She never types.

Built for the Scaler × Wispr **Build for Bharat** hackathon.

## The P1 path

```
Voice (Hindi/Hinglish)  →  structuring (Claude Haiku)  →  visit-note JSON  →  voice confirm-and-correct
```

No datastore, no dashboard in P1 — the structured record is the single source
of truth; everything downstream is a rendering of it.

## Run it

```bash
npm install
npm run dev          # → http://localhost:3000  (mock mode, no API key needed)
```

Mock mode is the default: the three demo samples run through the real
structuring guardrails with no network and no key. To enable the live model:

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY and ASHA_MODEL in .env.local, then:
npm run dev
```

## What's inside

| Path | Role |
|---|---|
| `app/page.tsx` + `app/AshaAwaazApp.tsx` | PWA shell + capture → confirm → queue state machine |
| `app/components/MicCapture.tsx` | voice capture (Wispr dictates into the focused field) + demo samples |
| `app/components/VisitNoteConfirm.tsx` | voice read-back; only unclear fields are re-asked, one at a time |
| `app/api/structure/route.ts` | structuring endpoint — mock-first, live via Anthropic Messages API |
| `app/lib/schema.ts` | frozen visit-note schema (v1.0) |
| `app/lib/validator.ts` | in-code guardrails — unstated/implausible values become `null`, never guessed |
| `app/lib/voice.ts` | Hindi text-to-speech read-back |
| `app/lib/queue.ts` | offline localStorage queue for low-connectivity field use |

## The guardrail that matters

A clinical value is **never inferred**. Anything the ASHA worker did not
clearly state resolves to `null`; anything the model flags uncertain is
surfaced for her to confirm or correct — one field at a time, never a restart.
This is enforced in code (`validator.ts`), not left to the prompt.

## Visit-note fields (v1)

name · age · gestational week · BP status · iron-tablet compliance · follow-up
needed — each with a per-field confidence and an `uncertain_fields` list that
drives the confirm-and-correct screen.

## Roadmap (not in P1)

Supabase datastore · PHC dashboard · service-worker offline shell · Marathi.
