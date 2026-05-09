import type { TicketLineDTO } from "../dto/TicketLineDTO";

export const createTicketLine = (
  payload: {
    productId: string;
    description: string;

    barcode?: string;

    quantity: number;
    unitPrice: number;
  }
): TicketLineDTO => {
  const subtotal =
    payload.quantity *
    payload.unitPrice;

  return {
    lineId: crypto.randomUUID(),

    productId: payload.productId,

    description: payload.description,

    barcode: payload.barcode,

    quantity: payload.quantity,

    unitPrice: payload.unitPrice,

    subtotal,

    flags: {
      isManualPrice: false,
      isRecovered: false,
    },
  };
};