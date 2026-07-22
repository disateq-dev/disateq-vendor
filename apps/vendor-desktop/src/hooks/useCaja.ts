import { useState, useCallback, useMemo, useRef } from "react";
import { usePreVentaStore } from "../domains/preventa/state/preventa.store";
import { definirCajasDeBloque, type TipoCaja } from "../domains/operator/blocks.store";
import type { Operador } from "../domains/operator/operator.store";
import type { SessionStats } from "../hooks/useSessionStats";
import {
  abrirSesionCajaEnSQLite,
  cerrarSesionCajaEnSQLite,
  registrarMovimientoCajaEnSQLite,
  actualizarMovimientoCajaEnSQLite,
} from '../domains/cash/sesion-caja-sqlite.service';
import type { EstadoArranque } from '../domains/cash/arranque-caja.service';

export type CashBoxType = TipoCaja;
export type MoveType             = "ingreso" | "egreso";
export type MoveSource           = "apertura" | "vendido" | "externo";
export type RegularizationStatus = "por_regularizar" | "regularizado" | "anulado";
export type RegularizationMode   = "reposicion" | "integracion_fondo";

export type CashMove = {
  id: string; type: MoveType; amount: number; motivo: string;
  observacion?: string; refId?: string;
  operator: string; cashBoxCode: string; terminal: string; timestamp: string;
  sourceType: MoveSource; fromApertura: number; fromVendido: number;
  regularizationStatus?: RegularizationStatus;
  regularizationMode?: RegularizationMode;
};

export type CashBox = {
  code: string; tipoCaja: TipoCaja; used: boolean; available: boolean;
};

export type CashSession = {
  isOpen: boolean; cashBox: CashBox | null;
  operator: string; operatorId?: string; terminal: string;
  openedAt: Date | null; apertura: number;
  motivo?: string; observacion?: string; refOp?: string;
};

const BOX_DEFS: { code: string; tipoCaja: CashBoxType }[] = definirCajasDeBloque().map(d => ({
  code: d.codigo,
  tipoCaja: d.tipoCaja,
}));
const TERMINAL = "PC-VENTAS01";

export const NULL_SESSION: CashSession = {
  isOpen: false, cashBox: null, operator: "", terminal: TERMINAL, openedAt: null, apertura: 0,
};

function blockOperatorFallback(ops: Operador[], boxCode: string): string {
  const prefix = boxCode[0];
  const op = ops.find(o => o.baseBloque !== null && String(o.baseBloque)[0] === prefix && o.estado === "ACTIVO");
  return op?.nombreCompleto ?? "Operador";
}

function deriveBoxes(usedCodes: Set<string>): CashBox[] {
  return BOX_DEFS.map(def => {
    const used = usedCodes.has(def.code);
    let available = false;
    if (!used) {
      if (def.tipoCaja === "PRINCIPAL") {
        available = true;
      } else if (def.tipoCaja === "AUXILIAR") {
        available = usedCodes.has(String(Number(def.code) - 1));
      } else if (def.tipoCaja === "EXCEPCIONAL") {
        available = !usedCodes.has(def.code[0] + "00");
      }
    }
    return { ...def, used, available };
  });
}

interface UseCajaDeps {
  addOpLog: (text: string) => void;
  addTurnEvent: (sk: string, type: import("../domains/cash/turn-events.store").TurnEventType, text: string) => void;
  resetStats: () => void;
  resetOpLogs: () => void;
  sessionStatsRef: React.RefObject<SessionStats>;
  activeOperatorRef: React.RefObject<Operador | null>;
  operatorsRef: React.RefObject<Operador[]>;
  setCobroOpen: (v: boolean) => void;
  setZone: (z: "search" | "ticket" | "cobro") => void;
  initialState: EstadoArranque;
}

export function useCaja({
  addOpLog, addTurnEvent,
  resetStats, resetOpLogs,
  sessionStatsRef,
  activeOperatorRef, operatorsRef,
  setCobroOpen, setZone,
  initialState,
}: UseCajaDeps) {
  const [cashSession, setCashSession] = useState<CashSession>(initialState.session);
  const cashSessionRef = useRef(cashSession);
  cashSessionRef.current = cashSession;

  const [usedCodes, setUsedCodes] = useState<Set<string>>(initialState.usedCodes);
  const cashBoxes = useMemo(() => deriveBoxes(usedCodes), [usedCodes]);

  const [cashMoves, setCashMoves] = useState<CashMove[]>(initialState.moves);
  const cashMovesRef = useRef(cashMoves);
  cashMovesRef.current = cashMoves;

  const addCashMove = useCallback((
    type: MoveType, amount: number, motivo: string,
    sourceType: MoveSource, fromApertura: number, fromVendido: number,
    observacion?: string, refId?: string,
    regularizationStatus?: RegularizationStatus,
    regularizationMode?: RegularizationMode,
  ): CashMove => {
    const s = cashSessionRef.current;
    const move: CashMove = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, amount, motivo,
      ...(observacion ? { observacion } : {}),
      ...(refId ? { refId } : {}),
      operator: s.operator, cashBoxCode: s.cashBox?.code ?? "",
      terminal: s.terminal, timestamp: new Date().toISOString(),
      sourceType, fromApertura, fromVendido,
      ...(regularizationStatus ? { regularizationStatus } : {}),
      ...(regularizationMode   ? { regularizationMode   } : {}),
    };
    setCashMoves(prev => [...prev, move]);
    const sk = s.cashBox && s.openedAt ? `${s.cashBox.code}-${s.openedAt.toISOString()}` : '';
    if (sk) {
      void registrarMovimientoCajaEnSQLite(
        sk, type, amount, motivo,
        observacion ?? null, refId ?? null,
        s.operator, s.cashBox?.code ?? '', s.terminal,
        sourceType, fromApertura, fromVendido,
        regularizationStatus ?? null, regularizationMode ?? null,
        move.timestamp,
      );
    }
    const verb   = refId ? "registró reposición" : type === "ingreso" ? "registró ingreso" : "registró egreso";
    const srcLbl = sourceType === "apertura" ? "fondo de cambio" : sourceType === "vendido" ? "caja del día" : "dinero prestado";
    const obs = observacion ? ` · ${observacion}` : "";
    const ref = refId ? ` [comp.${refId.slice(0, 8)}]` : "";
    addOpLog(`${s.operator} ${verb} S/ ${amount.toFixed(2)} [${srcLbl}] — ${motivo}${obs}${ref}`);
    if (s.cashBox && s.openedAt) {
      const sk      = `${s.cashBox.code}-${s.openedAt.toISOString()}`;
      const isFondo = sourceType === "apertura" || sourceType === "externo";
      const evType  = isFondo
        ? (type === "ingreso" ? "fondo_ingreso"     : "fondo_egreso")
        : (type === "ingreso" ? "movimiento_ingreso" : "movimiento_egreso");
      const srcLabel = sourceType === "apertura" ? "Fondo de cambio" : sourceType === "externo" ? "Préstamo al fondo" : "Caja del día";
      addTurnEvent(sk, evType, `${srcLabel} · ${motivo}`);
    }
    return move;
  }, [addOpLog, addTurnEvent]);

  const updateCashMove = useCallback((id: string, status: RegularizationStatus, mode?: RegularizationMode) => {
    const target = cashMovesRef.current.find(m => m.id === id);
    if (!target) return;
    const modeLabel = mode === "integracion_fondo" ? "integrado al fondo"
      : status === "anulado" ? "anulado" : "regularizado por reposición";
    const s = cashSessionRef.current;
    setCashMoves(prev => prev.map(m => m.id === id
      ? { ...m, regularizationStatus: status, ...(mode ? { regularizationMode: mode } : {}) }
      : m
    ));
    void actualizarMovimientoCajaEnSQLite(id, status, mode ?? null);
    addOpLog(`[REGULARIZACIÓN] ${s.operator} — CAJA ${s.cashBox?.code ?? "?"} — S/${target.amount.toFixed(2)} ${modeLabel}: ${target.motivo}`);
    if (s.cashBox && s.openedAt && (target.sourceType === "apertura" || target.sourceType === "externo")) {
      const sk     = `${s.cashBox.code}-${s.openedAt.toISOString()}`;
      const evType = mode === "integracion_fondo" ? "fondo_ingreso" : "fondo_egreso";
      const label  = mode === "integracion_fondo" ? "Préstamo integrado al fondo" : "Préstamo devuelto";
      addTurnEvent(sk, evType, `Fondo de cambio · ${label} · ${target.motivo}`);
    }
  }, [addOpLog, addTurnEvent]);

  const editCashMove = useCallback((id: string, motivo: string, observacion?: string) => {
    const target = cashMovesRef.current.find(m => m.id === id);
    if (!target) return;
    const s = cashSessionRef.current;
    setCashMoves(prev => prev.map(m => m.id === id
      ? { ...m, motivo, observacion: observacion || undefined }
      : m
    ));
    addOpLog(`[EDICIÓN] ${s.operator} — S/${target.amount.toFixed(2)}: ${motivo}`);
  }, [addOpLog]);

  const openCashSession = useCallback(async (
    boxCode: string, apertura: number, motivo?: string, refOp?: string,
    exceptionalSkipCodes?: string[],
  ): Promise<{ ok: boolean }> => {
    const box = cashBoxes.find(b => b.code === boxCode);
    if (!box) return { ok: false };
    const isExceptional = !!(exceptionalSkipCodes && exceptionalSkipCodes.length > 0);
    if (isExceptional ? box.used : !box.available) return { ok: false };
    const activeOp   = activeOperatorRef.current;
    const operator   = activeOp?.nombreCompleto ?? blockOperatorFallback(operatorsRef.current!, boxCode);
    const operatorId = activeOp?.id;
    const trimmedMotivo = motivo?.trim() || undefined;
    const trimmedRefOp  = refOp?.trim()  || undefined;
    const tag = isExceptional ? " [EXCEPCIONAL]" : "";
    const now = new Date();
    const sessionId = `${boxCode}-${now.toISOString()}`;
    const result = await abrirSesionCajaEnSQLite(
      sessionId,
      boxCode, box.tipoCaja, operator, operatorId ?? null, TERMINAL,
      apertura, trimmedMotivo ?? null, null, trimmedRefOp ?? null,
      now.toISOString(),
    );
    if (!result.ok) return { ok: false };
    resetStats();
    setCashMoves([]);
    resetOpLogs();
    if (isExceptional) {
      setUsedCodes(prev => {
        const next = new Set(prev);
        exceptionalSkipCodes!.forEach(c => next.add(c));
        return next;
      });
    }
    setCashSession({ isOpen: true, cashBox: box, operator, operatorId, terminal: TERMINAL, openedAt: now, apertura, motivo: trimmedMotivo, refOp: trimmedRefOp });
    const base  = `${operator} abrió CAJA ${boxCode}${tag} · fondo S/ ${apertura.toFixed(2)}`;
    const extra = [trimmedMotivo && `Motivo: ${trimmedMotivo}`, trimmedRefOp && `Ref: ${trimmedRefOp}`].filter(Boolean).join(" · ");
    addOpLog(extra ? `${base} — ${extra}` : base);
    addTurnEvent(sessionId, "apertura", `Apertura de turno · Caja ${boxCode}${tag}`);
    return { ok: true };
  }, [cashBoxes, addOpLog, addTurnEvent, resetStats, resetOpLogs]);

  const correctAperturaData = useCallback((
    newApertura: number, newMotivo?: string, newObservacion?: string, newRefOp?: string,
  ) => {
    const s = cashSessionRef.current;
    if (!s.isOpen) return;
    if (sessionStatsRef.current!.count > 0 || cashMovesRef.current.length > 0) return;
    const trimMotivo      = newMotivo?.trim()      || undefined;
    const trimObservacion = newObservacion?.trim() || undefined;
    const trimRefOp       = newRefOp?.trim()       || undefined;
    setCashSession(prev => ({ ...prev, apertura: newApertura, motivo: trimMotivo, observacion: trimObservacion, refOp: trimRefOp }));
    const parts = [`fondo S/ ${newApertura.toFixed(2)}`];
    if (trimMotivo)      parts.push(`motivo: ${trimMotivo}`);
    if (trimObservacion) parts.push(`obs: ${trimObservacion}`);
    if (trimRefOp)       parts.push(`ref: ${trimRefOp}`);
    addOpLog(`[CORRECCIÓN APERTURA] ${parts.join(' · ')}`);
  }, [addOpLog, sessionStatsRef]);

  const closeCashSession = useCallback(async (): Promise<{ ok: boolean }> => {
    const s = cashSessionRef.current;
    if (!s.isOpen || !s.cashBox) return { ok: false };
    const code = s.cashBox.code;
    const sk = s.openedAt ? `${code}-${s.openedAt.toISOString()}` : "";
    const result = await cerrarSesionCajaEnSQLite(sk, new Date().toISOString(), 'ok');
    if (!result.ok) return { ok: false };
    setCobroOpen(false);
    setZone("search");
    usePreVentaStore.getState().limpiarPreVenta();
    resetStats();
    setCashMoves([]);
    const op = s.operator;
    addTurnEvent(sk, "cierre", `Cierre de turno · Caja ${code}`);
    setUsedCodes(prev => { const next = new Set(prev); next.add(code); return next; });
    setCashSession({ isOpen: false, cashBox: null, operator: "", operatorId: undefined, terminal: TERMINAL, openedAt: null, apertura: 0 });
    addOpLog(`${op} cerró CAJA ${code}`);
    return { ok: true };
  }, [addOpLog, addTurnEvent, resetStats, setCobroOpen, setZone]);

  return {
    cashSession, cashSessionRef,
    cashBoxes,
    cashMoves, cashMovesRef,
    addCashMove, updateCashMove, editCashMove,
    openCashSession, closeCashSession, correctAperturaData,
  };
}
