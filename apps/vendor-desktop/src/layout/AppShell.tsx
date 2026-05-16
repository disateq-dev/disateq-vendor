import { type ReactNode } from "react";
import { ContextBar } from "./ContextBar";
import { ModulesBar } from "./ModulesBar";
import { StatusBar } from "./StatusBar";
import { Topbar } from "./Topbar";
import { ShortcutsBar } from "./ShortcutsBar";
import { usePOS } from "../context/POSContext";
import { type ActiveModule } from "../App";

interface AppShellProps {
  children: ReactNode;
  activeModule: ActiveModule;
  onModuleChange: (m: ActiveModule) => void;
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

export function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  const { closeCobro } = usePOS();
  return (
    <main className="h-screen overflow-hidden bg-[#f4f7fb] text-[#111827]">
      <section className="flex h-full flex-col">
        <header className="border-b border-[#dde4ec]">
          <Topbar />
          <ModulesBar active={activeModule} onChange={m => { closeCobro(); onModuleChange(m); }} />
          <ContextBar />
          <StatusBar />
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
