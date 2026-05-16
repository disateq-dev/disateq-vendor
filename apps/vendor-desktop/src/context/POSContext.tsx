import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTicketStore } from "../domains/ticket/state/ticket.store";
import { type Rubro, type VisualMode, type PrintFlow } from "../data/catalogs";

type FocusZone = "search" | "ticket" | "cobro";

export type CashBoxType = "normal" | "contingency-1" | "contingency-2";

export type MoveType   = "ingreso" | "egreso";
export type MoveSource = "apertura" | "vendido" | "mixto";

export type CashMove = {
  id: string;
  type: MoveType;
  amount: number;
  motivo: string;
  operator: string;
  cashBoxCode: string;
  terminal: string;
  timestamp: string;
  sourceType:   MoveSource;
  fromApertura: number;
  fromVendido:  number;
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
const LS_MOVES        = "disateq.pos.cashMoves";
const LS_SESSION_STATS = "disateq.pos.sessionStats";
const LS_OPLOGS       = "disateq.pos.opLogs";
const LS_RUBRO        = "disateq.pos.rubro";
const LS_VISUAL_MODE  = "disateq.pos.visualMode";
const LS_PRINT_FLOW   = "disateq.pos.printFlow";

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
      apertura:  typeof p.apertura === "number" ? p.apertura : 0,
      motivo:    typeof p.motivo === "string" ? p.motivo : undefined,
    };
  } catch {
    return NULL_SESSION;
  }
}

function loadUsedCodes(): Set<string> {
  try {
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
export type SessionStats = {
  count: number; total: number; cash: number; yape: number; tarjeta: number;
  docRanges: Partial<Record<string, DocRange>>;
};
const NULL_STATS: SessionStats = { count: 0, total: 0, cash: 0, yape: 0, tarjeta: 0, docRanges: {} };

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
    return {
      count:     typeof p.count    === "number" ? p.count    : 0,
      total:     typeof p.total    === "number" ? p.total    : 0,
      cash:      typeof p.cash     === "number" ? p.cash     : 0,
      yape:      typeof p.yape     === "number" ? p.yape     : 0,
      tarjeta:   typeof p.tarjeta  === "number" ? p.tarjeta  : 0,
      docRanges: ranges,
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
  openCashSession: (boxCode: string, apertura: number, motivo?: string) => void;
  closeCashSession: () => void;
  sessionStats: SessionStats;
  recordSale: (netTotal: number, payMethod: string, docType?: string, docSeries?: string, docCorrelative?: number, cashComponent?: number) => void;
  cashMoves: CashMove[];
  addCashMove: (type: MoveType, amount: number, motivo: string, sourceType: MoveSource, fromApertura: number, fromVendido: number) => CashMove;
  opLogs: OpLog[];
  addOpLog: (text: string) => void;
  sessionNotice: string | null;
  showNotice: (msg: string) => void;
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

  const recordSale = useCallback((
    netTotal: number, payMethod: string,
    docType?: string, docSeries?: string, docCorrelative?: number,
    cashComponent?: number,
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
      return {
        count:     prev.count + 1,
        total:     prev.total + netTotal,
        cash:      prev.cash    + addCash,
        yape:      prev.yape    + (payMethod === "yape"    ? netTotal : 0),
        tarjeta:   prev.tarjeta + (payMethod === "tarjeta" ? netTotal : 0),
        docRanges: ranges,
      };
    });
  }, []);

  const addCashMove = useCallback((
    type: MoveType, amount: number, motivo: string,
    sourceType: MoveSource, fromApertura: number, fromVendido: number,
  ): CashMove => {
    const s = cashSessionRef.current;
    const move: CashMove = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, amount, motivo,
      operator:    s.operator,
      cashBoxCode: s.cashBox?.code ?? "",
      terminal:    s.terminal,
      timestamp:   new Date().toISOString(),
      sourceType, fromApertura, fromVendido,
    };
    setCashMoves(prev => [...prev, move]);
    // human log
    const verb   = type === "ingreso" ? "registró ingreso" : "registró egreso";
    const prep   = type === "ingreso" ? "Destino" : "Origen";
    const detail = sourceType === "apertura"
      ? `${prep}: apertura`
      : sourceType === "vendido"
        ? `${prep}: vendido`
        : `${prep}: S/ ${fromApertura.toFixed(2)} apertura + S/ ${fromVendido.toFixed(2)} vendido`;
    addOpLog(`${s.operator} ${verb} S/ ${amount.toFixed(2)} — ${detail} — ${motivo}`);
    return move;
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

  const openCashSession = useCallback((boxCode: string, apertura: number, motivo?: string) => {
    const box = cashBoxes.find(b => b.code === boxCode);
    if (!box || !box.available) return;
    const operator = BLOCK_OPERATORS[boxCode[0]] ?? "Operador";
    setSessionStats(NULL_STATS);
    setCashMoves([]);
    setOpLogs([]);
    const trimmedMotivo = motivo?.trim() || undefined;
    setCashSession({ isOpen: true, cashBox: box, operator, terminal: TERMINAL, openedAt: new Date(), apertura, motivo: trimmedMotivo });
    const base = `${operator} abrió CAJA ${boxCode} · fondo S/ ${apertura.toFixed(2)}`;
    addOpLog(trimmedMotivo ? `${base} — Motivo: ${trimmedMotivo}` : base);
  }, [cashBoxes, addOpLog]);

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
      openCashSession, closeCashSession,
      sessionStats, recordSale,
      cashMoves, addCashMove,
      opLogs, addOpLog,
      sessionNotice, showNotice,
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
