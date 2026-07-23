import type { EstadoValorOperacional, ValorOperacional, ValorOperacionalStore } from './valor-operacional.types'

function createEmptyStore(): ValorOperacionalStore {
  return {
    valores: [],
    ultimaSincronizacion: null,
  }
}

let store: ValorOperacionalStore = createEmptyStore()

export function getValoresPorHOV(hovId: string): ValorOperacional[] {
  return store.valores
    .filter(valor => valor.hovId === hovId)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

export function getValoresActivosPorHOV(hovId: string): ValorOperacional[] {
  return store.valores.filter(valor =>
    valor.hovId === hovId &&
    valor.estado === 'ACTIVO'
  )
}

export function getValorById(id: string): ValorOperacional | null {
  return store.valores.find(valor => valor.id === id) ?? null
}

export function getValoresActivos(): ValorOperacional[] {
  return store.valores.filter(valor => valor.estado === 'ACTIVO')
}

export function guardarValor(valor: ValorOperacional): ValorOperacional {
  const idx = store.valores.findIndex(item => item.id === valor.id)
  if (idx >= 0) {
    store = {
      ...store,
      valores: store.valores.map(item => item.id === valor.id ? valor : item),
      ultimaSincronizacion: new Date().toISOString(),
    }
  } else {
    store = {
      ...store,
      valores: [...store.valores, valor],
      ultimaSincronizacion: new Date().toISOString(),
    }
  }
  return valor
}

export function actualizarEstado(id: string, estado: EstadoValorOperacional): ValorOperacional | null {
  const valor = getValorById(id)
  if (!valor) return null

  const updated: ValorOperacional = {
    ...valor,
    estado,
    modificadoEn: new Date().toISOString(),
  }

  guardarValor(updated)
  return updated
}

export function resetValorStore(): void {
  store = createEmptyStore()
}
