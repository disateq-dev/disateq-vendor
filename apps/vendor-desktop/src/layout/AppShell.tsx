import { type ReactNode } from "react";
import { ContextBar } from "./ContextBar";
import { ModulesBar } from "./ModulesBar";
import { Topbar } from "./Topbar";
import { ShortcutsBar } from "./ShortcutsBar";
import { StatusBar } from "./StatusBar";
import { type ActiveModule } from "../App";

interface AppShellProps {
  children: ReactNode;
  activeModule: ActiveModule;
  onModuleChange: (m: ActiveModule) => void;
}

export function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  return (
    <main className="h-screen overflow-hidden bg-[#f4f7fb] text-[#111827]">
      <section className="flex h-full flex-col">
        <header className="border-b border-[#dde4ec]">
          <Topbar />
          <ModulesBar active={activeModule} onChange={onModuleChange} />
          <ContextBar />
        </header>

        <section className="flex min-h-0 flex-1 gap-3 p-3">
          {children}
        </section>

        <ShortcutsBar />
        <StatusBar />
      </section>
    </main>
  );
}
