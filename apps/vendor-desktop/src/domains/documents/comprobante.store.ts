import type {
  Comprobante,
  ComprobanteStore,
  EstadoSUNAT,
  TipoComprobante,
} from './comprobante.types'

const STORAGE_KEY = 'disateq:documents:comprobantes'

function createEmptyStore(): ComprobanteStore {
  return {
    comprobantes: [],
    ultimaSincronizacion: null,
  }
}

function loadStore(): ComprobanteStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyStore()

    const parsed = JSON.parse(raw) as Partial<ComprobanteStore>

    return {
      comprobantes: Array.isArray(parsed.comprobantes) ? parsed.comprobantes as Comprobante[] : [],
      ultimaSincronizacion: typeof parsed.ultimaSincronizacion === 'string'
        ? parsed.ultimaSincronizacion
        : null,
    }
  } catch {
    return createEmptyStore()
  }
}

let store: ComprobanteStore = loadStore()

function persistStore(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const comprobanteStore = {
  getComprobanteById(id: string): Comprobante | null {
    return store.comprobantes.find(comprobante => comprobante.id === id) ?? null
  },

  getComprobanteByCodigo(codigoUnico: string): Comprobante | null {
    return store.comprobantes.find(comprobante => comprobante.codigoUnico === codigoUnico) ?? null
  },

  getComprobantesPorPedido(pedidoId: string): Comprobante[] {
    return store.comprobantes
      .filter(comprobante => comprobante.pedidoId === pedidoId)
      .sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn))
  },

  getComprobantesPorTipo(tipo: TipoComprobante): Comprobante[] {
    return store.comprobantes
      .filter(comprobante => comprobante.tipo === tipo)
      .sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn))
  },

  getUltimoCorrelativoPorSerie(serie: string): number {
    return store.comprobantes
      .filter(comprobante => comprobante.serie === serie)
      .reduce((max, comprobante) => Math.max(max, comprobante.correlativo), 0)
  },

  getComprobantesPendientesSUNAT(): Comprobante[] {
    return store.comprobantes
      .filter(comprobante => comprobante.estadoSUNAT === 'PENDIENTE')
      .sort((a, b) => a.emitidoEn.localeCompare(b.emitidoEn))
  },

  guardarComprobante(comprobante: Comprobante): Comprobante {
    const exists = store.comprobantes.some(item => item.id === comprobante.id)

    store = {
      ...store,
      comprobantes: exists
        ? store.comprobantes.map(item => item.id === comprobante.id ? comprobante : item)
        : [...store.comprobantes, comprobante],
      ultimaSincronizacion: new Date().toISOString(),
    }

    persistStore()
    return comprobante
  },

  actualizarEstadoSUNAT(
    id: string,
    estadoSUNAT: EstadoSUNAT,
    cdr: string | null
  ): Comprobante | null {
    const comprobante = this.getComprobanteById(id)
    if (!comprobante) return null

    const updated: Comprobante = {
      ...comprobante,
      estadoSUNAT,
      cdr,
      fechaEnvioSUNAT: estadoSUNAT === 'ENVIADO'
        ? new Date().toISOString()
        : comprobante.fechaEnvioSUNAT,
    }

    this.guardarComprobante(updated)
    return updated
  },
}
