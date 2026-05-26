import { create } from 'zustand';
import type { CompraOperacional, EstadoCompra } from './types';
import { loadCompras, saveCompras, loadOrCreateRuntimeId } from './persistence';

interface PurchasesState {
  runtimeId: string;
  compras: CompraOperacional[];
  registrarCompra: (compra: CompraOperacional) => void;
  actualizarEstado: (purchaseId: string, estado: EstadoCompra) => void;
  actualizarRecepcionLinea: (purchaseId: string, lineaId: string, deltaRecibida: number) => void;
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  runtimeId: loadOrCreateRuntimeId(),
  compras: loadCompras(),

  registrarCompra(compra) {
    const next = [...get().compras, compra];
    saveCompras(next);
    set({ compras: next });
  },

  actualizarEstado(purchaseId, estado) {
    const next = get().compras.map(c =>
      c.purchaseId === purchaseId ? { ...c, estado } : c
    );
    saveCompras(next);
    set({ compras: next });
  },

  actualizarRecepcionLinea(purchaseId, lineaId, deltaRecibida) {
    const next = get().compras.map(c => {
      if (c.purchaseId !== purchaseId) return c;
      const lineas = c.lineas.map(l =>
        l.lineaId === lineaId
          ? { ...l, cantidadRecibida: (l.cantidadRecibida ?? 0) + deltaRecibida }
          : l
      );
      const todasCompletas = lineas.every(l => (l.cantidadRecibida ?? 0) >= l.cantidad);
      const algunaRecibida = lineas.some(l => (l.cantidadRecibida ?? 0) > 0);
      const estado: EstadoCompra = todasCompletas ? 'recibida' : algunaRecibida ? 'recibida_parcial' : 'registrada';
      return { ...c, lineas, estado };
    });
    saveCompras(next);
    set({ compras: next });
  },
}));
