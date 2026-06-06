import type { LineaPreVenta } from "../dto/LineaPreVenta";
import { moneyMul } from "../../../lib/money";

export const crearLineaPreVenta = (
  payload: {
    productId: string;
    description: string;

    barcode?: string;

    quantity: number;
    unitPrice: number;
  }
): LineaPreVenta => {
  const subtotal = moneyMul(payload.quantity, payload.unitPrice);

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
