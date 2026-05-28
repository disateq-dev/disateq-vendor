import type { ArqueoData } from "../../../print/printTicket";

const LS_HISTORY     = "disateq.pos.sessionHistory";
const LS_CURRENT_SID = "disateq.pos.currentSessionId";
const MAX_RECORDS    = 50;

export type CloseSignal = "ok" | "warn";

export type CorrectionRecord = {
  correctedBy: string;
  correctedAt: string;           // ISO
  motivo:      string;
  accion:      "regularizar_cierre" | "documentar_diferencia";
  prevSignal:  CloseSignal | null;
  newSignal:   CloseSignal;
};

export type SessionEntry = {
  id:          string;
  boxCode:     string;
  boxLabel:    string;           // "PRINCIPAL" | "SECUNDARIA 01" | "SECUNDARIA 02" | "CONTINGENCIA"
  operator:    string;
  openedAt:    string;           // ISO
  closedAt:    string | null;
  closeSignal: CloseSignal | null;
  arqueo:      ArqueoData | null; // snapshot para reimpresión
  correction?: CorrectionRecord; // regularización excepcional
};

export function loadSessionHistory(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SessionEntry>[];
    return parsed.map(e => ({
      id:          e.id          ?? "",
      boxCode:     e.boxCode     ?? "",
      boxLabel:    e.boxLabel    ?? "PRINCIPAL",
      operator:    e.operator    ?? "",
      openedAt:    e.openedAt    ?? "",
      closedAt:    e.closedAt    ?? null,
      closeSignal: e.closeSignal ?? null,
      arqueo:      e.arqueo      ?? null,
      ...(e.correction ? { correction: e.correction } : {}),
    }));
  } catch { return []; }
}

export function recordSessionOpen(
  sid: string, boxCode: string, boxLabel: string, operator: string, openedAt: string,
): void {
  try {
    const hist = loadSessionHistory();
    const entry: SessionEntry = { id: sid, boxCode, boxLabel, operator, openedAt, closedAt: null, closeSignal: null, arqueo: null };
    const trimmed = [entry, ...hist].slice(0, MAX_RECORDS);
    localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
    localStorage.setItem(LS_CURRENT_SID, sid);
  } catch { /* quota */ }
}

export function recordSessionClose(
  sid: string, closedAt: string, closeSignal: CloseSignal, arqueo: ArqueoData,
): void {
  try {
    const hist = loadSessionHistory();
    const updated = hist.map(e =>
      e.id === sid ? { ...e, closedAt, closeSignal, arqueo } : e,
    );
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated));
    localStorage.removeItem(LS_CURRENT_SID);
  } catch { /* quota */ }
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(LS_CURRENT_SID);
}

export function recordSessionCorrection(
  sid: string,
  correction: CorrectionRecord,
  newSignal: CloseSignal,
): void {
  try {
    const hist = loadSessionHistory();
    const updated = hist.map(e =>
      e.id === sid ? { ...e, closeSignal: newSignal, correction } : e,
    );
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated));
  } catch { /* quota */ }
}
