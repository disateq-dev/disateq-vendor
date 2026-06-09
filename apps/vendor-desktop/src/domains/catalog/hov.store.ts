import type { HOV, HOVStore } from './hov.types'

const LS_KEY = 'disateq:catalog:hovs'

function createEmptyStore(): HOVStore {
  return {
    hovs: [],
    ultimaSincronizacion: null,
  }
}

function loadStore(): HOVStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return createEmptyStore()
    const parsed = JSON.parse(raw) as Partial<HOVStore>
    return {
      hovs: Array.isArray(parsed.hovs) ? parsed.hovs as HOV[] : [],
      ultimaSincronizacion: typeof parsed.ultimaSincronizacion === 'string' ? parsed.ultimaSincronizacion : null,
    }
  } catch {
    return createEmptyStore()
  }
}

let store: HOVStore = loadStore()

function persistStore(): void {
  localStorage.setItem(LS_KEY, JSON.stringify(store))
}

export function getHOVsActivas(contextoOperacionalId: string): HOV[] {
  return store.hovs.filter(hov =>
    hov.estado === 'ACTIVA' &&
    hov.contextoOperacionalId === contextoOperacionalId
  )
}

export function getHOVById(id: string): HOV | null {
  return store.hovs.find(hov => hov.id === id) ?? null
}

export function getHOVByCodigo(codigo: string): HOV | null {
  return store.hovs.find(hov => hov.codigo === codigo) ?? null
}

export function existeHOVActiva(productoId: string, unidadDespacho: string): boolean {
  return store.hovs.some(hov =>
    hov.estado === 'ACTIVA' &&
    hov.productoId === productoId &&
    hov.unidadDespacho === unidadDespacho
  )
}

export function getAllHOVs(): HOV[] {
  return store.hovs
}

export function guardarHOV(hov: HOV): HOV {
  const idx = store.hovs.findIndex(item => item.id === hov.id)
  if (idx >= 0) {
    store = {
      ...store,
      hovs: store.hovs.map(item => item.id === hov.id ? hov : item),
      ultimaSincronizacion: new Date().toISOString(),
    }
  } else {
    store = {
      ...store,
      hovs: [...store.hovs, hov],
      ultimaSincronizacion: new Date().toISOString(),
    }
  }
  persistStore()
  return hov
}
