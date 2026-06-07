import { useState, useCallback } from "react";
import type { Comprobante } from "../domains/documents/comprobante.types";
import { comprobanteStore } from "../domains/documents/comprobante.store";
import type { CashSession } from "../context/POSContext";

function cargarComprobantes(): Comprobante[] {
  return comprobanteStore.getComprobantesPorTipo('TIQUE_VENTA')
    .concat(comprobanteStore.getComprobantesPorTipo('BOLETA'))
    .concat(comprobanteStore.getComprobantesPorTipo('FACTURA'))
    .concat(comprobanteStore.getComprobantesPorTipo('COTIZACION'))
    .sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn));
}

interface UseComprobantesDeps {
  cashSessionRef: React.RefObject<CashSession>;
  addOpLog: (text: string) => void;
  addTurnEvent: (sk: string, type: string, text: string) => void;
  onAnulacion: (c: Comprobante) => void;
}

export function useComprobantes({
  cashSessionRef,
  addOpLog,
  addTurnEvent,
  onAnulacion,
}: UseComprobantesDeps) {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>(cargarComprobantes);

  const addComprobante = useCallback((comprobante: Comprobante) => {
    const s = cashSessionRef.current;
    const sk = s.cashBox && s.openedAt
      ? `${s.cashBox.code}-${s.openedAt.toISOString()}`
      : "";
    comprobanteStore.guardarComprobante(
      sk ? { ...comprobante, sessionKey: sk } : comprobante
    );
    setComprobantes(cargarComprobantes());
    if (sk) {
      const correlStr = String(comprobante.correlativo).padStart(8, "0");
      addTurnEvent(sk, "comprobante", `Comprobante ${comprobante.serie}-${correlStr} generado`);
    }
  }, [cashSessionRef, addTurnEvent]);

  const voidComprobante = useCallback((id: string, motivo: string) => {
    const c = comprobanteStore.getComprobanteById(id);
    if (!c || c.estado === "ANULADO") return;
    const s = cashSessionRef.current;
    onAnulacion(c);
    comprobanteStore.guardarComprobante({
      ...c,
      estado: "ANULADO",
      motivoAnulacion: motivo,
    });
    setComprobantes(cargarComprobantes());
    const correlStr = String(c.correlativo).padStart(8, "0");
    addOpLog(`${s.operator} anuló ${c.serie}-${correlStr} — ${motivo}`);
    const sk = s.cashBox && s.openedAt
      ? `${s.cashBox.code}-${s.openedAt.toISOString()}`
      : "";
    addTurnEvent(sk, "anulacion", `Comprobante ${c.serie}-${correlStr} anulado`);
  }, [cashSessionRef, addOpLog, addTurnEvent, onAnulacion]);

  return { comprobantes, addComprobante, voidComprobante };
}
