import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";

export default function App() {
  return (
    <AppShell>
      <SalesWorkspace />
      <TicketWorkspace />
    </AppShell>
  );
}
