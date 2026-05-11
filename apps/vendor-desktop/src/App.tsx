import { TicketGrid } from "./domains/ticket/components/TicketGrid";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";

export default function App() {
  return (
    <AppShell>
      <SalesWorkspace />

      {/* RIGHT */}
      <section className="w-[420px]">
        <TicketGrid />
      </section>
    </AppShell>
  );
}
