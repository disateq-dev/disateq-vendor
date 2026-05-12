import { type ReactNode } from "react";
import { ContextBar } from "./ContextBar";
import { ModulesBar } from "./ModulesBar";
import { Topbar } from "./Topbar";
import { ShortcutsBar } from "./ShortcutsBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="h-screen overflow-hidden bg-[#f4f7fb] text-[#111827]">
      <section className="flex h-full flex-col">
        <header className="border-b border-[#dde4ec]">
          <Topbar />
          <ModulesBar />
          <ContextBar />
        </header>

        <section className="flex min-h-0 flex-1 gap-3 p-3">
          {children}
        </section>

        <ShortcutsBar />
      </section>
    </main>
  );
}
