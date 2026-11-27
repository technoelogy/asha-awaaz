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
| 8 | **Repo public**: github.com/technoelogy/asha-awaaz; root tidied, reference docs in `docs/` | Repo shows *Public* |

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
