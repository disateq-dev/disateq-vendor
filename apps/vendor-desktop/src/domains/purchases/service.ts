import { usePurchasesStore } from './store';
import { inventoryService } from '../inventory/service';
import type { CompraOperacional, EstadoCompra, LineaCompra } from './types';

// Boundary de servicio — modules → purchasesService → inventoryService
// COMPRAS conserva causalidad comercial; INVENTARIOS conserva existencia
const store = () => usePurchasesStore.getState();

export const purchasesService = {
  registrarCompra(
    params: Omit<CompraOperacional, 'purchaseId' | 'timestamp' | 'runtimeId' | 'estado'>,
  ): string {
    const purchaseId = crypto.randomUUID();
    const { runtimeId } = store();
    const compra: CompraOperacional = {
      ...params,
      purchaseId,
      timestamp: Date.now(),
      runtimeId,
      estado: 'registrada',
    };
    store().registrarCompra(compra);
    return purchaseId;
  },

  // Registrar entradas en INVENTARIOS — causalidad explícita "compra:XXXX"
  // Solo registra el delta pendiente (cantidad - cantidadRecibida) para evitar doble entrada
  recibirLineas(purchaseId: string, lineas: LineaCompra[]): void {
    const causal = `compra:${purchaseId.slice(0, 8)}`;
    for (const linea of lineas) {
      const delta = linea.cantidad - (linea.cantidadRecibida ?? 0);
      if (delta > 0) {
        inventoryService.registrarEntrada(linea.itemId, delta, causal);
        store().actualizarRecepcionLinea(purchaseId, linea.lineaId, delta);
      }
    }
  },

  // Recepción parcial incremental — registra solo las cantidades ingresadas ahora
  recibirParcial(
    purchaseId: string,
    recepciones: Array<{ lineaId: string; itemId: string; cantidad: number }>,
  ): void {
    const causal = `compra:${purchaseId.slice(0, 8)}`;
    for (const r of recepciones) {
      if (r.cantidad <= 0) continue;
      inventoryService.registrarEntrada(r.itemId, r.cantidad, causal);
      store().actualizarRecepcionLinea(purchaseId, r.lineaId, r.cantidad);
    }
  },

  actualizarEstado(purchaseId: string, estado: EstadoCompra): void {
    store().actualizarEstado(purchaseId, estado);
  },

  todasLasCompras(): CompraOperacional[] {
    return store().compras;
  },

  buscarPorId(purchaseId: string): CompraOperacional | undefined {
    return store().compras.find(c => c.purchaseId === purchaseId);
  },
};
