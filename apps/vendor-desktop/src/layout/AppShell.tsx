import { useState, useEffect, type ReactNode } from "react";
import { SubContextBar } from "./SubContextBar";
import { ModulesBar } from "./ModulesBar";
import { Topbar } from "./Topbar";
import { ShortcutsBar } from "./ShortcutsBar";
import { usePOS } from "../context/POSContext";
import { type ActiveModule, type CashSubView, type InventorySubView, type PurchasesSubView } from "../App";

interface AppShellProps {
  children: ReactNode;
  activeModule: ActiveModule;
  onModuleChange: (m: ActiveModule) => void;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  inventorySubView: InventorySubView;
  onInventorySubViewChange: (sv: InventorySubView) => void;
  purchasesSubView: PurchasesSubView;
  onPurchasesSubViewChange: (sv: PurchasesSubView) => void;
}

function OperationalNotice() {
  const { sessionNotice } = usePOS();
  if (!sessionNotice) return null;
  return (
    <div className="shrink-0 flex items-center justify-center gap-2 border-t border-amber-100 bg-amber-50 px-5 py-1.5">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
      <span className="select-none text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
        {sessionNotice}
      </span>
    </div>
  );
}

export function AppShell({ children, activeModule, onModuleChange, cashSubView, onCashSubViewChange, inventorySubView, onInventorySubViewChange, purchasesSubView, onPurchasesSubViewChange }: AppShellProps) {
  const { closeCobro, logoutOperator, cobroOpen } = usePOS();
  const [hoveredModule, setHoveredModule] = useState<ActiveModule | null>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "L") { e.preventDefault(); logoutOperator(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logoutOperator]);

  // Escape global — scanner focus recovery en VENTAS (CobroPanel maneja su propio Escape cuando cobroOpen)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!cobroOpen && activeModule === "sales") {
        document.dispatchEvent(new CustomEvent("pos:focusSearch"));
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, activeModule]);

  // hover → preview; leave → back to active; click → permanent (hoveredModule = null, activeModule updated)
  const displayModule = hoveredModule ?? activeModule;
  const visible = hoveredModule !== null || true; // permanent once active module exists

  return (
    <main className="h-screen overflow-hidden bg-[#f7f9fc] text-[#111827]">
      <section className="flex h-full flex-col">
        <header className="border-b border-[#dde4ec]">
          <Topbar />
          <ModulesBar
            active={activeModule}
            display={displayModule}
            onChange={m => { closeCobro(); onModuleChange(m); setHoveredModule(null); }}
            onHover={setHoveredModule}
          />
          <SubContextBar
            displayModule={displayModule}
            activeModule={activeModule}
            visible={visible}
            cashSubView={cashSubView}
            onCashSubViewChange={onCashSubViewChange}
            inventorySubView={inventorySubView}
            onInventorySubViewChange={onInventorySubViewChange}
            purchasesSubView={purchasesSubView}
            onPurchasesSubViewChange={onPurchasesSubViewChange}
          />
        </header>

        <section className="flex min-h-0 flex-1 gap-3 p-3">
          {children}
        </section>

        <OperationalNotice />
        <ShortcutsBar />
      </section>
    </main>
  );
}
