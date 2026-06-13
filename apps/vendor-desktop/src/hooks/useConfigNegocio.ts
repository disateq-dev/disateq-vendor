import { useState, useCallback } from "react";
import { type Rubro, type VisualMode, type PrintFlow } from "../data/catalogs";
import { syncCatalogToInventory } from "../domains/inventory/catalog-bridge";
import { seedCatalogoFromRubro } from "../domains/catalog/rubro-seed.service";

const LS_RUBRO       = "disateq.pos.rubro";
const LS_VISUAL_MODE = "disateq.pos.visualMode";
const LS_PRINT_FLOW  = "disateq.pos.printFlow";

function loadRubro(): Rubro {
  const raw = localStorage.getItem(LS_RUBRO);
  if (raw === "abarrotes" || raw === "food-fast" || raw === "panaderia" ||
      raw === "farmacia"  || raw === "optica"    || raw === "zapateria" ||
      raw === "reparacion"|| raw === "celulares") return raw;
  return "panaderia";
}

function loadVisualMode(): VisualMode {
  const raw = localStorage.getItem(LS_VISUAL_MODE);
  if (raw === "lista" || raw === "visual") return raw;
  return "visual";
}

function loadPrintFlow(): PrintFlow {
  const raw = localStorage.getItem(LS_PRINT_FLOW);
  if (
    raw === "solo-comprobante"    || raw === "comprobante-despacho" ||
    raw === "comprobante-comanda" || raw === "comprobante-precuenta" ||
    raw === "comprobante-turno"   || raw === "comprobante-embarque"
  ) return raw as PrintFlow;
  return "comprobante-despacho";
}

export function useConfigNegocio() {
  const [rubro, setRubroState] = useState<Rubro>(() => {
    const r = loadRubro();
    syncCatalogToInventory(r);
    seedCatalogoFromRubro(r);
    return r;
  });

  const [visualMode, setVisualModeState] = useState<VisualMode>(loadVisualMode);
  const [printFlow,  setPrintFlowState]  = useState<PrintFlow>(loadPrintFlow);

  const setRubro = useCallback((r: Rubro) => {
    setRubroState(r);
    syncCatalogToInventory(r);
    seedCatalogoFromRubro(r);
    try { localStorage.setItem(LS_RUBRO, r); } catch { /* quota */ }
  }, []);

  const setVisualMode = useCallback((m: VisualMode) => {
    setVisualModeState(m);
    try { localStorage.setItem(LS_VISUAL_MODE, m); } catch { /* quota */ }
  }, []);

  const setPrintFlow = useCallback((f: PrintFlow) => {
    setPrintFlowState(f);
    try { localStorage.setItem(LS_PRINT_FLOW, f); } catch { /* quota */ }
  }, []);

  return { rubro, setRubro, visualMode, setVisualMode, printFlow, setPrintFlow };
}
