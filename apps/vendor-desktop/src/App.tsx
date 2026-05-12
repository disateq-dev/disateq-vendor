import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";
import { POSProvider } from "./context/POSContext";

export default function App() {
  return (
    <POSProvider>
      <AppShell>
        <SalesWorkspace />
        <TicketWorkspace />
      </AppShell>
    </POSProvider>
  );
}
