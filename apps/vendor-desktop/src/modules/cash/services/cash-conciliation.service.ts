import type { CashMove } from "../../../context/POSContext";

export interface ConciliationBreakdown {
  ingApertura:      number;
  egApertura:       number;
  ingVendido:       number;
  egVendido:        number;
  ingresosTotal:    number;
  egresosTotal:     number;
  fondoApertEsp:    number;
  fondoVendidoEsp:  number;
  efectivoEsperado: number;
}

export function calcConciliation(
  moves: CashMove[],
  cashVendido: number,
  apertura: number,
): ConciliationBreakdown {
  const ingresos = moves.filter(m => m.type === "ingreso");
  const egresos  = moves.filter(m => m.type === "egreso");

  const ingApertura   = ingresos.reduce((s, m) => s + m.fromApertura, 0);
  const egApertura    = egresos.reduce((s, m)  => s + m.fromApertura, 0);
  const ingVendido    = ingresos.reduce((s, m) => s + m.fromVendido,  0);
  const egVendido     = egresos.reduce((s, m)  => s + m.fromVendido,  0);
  const ingresosTotal = ingresos.reduce((s, m) => s + m.amount, 0);
  const egresosTotal  = egresos.reduce((s, m)  => s + m.amount, 0);

  const fondoApertEsp    = apertura + ingApertura - egApertura;
  const fondoVendidoEsp  = cashVendido + ingVendido - egVendido;
  const efectivoEsperado = fondoApertEsp + fondoVendidoEsp;

  return {
    ingApertura, egApertura, ingVendido, egVendido,
    ingresosTotal, egresosTotal,
    fondoApertEsp, fondoVendidoEsp,
    efectivoEsperado,
  };
}
