import { useState } from "react";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";
import { CashWorkspace } from "./modules/cash/CashWorkspace";
import { ConfigWorkspace } from "./modules/config/ConfigWorkspace";
import { ComprobantesWorkspace } from "./modules/comprobantes/ComprobantesWorkspace";
import { POSProvider } from "./context/POSContext";

export type ActiveModule   = "sales" | "cash" | "config" | "comprobantes";
export type CashSubView    = "turno" | "roles" | "operadores" | "cajas";

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("sales");
  const [cashSubView,  setCashSubView]  = useState<CashSubView>("turno");

  return (
    <POSProvider>
      <AppShell
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        cashSubView={cashSubView}
        onCashSubViewChange={setCashSubView}
      >
        {activeModule === "sales" && (
          <>
            <SalesWorkspace />
            <TicketWorkspace />
          </>
        )}
        {activeModule === "cash"          && <CashWorkspace onOpened={() => setActiveModule("sales")} cashSubView={cashSubView} />}
        {activeModule === "comprobantes"  && <ComprobantesWorkspace />}
        {activeModule === "config"        && <ConfigWorkspace />}
      </AppShell>
    </POSProvider>
  );
}
