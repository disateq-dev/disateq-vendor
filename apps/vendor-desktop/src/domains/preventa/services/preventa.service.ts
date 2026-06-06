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
        hovId:         input.productId,
        descripcion:   input.description,
        codigoBarras:  input.barcode,
        cantidad:      1,
        valorUnitario: input.unitPrice,
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

  incrementarLinea(lineaId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineaId];
    if (!line) return;
    state.actualizarCantidad(lineaId, line.cantidad + 1);
  },

  decrementarLinea(lineaId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineaId];
    if (!line || line.cantidad <= 1) return;
    state.actualizarCantidad(lineaId, line.cantidad - 1);
  },

  quitarLinea(lineaId: string) {
    usePreVentaStore.getState().quitarLinea(lineaId);
  },

  abrirNotaLinea(lineaId: string) {
    usePreVentaStore.getState().abrirNotaLinea(lineaId);
  },

  guardarNotaLinea(lineaId: string, nota: string) {
    usePreVentaStore.getState().splitLinea(lineaId, nota);
  },

  limpiar() {
    usePreVentaStore.getState().limpiarPreVenta();
    _pedidoActivoId = null;
  },

};
