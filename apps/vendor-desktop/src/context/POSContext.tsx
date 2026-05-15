import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTicketStore } from "../domains/ticket/state/ticket.store";
import { type Rubro, type VisualMode, type PrintFlow } from "../data/catalogs";

type FocusZone = "search" | "ticket" | "cobro";

export type CashBoxType = "normal" | "contingency-1" | "contingency-2";

export type MoveType = "ingreso" | "egreso";

export type CashMove = {
  id: string;
  type: MoveType;
  amount: number;
  motivo: string;
  operator: string;
  cashBoxCode: string;
  terminal: string;
  timestamp: string;
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
};

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
];

const OPERATOR = "Fernando T.";
const TERMINAL = "PC-VENTAS01";

// ── localStorage keys ──────────────────────────────────────────
const LS_SESSION  = "disateq.pos.cashSession";
const LS_USED     = "disateq.pos.usedCodes";
const LS_MOVES    = "disateq.pos.cashMoves";
const LS_RUBRO       = "disateq.pos.rubro";
const LS_VISUAL_MODE = "disateq.pos.visualMode";
const LS_PRINT_FLOW  = "disateq.pos.printFlow";

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
  operator: OPERATOR,
  terminal: TERMINAL,
  openedAt: null,
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
      operator:  typeof p.operator === "string" ? p.operator : OPERATOR,
      terminal:  typeof p.terminal === "string" ? p.terminal : TERMINAL,
      openedAt:  safeDate(p.openedAt),
    };
  } catch {
    return NULL_SESSION;
  }
}

function loadUsedCodes(): Set<string> {
  return new Set(); // temp: reset on every start for testing
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
    return Array.isArray(arr) ? arr : [];
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

// ── session stats ───────────────────────────────────────────────
export type SessionStats = { count: number; total: number; cash: number };
const NULL_STATS: SessionStats = { count: 0, total: 0, cash: 0 };

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
  openCashSession: (boxCode: string) => void;
  closeCashSession: () => void;
  sessionStats: SessionStats;
  recordSale: (netTotal: number, isEfectivo: boolean) => void;
  cashMoves: CashMove[];
  addCashMove: (type: MoveType, amount: number, motivo: string) => CashMove;
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

  // Lazy-initialize from localStorage — runs once on mount
  const [usedCodes, setUsedCodes] = useState<Set<string>>(loadUsedCodes);
  const [cashSession, setCashSession] = useState<CashSession>(loadSession);

  const cashSessionRef = useRef(cashSession);
  cashSessionRef.current = cashSession;

  // Persist on every change
  useEffect(() => { saveSession(cashSession); }, [cashSession]);
  useEffect(() => { saveUsedCodes(usedCodes); }, [usedCodes]);

  const cashBoxes = useMemo(() => deriveBoxes(usedCodes), [usedCodes]);
  const suggestedCashBox = useMemo(() => cashBoxes.find(b => b.available) ?? null, [cashBoxes]);

  const [sessionStats, setSessionStats] = useState<SessionStats>(NULL_STATS);
  const [cashMoves,    setCashMoves]    = useState<CashMove[]>(loadMoves);
  useEffect(() => { saveMoves(cashMoves); }, [cashMoves]);

  const recordSale = useCallback((netTotal: number, isEfectivo: boolean) => {
    setSessionStats(prev => ({
      count: prev.count + 1,
      total: prev.total + netTotal,
      cash:  prev.cash  + (isEfectivo ? netTotal : 0),
    }));
  }, []);

  const addCashMove = useCallback((type: MoveType, amount: number, motivo: string): CashMove => {
    const s = cashSessionRef.current;
    const move: CashMove = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      amount,
      motivo,
      operator:    s.operator,
      cashBoxCode: s.cashBox?.code ?? "",
      terminal:    s.terminal,
      timestamp:   new Date().toISOString(),
    };
    setCashMoves(prev => [...prev, move]);
    return move;
  }, []);

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

  const openCashSession = useCallback((boxCode: string) => {
    const box = cashBoxes.find(b => b.code === boxCode);
    if (!box || !box.available) return;
    setSessionStats(NULL_STATS);
    setCashMoves([]);
    setCashSession({ isOpen: true, cashBox: box, operator: OPERATOR, terminal: TERMINAL, openedAt: new Date() });
  }, [cashBoxes]);

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
    setUsedCodes(prev => { const next = new Set(prev); next.add(code); return next; });
    setCashSession({ isOpen: false, cashBox: null, operator: OPERATOR, terminal: TERMINAL, openedAt: null });
  }, []);

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
