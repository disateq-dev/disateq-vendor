import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTicketStore } from "../domains/ticket/state/ticket.store";
import { type Rubro, type VisualMode, type PrintFlow } from "../data/catalogs";
import { moneySub } from "../lib/money";
import type { Comprobante, ComprobanteLineItem } from "../domains/comprobantes/types/comprobante.types";
import { type OperatorRecord, loadOperators, checkPin, changePin, setOperatorPin, saveOperators } from "../domains/operator/operator.store";

type FocusZone = "search" | "ticket" | "cobro";

export type CashBoxType = "normal" | "contingency-1" | "contingency-2";

export type MoveType             = "ingreso" | "egreso";
export type MoveSource           = "apertura" | "vendido" | "mixto";
export type RegularizationStatus = "por_regularizar" | "regularizado";
export type RegularizationMode   = "reposicion" | "integracion_fondo";

export type CashMove = {
  id: string;
  type: MoveType;
  amount: number;
  motivo: string;
  observacion?: string;
  refId?: string;
  operator: string;
  cashBoxCode: string;
  terminal: string;
  timestamp: string;
  sourceType:            MoveSource;
  fromApertura:          number;
  fromVendido:           number;
  regularizationStatus?: RegularizationStatus;
  regularizationMode?:   RegularizationMode;
};

export type CashBox = {
  code: string;
  type: CashBoxType;
  used: boolean;
  available: boolean;
};

export type CashSession = {
  isOpen: boolean;
  cashBox: CashBox | null;
  operator: string;
  terminal: string;
  openedAt: Date | null;
  apertura: number;
  motivo?: string;
  observacion?: string;
  refOp?: string;
};

export type OpLog = { id: string; ts: string; text: string };

const BOX_DEFS: { code: string; type: CashBoxType }[] = [
  { code: "100", type: "normal" },
  { code: "101", type: "contingency-1" },
  { code: "102", type: "contingency-2" },
  { code: "200", type: "normal" },
  { code: "201", type: "contingency-1" },
  { code: "202", type: "contingency-2" },
  { code: "300", type: "normal" },
  { code: "301", type: "contingency-1" },
  { code: "302", type: "contingency-2" },
  { code: "500", type: "normal" },
  { code: "501", type: "contingency-1" },
  { code: "502", type: "contingency-2" },
];

const TERMINAL = "PC-VENTAS01";

const BLOCK_OPERATORS: Record<string, string> = {
  "1": "Ricardo Aguinaga",
  "2": "Lucía Rebaza",
  "3": "Administrador",
  "5": "Supervisor",
};

// ── localStorage keys ──────────────────────────────────────────
const LS_SESSION      = "disateq.pos.cashSession";
const LS_USED         = "disateq.pos.usedCodes";
const LS_USED_DATE    = "disateq.pos.usedDate";
const LS_MOVES        = "disateq.pos.cashMoves";
const LS_SESSION_STATS = "disateq.pos.sessionStats";
const LS_OPLOGS        = "disateq.pos.opLogs";
const LS_COMPROBANTES  = "disateq.pos.comprobantes";
const LS_CORRELATIVES  = "disateq.pos.correlatives";
const LS_RUBRO         = "disateq.pos.rubro";
const LS_VISUAL_MODE  = "disateq.pos.visualMode";
const LS_PRINT_FLOW   = "disateq.pos.printFlow";

function loadComprobantes(): Comprobante[] {
  try {
    const raw = localStorage.getItem(LS_COMPROBANTES);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveComprobantes(list: Comprobante[]): void {
  try { localStorage.setItem(LS_COMPROBANTES, JSON.stringify(list)); } catch { /* quota */ }
}

// Correlativos: persisten entre sesiones — única fuente de verdad para numeración
export type DocCorrelatives = Partial<Record<string, number>>;

function loadCorrelatives(): DocCorrelatives {
  try {
    const raw = localStorage.getItem(LS_CORRELATIVES);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return (p && typeof p === "object" && !Array.isArray(p)) ? p as DocCorrelatives : {};
  } catch { return {}; }
}

function saveCorrelatives(c: DocCorrelatives): void {
  try { localStorage.setItem(LS_CORRELATIVES, JSON.stringify(c)); } catch { /* quota */ }
}

function loadRubro(): Rubro {
  const raw = localStorage.getItem(LS_RUBRO);
  if (raw === "abarrotes" || raw === "food-fast" || raw === "panaderia" || raw === "farmacia") return raw;
  return "panaderia";
}

function loadVisualMode(): VisualMode {
  const raw = localStorage.getItem(LS_VISUAL_MODE);
  if (raw === "lista" || raw === "visual" || raw === "mixto") return raw;
  return "visual";
}

function loadPrintFlow(): PrintFlow {
  const raw = localStorage.getItem(LS_PRINT_FLOW);
  if (
    raw === "solo-comprobante"     || raw === "comprobante-despacho" ||
    raw === "comprobante-comanda"  || raw === "comprobante-precuenta" ||
    raw === "comprobante-turno"    || raw === "comprobante-embarque"
  ) return raw as PrintFlow;
  return "comprobante-despacho";
}

const NULL_SESSION: CashSession = {
  isOpen: false,
  cashBox: null,
  operator: "",
  terminal: TERMINAL,
  openedAt: null,
  apertura: 0,
};

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
      isOpen:    typeof p.isOpen === "boolean" ? p.isOpen : false,
      cashBox:   (p.cashBox && typeof (p.cashBox as CashBox).code === "string") ? p.cashBox as CashBox : null,
      operator:  typeof p.operator === "string" ? p.operator : "",
      terminal:  typeof p.terminal === "string" ? p.terminal : TERMINAL,
      openedAt:  safeDate(p.openedAt),
      apertura:    typeof p.apertura    === "number" ? p.apertura    : 0,
      motivo:      typeof p.motivo      === "string" ? p.motivo      : undefined,
      observacion: typeof p.observacion === "string" ? p.observacion : undefined,
      refOp:       typeof p.refOp       === "string" ? p.refOp       : undefined,
    };
  } catch {
    return NULL_SESSION;
  }
}

function loadUsedCodes(): Set<string> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(LS_USED_DATE) !== today) {
      // New operational day — reset daily cycle
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
  try { localStorage.setItem(LS_SESSION, JSON.stringify(s)); } catch { /* quota or disabled */ }
}

function saveUsedCodes(codes: Set<string>): void {
  try { localStorage.setItem(LS_USED, JSON.stringify([...codes])); } catch { /* quota or disabled */ }
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
  try { localStorage.setItem(LS_MOVES, JSON.stringify(moves)); } catch { /* quota or disabled */ }
}

// ── derivation ─────────────────────────────────────────────────
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
      }
    }
    return { ...def, used, available };
  });
}

function loadOpLogs(): OpLog[] {
  try {
    const raw = localStorage.getItem(LS_OPLOGS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveOpLogs(logs: OpLog[]): void {
  try { localStorage.setItem(LS_OPLOGS, JSON.stringify(logs)); } catch { /* quota or disabled */ }
}

// ── session stats ───────────────────────────────────────────────
export type DocRange  = { series: string; first: number; last: number; count: number };
export type ByMethod = { efe: number; yap: number; tar: number; mix: number };
export type SessionStats = {
  count: number; total: number; cash: number; yape: number; tarjeta: number;
  docRanges: Partial<Record<string, DocRange>>;
  byMethod: ByMethod;
};
const NULL_STATS: SessionStats = {
  count: 0, total: 0, cash: 0, yape: 0, tarjeta: 0, docRanges: {},
  byMethod: { efe: 0, yap: 0, tar: 0, mix: 0 },
};

function loadSessionStats(): SessionStats {
  try {
    const raw = localStorage.getItem(LS_SESSION_STATS);
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
      count:     typeof p.count    === "number" ? p.count    : 0,
      total:     typeof p.total    === "number" ? p.total    : 0,
      cash:      typeof p.cash     === "number" ? p.cash     : 0,
      yape:      typeof p.yape     === "number" ? p.yape     : 0,
      tarjeta:   typeof p.tarjeta  === "number" ? p.tarjeta  : 0,
      docRanges: ranges,
      byMethod: {
        efe: typeof bm.efe === "number" ? bm.efe : 0,
        yap: typeof bm.yap === "number" ? bm.yap : 0,
        tar: typeof bm.tar === "number" ? bm.tar : 0,
        mix: typeof bm.mix === "number" ? bm.mix : 0,
      },
    };
  } catch { return NULL_STATS; }
}

function saveSessionStats(s: SessionStats): void {
  try { localStorage.setItem(LS_SESSION_STATS, JSON.stringify(s)); } catch { /* quota */ }
}

// ── startup recovery ────────────────────────────────────────────

type RecoveredState = {
  session:     CashSession;
  usedCodes:   Set<string>;
  stats:       SessionStats;
  moves:       CashMove[];
  recoveryLog: string | null;
};

function recoverOperationalState(): RecoveredState {
  const session = loadSession();
  const codes   = loadUsedCodes();
  const stats   = loadSessionStats();
  const moves   = loadMoves();

  // Guard 1: session open but box invalid or openedAt missing
  if (session.isOpen && (!session.cashBox || !BOX_DEFS.some(d => d.code === session.cashBox!.code) || !session.openedAt)) {
    try {
      localStorage.setItem(LS_SESSION, JSON.stringify(NULL_SESSION));
      localStorage.removeItem(LS_SESSION_STATS);
      localStorage.removeItem(LS_MOVES);
    } catch { /* ignore */ }
    return {
      session: NULL_SESSION, usedCodes: codes, stats: NULL_STATS, moves: [],
      recoveryLog: "Sesión inválida detectada — se cerró automáticamente",
    };
  }

  // Guard 2: session closed but stale stats remain
  let resolvedStats = stats;
  if (!session.isOpen && stats.count > 0) {
    resolvedStats = NULL_STATS;
    try { localStorage.removeItem(LS_SESSION_STATS); } catch { /* ignore */ }
  }

  // Guard 3: session closed but moves remain (crash during close sequence)
  let resolvedMoves = moves;
  if (!session.isOpen && moves.length > 0) {
    resolvedMoves = [];
    try { localStorage.removeItem(LS_MOVES); } catch { /* ignore */ }
  }

  // Guard 4: contingency session active but prerequisite missing from usedCodes
  let resolvedCodes = codes;
  let recoveryLog: string | null = null;
  if (session.isOpen && session.cashBox && session.cashBox.type !== "normal") {
    const box    = session.cashBox;
    const prereq = box.code.slice(0, 2) + (box.type === "contingency-1" ? "0" : "1");
    if (!codes.has(prereq)) {
      const next = new Set(codes);
      next.add(prereq);
      resolvedCodes = next;
      try { localStorage.setItem(LS_USED, JSON.stringify([...next])); } catch { /* ignore */ }
      recoveryLog = `Prereq CAJA ${prereq} restaurado para contingencia activa CAJA ${box.code}`;
    }
  }

  return {
    session, usedCodes: resolvedCodes,
    stats: resolvedStats, moves: resolvedMoves,
    recoveryLog,
  };
}

// ── context interface ──────────────────────────────────────────
interface POSContextValue {
  zone: FocusZone;
  enterTicket: () => void;
  enterSearch: () => void;
  cobroOpen: boolean;
  openCobro: () => void;
  closeCobro: () => void;
  cashSession: CashSession;
  cashBoxes: CashBox[];
  suggestedCashBox: CashBox | null;
  openCashSession: (boxCode: string, apertura: number, motivo?: string, refOp?: string, exceptionalSkipCodes?: string[]) => void;
  closeCashSession: () => void;
  correctAperturaData: (apertura: number, motivo?: string, observacion?: string, refOp?: string) => void;
  sessionStats: SessionStats;
  docCorrelatives: DocCorrelatives;
  recordSale: (netTotal: number, payMethod: string, docType?: string, docSeries?: string, docCorrelative?: number, cashComponent?: number, mixtoYapComponent?: number, mixtoTarComponent?: number) => void;
  cashMoves: CashMove[];
  addCashMove: (type: MoveType, amount: number, motivo: string, sourceType: MoveSource, fromApertura: number, fromVendido: number, observacion?: string, refId?: string, regularizationStatus?: RegularizationStatus, regularizationMode?: RegularizationMode) => CashMove;
  updateCashMove: (id: string, status: RegularizationStatus, mode?: RegularizationMode) => void;
  opLogs: OpLog[];
  addOpLog: (text: string) => void;
  comprobantes: Comprobante[];
  addComprobante: (data: {
    docType: string; docSeries: string; docCorrelative: number; dateTime: string;
    lines: ComprobanteLineItem[]; discountAmount: number; grossTotal: number; netTotal: number;
    payMethod: string; cashComponent: number; yapeComponent: number; tarjetaComponent: number;
    customer?: { docNumber: string; name: string } | null;
  }) => void;
  voidComprobante: (id: string, motivo: string) => void;
  sessionNotice: string | null;
  showNotice: (msg: string) => void;
  operators: OperatorRecord[];
  activeOperator: OperatorRecord | null;
  loginOperator: (id: string, pin: string) => boolean;
  logoutOperator: () => void;
  changeOperatorPin: (currentPin: string, newPin: string) => boolean;
  changeOperatorPinById: (id: string, currentPin: string, newPin: string) => boolean;
  resetOperatorPin: (id: string, newPin: string) => boolean;
  rubro: Rubro;
  setRubro: (r: Rubro) => void;
  visualMode: VisualMode;
  setVisualMode: (m: VisualMode) => void;
  printFlow: PrintFlow;
  setPrintFlow: (f: PrintFlow) => void;
}

const POSContext = createContext<POSContextValue | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [zone, setZone] = useState<FocusZone>("search");
  const [cobroOpen, setCobroOpen] = useState(false);

  // Recover consistent state from localStorage — runs once on mount
  const [initState] = useState(recoverOperationalState);
  const recoveryLogRef = useRef(initState.recoveryLog);
  const [usedCodes,   setUsedCodes]   = useState(() => initState.usedCodes);
  const [cashSession, setCashSession] = useState(() => initState.session);

  const cashSessionRef = useRef(cashSession);
  cashSessionRef.current = cashSession;

  // Persist on every change
  useEffect(() => { saveSession(cashSession); }, [cashSession]);
  useEffect(() => { saveUsedCodes(usedCodes); }, [usedCodes]);

  const cashBoxes = useMemo(() => deriveBoxes(usedCodes), [usedCodes]);
  const suggestedCashBox = useMemo(() => cashBoxes.find(b => b.available) ?? null, [cashBoxes]);

  const [sessionStats, setSessionStats] = useState(() => initState.stats);
  const [cashMoves,    setCashMoves]    = useState(() => initState.moves);
  useEffect(() => { saveMoves(cashMoves); }, [cashMoves]);
  useEffect(() => { saveSessionStats(sessionStats); }, [sessionStats]);

  // Refs para correctAperturaData — deben ir DESPUÉS de las declaraciones de estado
  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;
  const cashMovesRef = useRef(cashMoves);
  cashMovesRef.current = cashMoves;

  const [comprobantes, setComprobantes] = useState<Comprobante[]>(loadComprobantes);
  const comprobantesRef = useRef(comprobantes);
  comprobantesRef.current = comprobantes;
  useEffect(() => { saveComprobantes(comprobantes); }, [comprobantes]);

  const [docCorrelatives, setDocCorrelatives] = useState<DocCorrelatives>(loadCorrelatives);
  useEffect(() => { saveCorrelatives(docCorrelatives); }, [docCorrelatives]);

  const [opLogs, setOpLogs] = useState<OpLog[]>(loadOpLogs);
  useEffect(() => { saveOpLogs(opLogs); }, [opLogs]);

  const addOpLog = useCallback((text: string) => {
    const entry: OpLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
      text,
    };
    setOpLogs(prev => [...prev, entry]);
  }, []);

  // Emit recovery log once if startup found inconsistencies
  useEffect(() => {
    if (recoveryLogRef.current) {
      addOpLog(`[RECOVERY] ${recoveryLogRef.current}`);
      recoveryLogRef.current = null;
    }
  }, [addOpLog]);

  const [operators, setOperators] = useState<OperatorRecord[]>(loadOperators);
  const operatorsRef = useRef(operators);
  operatorsRef.current = operators;
  const [activeOperator, setActiveOperator] = useState<OperatorRecord | null>(null);
  const activeOperatorRef = useRef<OperatorRecord | null>(null);
  activeOperatorRef.current = activeOperator;

  const loginOperator = useCallback((id: string, pin: string): boolean => {
    const ok = checkPin(operators, id, pin);
    if (ok) {
      const op = operators.find(o => o.id === id)!;
      setActiveOperator(op);
      addOpLog(`[LOGIN] ${op.name} inició sesión`);
    }
    return ok;
  }, [operators, addOpLog]);

  const logoutOperator = useCallback(() => {
    const op = activeOperatorRef.current;
    setActiveOperator(null);
    if (op) addOpLog(`[LOGOUT] ${op.name} cerró sesión`);
  }, [addOpLog]);

  const changeOperatorPin = useCallback((currentPin: string, newPin: string): boolean => {
    const op = activeOperatorRef.current;
    if (!op) return false;
    const updated = changePin(operatorsRef.current, op.id, currentPin, newPin);
    if (!updated) return false;
    saveOperators(updated);
    setOperators(updated);
    addOpLog(`[PIN] ${op.name} actualizó su PIN`);
    return true;
  }, [addOpLog]);

  const changeOperatorPinById = useCallback((id: string, currentPin: string, newPin: string): boolean => {
    const updated = changePin(operatorsRef.current, id, currentPin, newPin);
    if (!updated) return false;
    saveOperators(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) addOpLog(`[PIN] ${op.name} actualizó su PIN (login)`);
    return true;
  }, [addOpLog]);

  const resetOperatorPin = useCallback((id: string, newPin: string): boolean => {
    const updated = setOperatorPin(operatorsRef.current, id, newPin);
    if (!updated) return false;
    saveOperators(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) addOpLog(`[PIN] ${op.name} reseteó su PIN`);
    return true;
  }, [addOpLog]);

  const addComprobante = useCallback((data: {
    docType: string; docSeries: string; docCorrelative: number; dateTime: string;
    lines: ComprobanteLineItem[]; discountAmount: number; grossTotal: number; netTotal: number;
    payMethod: string; cashComponent: number; yapeComponent: number; tarjetaComponent: number;
    customer?: { docNumber: string; name: string } | null;
  }) => {
    const s = cashSessionRef.current;
    const sessionKey = s.cashBox ? `${s.cashBox.code}-${s.openedAt?.toISOString() ?? ""}` : "";
    const c: Comprobante = {
      ...data,
      customer: data.customer ?? undefined,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionKey,
      operator:    s.operator,
      cashBoxCode: s.cashBox?.code ?? "",
      terminal:    s.terminal,
      status: "active",
    };
    setComprobantes(prev => [...prev, c]);
  }, []);

  const voidComprobante = useCallback((id: string, motivo: string) => {
    const s = cashSessionRef.current;
    const c = comprobantesRef.current.find(x => x.id === id);
    if (!c || c.status === "cancelled") return;
    setSessionStats(prev => ({
      count:     prev.count - 1,
      total:     moneySub(prev.total,   c.netTotal),
      cash:      moneySub(prev.cash,    c.cashComponent),
      yape:      moneySub(prev.yape,    c.yapeComponent),
      tarjeta:   moneySub(prev.tarjeta, c.tarjetaComponent),
      docRanges: prev.docRanges,
      byMethod: {
        efe: prev.byMethod.efe - (c.payMethod === "efectivo" ? 1 : 0),
        yap: prev.byMethod.yap - (c.payMethod === "yape"     ? 1 : 0),
        tar: prev.byMethod.tar - (c.payMethod === "tarjeta"  ? 1 : 0),
        mix: prev.byMethod.mix - (c.payMethod === "mixto"    ? 1 : 0),
      },
    }));
    setComprobantes(prev => prev.map(x => x.id === id ? {
      ...x,
      status: "cancelled" as const,
      cancelledAt:     new Date().toISOString(),
      cancelledBy:     s.operator,
      cancelledMotivo: motivo,
    } : x));
    addOpLog(`${s.operator} anuló ${c.docSeries}-${String(c.docCorrelative).padStart(8,"0")} — ${motivo}`);
  }, [addOpLog]);

  const recordSale = useCallback((
    netTotal: number, payMethod: string,
    docType?: string, docSeries?: string, docCorrelative?: number,
    cashComponent?: number, mixtoYapComponent?: number, mixtoTarComponent?: number,
  ) => {
    setSessionStats(prev => {
      const ranges = { ...prev.docRanges };
      if (docType && docSeries && docCorrelative !== undefined) {
        const existing = ranges[docType];
        ranges[docType] = existing
          ? { series: docSeries, first: existing.first, last: docCorrelative, count: existing.count + 1 }
          : { series: docSeries, first: docCorrelative, last: docCorrelative, count: 1 };
      }
      const addCash = payMethod === "efectivo" ? netTotal
                    : payMethod === "mixto"    ? (cashComponent ?? 0)
                    : 0;
      const addYape = payMethod === "yape"    ? netTotal
                    : payMethod === "mixto"   ? (mixtoYapComponent ?? 0)
                    : 0;
      const addTar  = payMethod === "tarjeta" ? netTotal
                    : payMethod === "mixto"   ? (mixtoTarComponent ?? 0)
                    : 0;
      return {
        count:     prev.count + 1,
        total:     prev.total + netTotal,
        cash:      prev.cash    + addCash,
        yape:      prev.yape    + addYape,
        tarjeta:   prev.tarjeta + addTar,
        docRanges: ranges,
        byMethod: {
          efe: prev.byMethod.efe + (payMethod === "efectivo" ? 1 : 0),
          yap: prev.byMethod.yap + (payMethod === "yape"     ? 1 : 0),
          tar: prev.byMethod.tar + (payMethod === "tarjeta"  ? 1 : 0),
          mix: prev.byMethod.mix + (payMethod === "mixto"    ? 1 : 0),
        },
      };
    });
    // Persistir correlativo globalmente — sobrevive cambios de sesión
    if (docType && docCorrelative !== undefined) {
      setDocCorrelatives(prev => ({ ...prev, [docType]: docCorrelative }));
    }
  }, []);

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
      operator:    s.operator,
      cashBoxCode: s.cashBox?.code ?? "",
      terminal:    s.terminal,
      timestamp:   new Date().toISOString(),
      sourceType, fromApertura, fromVendido,
      ...(regularizationStatus ? { regularizationStatus } : {}),
      ...(regularizationMode   ? { regularizationMode   } : {}),
    };
    setCashMoves(prev => [...prev, move]);
    const verb   = refId ? "registró reposición" : type === "ingreso" ? "registró ingreso" : "registró egreso";
    const srcLbl = sourceType === "apertura" ? "fondo" : sourceType === "vendido" ? "venta" : `fondo S/${fromApertura.toFixed(2)} + venta S/${fromVendido.toFixed(2)}`;
    const obs    = observacion ? ` · ${observacion}` : "";
    const ref    = refId ? ` [comp.${refId.slice(0, 8)}]` : "";
    addOpLog(`${s.operator} ${verb} S/ ${amount.toFixed(2)} [${srcLbl}] — ${motivo}${obs}${ref}`);
    return move;
  }, [addOpLog]);

  const updateCashMove = useCallback((id: string, status: RegularizationStatus, mode?: RegularizationMode) => {
    setCashMoves(prev => {
      const target = prev.find(m => m.id === id);
      if (!target) return prev;
      const modeLabel = mode === "integracion_fondo" ? "integrado al fondo" : "regularizado por reposición";
      const s = cashSessionRef.current;
      addOpLog(`[REGULARIZACIÓN] ${s.operator} — CAJA ${s.cashBox?.code ?? "?"} — S/${target.amount.toFixed(2)} ${modeLabel}: ${target.motivo}`);
      return prev.map(m => m.id === id ? { ...m, regularizationStatus: status, ...(mode ? { regularizationMode: mode } : {}) } : m);
    });
  }, [addOpLog]);

  const [rubro, setRubroState] = useState<Rubro>(loadRubro);
  const setRubro = useCallback((r: Rubro) => {
    setRubroState(r);
    try { localStorage.setItem(LS_RUBRO, r); } catch { /* quota */ }
  }, []);

  const [visualMode, setVisualModeState] = useState<VisualMode>(loadVisualMode);
  const setVisualMode = useCallback((m: VisualMode) => {
    setVisualModeState(m);
    try { localStorage.setItem(LS_VISUAL_MODE, m); } catch { /* quota */ }
  }, []);

  const [printFlow, setPrintFlowState] = useState<PrintFlow>(loadPrintFlow);
  const setPrintFlow = useCallback((f: PrintFlow) => {
    setPrintFlowState(f);
    try { localStorage.setItem(LS_PRINT_FLOW, f); } catch { /* quota */ }
  }, []);

  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setSessionNotice(msg);
    noticeTimer.current = setTimeout(() => setSessionNotice(null), 2800);
  }, []);

  const enterTicket = useCallback(() => setZone("ticket"), []);
  const enterSearch = useCallback(() => setZone("search"), []);

  const openCobro = useCallback(() => {
    if (!cashSessionRef.current.isOpen) {
      showNotice("Apertura de caja requerida para cobrar");
      return;
    }
    setCobroOpen(true);
    setZone("cobro");
  }, [showNotice]);

  const closeCobro = useCallback(() => { setCobroOpen(false); setZone("search"); }, []);

  const openCashSession = useCallback((
    boxCode: string, apertura: number, motivo?: string, refOp?: string,
    exceptionalSkipCodes?: string[], // para apertura excepcional: marcar cajas previas como usadas
  ) => {
    const box = cashBoxes.find(b => b.code === boxCode);
    if (!box) return;
    // Excepcional: permite abrir caja no-disponible si no fue usada hoy y se proveen skip codes
    const isExceptional = !!(exceptionalSkipCodes && exceptionalSkipCodes.length > 0);
    if (isExceptional ? box.used : !box.available) return;
    const operator = activeOperatorRef.current?.name ?? BLOCK_OPERATORS[boxCode[0]] ?? "Operador";
    setSessionStats(NULL_STATS);
    setCashMoves([]);
    setOpLogs([]);
    // Marcar cajas previas como omitidas excepcionalmente — previene reapertura posterior
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
    setCashSession({ isOpen: true, cashBox: box, operator, terminal: TERMINAL, openedAt: new Date(), apertura, motivo: trimmedMotivo, refOp: trimmedRefOp });
    const base = `${operator} abrió CAJA ${boxCode}${tag} · fondo S/ ${apertura.toFixed(2)}`;
    const extra = [trimmedMotivo && `Motivo: ${trimmedMotivo}`, trimmedRefOp && `Ref: ${trimmedRefOp}`].filter(Boolean).join(" · ");
    addOpLog(extra ? `${base} — ${extra}` : base);
  }, [cashBoxes, addOpLog]);

  const correctAperturaData = useCallback((
    newApertura: number,
    newMotivo?: string,
    newObservacion?: string,
    newRefOp?: string,
  ) => {
    const s = cashSessionRef.current;
    if (!s.isOpen) return;
    // Block if any operational activity exists
    if (sessionStatsRef.current.count > 0 || cashMovesRef.current.length > 0) return;
    const trimMotivo      = newMotivo?.trim()      || undefined;
    const trimObservacion = newObservacion?.trim() || undefined;
    const trimRefOp       = newRefOp?.trim()       || undefined;
    setCashSession(prev => ({
      ...prev,
      apertura:    newApertura,
      motivo:      trimMotivo,
      observacion: trimObservacion,
      refOp:       trimRefOp,
    }));
    const parts = [`fondo S/ ${newApertura.toFixed(2)}`];
    if (trimMotivo)      parts.push(`motivo: ${trimMotivo}`);
    if (trimObservacion) parts.push(`obs: ${trimObservacion}`);
    if (trimRefOp)       parts.push(`ref: ${trimRefOp}`);
    addOpLog(`[CORRECCIÓN APERTURA] ${parts.join(' · ')}`);
  }, [addOpLog]);

  const closeCashSession = useCallback(() => {
    const s = cashSessionRef.current;
    if (!s.isOpen || !s.cashBox) return;
    const code = s.cashBox.code;
    // Cleanup operational context
    setCobroOpen(false);
    setZone("search");
    useTicketStore.getState().clearTicket();
    setSessionStats(NULL_STATS);
    setCashMoves([]);
    const op = s.operator;
    setUsedCodes(prev => { const next = new Set(prev); next.add(code); return next; });
    setCashSession({ isOpen: false, cashBox: null, operator: "", terminal: TERMINAL, openedAt: null, apertura: 0 });
    addOpLog(`${op} cerró CAJA ${code}`);
  }, [addOpLog]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cobroOpen) return;
      if (e.key === "F4") { e.preventDefault(); openCobro(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCobro, cobroOpen]);

  return (
    <POSContext.Provider value={{
      zone, enterTicket, enterSearch,
      cobroOpen, openCobro, closeCobro,
      cashSession, cashBoxes, suggestedCashBox,
      openCashSession, closeCashSession, correctAperturaData,
      sessionStats, docCorrelatives, recordSale,
      cashMoves, addCashMove, updateCashMove,
      opLogs, addOpLog,
      comprobantes, addComprobante, voidComprobante,
      sessionNotice, showNotice,
      operators, activeOperator, loginOperator, logoutOperator, changeOperatorPin, changeOperatorPinById, resetOperatorPin,
      rubro, setRubro,
      visualMode, setVisualMode,
      printFlow, setPrintFlow,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
