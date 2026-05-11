// Local-first storage para compromissos. Funciona 100% offline.
export type LocalEvent = {
  id: string;
  title: string;
  starts_at: string; // ISO
  ends_at: string | null;
  notify_minutes_before: number;
  notification_id: number | null;
};

const KEY = "minha-agenda:events:v1";

export function loadEvents(): LocalEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: LocalEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

export function upsertEvent(ev: LocalEvent) {
  const list = loadEvents();
  const idx = list.findIndex((e) => e.id === ev.id);
  if (idx >= 0) list[idx] = ev;
  else list.push(ev);
  saveEvents(list);
  return list;
}

export function deleteEvent(id: string) {
  const list = loadEvents().filter((e) => e.id !== id);
  saveEvents(list);
  return list;
}

export function newId() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function exportJson(): string {
  return JSON.stringify({ version: 1, exported_at: new Date().toISOString(), events: loadEvents() }, null, 2);
}

export function importJson(text: string): { ok: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(text);
    const events = Array.isArray(data) ? data : data.events;
    if (!Array.isArray(events)) return { ok: false, count: 0, error: "Arquivo inválido" };
    // merge by id
    const map = new Map<string, LocalEvent>();
    for (const e of loadEvents()) map.set(e.id, e);
    for (const e of events) {
      if (e && typeof e.title === "string" && typeof e.starts_at === "string") {
        const id = typeof e.id === "string" ? e.id : newId();
        map.set(id, {
          id,
          title: e.title,
          starts_at: e.starts_at,
          ends_at: e.ends_at ?? null,
          notify_minutes_before: typeof e.notify_minutes_before === "number" ? e.notify_minutes_before : -1,
          notification_id: typeof e.notification_id === "number" ? e.notification_id : null,
        });
      }
    }
    const list = Array.from(map.values());
    saveEvents(list);
    return { ok: true, count: list.length };
  } catch (err) {
    return { ok: false, count: 0, error: err instanceof Error ? err.message : "Erro" };
  }
}
