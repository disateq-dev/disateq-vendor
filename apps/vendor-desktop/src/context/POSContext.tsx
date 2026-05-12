import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";

type FocusZone = "search" | "ticket" | "cobro";

export type CashBoxType = "normal" | "contingency-1" | "contingency-2";

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
  sessionNotice: string | null;
  showNotice: (msg: string) => void;
}

const POSContext = createContext<POSContextValue | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [zone, setZone] = useState<FocusZone>("search");
  const [cobroOpen, setCobroOpen] = useState(false);
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set());
  const [cashSession, setCashSession] = useState<CashSession>({
    isOpen: false,
    cashBox: null,
    operator: OPERATOR,
    terminal: TERMINAL,
    openedAt: null,
  });

  const cashSessionRef = useRef(cashSession);
  cashSessionRef.current = cashSession;

  const cashBoxes = useMemo(() => deriveBoxes(usedCodes), [usedCodes]);
  const suggestedCashBox = useMemo(() => cashBoxes.find(b => b.available) ?? null, [cashBoxes]);

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
    setCashSession({ isOpen: true, cashBox: box, operator: OPERATOR, terminal: TERMINAL, openedAt: new Date() });
  }, [cashBoxes]);

  const closeCashSession = useCallback(() => {
    const s = cashSessionRef.current;
    if (!s.isOpen || !s.cashBox) return;
    const code = s.cashBox.code;
    setUsedCodes(prev => { const next = new Set(prev); next.add(code); return next; });
    setCashSession({ isOpen: false, cashBox: null, operator: OPERATOR, terminal: TERMINAL, openedAt: null });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F4") { e.preventDefault(); openCobro(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCobro]);

  return (
    <POSContext.Provider value={{
      zone, enterTicket, enterSearch,
      cobroOpen, openCobro, closeCobro,
      cashSession, cashBoxes, suggestedCashBox,
      openCashSession, closeCashSession,
      sessionNotice, showNotice,
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
