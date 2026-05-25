import type { ItemOperacional, MovimientoOperacional } from './types';

// 0.5 — Persistencia local edge-first (localStorage)
// Prefijo inv_v0_ para evitar colisión con otros módulos

const K = {
  items:      'inv_v0_items',
  movimientos:'inv_v0_movimientos',
  runtimeId:  'inv_v0_runtime_id',
} as const;

function tryParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadItems(): ItemOperacional[] {
  return tryParse(localStorage.getItem(K.items), []);
}

export function saveItems(items: ItemOperacional[]): void {
  localStorage.setItem(K.items, JSON.stringify(items));
}

export function loadMovimientos(): MovimientoOperacional[] {
  return tryParse(localStorage.getItem(K.movimientos), []);
}

export function saveMovimientos(movimientos: MovimientoOperacional[]): void {
  localStorage.setItem(K.movimientos, JSON.stringify(movimientos));
}

// runtimeId persiste entre sesiones — identidad del runtime edge
export function loadOrCreateRuntimeId(): string {
  const existing = localStorage.getItem(K.runtimeId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(K.runtimeId, id);
  return id;
}
