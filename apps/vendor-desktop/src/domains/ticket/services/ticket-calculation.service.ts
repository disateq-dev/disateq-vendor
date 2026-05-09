import type { TicketLineDTO } from "../dto/TicketLineDTO";

export interface TicketTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export const calculateTicketTotals = (
  lines: TicketLineDTO[]
): TicketTotals => {
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