import { create } from 'zustand';
import type { CompraOperacional, EstadoCompra } from './types';
import { loadCompras, saveCompras, loadOrCreateRuntimeId } from './persistence';

interface PurchasesState {
  runtimeId: string;
  compras: CompraOperacional[];
  registrarCompra: (compra: CompraOperacional) => void;
  actualizarEstado: (purchaseId: string, estado: EstadoCompra) => void;
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
}));
