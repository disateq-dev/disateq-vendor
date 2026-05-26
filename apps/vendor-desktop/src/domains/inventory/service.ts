import {
  useInventoryStore,
  deriveDisponibilidad,
  deriveEstado,
  deriveReservado,
  deriveDisponibleParaOperar,
  deriveDisponibilidadEn,
} from './store';
import type { ItemOperacional, Reserva } from './types';

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

  // 0.3 — existencia derivada, nunca campo mutable
  disponibilidad(itemId: string): number {
    return deriveDisponibilidad(store().movimientos, itemId);
  },

  // 1.2 — umbral mínimo por ítem (contexto operacional CAPA 1)
  setUmbral(itemId: string, umbral: number): void {
    store().setUmbral(itemId, umbral);
  },

  // 1.1 — estado operacional derivado
  estado(itemId: string): ReturnType<typeof deriveEstado> {
    const existencia = deriveDisponibilidad(store().movimientos, itemId);
    const ctx = store().contexto.find(c => c.itemId === itemId);
    return deriveEstado(existencia, ctx?.umbralMinimo ?? 0);
  },

  // 0.4 — baja lógica (soft delete — preserva historial de movimientos)
  darDeBaja(itemId: string): void {
    store().eliminarItem(itemId);
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

  // ── 1.3 — RESERVAS OPERACIONALES ─────────────────────────────────────────

  // Reserva: señal contextual, NO movimiento físico. deriveDisponibilidad() no cambia.
  reservar(itemId: string, cantidad: number, causa: string, expiracion?: number): string {
    return store().crearReserva(itemId, cantidad, causa, expiracion);
  },

  liberarReserva(reservaId: string, motivo: string): void {
    store().liberarReserva(reservaId, motivo);
  },

  // Materializar: convierte reserva en salida CAPA 0 (I-SEP-07)
  materializarReserva(reservaId: string): void {
    store().materializarReserva(reservaId);
  },

  // Proyección: disponible para comprometer = existencia - reservado activo
  disponibleParaOperar(itemId: string): number {
    const { movimientos, reservas } = store();
    return deriveDisponibleParaOperar(movimientos, reservas, itemId);
  },

  reservadoPor(itemId: string): number {
    return deriveReservado(store().reservas, itemId);
  },

  reservasActivasPor(itemId: string): Reserva[] {
    return store().reservas.filter(r => r.itemId === itemId && r.estado === 'activa');
  },

  todasLasReservas(): Reserva[] {
    return store().reservas;
  },

  // ── RECONCILIACIÓN OPERACIONAL ────────────────────────────────────────────

  // Conteo físico → ajuste automático con causalidad explícita
  // No sobrescribe historia. El log permanece inmutable.
  // Genera movimiento de ajuste (delta firmado) si hay diferencia.
  reconciliar(
    itemId: string,
    conteoFisico: number,
    causa: string,
  ): { existenciaAntes: number; conteoFisico: number; delta: number; movimientoGenerado: boolean } {
    const existenciaAntes = deriveDisponibilidad(store().movimientos, itemId);
    const delta = conteoFisico - existenciaAntes;
    if (delta !== 0) {
      store().registrarMovimiento(itemId, 'ajuste', delta, causa);
    }
    return { existenciaAntes, conteoFisico, delta, movimientoGenerado: delta !== 0 };
  },

  // ── TEMPORALIDAD MÍNIMA ───────────────────────────────────────────────────

  // Reconstrucción simple desde log hasta un timestamp dado
  disponibilidadEn(itemId: string, hasta: number): number {
    return deriveDisponibilidadEn(store().movimientos, itemId, hasta);
  },
};
