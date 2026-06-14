import { create } from 'zustand';
import type { ItemOperacional, MovimientoOperacional, TipoMovimiento, ContextoItem, EstadoDisponibilidad, Reserva } from './types';
import {
  loadItems, saveItems,
  loadMovimientos, saveMovimientos,
  loadOrCreateRuntimeId,
  loadContexto, saveContexto,
  loadReservas, saveReservas,
} from './persistence';

interface InventoryState {
  runtimeId: string;
  items: ItemOperacional[];
  movimientos: MovimientoOperacional[]; // log inmutable — solo append
  contexto: ContextoItem[];
  reservas: Reserva[];
  registrarItem: (item: ItemOperacional) => void;
  registrarMovimiento: (itemId: string, tipo: TipoMovimiento, cantidad: number, causa: string) => void;
  setUmbral: (itemId: string, umbral: number) => void;
  eliminarItem: (itemId: string) => void;
  actualizarItem: (itemId: string, cambios: Partial<Pick<ItemOperacional, 'nombre' | 'unidadBase'>>) => void;
  retirarItem: (itemId: string) => void;
  eliminarItemFisico: (itemId: string) => void;
  reconstruir: () => void;
  // 1.3 — Reservas operacionales
  crearReserva: (itemId: string, cantidad: number, causa: string, expiracion?: number) => string;
  liberarReserva: (reservaId: string, motivo: string) => void;
  materializarReserva: (reservaId: string) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  runtimeId:   loadOrCreateRuntimeId(),
  items:       loadItems(),
  movimientos: loadMovimientos(),
  contexto:    loadContexto(),
  reservas:    loadReservas(),

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

  eliminarItem(itemId) {
    const { items } = get();
    const next = items.map(i => i.itemId === itemId ? { ...i, eliminado: true } : i);
    saveItems(next);
    set({ items: next });
  },

  actualizarItem(itemId, cambios) {
    const { items } = get();
    const next = items.map(i =>
      i.itemId === itemId ? { ...i, ...cambios } : i
    );
    saveItems(next);
    set({ items: next });
  },

  retirarItem(itemId) {
    const { items } = get();
    const next = items.map(i =>
      i.itemId === itemId ? { ...i, estado: 'RETIRADO' as const } : i
    );
    saveItems(next);
    set({ items: next });
  },

  eliminarItemFisico(itemId) {
    const { items } = get();
    const next = items.filter(i => i.itemId !== itemId);
    saveItems(next);
    set({ items: next });
  },

  reconstruir() {
    set({
      items:       loadItems(),
      movimientos: loadMovimientos(),
      contexto:    loadContexto(),
      reservas:    loadReservas(),
    });
  },

  // 1.3 — Reservas operacionales
  crearReserva(itemId, cantidad, causa, expiracion) {
    const { reservas, runtimeId } = get();
    const reservaId = crypto.randomUUID();
    const nueva: Reserva = {
      reservaId,
      itemId,
      cantidad,
      causa,
      timestamp: Date.now(),
      runtimeId,
      expiracion,
      estado: 'activa',
    };
    const next = [...reservas, nueva];
    saveReservas(next);
    set({ reservas: next });
    return reservaId;
  },

  liberarReserva(reservaId, motivo) {
    const { reservas } = get();
    const next = reservas.map(r =>
      r.reservaId === reservaId && r.estado === 'activa'
        ? { ...r, estado: 'liberada' as const, liberadaEn: Date.now(), liberadaCausa: motivo }
        : r
    );
    saveReservas(next);
    set({ reservas: next });
  },

  // Materializar: crea movimiento de salida CAPA 0 y marca reserva como materializada
  materializarReserva(reservaId) {
    const { reservas, movimientos, runtimeId } = get();
    const reserva = reservas.find(r => r.reservaId === reservaId && r.estado === 'activa');
    if (!reserva) return;

    const mov: MovimientoOperacional = {
      movementId: crypto.randomUUID(),
      itemId:     reserva.itemId,
      tipo:       'salida',
      cantidad:   reserva.cantidad,
      timestamp:  Date.now(),
      runtimeId,
      causa:      `materializa-reserva:${reservaId.slice(0, 8)}`,
    };
    const nextMov = [...movimientos, mov];
    saveMovimientos(nextMov);

    const nextRes = reservas.map(r =>
      r.reservaId === reservaId
        ? { ...r, estado: 'materializada' as const, liberadaEn: Date.now() }
        : r
    );
    saveReservas(nextRes);

    set({ movimientos: nextMov, reservas: nextRes });
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

// 1.3 — Reservado activo por ítem (proyección sobre reservas activas — I-SEP-01 respetado)
// deriveDisponibilidad() NO cambia su semántica; esta es la segunda función del Modelo D
export function deriveReservado(reservas: Reserva[], itemId: string): number {
  return reservas
    .filter(r => r.itemId === itemId && r.estado === 'activa')
    .reduce((acc, r) => acc + r.cantidad, 0);
}

// 1.3 — Disponible para comprometer = existencia - reservado activo (Modelo D)
export function deriveDisponibleParaOperar(
  movimientos: MovimientoOperacional[],
  reservas: Reserva[],
  itemId: string,
): number {
  return deriveDisponibilidad(movimientos, itemId) - deriveReservado(reservas, itemId);
}

// 8 — Temporalidad mínima: disponibilidad proyectada hasta un timestamp dado
// Helper para auditoría temporal sin event sourcing enterprise
export function deriveDisponibilidadEn(
  movimientos: MovimientoOperacional[],
  itemId: string,
  hasta: number,
): number {
  return movimientos
    .filter(m => m.itemId === itemId && m.timestamp <= hasta)
    .reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + m.cantidad;
      if (m.tipo === 'salida')  return acc - m.cantidad;
      return acc + m.cantidad;
    }, 0);
}
