import type { EstadoValorOperacional, ValorOperacional, ValorOperacionalStore } from './valor-operacional.types'

const LS_KEY = 'disateq:catalog:valores-operacionales'

function createEmptyStore(): ValorOperacionalStore {
  return {
    valores: [],
    ultimaSincronizacion: null,
  }
}

function loadStore(): ValorOperacionalStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return createEmptyStore()
    const parsed = JSON.parse(raw) as Partial<ValorOperacionalStore>
    return {
      valores: Array.isArray(parsed.valores) ? parsed.valores as ValorOperacional[] : [],
      ultimaSincronizacion: typeof parsed.ultimaSincronizacion === 'string' ? parsed.ultimaSincronizacion : null,
    }
  } catch {
    return createEmptyStore()
  }
}

let store: ValorOperacionalStore = loadStore()

function persistStore(): void {
  localStorage.setItem(LS_KEY, JSON.stringify(store))
}

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
  persistStore()
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
