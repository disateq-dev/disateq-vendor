import type { CorrelativoStore, RegistroCorrelativo } from './correlativo.types'
import type { TipoComprobante } from './comprobante.types'

function createEmptyStore(): CorrelativoStore {
  return { registros: [] }
}

let store: CorrelativoStore = createEmptyStore()

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
    return nuevo
  },

  obtenerRegistros(): RegistroCorrelativo[] {
    return [...store.registros]
  },

  hidratarDesdeDb(registros: RegistroCorrelativo[]): void {
    store = { registros: [...registros] }
  },
}
