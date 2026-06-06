import { crearLineaPreVenta } from "../state/preventa.actions";
import { usePreVentaStore } from "../state/preventa.store";
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

export const preVentaService = {

  agregarProducto(input: AddProductInput) {
    usePreVentaStore.getState().agregarLinea(
      crearLineaPreVenta({
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

  agregarProductoDesdeHOV(input: AddProductBridgeInput) {
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
    usePreVentaStore.getState().agregarLinea(
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

  incrementarLinea(lineId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineId];
    if (!line) return;
    state.updateQuantity(lineId, line.quantity + 1);
  },

  decrementarLinea(lineId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineId];
    if (!line || line.quantity <= 1) return;
    state.updateQuantity(lineId, line.quantity - 1);
  },

  quitarLinea(lineId: string) {
    usePreVentaStore.getState().quitarLinea(lineId);
  },

  abrirNotaLinea(lineId: string) {
    usePreVentaStore.getState().abrirNotaLinea(lineId);
  },

  guardarNotaLinea(lineId: string, note: string) {
    usePreVentaStore.getState().splitLinea(lineId, note);
  },

  limpiar() {
    usePreVentaStore.getState().limpiarPreVenta();
    _pedidoActivoId = null;
  },

};
