export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

// 0.1 — Identidad mínima de ítem
export interface ItemOperacional {
  itemId: string;
  nombre: string;
  unidadBase: string;
  eliminado?: boolean;
  estado?: 'ACTIVO' | 'RETIRADO';
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

// 1.1 — Estado operacional derivado de existencia + contexto de umbral
export type EstadoDisponibilidad = 'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO';

// 1.2 — Contexto operacional por ítem (umbralMinimo=0 → sin umbral configurado)
export interface ContextoItem {
  itemId: string;
  umbralMinimo: number;
}

// 1.3 — Reserva operacional mínima (Modelo D — separación como capa de contexto)
// La reserva NO altera deriveDisponibilidad() — es señal contextual, no movimiento físico
// deriveDisponibilidad() sigue siendo proyección pura de existencia física
// deriveDisponibleParaOperar() = existencia - reservado activo
export type EstadoReserva = 'activa' | 'materializada' | 'liberada';

export interface Reserva {
  reservaId: string;
  itemId: string;
  cantidad: number;
  causa: string;         // señal causal mínima
  timestamp: number;
  runtimeId: string;
  expiracion?: number;   // unix ms — opcional; sin expiración = contexto del día
  estado: EstadoReserva;
  liberadaEn?: number;
  liberadaCausa?: string;
}
