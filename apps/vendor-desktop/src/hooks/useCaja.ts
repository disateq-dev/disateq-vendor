import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePreVentaStore } from "../domains/preventa/state/preventa.store";
import { blockBoxDefs } from "../domains/operator/blocks.store";
import type { Operador } from "../domains/operator/operator.store";
import { NULL_STATS, type SessionStats, type DocRange, type ByMethod } from "../hooks/useSessionStats";

export type CashBoxType = "normal" | "contingency-1" | "contingency-2" | "contingencia";
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
  code: string; type: CashBoxType; used: boolean; available: boolean;
};

export type CashSession = {
  isOpen: boolean; cashBox: CashBox | null;
  operator: string; operatorId?: string; terminal: string;
  openedAt: Date | null; apertura: number;
  motivo?: string; observacion?: string; refOp?: string;
};

const BOX_DEFS = blockBoxDefs() as { code: string; type: CashBoxType }[];
const TERMINAL = "PC-VENTAS01";

const LS_SESSION   = "disateq.pos.cashSession";
const LS_USED      = "disateq.pos.usedCodes";
const LS_USED_DATE = "disateq.pos.usedDate";
const LS_MOVES     = "disateq.pos.cashMoves";

export const NULL_SESSION: CashSession = {
  isOpen: false, cashBox: null, operator: "", terminal: TERMINAL, openedAt: null, apertura: 0,
};

function blockOperatorFallback(ops: Operador[], boxCode: string): string {
  const prefix = boxCode[0];
  const op = ops.find(o => o.baseBloque !== null && String(o.baseBloque)[0] === prefix && o.estado === "ACTIVO");
  return op?.nombreCompleto ?? "Operador";
}

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function loadSession(): CashSession {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return NULL_SESSION;
    const p = JSON.parse(raw) as Partial<CashSession> & { openedAt?: unknown; cashBox?: unknown };
    return {
      isOpen:      typeof p.isOpen      === "boolean" ? p.isOpen      : false,
      cashBox:     (p.cashBox && typeof (p.cashBox as CashBox).code === "string") ? p.cashBox as CashBox : null,
      operator:    typeof p.operator    === "string"  ? p.operator    : "",
      operatorId:  typeof p.operatorId  === "string"  ? p.operatorId  : undefined,
      terminal:    typeof p.terminal    === "string"  ? p.terminal    : TERMINAL,
      openedAt:    safeDate(p.openedAt),
      apertura:    typeof p.apertura    === "number"  ? p.apertura    : 0,
      motivo:      typeof p.motivo      === "string"  ? p.motivo      : undefined,
      observacion: typeof p.observacion === "string"  ? p.observacion : undefined,
      refOp:       typeof p.refOp       === "string"  ? p.refOp       : undefined,
    };
  } catch { return NULL_SESSION; }
}

function loadUsedCodes(): Set<string> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LS_USED_DATE) !== today) {
      localStorage.removeItem(LS_USED);
      localStorage.setItem(LS_USED_DATE, today);
      return new Set();
    }
    const raw = localStorage.getItem(LS_USED);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((v: unknown) => typeof v === "string")) : new Set();
  } catch { return new Set(); }
}

function saveSession(s: CashSession): void {
  try { localStorage.setItem(LS_SESSION, JSON.stringify(s)); } catch { /* quota */ }
}

function saveUsedCodes(codes: Set<string>): void {
  try { localStorage.setItem(LS_USED, JSON.stringify([...codes])); } catch { /* quota */ }
}

function loadMoves(): CashMove[] {
  try {
    const raw = localStorage.getItem(LS_MOVES);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((m: unknown): m is CashMove => {
      if (!m || typeof m !== "object") return false;
      const o = m as Record<string, unknown>;
      return typeof o.id === "string" && typeof o.type === "string"
          && typeof o.amount === "number" && typeof o.motivo === "string";
    });
  } catch { return []; }
}

function saveMoves(moves: CashMove[]): void {
  try { localStorage.setItem(LS_MOVES, JSON.stringify(moves)); } catch { /* quota */ }
}

function deriveBoxes(usedCodes: Set<string>): CashBox[] {
  return BOX_DEFS.map(def => {
    const used = usedCodes.has(def.code);
    let available = false;
    if (!used) {
      if (def.type === "normal") {
        available = true;
      } else if (def.type === "contingency-1") {
        available = usedCodes.has(def.code.slice(0, 2) + "0");
      } else if (def.type === "contingency-2") {
        available = usedCodes.has(def.code.slice(0, 2) + "1");
      } else if (def.type === "contingencia") {
        available = !usedCodes.has(def.code[0] + "00");
      }
    }
    return { ...def, used, available };
  });
}

type RecoveredState = {
  session: CashSession; usedCodes: Set<string>;
  stats: SessionStats; moves: CashMove[]; recoveryLog: string | null;
};

export function recoverOperationalState(): RecoveredState {
  const session = loadSession();
  const codes   = loadUsedCodes();
  const moves   = loadMoves();

  const stats = (() => {
    try {
      const raw = localStorage.getItem("disateq.pos.sessionStats");
      if (!raw) return NULL_STATS;
      const p = JSON.parse(raw) as Partial<SessionStats>;
      const ranges: Partial<Record<string, DocRange>> = {};
      if (p.docRanges && typeof p.docRanges === "object") {
        for (const [k, v] of Object.entries(p.docRanges)) {
          if (v && typeof v.series === "string" && typeof v.first === "number"
              && typeof v.last === "number" && typeof v.count === "number") {
            ranges[k] = v as DocRange;
          }
        }
      }
      const bm = (p.byMethod && typeof p.byMethod === "object") ? p.byMethod as Partial<ByMethod> : {};
      return {
        count:   typeof p.count   === "number" ? p.count   : 0,
        total:   typeof p.total   === "number" ? p.total   : 0,
        cash:    typeof p.cash    === "number" ? p.cash    : 0,
        yape:    typeof p.yape    === "number" ? p.yape    : 0,
        tarjeta: typeof p.tarjeta === "number" ? p.tarjeta : 0,
        docRanges: ranges,
        byMethod: {
          efe: typeof bm.efe === "number" ? bm.efe : 0,
          yap: typeof bm.yap === "number" ? bm.yap : 0,
          tar: typeof bm.tar === "number" ? bm.tar : 0,
          mix: typeof bm.mix === "number" ? bm.mix : 0,
        },
      };
    } catch { return NULL_STATS; }
  })();

  if (session.isOpen && (!session.cashBox || !BOX_DEFS.some(d => d.code === session.cashBox!.code) || !session.openedAt)) {
    try {
      localStorage.setItem(LS_SESSION, JSON.stringify(NULL_SESSION));
      localStorage.removeItem("disateq.pos.sessionStats");
      localStorage.removeItem(LS_MOVES);
    } catch { /* ignore */ }
    return { session: NULL_SESSION, usedCodes: codes, stats: NULL_STATS, moves: [], recoveryLog: "Sesión inválida detectada — se cerró automáticamente" };
  }

  let resolvedStats = stats;
  if (!session.isOpen && stats.count > 0) {
    resolvedStats = NULL_STATS;
    try { localStorage.removeItem("disateq.pos.sessionStats"); } catch { /* ignore */ }
  }

  let resolvedMoves = moves;
  if (!session.isOpen && moves.length > 0) {
    resolvedMoves = [];
    try { localStorage.removeItem(LS_MOVES); } catch { /* ignore */ }
  }

  let resolvedCodes = codes;
  let recoveryLog: string | null = null;
  if (session.isOpen && session.cashBox && session.cashBox.type !== "normal") {
    const box    = session.cashBox;
    const prereq = box.type === "contingency-1" ? box.code.slice(0, 2) + "0"
                 : box.type === "contingency-2" ? box.code.slice(0, 2) + "1"
                 : box.code[0] + "00";
    if (!codes.has(prereq)) {
      const next = new Set(codes);
      next.add(prereq);
      resolvedCodes = next;
      try { localStorage.setItem(LS_USED, JSON.stringify([...next])); } catch { /* ignore */ }
      recoveryLog = `Prereq CAJA ${prereq} restaurado para contingencia activa CAJA ${box.code}`;
    }
  }

  return { session, usedCodes: resolvedCodes, stats: resolvedStats, moves: resolvedMoves, recoveryLog };
}

interface UseCajaDeps {
  addOpLog: (text: string) => void;
  addTurnEvent: (sk: string, type: string, text: string) => void;
  resetStats: () => void;
  resetOpLogs: () => void;
  sessionStatsRef: React.RefObject<SessionStats>;
  activeOperatorRef: React.RefObject<Operador | null>;
  operatorsRef: React.RefObject<Operador[]>;
  setCobroOpen: (v: boolean) => void;
  setZone: (z: "search" | "ticket" | "cobro") => void;
  initialMoves: CashMove[];
  initialSession: CashSession;
  initialUsedCodes: Set<string>;
}

export function useCaja({
  addOpLog, addTurnEvent,
  resetStats, resetOpLogs,
  sessionStatsRef,
  activeOperatorRef, operatorsRef,
  setCobroOpen, setZone,
  initialMoves, initialSession, initialUsedCodes,
}: UseCajaDeps) {
  const [cashSession, setCashSession] = useState<CashSession>(initialSession);
  useEffect(() => { saveSession(cashSession); }, [cashSession]);

  const cashSessionRef = useRef(cashSession);
  cashSessionRef.current = cashSession;

  const [usedCodes, setUsedCodes] = useState<Set<string>>(initialUsedCodes);
  useEffect(() => { saveUsedCodes(usedCodes); }, [usedCodes]);

  const cashBoxes = useMemo(() => deriveBoxes(usedCodes), [usedCodes]);

  const [cashMoves, setCashMoves] = useState<CashMove[]>(initialMoves);
  useEffect(() => { saveMoves(cashMoves); }, [cashMoves]);

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

  const openCashSession = useCallback((
    boxCode: string, apertura: number, motivo?: string, refOp?: string,
    exceptionalSkipCodes?: string[],
  ) => {
    const box = cashBoxes.find(b => b.code === boxCode);
    if (!box) return;
    const isExceptional = !!(exceptionalSkipCodes && exceptionalSkipCodes.length > 0);
    if (isExceptional ? box.used : !box.available) return;
    const activeOp   = activeOperatorRef.current;
    const operator   = activeOp?.nombreCompleto ?? blockOperatorFallback(operatorsRef.current!, boxCode);
    const operatorId = activeOp?.id;
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
    const trimmedMotivo = motivo?.trim() || undefined;
    const trimmedRefOp  = refOp?.trim()  || undefined;
    const tag = isExceptional ? " [EXCEPCIONAL]" : "";
    const now = new Date();
    setCashSession({ isOpen: true, cashBox: box, operator, operatorId, terminal: TERMINAL, openedAt: now, apertura, motivo: trimmedMotivo, refOp: trimmedRefOp });
    const base  = `${operator} abrió CAJA ${boxCode}${tag} · fondo S/ ${apertura.toFixed(2)}`;
    const extra = [trimmedMotivo && `Motivo: ${trimmedMotivo}`, trimmedRefOp && `Ref: ${trimmedRefOp}`].filter(Boolean).join(" · ");
    addOpLog(extra ? `${base} — ${extra}` : base);
    addTurnEvent(`${boxCode}-${now.toISOString()}`, "apertura", `Apertura de turno · Caja ${boxCode}${tag}`);
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

  const closeCashSession = useCallback(() => {
    const s = cashSessionRef.current;
    if (!s.isOpen || !s.cashBox) return;
    const code = s.cashBox.code;
    setCobroOpen(false);
    setZone("search");
    usePreVentaStore.getState().limpiarPreVenta();
    resetStats();
    setCashMoves([]);
    const op = s.operator;
    const sk = s.openedAt ? `${code}-${s.openedAt.toISOString()}` : "";
    addTurnEvent(sk, "cierre", `Cierre de turno · Caja ${code}`);
    setUsedCodes(prev => { const next = new Set(prev); next.add(code); return next; });
    setCashSession({ isOpen: false, cashBox: null, operator: "", operatorId: undefined, terminal: TERMINAL, openedAt: null, apertura: 0 });
    addOpLog(`${op} cerró CAJA ${code}`);
  }, [addOpLog, addTurnEvent, resetStats, setCobroOpen, setZone]);

  return {
    cashSession, cashSessionRef,
    cashBoxes,
    cashMoves, cashMovesRef,
    addCashMove, updateCashMove, editCashMove,
    openCashSession, closeCashSession, correctAperturaData,
  };
}
