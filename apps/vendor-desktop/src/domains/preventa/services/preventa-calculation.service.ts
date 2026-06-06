import type { LineaPreVenta } from "../dto/LineaPreVenta";

export interface TotalesPreVenta {
  subtotal: number;
  tax: number;
  total: number;
}

export const calcularTotalesPreVenta = (
  lines: LineaPreVenta[]
): TotalesPreVenta => {
  const subtotal = lines.reduce(
    (accumulator, line) =>
      accumulator + line.subtotal,
    0
  );

  const tax = subtotal * 0.18;

  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
  };
};
