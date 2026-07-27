import type { TipoValorOperacional } from '../../catalog/valor-operacional.types'
import { crearLineaPreVenta } from "../state/preventa.actions";
import { usePreVentaStore } from "../state/preventa.store";
import {
  obtenerPedidoActivoOCrear,
  sincronizarConcrecion,
  traducirALineaPreVenta,
  type AddProductBridgeInput
} from "../../sales/bridge-pedido";
import { cargarPedidosActivosDesdeSQLite } from "../../sales/pedido.store";
import { agregarLinea, modificarCantidad, suspenderLinea, abandonarPedido } from '../../sales/pedido.service'

type AddProductInput = {
  hovId:         string;
  descripcion:   string;
  codigoBarras?: string;
  valorUnitario: number;
  presentacion?: string;
  tipoPrecio?:   TipoValorOperacional;
};

let _pedidoActivoId: string | null = null;

export const preVentaService = {

  agregarProducto(input: AddProductInput) {
    usePreVentaStore.getState().agregarLinea(
      crearLineaPreVenta({
        hovId:         input.hovId,
        descripcion:   input.descripcion,
        codigoBarras:  input.codigoBarras ?? '',
        cantidad:      1,
        valorUnitario: input.valorUnitario,
        presentacion:  input.presentacion,
        tipoPrecio:    input.tipoPrecio,
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
    if (!_pedidoActivoId) return;
    let pedidoActualizado;
    try {
      pedidoActualizado = agregarLinea({
        pedidoId: _pedidoActivoId,
        hovId: input.hovId,
        cantidad: input.cantidad,
        contextoOperacionalId: input.contextoOperacionalId,
        identidadOperacionalId: input.identidadOperacionalId,
        margenMinimoConfigurable: input.margenMinimoConfigurable,
        operadorTieneCapacidadLibre: input.operadorTieneCapacidadLibre,
        operadorId: input.operadorId,
        valorManual: input.tipoValor === 'LIBRE' ? input.valorUnitario : null,
      });
    } catch {
      return;
    }
    const lineaCreada = pedidoActualizado.lineas[pedidoActualizado.lineas.length - 1];
    usePreVentaStore.getState().agregarLinea(
      traducirALineaPreVenta(input, lineaCreada.id),
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

  async concretarVenta(pedidoId: string, metodoPago: string, tipoComprobante: string, sesionId: string | null, cajaCodigo: string | null): Promise<{ ok: boolean }> {
    const resultado = await sincronizarConcrecion(pedidoId, metodoPago, tipoComprobante, sesionId, cajaCodigo)
    _pedidoActivoId = null
    return resultado
  },

  incrementarLinea(lineaId: string, operadorId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineaId];
    if (!line) return;
    if (!_pedidoActivoId) return;
    try {
      modificarCantidad({
        pedidoId: _pedidoActivoId,
        lineaId,
        nuevaCantidad: line.cantidad + 1,
        operadorId,
      });
    } catch {
      return;
    }
    state.actualizarCantidad(lineaId, line.cantidad + 1);
  },

  decrementarLinea(lineaId: string, operadorId: string) {
    const state = usePreVentaStore.getState();
    const line = state.linesById[lineaId];
    if (!line || line.cantidad <= 1) return;
    if (!_pedidoActivoId) return;
    try {
      modificarCantidad({
        pedidoId: _pedidoActivoId,
        lineaId,
        nuevaCantidad: line.cantidad - 1,
        operadorId,
      });
    } catch {
      return;
    }
    state.actualizarCantidad(lineaId, line.cantidad - 1);
  },

  quitarLinea(lineaId: string, operadorId: string) {
    if (_pedidoActivoId) {
      try {
        suspenderLinea({
          pedidoId: _pedidoActivoId,
          lineaId,
          operadorId,
        });
      } catch {
        return;
      }
    }
    usePreVentaStore.getState().quitarLinea(lineaId);
  },

  abrirNotaLinea(lineaId: string) {
    usePreVentaStore.getState().abrirNotaLinea(lineaId);
  },

  guardarNotaLinea(lineaId: string, nota: string) {
    usePreVentaStore.getState().splitLinea(lineaId, nota);
  },

  limpiar(operadorId: string) {
    if (_pedidoActivoId) {
      try {
        abandonarPedido(_pedidoActivoId, operadorId, "Ticket limpiado por el operador");
      } catch {}
    }
    usePreVentaStore.getState().limpiarPreVenta();
    _pedidoActivoId = null;
  },

  async inicializar(): Promise<void> {
    await cargarPedidosActivosDesdeSQLite()
  },

};
