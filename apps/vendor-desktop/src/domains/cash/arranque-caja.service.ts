import { invoke } from "@tauri-apps/api/core";
import type { CashSession, CashMove, CashBoxType } from "../../hooks/useCaja";
import { NULL_SESSION } from "../../hooks/useCaja";
import { NULL_STATS, type SessionStats } from "../../hooks/useSessionStats";
import { logError } from "../logging/error-logger";
import type { TurnEvent } from "../cash/turn-events.store";

type RawSesion = {
  id: string;
  caja_codigo: string;
  caja_tipo: string;
  operador_nombre: string;
  operador_id: string | null;
  terminal: string;
  apertura: number;
  motivo: string | null;
  observacion: string | null;
  ref_op: string | null;
  abierta_en: string;
};

type RawMovimiento = {
  id: string;
  tipo: string;
  monto: number;
  motivo: string;
  observacion: string | null;
  ref_id: string | null;
  operador_nombre: string;
  caja_codigo: string;
  terminal: string;
  source_type: string;
  from_apertura: number;
  from_vendido: number;
  regularization_status: string | null;
  regularization_mode: string | null;
  timestamp: string;
};

type RawEventoTurno = {
  sesion_id: string;
  tipo:      string;
  texto:     string;
  ts:        string;
};

type RawVenta = {
  total: number;
  metodo_pago: string;
  tipo_comprobante: string;
};

type RawEstadoArranque = {
  sesion: RawSesion | null;
  movimientos: RawMovimiento[];
  cajasUsadasHoy: string[];
  ventas: RawVenta[];
  eventos: RawEventoTurno[];
};

export type EstadoArranque = {
  session: CashSession;
  moves: CashMove[];
  usedCodes: Set<string>;
  stats: SessionStats;
  events: TurnEvent[];
};

function mapEventoTurno(r: RawEventoTurno, sessionKey: string): TurnEvent {
  return {
    id:         `arranque-${r.ts}-${Math.random().toString(36).slice(2, 6)}`,
    sessionKey,
    ts:         r.ts,
    type:       r.tipo as TurnEvent["type"],
    text:       r.texto,
  };
}

function mapMovimiento(r: RawMovimiento): CashMove {
  return {
    id:               r.id,
    type:             r.tipo as CashMove["type"],
    amount:           r.monto,
    motivo:           r.motivo,
    observacion:      r.observacion ?? undefined,
    refId:            r.ref_id ?? undefined,
    operator:         r.operador_nombre,
    cashBoxCode:      r.caja_codigo.replace(/^'|'$/g, ""),
    terminal:         r.terminal,
    timestamp:        r.timestamp,
    sourceType:       r.source_type as CashMove["sourceType"],
    fromApertura:     r.from_apertura,
    fromVendido:      r.from_vendido,
    regularizationStatus: r.regularization_status as CashMove["regularizationStatus"] ?? undefined,
    regularizationMode:   r.regularization_mode as CashMove["regularizationMode"] ?? undefined,
  };
}

function reconstruirStats(ventas: RawVenta[]): SessionStats {
  let count = 0, total = 0, cash = 0, yape = 0, tarjeta = 0;
  let efe = 0, yap = 0, tar = 0, mix = 0;
  for (const v of ventas) {
    count++;
    total += v.total;
    if (v.metodo_pago === "efectivo") { cash += v.total; efe++; }
    else if (v.metodo_pago === "yape") { yape += v.total; yap++; }
    else if (v.metodo_pago === "tarjeta") { tarjeta += v.total; tar++; }
    else if (v.metodo_pago === "mixto") { cash += v.total; mix++; }
  }
  return {
    count, total,
    cash:    Math.round(cash    * 100) / 100,
    yape:    Math.round(yape    * 100) / 100,
    tarjeta: Math.round(tarjeta * 100) / 100,
    docRanges: {},
    byMethod: { efe, yap, tar, mix },
  };
}

const LS_KEYS_OBSOLETAS = [
  "disateq.pos.cashSession",
  "disateq.pos.usedCodes",
  "disateq.pos.usedDate",
  "disateq.pos.cashMoves",
  "disateq.pos.sessionStats",
  "disateq.pos.correlatives",
];

function limpiarKeysObsoletas(): void {
  try {
    for (const key of LS_KEYS_OBSOLETAS) {
      localStorage.removeItem(key);
    }
  } catch { /* quota o acceso denegado — ignorar */ }
}

export async function obtenerEstadoArranque(): Promise<EstadoArranque> {
  try {
    limpiarKeysObsoletas();
    const raw = await invoke<RawEstadoArranque>("obtener_estado_arranque");

    if (!raw.sesion) {
      return {
        session:   NULL_SESSION,
        moves:     [],
        usedCodes: new Set(raw.cajasUsadasHoy.map(c => c.replace(/^'|'$/g, ""))),
        stats:     NULL_STATS,
        events:    [],
      };
    }

    const s = raw.sesion;
    const cajaCode = s.caja_codigo.replace(/^'|'$/g, "");

    const cashBox = {
      code:     cajaCode,
      tipoCaja: s.caja_tipo as CashBoxType,
      used:     false,
      available: false,
    };

    const session: CashSession = {
      isOpen:     true,
      cashBox,
      operator:   s.operador_nombre,
      operatorId: s.operador_id ?? undefined,
      terminal:   s.terminal,
      openedAt:   new Date(s.abierta_en),
      apertura:   s.apertura,
      motivo:     s.motivo ?? undefined,
      observacion: s.observacion ?? undefined,
      refOp:      s.ref_op ?? undefined,
    };

    const usedCodes = new Set([
      ...raw.cajasUsadasHoy.map(c => c.replace(/^'|'$/g, "")),
      cajaCode,
    ]);

    return {
      session,
      moves:     raw.movimientos.map(mapMovimiento),
      usedCodes,
      stats:     reconstruirStats(raw.ventas),
      events:    raw.eventos.map(e => mapEventoTurno(e, `${cajaCode}-${s.abierta_en}`)),
    };
  } catch (err) {
    await logError("arranque-caja", "No se pudo obtener el estado de arranque desde SQLite");
    return {
      session:   NULL_SESSION,
      moves:     [],
      usedCodes: new Set(),
      stats:     NULL_STATS,
      events:    [],
    };
  }
}
