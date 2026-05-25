import { useInventoryStore, deriveDisponibilidad } from './store';
import type { ItemOperacional } from './types';

// Boundary de servicio — módulos usan inventoryService, no el store directamente

const store = () => useInventoryStore.getState();

export const inventoryService = {
  // 0.1
  registrarItem(item: ItemOperacional): void {
    store().registrarItem(item);
  },

  // 0.2
  registrarEntrada(itemId: string, cantidad: number, causa: string): void {
    store().registrarMovimiento(itemId, 'entrada', cantidad, causa);
  },

  registrarSalida(itemId: string, cantidad: number, causa: string): void {
    store().registrarMovimiento(itemId, 'salida', cantidad, causa);
  },

  registrarAjuste(itemId: string, delta: number, causa: string): void {
    store().registrarMovimiento(itemId, 'ajuste', delta, causa);
  },

  // 0.3 — disponibilidad derivada, nunca campo mutable
  disponibilidad(itemId: string): number {
    return deriveDisponibilidad(store().movimientos, itemId);
  },

  // 0.6 — reconstrucción desde log (valida continuidad operacional)
  reconstruirDesdeLog(): void {
    store().reconstruir();
  },

  // diagnóstico runtime — para validación 0.6
  diagnostico(): { runtimeId: string; items: number; movimientos: number } {
    const { runtimeId, items, movimientos } = store();
    return { runtimeId, items: items.length, movimientos: movimientos.length };
  },
};
