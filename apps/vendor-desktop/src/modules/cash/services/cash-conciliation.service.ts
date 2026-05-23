import type { CashMove } from "../../../context/POSContext";
import { moneySum, moneyAdd, moneySub } from "../../../lib/money";

export interface ConciliationBreakdown {
  ingApertura:       number;
  egApertura:        number;
  ingVendido:        number;
  egVendido:         number;
  ingresosTotal:     number;
  egresosTotal:      number;
  fondoApertEsp:     number;
  fondoVendidoEsp:   number;
  efectivoEsperado:  number;
  // Arqueo operacional puro: ventas cash + ingresos − egresos (excluye fondo fijo/apertura)
  arqueoOperacional: number;
}

export function calcConciliation(
  moves: CashMove[],
  cashVendido: number,
  apertura: number,
): ConciliationBreakdown {
  const ingresos = moves.filter(m => m.type === "ingreso" && m.sourceType !== "externo");
  const egresos  = moves.filter(m => m.type === "egreso");

  const ingApertura   = moneySum(ingresos.map(m => m.fromApertura));
  const egApertura    = moneySum(egresos.map(m => m.fromApertura));
  const ingVendido    = moneySum(ingresos.map(m => m.fromVendido));
  const egVendido     = moneySum(egresos.map(m => m.fromVendido));
  const ingresosTotal = moneySum(ingresos.map(m => m.amount));
  const egresosTotal  = moneySum(egresos.map(m => m.amount));

  const fondoApertEsp    = moneySub(moneyAdd(apertura, ingApertura), egApertura);
  const fondoVendidoEsp  = moneySub(moneyAdd(cashVendido, ingVendido), egVendido);
  const efectivoEsperado = moneyAdd(fondoApertEsp, fondoVendidoEsp);
  // Arqueo operacional = solo ventas en efectivo registradas.
  // Ingresos/egresos se muestran como referencia/auditoría pero NO se reaaplican
  // sobre el monto final contado por el operador — ese monto ya los incluye implícitamente.
  const arqueoOperacional = cashVendido;

  return {
    ingApertura, egApertura, ingVendido, egVendido,
    ingresosTotal, egresosTotal,
    fondoApertEsp, fondoVendidoEsp,
    efectivoEsperado,
    arqueoOperacional,
  };
}
