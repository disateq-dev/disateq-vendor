import type { ArqueoData } from "../../../print/printTicket";
import {
  obtenerHistorialSesionesSQLite,
  obtenerSesionActivaSQLite,
  actualizarSesionCajaCorrection,
  type SesionCajaRow,
} from "../../../domains/cash/sesion-caja-sqlite.service";

export { actualizarSesionCajaCorrection };

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

function parseArqueo(row: SesionCajaRow): ArqueoData | null {
  if (row.arqueo_json === null) return null;
  try {
    return JSON.parse(row.arqueo_json) as ArqueoData;
  } catch {
    return null;
  }
}

function parseCorrection(row: SesionCajaRow): CorrectionRecord | undefined {
  if (row.correction_json === null) return undefined;
  try {
    return JSON.parse(row.correction_json) as CorrectionRecord;
  } catch {
    return undefined;
  }
}

function mapSesionCajaRow(row: SesionCajaRow): SessionEntry {
  const correction = parseCorrection(row);
  return {
    id: row.id,
    boxCode: row.caja_codigo,
    boxLabel: `CAJA ${row.caja_tipo}`,
    operator: row.operador_nombre,
    openedAt: row.abierta_en,
    closedAt: row.cerrada_en ?? null,
    closeSignal: row.close_signal as CloseSignal | null,
    apertura: row.apertura,
    arqueo: parseArqueo(row),
    ...(correction ? { correction } : {}),
  };
}

export async function loadSessionHistory(): Promise<SessionEntry[]> {
  try {
    const rows = await obtenerHistorialSesionesSQLite(60);
    return rows.map(mapSesionCajaRow);
  } catch {
    return [];
  }
}

export async function getCurrentSessionId(): Promise<string | null> {
  try {
    const sesion = await obtenerSesionActivaSQLite();
    return sesion !== null ? sesion.id : null;
  } catch {
    return null;
  }
}

export async function recordSessionOpen(
  sid: string, boxCode: string, boxLabel: string,
  operator: string, openedAt: string, apertura: number,
): Promise<void> {
  void sid;
  void boxCode;
  void boxLabel;
  void operator;
  void openedAt;
  void apertura;
}

export async function recordSessionClose(
  sid: string, closedAt: string, closeSignal: CloseSignal, arqueo: ArqueoData,
): Promise<void> {
  void sid;
  void closedAt;
  void closeSignal;
  void arqueo;
}

export async function recordSessionCorrection(
  sid: string,
  correction: CorrectionRecord,
  newSignal: CloseSignal,
): Promise<void> {
  try {
    await actualizarSesionCajaCorrection(sid, newSignal, JSON.stringify(correction), null);
  } catch {
  }
}

export async function recordAperturaCorrection(
  sid: string,
  correction: CorrectionRecord,
): Promise<void> {
  try {
    await actualizarSesionCajaCorrection(sid, correction.newSignal, JSON.stringify(correction), null);
  } catch {
  }
}
