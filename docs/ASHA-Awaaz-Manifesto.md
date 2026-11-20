# ASHA Awaaz — Manifesto & Build Handbook

**Swasth Nari, Sashakt Bharat.** *(A Healthy Woman, A Stronger India.)*

Voice-first visit logging for India's ASHA workers that outputs data in the government's own schema.

`v1.1 · 20 Nov 2026 · a technoelogy.com build`

---

## 1. The one-line

An ASHA worker speaks her home-visit note in Hindi or Hinglish. The app structures it, reads it back for her to confirm, and produces a clean record in the same schema the government already uses — ready to flow into RCH / HMIS instead of a paper register.

## 2. Who this is for (four layers)

1. **The district health official** — graded on HMIS and RCH data, because that data drives NITI Aayog rankings and the release of central funds under PIP conditionality. This is who signs off.
2. **The ASHA + ANM** — today juggling 7–15 registers, losing up to ~2 hours a day to record-keeping, entering the same details twice.
3. **The woman of the house** — pregnant women and adolescent girls, 52% and 59% of whom are anemic (NFHS-5), whose danger signs surface weeks late in a monthly report instead of at her door.

## 3. The problem (data-backed)

- Frontline staff maintain **7–15 registers** and spend **up to 2 hours/day** on record-keeping.
- The government's own Integrated RCH Register admits the same information is copied across many registers — **"duplication."**
- HMIS **data quality "remains a challenge,"** and the fix the government itself asks for is **"validation at source."**
- Danger signs (high-risk pregnancy, severe anemia) are not flagged at the point of care.

## 4. The thesis

Do not sell "better health." Every initiative says that. **Sell the official the number they are already graded on — and show it costs nothing to move.** Near-zero cost in, a better-ranked and fully-funded district out.

And: **plug in, don't replace.** No new infrastructure. The tool rides the existing ASHA → ANM → RCH Portal (ANMOL) → HMIS pipeline.

## 5. Product principles (the non-negotiables)

Every future build decision checks against these. If a feature breaks one, it does not ship.

1. **Voice-first.** Speak, don't type. Hindi / Hinglish, accent-tolerant.
2. **Confirm-and-correct.** The record is read back aloud. Only fields marked *unclear* are re-asked, one at a time. Never a restart.
3. **Never-guess guardrail.** Unstated = blank. Off-enum or out-of-range = null + unclear. `llm_clinical_inference = false`, hard-coded. The model structures; it never fills clinical gaps.
4. **The frozen JSON schema is the single source of truth.** The dashboard and the database are renderings of it, never the other way round.
5. **Schema-compatible with government systems.** The output maps field-for-field onto what ANMOL / RCH already capture.
6. **Privacy by design.** Data minimization is structural (never-guess = less data held). The State is the data fiduciary.
7. **Mock-first, swappable seams.** Voice source, structuring, and datastore are all swappable behind one env var each — demo today, production tomorrow.

## 6. Cohorts

One visit = one beneficiary = one record. An absent person is simply no record.

- **Live — Pregnant woman (ANC):** gestational week, BP, iron compliance, + HRP danger signs (severe headache, blurred vision, swelling, bleeding, reduced fetal movement) → auto PHC-refer.
- **Live — Adolescent girl (RKSK / WIFS, 10–19):** school status, periods, menstrual hygiene, blue IFA tablet, deworming, pallor, nutrition, marriage pressure, + anemia danger signs (severe pallor, breathlessness, heavy bleeding) → auto refer.
- **Roadmap:** Women 30+ (NCD), new mother (PNC), child under 5 (growth).

## 7. How it plugs into government

- **Pipeline:** ASHA (voice) → structured record → ANM → **RCH Portal via ANMOL** → **HMIS**.
- **Danger signs** map to high-risk pregnancy tracking (PMSMA).
- **IFA / anemia status** maps to Anemia Mukt Bharat / WIFS.
- **Never-guess** delivers the "validation at source" the HMIS guidelines call for.

## 8. Privacy & compliance (DPDP Act, 2023)

- **Data minimization** is built in: the app holds only what the ASHA states, nothing inferred.
- **The State is the data fiduciary.** Beneficiary data stays with the government, never a private party.
- **Minors:** the adolescent cohort are legally children (under 18). The tool processes their health data under the DPDP Rules' **healthcare carve-out**, staying compliant without parental-consent friction at the door.
- **Funders get zero data access.** Non-negotiable.

## 9. Success metrics (one-block pilot)

Prove it on one PHC, not a nation. The three numbers that fund the next ten blocks:

| Metric | Target |
|---|---|
| Record-keeping time per worker | ~2 hrs/day → under 30 min (**–60%**) |
| Visits reaching the RCH schema same-day | **95%** |
| High-risk / severe-anemia cases flagged at point of care | **90%+** |

## 10. Risks & honest limits

- **Interoperability is the real blocker, not voice.** Until a state grants RCH / ANMOL API access, the output is a clean schema-matched export, not a live push.
- **Voice accuracy** in noise and across accents — mitigated by confirm-and-correct + never-guess (errors surface instead of entering silently).
- **Adoption** — it only works if the PHC acts on the referrals it raises.

## 11. Funding philosophy

- **Government-first.** The submission and the pitch target health authorities only — no business houses in the ask.
- **CSR funds the pilot, not the product.** If used, strictly arm's-length: brand-neutral, zero data access, maternal/child-health CSR (Schedule VII). The moment a logo or a data pipe touches an ASHA's screen, government trust dies.
- **The State absorbs it at scale** — near-zero marginal cost is what makes public funding realistic.

## 12. Tech stack

- **Frontend:** Next.js (App Router), TypeScript, plain scoped CSS.
- **Structuring:** Anthropic Claude Haiku via Messages API (deterministic, temperature 0).
- **Voice:** browser Web Speech API for the demo; **Wispr Flow** documented as the production voice seam (one env-var swap).
- **Persistence:** Supabase (server-side, RLS).
- **Guardrails:** in-code validator enforcing the schema before anything downstream sees the model output.

## 13. Build status (20 Nov 2026)

**Shipped & live:**
- Voice → structure → confirm-and-correct loop (live Claude Haiku).
- Never-guess guardrail, proven on a real transcript.
- Part 1: HRP danger-sign screening + auto PHC-refer.
- Part 2: "Who is this visit for?" cohort picker + adolescent cohort.
- Supabase persistence + PHC dashboard.
- Deployed: **asha-awaaz.vercel.app**. Repo: **github.com/technoelogy/asha-awaaz**.

**Open:**
- Supabase production env fix (dashboard "No datastore").
- Round 2 build submission — due **29 Nov 2026**.

## 14. North star

Swasth Nari, Sashakt Bharat. A healthy woman is a stronger India — and it starts with getting her visit on the record the moment it happens.

---

### Sources (every number is defensible)

- ASHA workforce ~1 million — MoHFW / NHM (NHM-MIS; ~939,978 in 2018, target 1,022,265).
- Anemia 52.2% pregnant women, 59.1% adolescent girls — NFHS-5 (2019–21), MoHFW / PIB.
- 7–15 registers, ~2 hrs/day record-keeping — peer-reviewed PHC HMIS evaluation (BMC Health Services Research).
- "Duplication" across registers — Government of India, Integrated RCH Register instruction manual.
- HMIS used for PIP conditionality + NITI Aayog rankings; "validation at source" — NHM HMIS/RCH implementation guidelines.
- RCH Portal (upgraded MCTS) + ANMOL (ANM Online) — MoHFW; state PRC assessments.
- DPDP Act 2023: child = under 18, verifiable parental consent (Section 9); healthcare carve-out (DPDP Rules 2025, Rule 12 / Schedule 4).

---

### Acronyms & abbreviations

| Short | Full form |
|---|---|
| **ANC** | Antenatal Care (pregnancy check-ups before birth) |
| **ANM** | Auxiliary Nurse Midwife (health worker above the ASHA, at the sub-centre) |
| **ANMOL** | ANM Online (tablet app ANMs use to enter RCH data) |
| **API** | Application Programming Interface (direct system-to-system data exchange) |
| **ASHA** | Accredited Social Health Activist (community health worker) |
| **BP** | Blood Pressure |
| **CSR** | Corporate Social Responsibility |
| **DPDP** | Digital Personal Data Protection (Act, 2023) |
| **HMIS** | Health Management Information System (government's monthly health-data portal) |
| **HRP** | High-Risk Pregnancy |
| **IFA** | Iron and Folic Acid (supplement; the "blue tablet" for adolescents) |
| **JSON** | JavaScript Object Notation (the structured data format the record uses) |
| **LLM** | Large Language Model (the AI that structures the voice note) |
| **MCTS** | Mother and Child Tracking System (predecessor of the RCH Portal) |
| **MoHFW** | Ministry of Health and Family Welfare |
| **NCD** | Non-Communicable Disease |
| **NFHS** | National Family Health Survey (NFHS-5 = 5th round, 2019–21) |
| **NHM** | National Health Mission |
| **NITI Aayog** | National Institution for Transforming India (central policy commission) |
| **PHC** | Primary Health Centre |
| **PIP** | Programme Implementation Plan (NHM funding plan; "conditionality" = fund release tied to deliverables) |
| **PMSMA** | Pradhan Mantri Surakshit Matritva Abhiyan (national safe-motherhood / high-risk-pregnancy programme) |
| **PNC** | Postnatal Care (care after childbirth) |
| **PRC** | Population Research Centre |
| **RCH** | Reproductive and Child Health |
| **RKSK** | Rashtriya Kishor Swasthya Karyakram (National Adolescent Health Programme) |
| **RLS** | Row-Level Security (database access control) |
| **WIFS** | Weekly Iron and Folic Acid Supplementation (programme) |
