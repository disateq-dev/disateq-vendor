import type { ArqueoData } from "../../../print/printTicket";

const LS_HISTORY     = "disateq.pos.sessionHistory";
const LS_CURRENT_SID = "disateq.pos.currentSessionId";
const MAX_RECORDS    = 50;

export type CloseSignal = "ok" | "warn";

export type CorrectionAccion =
  | "regularizar_cierre"
  | "cierre_extemporaneo"
  | "documentar_diferencia"
  | "correccion_apertura";

export type CorrectionRecord = {
  correctedBy:      string;
  correctedAt:      string;
  motivo:           string;
  accion:           CorrectionAccion;
  prevSignal:       CloseSignal | null;
  newSignal:        CloseSignal;
  fechaOperacional?: string;
  prevApertura?:    number;
  newApertura?:     number;
  prevContado?: { efe: number; yape: number; tar: number; total: number };
  newContado?:  { efe: number; yape: number; tar: number; total: number };
  newDiferencia?: number;
};

export type SessionEntry = {
  id:          string;
  boxCode:     string;
  boxLabel:    string;
  operator:    string;
  openedAt:    string;
  closedAt:    string | null;
  closeSignal: CloseSignal | null;
  apertura:    number;
  arqueo:      ArqueoData | null;
  correction?: CorrectionRecord;
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
      apertura:    e.apertura    ?? 0,
      arqueo:      e.arqueo      ?? null,
      ...(e.correction ? { correction: e.correction } : {}),
    }));
  } catch { return []; }
}

export function recordSessionOpen(
  sid: string, boxCode: string, boxLabel: string,
  operator: string, openedAt: string, apertura: number,
): void {
  try {
    const hist = loadSessionHistory();
    const entry: SessionEntry = {
      id: sid, boxCode, boxLabel, operator, openedAt,
      closedAt: null, closeSignal: null, apertura, arqueo: null,
    };
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

// Rectificación de cierre — actualiza closeSignal y registra corrección
export function recordSessionCorrection(
  sid: string,
  correction: CorrectionRecord,
  newSignal: CloseSignal,
): void {
  try {
    const hist = loadSessionHistory();
    const updated = hist.map(e => {
      if (e.id !== sid) return e;
      const arqueo = (e.arqueo && correction.newContado)
        ? {
            ...e.arqueo,
            contadoEfe:   correction.newContado.efe,
            contadoYape:  correction.newContado.yape,
            contadoTar:   correction.newContado.tar,
            contadoTotal: correction.newContado.total,
            diferencia:   correction.newDiferencia ?? e.arqueo.diferencia,
          }
        : e.arqueo;
      return { ...e, closeSignal: newSignal, arqueo, correction };
    });
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated));
  } catch { /* quota */ }
}

// Rectificación de apertura — actualiza el fondo de apertura sin cambiar closeSignal
export function recordAperturaCorrection(
  sid: string,
  correction: CorrectionRecord,
): void {
  try {
    const hist = loadSessionHistory();
    const updated = hist.map(e => {
      if (e.id !== sid) return e;
      return {
        ...e,
        apertura:   correction.newApertura ?? e.apertura,
        correction,
      };
    });
    localStorage.setItem(LS_HISTORY, JSON.stringify(updated));
  } catch { /* quota */ }
}
