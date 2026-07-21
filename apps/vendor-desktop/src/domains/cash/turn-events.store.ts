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
