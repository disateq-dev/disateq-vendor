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
  recibirLineas(purchaseId: string, lineas: LineaCompra[]): void {
    const causal = `compra:${purchaseId.slice(0, 8)}`;
    for (const linea of lineas) {
      inventoryService.registrarEntrada(linea.itemId, linea.cantidad, causal);
    }
    store().actualizarEstado(purchaseId, 'recibida');
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
