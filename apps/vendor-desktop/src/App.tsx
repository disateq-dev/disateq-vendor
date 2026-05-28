import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { TicketWorkspace } from "./modules/ticket/TicketWorkspace";
import { CashWorkspace } from "./modules/cash/CashWorkspace";
import { ConfigWorkspace } from "./modules/config/ConfigWorkspace";
import { ComprobantesWorkspace } from "./modules/comprobantes/ComprobantesWorkspace";
import { InventoryWorkspace } from "./modules/inventory/InventoryWorkspace";
import { PurchasesWorkspace } from "./modules/purchases/PurchasesWorkspace";
import { POSProvider, usePOS } from "./context/POSContext";
import { LoginScreen } from "./modules/login/LoginScreen";

export type ActiveModule            = "sales" | "cash" | "config" | "comprobantes" | "abastecimiento";
export type CashSubView             = "turno" | "roles" | "cajas" | "operadores" | "corregir-arqueo";
export type AbastecimientoSubModule = "compras" | "inventarios" | "proveedores" | "traslados";
export type ConfigSubView           = "negocio" | "operacion" | "rubro" | "experiencia" | "capacidades";

function AppRoot() {
  const { activeOperator } = usePOS();
  const [activeModule,            setActiveModule]            = useState<ActiveModule>("cash");
  const [cashSubView,             setCashSubView]             = useState<CashSubView>("turno");
  const [abastecimientoSubModule, setAbastecimientoSubModule] = useState<AbastecimientoSubModule>("compras");
  const [configSubView,           setConfigSubView]           = useState<ConfigSubView>("negocio");
  const prevOpId        = useRef<string | null>(null);
  const isInitialMount  = useRef(true);

  useEffect(() => {
    const win = getCurrentWindow();
    if (activeOperator) {
      // Login → Main app: resize + center + show
      win.setAlwaysOnTop(false);
      win.setDecorations(true);
      win.setResizable(true);
      win.setSize(new LogicalSize(1366, 768))
        .then(() => win.center())
        .then(() => win.show())
        .catch(() => {});
    } else if (!isInitialMount.current) {
      // Main app → Login (logout): LoginScreen.tsx llama win.show() tras su render
      win.setResizable(false);
      win.setDecorations(false);
      win.setAlwaysOnTop(true);
      win.setSize(new LogicalSize(740, 520)).then(() => win.center()).catch(() => {});
    }
    // Inicial: ventana oculta desde tauri.conf — LoginScreen.tsx la muestra tras primer paint
    isInitialMount.current = false;
  }, [activeOperator]);

  // Al hacer login (transición null → operador), ir a TURNO
  useEffect(() => {
    if (activeOperator && activeOperator.id !== prevOpId.current) {
      setActiveModule("cash");
      setCashSubView("turno");
    }
    prevOpId.current = activeOperator?.id ?? null;
  }, [activeOperator]);

  if (!activeOperator) return <LoginScreen />;

  return (
    <AppShell
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      cashSubView={cashSubView}
      onCashSubViewChange={setCashSubView}
      abastecimientoSubModule={abastecimientoSubModule}
      onAbastecimientoSubModuleChange={setAbastecimientoSubModule}
      configSubView={configSubView}
      onConfigSubViewChange={setConfigSubView}
    >
      {activeModule === "sales" && (
        <>
          <SalesWorkspace />
          <TicketWorkspace />
        </>
      )}
      {activeModule === "cash"         && <CashWorkspace onOpened={() => setActiveModule("sales")} cashSubView={cashSubView} />}
      {activeModule === "comprobantes" && <ComprobantesWorkspace />}
      {activeModule === "config"       && <ConfigWorkspace configSubView={configSubView} />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "inventarios"  && <InventoryWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "compras"      && <PurchasesWorkspace />}
      {activeModule === "abastecimiento" && (abastecimientoSubModule === "proveedores" || abastecimientoSubModule === "traslados") && (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#9ca3af]">Próximamente</span>
        </div>
      )}
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
