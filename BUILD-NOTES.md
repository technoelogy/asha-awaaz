## 2026-11-19 — ASHA Awaaz: two cohorts live + deployed

Shipped
- Part 1: HRP danger-sign screening (5 signs, present/absent/unclear, auto PHC-refer banner). Tested live (high BP + headache + blurred vision -> refer).
- Part 2: "Who is this visit for?" cohort picker. Pregnant + Adolescent girl (RKSK/WIFS) live; 3 cohorts "coming soon". 10-field adolescent set grounded in govt WIFS/RKSK touchpoints.
- Never-guess guardrail held on a real transcript (Deworming stayed "unclear" because unspoken).
- Pushed to GitHub: github.com/technoelogy/asha-awaaz
- Deployed to Vercel: asha-awaaz.vercel.app — live Claude Haiku structuring working in production.

Open / next
- BUG: Supabase persistence not connecting in production (dashboard "No datastore", visit stuck in local queue). Fix: verify SUPABASE_URL + SUPABASE_SERVICE_KEY in Vercel env, redeploy.
- Submission (due 29 Nov): write-up, demo script, rehearse.
- Voice: browser speech for demo; Wispr documented as production seam.
