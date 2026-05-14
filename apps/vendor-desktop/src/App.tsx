import { useState } from "react";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";
import { CashWorkspace } from "./modules/cash/CashWorkspace";
import { POSProvider } from "./context/POSContext";

export type ActiveModule = "sales" | "cash";

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("sales");

  return (
    <POSProvider>
      <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
        {activeModule === "sales" && (
          <>
            <SalesWorkspace />
            <TicketWorkspace />
          </>
        )}
        {activeModule === "cash" && <CashWorkspace onOpened={() => setActiveModule("sales")} />}
      </AppShell>
    </POSProvider>
  );
}
