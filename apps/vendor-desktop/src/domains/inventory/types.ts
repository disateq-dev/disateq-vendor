export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

// 0.1 — Identidad mínima de ítem
export interface ItemOperacional {
  itemId: string;
  nombre: string;
  unidadBase: string;
}

// 0.2 — Movimiento operacional con causalidad mínima
export interface MovimientoOperacional {
  movementId: string;
  itemId: string;
  tipo: TipoMovimiento;
  cantidad: number; // entrada/salida: positivo; ajuste: delta firmado
  timestamp: number;
  runtimeId: string;
  causa: string;
}
