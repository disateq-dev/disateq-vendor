import { createTicketLine } from "../state/ticket.actions";
import { useTicketStore } from "../state/ticket.store";
import {
  obtenerPedidoActivoOCrear,
  sincronizarConcrecion,
  traducirATicketLine,
  type AddProductBridgeInput
} from "../../sales/bridge-pedido";
import { agregarLinea } from '../../sales/pedido.service'

type AddProductInput = {
  productId:    string;
  description:  string;
  barcode:      string;
  unitPrice:    number;
  presentacion?: string;
  tipoPrecio?:   string;
};

let _pedidoActivoId: string | null = null;

export const ticketService = {

  addProduct(input: AddProductInput) {
    useTicketStore.getState().addLine(
      createTicketLine({
        productId:    input.productId,
        description:  input.description,
        barcode:      input.barcode,
        quantity:     1,
        unitPrice:    input.unitPrice,
        presentacion: input.presentacion,
        tipoPrecio:   input.tipoPrecio,
      }),
    );
  },

  addProductFromHOV(input: AddProductBridgeInput) {
    if (!_pedidoActivoId) {
      _pedidoActivoId = obtenerPedidoActivoOCrear(
        input.contextoOperacionalId,
        input.identidadOperacionalId,
        input.operadorId
      );
    }
    if (_pedidoActivoId) {
      try {
        agregarLinea({
          pedidoId: _pedidoActivoId,
          hovId: input.hovId,
          cantidad: input.cantidad,
          contextoOperacionalId: input.contextoOperacionalId,
          identidadOperacionalId: input.identidadOperacionalId,
          margenMinimoConfigurable: input.margenMinimoConfigurable,
          operadorTieneCapacidadLibre: input.operadorTieneCapacidadLibre,
          operadorId: input.operadorId,
        });
      } catch {
        // fallo silencioso · el ticket visual no se ve afectado
      }
    }
    useTicketStore.getState().addLine(
      traducirATicketLine(input),
    );
  },

  obtenerPedidoActivoOCrear(
    contextoOperacionalId: string,
    identidadOperacionalId: string,
    operadorId: string
  ): string {
    if (_pedidoActivoId) return _pedidoActivoId;
    _pedidoActivoId = obtenerPedidoActivoOCrear(
      contextoOperacionalId,
      identidadOperacionalId,
      operadorId
    );
    return _pedidoActivoId;
  },

  concretarVenta(pedidoId: string): void {
    sincronizarConcrecion(pedidoId);
    _pedidoActivoId = null;
  },

  incrementLine(lineId: string) {
    const state = useTicketStore.getState();
    const line = state.linesById[lineId];
    if (!line) return;
    state.updateQuantity(lineId, line.quantity + 1);
  },

  decrementLine(lineId: string) {
    const state = useTicketStore.getState();
    const line = state.linesById[lineId];
    if (!line || line.quantity <= 1) return;
    state.updateQuantity(lineId, line.quantity - 1);
  },

  removeLine(lineId: string) {
    useTicketStore.getState().removeLine(lineId);
  },

  openLineNote(lineId: string) {
    useTicketStore.getState().openNoteFor(lineId);
  },

  saveLineNote(lineId: string, note: string) {
    useTicketStore.getState().splitLine(lineId, note);
  },

  clear() {
    useTicketStore.getState().clearTicket();
    _pedidoActivoId = null;
  },

};
