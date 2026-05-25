import { create } from 'zustand';
import type { ItemOperacional, MovimientoOperacional, TipoMovimiento, ContextoItem, EstadoDisponibilidad } from './types';
import {
  loadItems, saveItems,
  loadMovimientos, saveMovimientos,
  loadOrCreateRuntimeId,
  loadContexto, saveContexto,
} from './persistence';

interface InventoryState {
  runtimeId: string;
  items: ItemOperacional[];
  movimientos: MovimientoOperacional[]; // log inmutable — solo append
  contexto: ContextoItem[];
  registrarItem: (item: ItemOperacional) => void;
  registrarMovimiento: (itemId: string, tipo: TipoMovimiento, cantidad: number, causa: string) => void;
  setUmbral: (itemId: string, umbral: number) => void;
  reconstruir: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  runtimeId:   loadOrCreateRuntimeId(),
  items:       loadItems(),
  movimientos: loadMovimientos(),
  contexto:    loadContexto(),

  registrarItem(item) {
    const { items } = get();
    if (items.some(i => i.itemId === item.itemId)) return;
    const next = [...items, item];
    saveItems(next);
    set({ items: next });
  },

  registrarMovimiento(itemId, tipo, cantidad, causa) {
    const { movimientos, runtimeId } = get();
    const mov: MovimientoOperacional = {
      movementId: crypto.randomUUID(),
      itemId,
      tipo,
      cantidad,
      timestamp: Date.now(),
      runtimeId,
      causa,
    };
    const next = [...movimientos, mov];
    saveMovimientos(next);
    set({ movimientos: next });
  },

  setUmbral(itemId, umbral) {
    const { contexto } = get();
    const exists = contexto.some(c => c.itemId === itemId);
    const next = exists
      ? contexto.map(c => c.itemId === itemId ? { ...c, umbralMinimo: umbral } : c)
      : [...contexto, { itemId, umbralMinimo: umbral }];
    saveContexto(next);
    set({ contexto: next });
  },

  reconstruir() {
    set({ items: loadItems(), movimientos: loadMovimientos(), contexto: loadContexto() });
  },
}));

// 1.1 — Estado operacional derivado de existencia + umbral (CAPA 1)
// umbral=0 significa sin umbral configurado → solo agotado/disponible
export function deriveEstado(existencia: number, umbral: number): EstadoDisponibilidad {
  if (existencia <= 0)      return 'agotado';
  if (umbral > 0 && existencia <= umbral) return 'bajo_stock';
  return 'disponible';
}

// 0.3 — Disponibilidad derivada desde el log de movimientos
// Nunca un contador mutable: proyección pura sobre eventos (AP-01 evitado)
export function deriveDisponibilidad(
  movimientos: MovimientoOperacional[],
  itemId: string,
): number {
  return movimientos
    .filter(m => m.itemId === itemId)
    .reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + m.cantidad;
      if (m.tipo === 'salida')  return acc - m.cantidad;
      return acc + m.cantidad; // ajuste: delta firmado
    }, 0);
}
