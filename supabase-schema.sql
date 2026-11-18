-- ASHA Awaaz — Supabase schema (v1)
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- The structured visit-note JSON is the source of truth: it lives whole in the
-- `record` column. The other columns are denormalised copies for fast dashboard
-- queries — they are views of `record`, never a second source of truth.

create table if not exists public.visit_notes (
  id               uuid primary key,
  created_at       timestamptz not null default now(),
  record           jsonb       not null,
  beneficiary_name text,
  gestational_week int,
  bp_status        text,
  iron_compliance  text,
  follow_up_needed boolean,
  confirmed        boolean     not null default true
);

create index if not exists visit_notes_created_idx
  on public.visit_notes (created_at desc);

-- Row Level Security: inserts/reads go through the server-side route using the
-- service key (which bypasses RLS), so keep RLS ON with no public policies.
-- Synthetic data only in v1 — no real patient PII.
alter table public.visit_notes enable row level security;
