export type TurnEventType =
  | "apertura"
  | "movimiento_ingreso"
  | "movimiento_egreso"
  | "fondo_ingreso"
  | "fondo_egreso"
  | "comprobante"
  | "anulacion"
  | "cierre";

export type TurnEvent = {
  id:         string;
  sessionKey: string;   // "{boxCode}-{openedAt.toISOString()}" — trazabilidad por turno
  ts:         string;   // ISO timestamp del suceso
  type:       TurnEventType;
  text:       string;
};

const LS_KEY = "disateq.pos.turnEvents";

export function loadTurnEvents(): TurnEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(e =>
      typeof e.id         === "string" &&
      typeof e.sessionKey === "string" &&
      typeof e.ts         === "string" &&
      typeof e.type       === "string" &&
      typeof e.text       === "string"
    ) as TurnEvent[];
  } catch { return []; }
}

export function saveTurnEvents(events: TurnEvent[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(events)); } catch {}
}
