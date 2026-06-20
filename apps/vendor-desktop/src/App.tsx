import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { AppShell } from "./layout/AppShell";
import { SalesWorkspace } from "./modules/sales/SalesWorkspace";
import { PreVentaWorkspace } from "./modules/preventa/PreVentaWorkspace";
import { CashWorkspace } from "./modules/cash/CashWorkspace";
import { ConfigWorkspace } from "./modules/config/ConfigWorkspace";
import { ComprobantesWorkspace } from "./modules/comprobantes/ComprobantesWorkspace";
import { ClientesWorkspace } from "./modules/sales/ClientesWorkspace";
import { ReportesWorkspace } from "./modules/sales/ReportesWorkspace";
import { InventoryWorkspace } from "./modules/inventory/InventoryWorkspace";
import { PurchasesWorkspace } from "./modules/purchases/PurchasesWorkspace";
import { CatalogoFarmaciaWorkspace } from './modules/abastecimiento/farmacia/CatalogoFarmaciaWorkspace'
import { ProveedoresWorkspace } from './modules/abastecimiento/farmacia/ProveedoresWorkspace'
import { IngresosMercaderiaWorkspace } from './modules/abastecimiento/farmacia/IngresosMercaderiaWorkspace'
import { POSProvider, usePOS } from "./context/POSContext";
import { LoginScreen } from "./modules/login/LoginScreen";

export type ActiveModule            = "sales" | "cash" | "config" | "comprobantes" | "abastecimiento" | "clientes" | "reportes";
export type CashSubView             = "turno" | "supervision-caja";
export type AbastecimientoSubModule = "catalogo" | "proveedores" | "ingresos" | "compras" | "inventarios" | "traslados";
export type ConfigSubView           = "negocio" | "operacion" | "rubro" | "experiencia" | "operadores" | "cajas" | "roles" | "capacidades";

function AppRoot() {
  const { activeOperator, cashSession } = usePOS();
  const [activeModule,            setActiveModule]            = useState<ActiveModule>("cash");
  const [cashSubView,             setCashSubView]             = useState<CashSubView>("turno");
  const [abastecimientoSubModule, setAbastecimientoSubModule] = useState<AbastecimientoSubModule>("catalogo");
  const [configSubView,           setConfigSubView]           = useState<ConfigSubView>("negocio");
  const prevOpId        = useRef<string | null>(null);
  const isInitialMount  = useRef(true);

  useEffect(() => {
    try {
      const win = getCurrentWindow();
      if (activeOperator) {
        win.setResizable(true)
          .then(() => win.setMinSize(new LogicalSize(1366, 768)))
          .then(() => win.setSize(new LogicalSize(1366, 768)))
          .then(() => win.setDecorations(true))
          .then(() => win.setAlwaysOnTop(false))
          .then(() => win.center())
          .then(() => win.show())
          .catch(() => {});
      } else if (!isInitialMount.current) {
        win.setMinSize(null)
          .then(() => win.setSize(new LogicalSize(740, 520)))
          .then(() => win.setResizable(false))
          .then(() => win.setDecorations(false))
          .then(() => win.setAlwaysOnTop(true))
          .then(() => win.center())
          .catch(() => {});
      }
    } catch { /* no-tauri env */ }
    isInitialMount.current = false;
  }, [activeOperator]);

  // Al hacer login o reingresar (transición null → operador): si ya hay
  // turno abierto (sesión recuperada), ir directo a VENTAS; si no, a TURNO.
  useEffect(() => {
    if (activeOperator && activeOperator.id !== prevOpId.current) {
      if (cashSession.isOpen) {
        setActiveModule("sales");
      } else {
        setActiveModule("cash");
        setCashSubView("turno");
      }
    }
    prevOpId.current = activeOperator?.id ?? null;
  }, [activeOperator, cashSession.isOpen]);

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
          <PreVentaWorkspace />
        </>
      )}
      {activeModule === "cash"         && <CashWorkspace onOpened={() => setActiveModule("sales")} cashSubView={cashSubView} onCashSubViewChange={setCashSubView} />}
      {activeModule === "comprobantes" && <ComprobantesWorkspace />}
      {activeModule === "clientes"  && <ClientesWorkspace />}
      {activeModule === "reportes"  && <ReportesWorkspace />}
      {activeModule === "config"       && <ConfigWorkspace configSubView={configSubView} />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "catalogo"     && <CatalogoFarmaciaWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "proveedores" && <ProveedoresWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "ingresos" && <IngresosMercaderiaWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "inventarios"  && <InventoryWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "compras"      && <PurchasesWorkspace />}
      {activeModule === "abastecimiento" && abastecimientoSubModule === "traslados" && (
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
