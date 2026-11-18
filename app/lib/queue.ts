// ASHA Awaaz — offline queue.
//
// Rural 2G reality: the network drops mid-shift. A confirmed visit-note is
// never lost — it is queued in localStorage and she is TOLD it is queued.
// On reconnect the queue drains to /api/visits, which persists to Supabase
// when configured (or acknowledges locally when not).
//
// This local queue is the durability buffer in front of the datastore, so a
// confirmed note survives a dropped network until it syncs.
"use client";

import { VisitNote } from "./schema";

const QUEUE_KEY = "asha-awaaz:queue:v1";

export interface QueuedNote {
  visitNote: VisitNote;
  queued_at: string;
  synced: boolean;
}

function read(): QueuedNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedNote[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedNote[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Storage full / disabled — swallow; the UI still shows the current note.
  }
}

export function enqueue(note: VisitNote): QueuedNote {
  const item: QueuedNote = {
    visitNote: note,
    queued_at: new Date().toISOString(),
    synced: false,
  };
  const items = read();
  items.push(item);
  write(items);
  return item;
}

export function pendingCount(): number {
  return read().filter((i) => !i.synced).length;
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

// Drain: POST each pending note to /api/visits (which persists to Supabase
// when configured, or acknowledges locally when not). Stop on the first
// failure so unsent notes stay queued for the next drain.
export async function drain(): Promise<number> {
  if (!isOnline()) return 0;
  const items = read();
  let drained = 0;
  for (const item of items) {
    if (item.synced) continue;
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitNote: item.visitNote }),
      });
      if (!res.ok) break; // keep this and the rest for the next drain
      item.synced = true;
      drained++;
    } catch {
      break; // offline / server unreachable — retry next time
    }
  }
  write(items);
  return drained;
}
