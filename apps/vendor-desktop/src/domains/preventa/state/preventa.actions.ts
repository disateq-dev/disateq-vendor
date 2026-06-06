import type { LineaPreVenta } from "../dto/LineaPreVenta";
import { moneyMul } from "../../../lib/money";

export const crearLineaPreVenta = (
  payload: {
    hovId: string;
    descripcion: string;

    codigoBarras?: string;

    cantidad: number;
    valorUnitario: number;

    presentacion?: string;
    tipoPrecio?: string;
  }
): LineaPreVenta => {
  const subtotal = moneyMul(payload.cantidad, payload.valorUnitario);

  return {
    lineaId: crypto.randomUUID(),

    hovId: payload.hovId,

    descripcion: payload.descripcion,

    codigoBarras: payload.codigoBarras,

    cantidad: payload.cantidad,

    valorUnitario: payload.valorUnitario,

    subtotal,

    presentacion: payload.presentacion,

    tipoPrecio: payload.tipoPrecio,

    flags: {
      esPrecioManual: false,
      esRecuperada: false,
    },
  };
};
