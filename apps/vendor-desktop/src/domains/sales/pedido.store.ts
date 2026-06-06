import type { Pedido, PedidoStore } from "./pedido.types";

const STORAGE_KEY = "disateq:sales:pedidos";

function cargarStore(): PedidoStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pedidos: [], ultimaSincronizacion: null };
    return JSON.parse(raw) as PedidoStore;
  } catch {
    return { pedidos: [], ultimaSincronizacion: null };
  }
}

function persistirStore(store: PedidoStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // offline first · fallo silencioso
  }
}

const _store: PedidoStore = cargarStore();

export const pedidoStore = {

  getPedidoById(id: string): Pedido | null {
    return _store.pedidos.find(p => p.id === id) ?? null;
  },

  getPedidoByCodigo(codigo: string): Pedido | null {
    return _store.pedidos.find(p => p.codigo === codigo) ?? null;
  },

  getPedidosAbiertos(contextoOperacionalId: string): Pedido[] {
    return _store.pedidos
      .filter(p =>
        p.estado === "ABIERTO" &&
        (contextoOperacionalId === "" ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) =>
        b.momentoApertura.localeCompare(a.momentoApertura)
      );
  },

  getPedidosActivos(contextoOperacionalId: string): Pedido[] {
    const estadosActivos = ["ABIERTO", "CONFIRMADO", "EN_COBRO"];
    return _store.pedidos
      .filter(p =>
        estadosActivos.includes(p.estado) &&
        (contextoOperacionalId === "" ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) =>
        b.momentoApertura.localeCompare(a.momentoApertura)
      );
  },

  getPedidosConcretados(contextoOperacionalId: string): Pedido[] {
    return _store.pedidos
      .filter(p =>
        p.estado === "CONCRETADO" &&
        (contextoOperacionalId === "" ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) =>
        (b.momentoConcrecion ?? "")
          .localeCompare(a.momentoConcrecion ?? "")
      );
  },

  guardarPedido(pedido: Pedido): Pedido {
    const idx = _store.pedidos.findIndex(p => p.id === pedido.id);
    if (idx >= 0) {
      _store.pedidos[idx] = pedido;
    } else {
      _store.pedidos.push(pedido);
    }
    persistirStore(_store);
    return pedido;
  },

};
