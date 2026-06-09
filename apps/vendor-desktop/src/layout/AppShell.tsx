import { useState, useEffect, useRef, type ReactNode } from "react";
import { ContextBar } from "./OperationalBar";
import { Topbar } from "./Topbar";
import { ShortcutsBar } from "./ShortcutsBar";
import { usePOS } from "../context/POSContext";
import { type ActiveModule, type CashSubView, type AbastecimientoSubModule, type ConfigSubView } from "../App";

interface AppShellProps {
  children: ReactNode;
  activeModule: ActiveModule;
  onModuleChange: (m: ActiveModule) => void;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  abastecimientoSubModule: AbastecimientoSubModule;
  onAbastecimientoSubModuleChange: (sm: AbastecimientoSubModule) => void;
  configSubView: ConfigSubView;
  onConfigSubViewChange: (sv: ConfigSubView) => void;
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

export function AppShell({ children, activeModule, onModuleChange, cashSubView, onCashSubViewChange, abastecimientoSubModule, onAbastecimientoSubModuleChange, configSubView, onConfigSubViewChange }: AppShellProps) {
  const { closeCobro, logoutOperator, cobroOpen } = usePOS();
  const [, setHoveredModule] = useState<ActiveModule | null>(null);
  const navModeRef = useRef(false);

  useEffect(() => {
    function handler(e: Event) {
      navModeRef.current = (e as CustomEvent<{ active: boolean }>).detail.active;
    }
    document.addEventListener("pos:navMode", handler);
    return () => document.removeEventListener("pos:navMode", handler);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "L") { e.preventDefault(); logoutOperator(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logoutOperator]);

  // Escape global — scanner focus recovery en VENTAS
  // Bloqueado cuando navMode de ContextBar está activo
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (navModeRef.current) return; // ContextBar maneja este Escape
      if (!cobroOpen && activeModule === "sales") {
        document.dispatchEvent(new CustomEvent("pos:focusSearch"));
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, activeModule]);

  return (
    <main className="h-screen overflow-hidden bg-[#f7f9fc] text-[#111827]">
      <section className="flex h-full flex-col">
        <header className="border-b border-[#dde4ec]">
          <Topbar />
          <ContextBar
            active={activeModule}
            onChange={m => { closeCobro(); onModuleChange(m); setHoveredModule(null); }}
            onHover={setHoveredModule}
            cashSubView={cashSubView}
            onCashSubViewChange={onCashSubViewChange}
            abastecimientoSubModule={abastecimientoSubModule}
            onAbastecimientoSubModuleChange={onAbastecimientoSubModuleChange}
            configSubView={configSubView}
            onConfigSubViewChange={onConfigSubViewChange}
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
