import { useState, useCallback, useRef } from "react";
import { usePreVentaStore } from "../domains/preventa/state/preventa.store";

type FocusZone = "search" | "ticket" | "cobro";

interface UsePreVentaUXDeps {
  isTurnoAbierto: boolean;
  showNotice: (msg: string) => void;
}

export function usePreVentaUX({ isTurnoAbierto, showNotice }: UsePreVentaUXDeps) {
  const [zone, setZone]           = useState<FocusZone>("search");
  const [cobroOpen, setCobroOpen] = useState(false);

  const isTurnoAbiertoRef = useRef(isTurnoAbierto);
  isTurnoAbiertoRef.current = isTurnoAbierto;

  const enterTicket = useCallback(() => setZone("ticket"), []);
  const enterSearch = useCallback(() => setZone("search"), []);

  const openCobro = useCallback(() => {
    if (!isTurnoAbiertoRef.current) {
      showNotice("Abre el turno para poder cobrar");
      return;
    }
    setCobroOpen(true);
    setZone("cobro");
  }, [showNotice]);

  const closeCobro = useCallback(() => {
    setCobroOpen(false);
    setZone("search");
  }, []);

  const newSale = useCallback(() => {
    usePreVentaStore.getState().limpiarPreVenta();
    setCobroOpen(false);
    setZone("search");
  }, []);

  return { zone, setZone, cobroOpen, setCobroOpen, enterTicket, enterSearch, openCobro, closeCobro, newSale };
}
