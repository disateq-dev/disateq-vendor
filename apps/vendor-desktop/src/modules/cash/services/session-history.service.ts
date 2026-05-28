const LS_HISTORY    = "disateq.pos.sessionHistory";
const LS_CURRENT_SID = "disateq.pos.currentSessionId";
const MAX_RECORDS   = 50;

export type CloseSignal = "ok" | "warn";

export type SessionEntry = {
  id:          string;
  boxCode:     string;
  operator:    string;
  openedAt:    string;        // ISO
  closedAt:    string | null;
  closeSignal: CloseSignal | null;
};

export function loadSessionHistory(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionEntry[];
  } catch { return []; }
}

export function recordSessionOpen(
  sid: string, boxCode: string, operator: string, openedAt: string,
): void {
  try {
    const hist = loadSessionHistory();
    const entry: SessionEntry = { id: sid, boxCode, operator, openedAt, closedAt: null, closeSignal: null };
    const trimmed = [entry, ...hist].slice(0, MAX_RECORDS);
    localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
    localStorage.setItem(LS_CURRENT_SID, sid);
  } catch { /* quota */ }
}

export function recordSessionClose(
  sid: string, closedAt: string, closeSignal: CloseSignal,
): void {
  try {
    const hist = loadSessionHistory();
    const updated = hist.map(e =>
      e.id === sid ? { ...e, closedAt, closeSignal } : e,
    );
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated));
    localStorage.removeItem(LS_CURRENT_SID);
  } catch { /* quota */ }
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(LS_CURRENT_SID);
}
