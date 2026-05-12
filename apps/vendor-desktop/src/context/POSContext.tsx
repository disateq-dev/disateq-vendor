import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type FocusZone = "search" | "ticket" | "cobro";

interface POSContextValue {
  zone: FocusZone;
  enterTicket: () => void;
  enterSearch: () => void;
  cobroOpen: boolean;
  openCobro: () => void;
  closeCobro: () => void;
}

const POSContext = createContext<POSContextValue | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [zone, setZone] = useState<FocusZone>("search");
  const [cobroOpen, setCobroOpen] = useState(false);

  const enterTicket = useCallback(() => setZone("ticket"), []);
  const enterSearch = useCallback(() => setZone("search"), []);
  const openCobro = useCallback(() => { setCobroOpen(true); setZone("cobro"); }, []);
  const closeCobro = useCallback(() => { setCobroOpen(false); setZone("search"); }, []);

  // F4 global — works from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F4") { e.preventDefault(); openCobro(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCobro]);

  return (
    <POSContext.Provider value={{ zone, enterTicket, enterSearch, cobroOpen, openCobro, closeCobro }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
