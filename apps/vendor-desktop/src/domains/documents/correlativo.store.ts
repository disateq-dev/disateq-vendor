import type { CorrelativoStore, RegistroCorrelativo } from './correlativo.types'
import type { TipoComprobante } from './comprobante.types'

const STORAGE_KEY = 'disateq:documents:correlativos'

function createEmptyStore(): CorrelativoStore {
  return { registros: [] }
}

function loadStore(): CorrelativoStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyStore()
    const parsed = JSON.parse(raw) as Partial<CorrelativoStore>
    return {
      registros: Array.isArray(parsed.registros) ? parsed.registros as RegistroCorrelativo[] : [],
    }
  } catch {
    return createEmptyStore()
  }
}

function persistStore(store: CorrelativoStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

let store: CorrelativoStore = loadStore()

export const correlativoStore = {

  obtenerSiguiente(serie: string): number {
    const registro = store.registros.find(r => r.serie === serie)
    return registro ? registro.siguiente : 1
  },

  confirmarEmision(serie: string, numeroUsado: number): void {
    const now = new Date().toISOString()
    const existe = store.registros.some(r => r.serie === serie)
    store = {
      registros: existe
        ? store.registros.map(r =>
            r.serie === serie
              ? { ...r, ultimoEmitido: numeroUsado, siguiente: numeroUsado + 1, actualizadoEn: now }
              : r
          )
        : store.registros,
    }
    persistStore(store)
  },

  inicializarSerie(serie: string, tipo: TipoComprobante, desde: number): RegistroCorrelativo {
    const now = new Date().toISOString()
    const existente = store.registros.find(r => r.serie === serie)
    if (existente) {
      if (desde > existente.siguiente) {
        store = {
          registros: store.registros.map(r =>
            r.serie === serie ? { ...r, siguiente: desde, actualizadoEn: now } : r
          ),
        }
        persistStore(store)
        return store.registros.find(r => r.serie === serie)!
      }
      return existente
    }
    const nuevo: RegistroCorrelativo = {
      serie,
      tipo,
      siguiente: desde,
      ultimoEmitido: desde - 1,
      creadoEn: now,
      actualizadoEn: now,
    }
    store = { registros: [...store.registros, nuevo] }
    persistStore(store)
    return nuevo
  },

  obtenerRegistros(): RegistroCorrelativo[] {
    return [...store.registros]
  },
}
