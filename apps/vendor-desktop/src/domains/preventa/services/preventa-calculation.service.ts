import type { LineaPreVenta } from "../dto/LineaPreVenta";

export interface TotalesPreVenta {
  subtotal: number;
  tax: number;
  total: number;
}

export const calcularTotalesPreVenta = (
  lineas: LineaPreVenta[],
  tasaIGV: number
): TotalesPreVenta => {
  const subtotal = lineas.reduce((acc, line) => acc + line.subtotal, 0);
  const tax      = subtotal * tasaIGV;
  const total    = subtotal + tax;
  return { subtotal, tax, total };
};
