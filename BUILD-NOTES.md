# ASHA Awaaz — Build Notes

**v2 · updated Fri 27 Nov 2026 (IST)**
Scaler × Wispr Flow, *Build for Bharat*, Round 2 · Theme: Healthcare access
Submission closes **Mon 30 Nov, 11:59 pm IST** · Our target: **Sun 29 Nov night** · Submit once only.

---

## 2026-11-27 — Production fixed, home page shipped, repo public

### Shipped today
| # | What | Proof |
|---|---|---|
| 1 | **Docker one-command start**, runs with zero secret keys (`docker compose up --build`) | Built and tested on Mac: 73 s build, full flow works with no keys |
| 2 | **Key-not-set notice** + `/api/status` health check | `{"structuring":"live","datastore":"live"}` on Vercel |
| 3 | **Supabase fixed in production.** Root cause: `SUPABASE_URL` held only the project ref; code now accepts ref or full URL | `/api/visits` → `mode: live`, 8 rows |
| 4 | **Mobile-first app pass**: refer banner first, only unclear fields ask for fixes, compact grid, sticky confirm, demo samples on top when no key | Screenshots at 390 px |
| 5 | **Home page** (`/`), app moved to **`/visit`**, health centre view at `/dashboard` | asha-awaaz.vercel.app |
| 6 | **Brand system**: 60-30-10 Ricotta Cream / Prussian Blue / Sindoor `#CA2325`; fonts Tiro Devanagari Hindi (headlines) + Mukta (body), self-hosted so Docker works offline | All three surfaces themed |
| 7 | **Security**: RLS enabled on `visit_notes` (no policies; server key bypasses) | Supabase: "RLS enabled, no policies" |
| 8 | **Keys rotated** (Anthropic + Supabase) after exposure in a screenshot; Vercel updated + redeployed; env values now trimmed in code | `/api/visits` → `mode: live` on new keys |
| 9 | **Repo public**: github.com/technoelogy/asha-awaaz; root tidied, reference docs in `docs/` | Repo shows *Public* |

### Home page — what's on it
- **First fold** (fits one screen, 360 px phone → 1920 px monitor): ASHA Awaaz | स्वस्थ नारी, सशक्त भारत · "for a healthy woman, a stronger Bharat" · one-line explainer · doorstep illustration (ASHA walks from her bicycle to the door, speaks, "Visit logged · PHC alerted" card rises).
- **Problem**: Today vs With ASHA Awaaz. Three cited numbers:
  - 10 lakh+ ASHAs — NHSRC ASHA Update 2022–23
  - 52.2% of pregnant women anaemic — NFHS-5
  - 88 maternal deaths per lakh live births vs SDG target <70 — SRS 2021–23 (RBI HSIS)
- **How it works**: animated phone cycling 4 real screens (speak → structure → confirm → saved), pauses on hover.
- **Trust**: never guesses · system's own checklists · DPDP-minded privacy · swappable speech engine.
- **System map**: 14 components, tagged Live now (9) / Building (2) / Pilot (3) / At scale (2).
- **Close**: स्वस्थ नारी, सशक्त भारत · "Built for impact. Built for a greater Bharat." · "From impression to impact."
- Footer credit: built by Noel Gomes, technoelogy.com.
- Hook for deck: tagline echoes MoHFW's **Swasth Nari Sashakt Parivar Abhiyaan** (launched by the PM, 17 Sep 2025).

### Decisions taken
- **Stay Hindi/Hinglish for Round 2.** Kannada = "next language" on the page and deck. Line up a Kannada speaker if shortlisted.
- **Submission targets government only.** No CSR / business-house angle. Funders get zero data access.
- **Logo**: plain "ASHA Awaaz", no quote marks.
- **Watermark** (taglines in Indian languages): first fold + closing fold only, very light.
- **Red is reserved** for danger signs, CTAs and the hero line.
- **Speech engine stays swappable** (one file: `app/api/transcribe/route.ts`).

---

## Speech engine plan (answer to "Sarvam vs ElevenLabs?")

| Layer | Today (demo) | Pilot | Why |
|---|---|---|---|
| Speech → text | Chrome built-in voice typing (free); Wispr Flow dictation (sponsor) | **Sarvam** speech-to-text | 22 Indian languages + English, auto language detection, code-mixed audio |
| Read-back voice | Browser Hindi voice (free) | Sarvam Bulbul (optional) | Natural Indian voices |
| Text → safe record | **Ours**: Claude Haiku + never-guess validator | Same | This is the product |

- **Cost (Sarvam):** ₹30 per hour of audio → **~₹0.50 per 1-minute visit note**. ₹1,000 free credits on signup.
- **Position for judges:** dialect accuracy is the speech engine's job; ours is turning imperfect text into a safe record. Every team can call the same API. Few will have the layer after it.
- **Wire Sarvam live?** Only after deck + demo are done (Sunday morning, ~2–3 h). If not, the deck says "engine-agnostic; tested on Chrome + Wispr Flow; Sarvam for dialects in pilot."

---

## Voice test plan — **Sat 28 Nov, 10:00–11:00 IST**
Owner: Tron speaks · Claude logs results and fixes anything that breaks.
Where: live site **asha-awaaz.vercel.app/visit**.

| # | Script (speak it, don't paste) | Laptop Chrome mic | Android Chrome mic | Wispr Flow dictation |
|---|---|---|---|---|
| 1 | Clean Hinglish: Sunita, 24, week 28, BP normal, taking iron, follow-up next month | ☐ | ☐ | ☐ |
| 2 | Pure Hindi version of #1 | ☐ | ☐ | ☐ |
| 3 | Danger signs: Phoolmati, 24, week 26, BP high, severe headache, blurred vision | ☐ | ☐ | ☐ |
| 4 | Noisy: speak #3 with TV / fan on | ☐ | ☐ | ☐ |
| 5 | Adolescent: Guddi, 16, out of school, heavy periods, not taking blue tablet, pale, breathless | ☐ | ☐ | ☐ |

For each, record three things:
1. Did the transcript capture the key facts (name, numbers, signs)?
2. Did the record come out right?
3. Did anything unsaid get marked **unclear** instead of guessed?

Output: one results line for the deck, e.g. "15 live voice tests across 3 input paths; X/15 structured correctly; 0 guessed fields."

---

## Status board

| Item | Owner | Due | Status |
|---|---|---|---|
| Public repo, starts with no keys | Claude | — | ✅ Done |
| Live link | Claude | — | ✅ Done |
| Supabase in production + RLS | Tron + Claude | — | ✅ Done |
| Key rotation (Anthropic, Supabase) | Tron | — | ✅ Done 27 Nov |
| Sarvam API key saved to `.env.local` | Tron | — | ✅ Done (not yet in Vercel) |
| Home page | Claude | — | ✅ Done |
| Translations check (Kannada first) | Tron | Sun 29, 2 pm | ⏳ Sent to groups. Unconfirmed lines get removed. |
| Voice test (above) | Tron + Claude | Sat 28, 11 am | ⏳ Scheduled |
| "Referral acknowledged" + "Export in register's fields" | Claude | Sat 28, 3 pm | ⏳ **Awaiting Tron's yes/no.** If no → relabel "Pilot" on home page |
| Pitch deck PDF (~8 slides: problem, users + numbers, dependencies + fallback, launch plan) | Claude drafts, Tron reviews | Sat 28 night | ⏳ |
| Demo script ≤3 min (PAS framework; Phoolmati flow; live voice moment; end on health centre view) | Claude | Sat 28 night | ⏳ |
| Clear Supabase test rows before recording | Tron | Sun 29, before recording | ⏳ |
| Record + upload demo (YouTube, unlisted) | Tron | Sun 29 | ⏳ |
| Sarvam live (optional) | Tron key + Claude | Sun 29 morning | Optional |
| Final checklist + submit (once) | Tron + Claude | Sun 29 night | ⏳ |

---

## Tech reference (how it's built)

### Stack
| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.3.8 (App Router, Turbopack), React 19.2.8 | TypeScript strict, plain scoped CSS (no Tailwind) |
| Structuring AI | Anthropic Messages API, model `claude-haiku-4-5`, temperature 0 | Called server-side only; model set by `ASHA_MODEL` |
| Guardrail | `app/lib/validator.ts` | Re-derives every field after the AI; unstated / off-list / out-of-range → `null` + "unclear"; `llm_clinical_inference: false` |
| Database | Supabase Postgres, table `visit_notes` (`supabase-schema.sql`) | Full record in `record` jsonb + a few flat columns for the dashboard; RLS on, no policies |
| Speech in (demo) | Chrome Web Speech API; Wispr Flow dictation into the text box | Production seam: `app/api/transcribe/route.ts` |
| Speech out | Browser `speechSynthesis`, Hindi voice | `app/lib/voice.ts` |
| Offline | `app/lib/queue.ts`, localStorage queue → drains to `/api/visits` on reconnect | Visit never lost; she is told it is queued |
| Fonts | `@fontsource/tiro-devanagari-hindi`, `@fontsource/mukta` | Bundled at build, so no internet needed in Docker |
| Hosting | Vercel (auto-deploy from GitHub `main`) | asha-awaaz.vercel.app |
| Container | `Dockerfile` (node:22-alpine, 3 stages) + `docker-compose.yml`; Next `output: "standalone"` | Starts with zero keys |

### Routes
| Path | What |
|---|---|
| `/` | Home page (story, data, live phone demo, system map) |
| `/visit` | The ASHA app: who is it for → speak → confirm → saved |
| `/dashboard` | Health centre (PHC) view of all visits |
| `POST /api/structure` | Transcript → structured record (AI + validator). Mock samples if no key |
| `GET/POST /api/visits` | List / save visits in Supabase. "local" mode if no keys |
| `GET /api/status` | `{"structuring":"live|demo","datastore":"live|local"}` |
| `POST /api/transcribe` | Speech engine socket (Wispr today; Sarvam next) |

### Environment variables
| Name | Where | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` + Vercel | No. Without it, demo samples run |
| `ASHA_MODEL` | same | No (default `claude-haiku-4-5`) |
| `SUPABASE_URL` | same | No. Full URL *or* bare project ref both work |
| `SUPABASE_SERVICE_KEY` | same, **server only, never `NEXT_PUBLIC_`** | No. Without it, datastore is "local" |
| `SARVAM_API_KEY` | `.env.local` only (so far) | Not used yet |
| `ASHA_MOCK=1` | optional | Forces demo mode even with a key |

All values are trimmed in code (guards against pasted spaces / line breaks).

### Schema v1.1 (cohort-aware)
- `cohort`: `pregnant` | `adolescent`, stored inside `record` jsonb, so no DB migration was needed when cohorts were added.
- Pregnant: name, age, gestational week, BP status, iron (IFA) compliance, follow-up, 5 danger signs (bleeding, swelling, blurred vision, severe headache, reduced fetal movement), each `present | absent | unclear`.
- Adolescent (RKSK / WIFS): in school, periods started, period pattern, menstrual hygiene, IFA (blue tablet), deworming (albendazole), pallor, nutrition, marriage pressure, follow-up; danger signs: severe pallor, breathlessness, heavy bleeding.
- Any danger sign `present` → red **PHC रेफर कीजिए** banner.

### Everyday commands
```bash
git pull                                   # get Claude's latest pushes
docker compose up --build                  # one-command start (Docker Desktop must be open)
npm install && npm run dev                 # without Docker
curl https://asha-awaaz.vercel.app/api/status
curl -s https://asha-awaaz.vercel.app/api/visits | head -c 300
open -e .env.local                         # edit keys in TextEdit
```

### Deploy / key-change checklist
1. Edit the variable in Vercel → Settings → Environment Variables → ⋮ → Edit → paste into **Value** → Save.
2. **Redeploy** (Deployments → ⋮ → Redeploy). Env changes only apply to a new deployment.
3. Wait for **Ready**, then run the two `curl` checks above.

---

## Hurdles log (symptom → cause → fix → lesson)

| # | Date | Symptom | Root cause | Fix | Lesson |
|---|---|---|---|---|---|
| 1 | 19 Nov | `cd` into project failed | Folder name typo (`asha-awaz`) | Real path `~/Projects/technoelogy-lab/ASHA-Awaaz` | Copy paths, don't retype |
| 2 | 19 Nov | Tarball "not found" in ~/Downloads | Browser saved into the project folder | Extract from current folder | Check where downloads land |
| 3 | 19 Nov | Pasted commands failed (`[200~`, `npm` prefix, `git push~`) | Stray characters from copy-paste | One clean command at a time | Paste into Terminal one line at a time |
| 4 | 19 Nov | Vercel couldn't see the repo | GitHub app not granted access | "Adjust GitHub App Permissions" → add `asha-awaaz` | New repos need explicit Vercel access |
| 5 | 19 Nov | Daily notes landed in the wrong repo | Notes belong in `technoelogy/notes` | Moved; now pushed directly | One repo per purpose |
| 6 | 27 Nov | `docker compose` failed | Docker daemon not running | Open Docker Desktop first | Daemon ≠ CLI |
| 7 | 27 Nov | "समझें और जाँचें" looked broken on a fresh start | Disabled until there's text or a sample; judges see a dead button | No-key mode puts samples on top + hint line under the button | Design the first 10 seconds for a judge with no keys |
| 8 | 27 Nov | Unclear field spilled past card edges on phones; fixer too tall; empty grey grid cell | Mobile CSS not tuned | Mobile-first pass: compact fixer, inline input, last odd cell spans 2 | Screenshot at 390 px before calling it done |
| 9 | 27 Nov | Saved screen said "(2 कतार में)" while online | Queue count shown before the sync finished | Show count only when offline | Only show a status the user can act on |
| 10 | 27 Nov | Dashboard "No datastore" while `/api/status` said live | `SUPABASE_URL` in Vercel held only the project ref → "Failed to parse URL" | Code accepts ref or full URL | `/api/status` checks presence, not validity; test the real call |
| 11 | 27 Nov | `/dashboard.` gave 404 | Trailing full stop copied from chat | Type URLs without punctuation | Never end a message with a URL followed by a full stop |
| 12 | 27 Nov | Typing the URL in Terminal: "no such file" | Needs `curl` in front | `curl https://…` | Terminal ≠ browser bar |
| 13 | 27 Nov | Supabase table showed a public globe icon | RLS off | Enabled RLS, no policies | Server key bypasses RLS, so the app is unaffected |
| 14 | 27 Nov | Phone demo text invisible on the home page | Dark section's light text colour inherited into the white phone | Set `color` on the phone body | Scoped colours on nested components |
| 15 | 27 Nov | Logo quote marks "removed" but still showing | Formatter had split the JSX across lines, so find-and-replace missed it | Regex replace + grep to verify | Verify edits by searching, not assuming |
| 16 | 27 Nov | Test server wouldn't start | Old process still on port 3311 | `fuser -k 3311/tcp` before restart | Free the port first |
| 17 | 27 Nov | **API keys visible in a screenshot** (2nd day running) | `.env.local` open on screen | Rotated Anthropic + Supabase keys, updated Vercel, redeployed | Close `.env` before any screenshot; show names only |
| 18 | 27 Nov | Went to OpenAI's site to rotate the key | App uses Anthropic, not OpenAI | console.anthropic.com → API Keys | Know which vendor each key belongs to |
| 19 | 27 Nov | After rotation, `/api/visits` → "Unregistered API key" even after redeploy | Stray whitespace in the pasted key | Code now `.trim()`s every key | Defensive trimming on all env values |
| 20 | 27 Nov | `/api/visitss` returned an HTML 404 | Typo | Correct URL | Read the first line of output before reacting |

### Lint rules that bit us
- `react-hooks/set-state-in-effect`: call `setState` inside the promise `.then()`, not directly in the effect body.
- `@next/next/no-html-link-for-pages`: use `<Link>` from `next/link` for internal links, not `<a>`.

---

## Step-by-step log (what was done, in order)

**19 Nov**
1. Two cohorts live (pregnant + adolescent), danger-sign screening, cohort picker.
2. Repo created on GitHub, Vercel project imported and connected, env vars added, live structuring working.

**27 Nov**
1. Docker: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `output: "standalone"` → tested on Mac.
2. `/api/status` + key-not-set banner; judge-facing README.
3. Mobile-first pass on confirm / capture / picker screens; verified with Playwright at 390 px.
4. Production DB fix (Supabase URL), queue-count fix, synced queued visits (8 rows).
5. Home page v1 → v2 (product-first hero, illustration, Today vs With, animated phone) → v3 (fonts, brand line, Bharat wording, lighter watermark, walk-in animation) → v4 (fits one screen on all devices, no quote marks, footer credit).
6. Moved app to `/visit`; updated dashboard links + README.
7. RLS on; repo public; root tidied into `docs/`.
8. Speech engine decision (Sarvam for pilot); Sarvam account + key saved locally.
9. Key rotation (Anthropic, Supabase) → Vercel updated → redeploy → trim fix → verified live.
10. Build Notes v2 + daily note pushed to `technoelogy/notes`.

---

## 2026-11-19 — Two cohorts live + deployed

Shipped
- Part 1: HRP danger-sign screening (5 signs, present/absent/unclear, auto PHC-refer banner). Tested live (high BP + headache + blurred vision → refer).
- Part 2: "Who is this visit for?" cohort picker. Pregnant + Adolescent girl (RKSK/WIFS) live; 3 cohorts "coming soon". 10-field adolescent set grounded in govt WIFS/RKSK touchpoints.
- Never-guess guardrail held on a real transcript (Deworming stayed "unclear" because unspoken).
- Pushed to GitHub: github.com/technoelogy/asha-awaaz
- Deployed to Vercel: asha-awaaz.vercel.app — live Claude Haiku structuring working in production.

Open (as of 19 Nov — now resolved)
- ~~BUG: Supabase persistence not connecting in production~~ → fixed 27 Nov.
- Voice: browser speech for demo; Wispr documented as production seam → see Speech engine plan.
