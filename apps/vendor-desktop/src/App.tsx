import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";
import { CashWorkspace } from "./modules/cash/CashWorkspace";
import { ConfigWorkspace } from "./modules/config/ConfigWorkspace";
import { ComprobantesWorkspace } from "./modules/comprobantes/ComprobantesWorkspace";
import { POSProvider, usePOS } from "./context/POSContext";
import { LoginScreen } from "./modules/login/LoginScreen";

export type ActiveModule = "sales" | "cash" | "config" | "comprobantes";
export type CashSubView  = "turno" | "roles" | "operadores" | "cajas";

function AppRoot() {
  const { activeOperator } = usePOS();
  const [activeModule, setActiveModule] = useState<ActiveModule>("sales");
  const [cashSubView,  setCashSubView]  = useState<CashSubView>("turno");

  useEffect(() => {
    const win = getCurrentWindow();
    if (activeOperator) {
      win.setSize(new LogicalSize(1366, 768)).then(() => win.center());
    } else {
      win.setSize(new LogicalSize(880, 548)).then(() => win.center());
    }
  }, [activeOperator]);

  if (!activeOperator) return <LoginScreen />;

  return (
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
      {activeModule === "cash"         && <CashWorkspace onOpened={() => setActiveModule("sales")} cashSubView={cashSubView} />}
      {activeModule === "comprobantes" && <ComprobantesWorkspace />}
      {activeModule === "config"       && <ConfigWorkspace />}
    </AppShell>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppRoot />
    </POSProvider>
  );
}
