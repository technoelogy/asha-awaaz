// ASHA Awaaz — visit persistence.  POST /api/visits (save)  ·  GET /api/visits (list)
//
// The database seam. Inserts go through here (server-side) so the Supabase key
// never reaches the browser — same pattern as the Anthropic and Wispr keys.
//
// Mode resolution:
//   local — no SUPABASE_URL / SUPABASE_SERVICE_KEY  (default; app runs in-memory)
//   live  — both set; confirmed notes become real rows
//
// TO ACTIVATE: create a Supabase project, run supabase-schema.sql, then set
// SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local. Nothing else changes.

import { VisitNote } from "../../lib/schema";

export const runtime = "nodejs";

function config(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  // Accept a bare project ref ("abcd1234") or a full URL.
  let u = url.trim().replace(/\/$/, "");
  if (!/^https?:\/\//.test(u)) u = u.includes(".") ? `https://${u}` : `https://${u}.supabase.co`;
  return { url: u, key };
}

// Denormalise a few fields for easy dashboard queries; keep the full record.
function toRow(note: VisitNote) {
  return {
    id: note.visit_id,
    created_at: note.created_at,
    record: note,
    beneficiary_name: note.beneficiary.name,
    gestational_week: note.beneficiary.gestational_week,
    bp_status: note.assessment.bp_status,
    iron_compliance: note.assessment.iron_compliance,
    follow_up_needed: note.follow_up.needed,
    confirmed: note.status.confirmed_by_asha,
  };
}

export async function POST(req: Request) {
  let body: { visitNote?: VisitNote };
  try {
    body = (await req.json()) as { visitNote?: VisitNote };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const note = body.visitNote;
  if (!note || !note.visit_id) {
    return Response.json({ error: "missing_visit_note" }, { status: 400 });
  }

  const cfg = config();
  if (!cfg) {
    // No datastore configured — acknowledge so the queue clears locally.
    return Response.json({ mode: "local", stored: false });
  }

  try {
    const res = await fetch(`${cfg.url}/rest/v1/visit_notes?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${cfg.key}`,
        "content-type": "application/json",
        // upsert so a re-sent note (queue retry) doesn't duplicate
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(toRow(note)),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: "supabase_insert_failed", detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }
    return Response.json({ mode: "live", stored: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "insert_failed";
    return Response.json({ error: "insert_failed", detail: message }, { status: 502 });
  }
}

export async function GET() {
  const cfg = config();
  if (!cfg) return Response.json({ mode: "local", count: 0, visits: [] });

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/visit_notes?select=id,created_at,beneficiary_name,gestational_week,bp_status,iron_compliance,follow_up_needed,record&order=created_at.desc&limit=100`,
      { headers: { apikey: cfg.key, authorization: `Bearer ${cfg.key}` } },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json({ error: "supabase_list_failed", detail: detail.slice(0, 300) }, { status: 502 });
    }
    const visits = (await res.json()) as unknown[];
    return Response.json({ mode: "live", count: visits.length, visits });
  } catch (err) {
    const message = err instanceof Error ? err.message : "list_failed";
    return Response.json({ error: "list_failed", detail: message }, { status: 502 });
  }
}
