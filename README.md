# ASHA Awaaz

**Swasth Nari, Sashakt Bharat.** Voice-first visit logging for India's ASHA workers.

An ASHA worker speaks a home-visit note in Hindi, Hinglish or Bhojpuri-accented
Hindi. The app turns it into a structured record, reads it back for her to
confirm by ear, flags danger signs for a PHC referral, and shows the visit on
a PHC dashboard. She never fills an English form.

Built for the Scaler × Wispr **Build for Bharat** hackathon · Theme: **Healthcare access**.

## Start it (one command, no keys needed)

```bash
docker compose up --build
```

Open **http://localhost:3000**.

Without any keys the app runs fully on built-in demo samples and shows an
"AI key not set" note. Nothing breaks.

Without Docker: `npm install && npm run dev`.

## Try the core flow (about 1 minute)

1. Tap **गर्भवती महिला** (pregnant woman).
2. Under *Demo samples*, tap **Bhojpuri accent · HIGH-RISK**.
3. Tap **समझें और जाँचें**. The structured record appears.
4. See the red banner: severe headache + blurred vision → **refer to PHC**.
5. Tap **🔊 सुनें** to hear the Hindi read-back. Tap **पुष्टि करें और सेव करें**.
6. Open **PHC Dashboard** (footer link) to see the visit flagged.

Also try **किशोरी (10–19)** → *HIGH-RISK · severe anaemia* for the adolescent-girl flow.

## Optional: go live

Set any of these before `docker compose up` (shell or a `.env` file):

| Variable | Enables |
|---|---|
| `ANTHROPIC_API_KEY` | Live AI structuring of your own speech (Claude Haiku) |
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Saved visits persist (run `supabase-schema.sql` first) |

Voice capture uses the browser's speech recognition (Chrome). Use it on
`localhost` or HTTPS.

## How it works

```
Voice (Hindi / Hinglish)
  → structuring (Claude Haiku, temperature 0)
  → in-code validator (never-guess guardrail)
  → visit-note JSON (single source of truth)
  → voice read-back + confirm-and-correct
  → save → PHC dashboard
```

**Never-guess guardrail.** If something wasn't said, the field stays blank and
is asked again. Values that don't fit the allowed options or ranges become
blank too. The model structures speech; it never fills in clinical values.

## Project layout

- `app/lib/schema.ts` — visit-note schema (pregnant + adolescent cohorts)
- `app/lib/validator.ts` — guardrails applied to model output
- `app/lib/structurePrompt.ts` — structuring prompts per cohort
- `app/components/` — cohort picker, mic capture, confirm screen
- `app/api/` — structure, visits, status, transcribe routes
- `app/dashboard/` — PHC dashboard
- `docs/` — manifesto and build handbook

Synthetic data only. No real patient data.
