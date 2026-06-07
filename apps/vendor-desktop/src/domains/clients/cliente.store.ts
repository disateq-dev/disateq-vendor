import type {
  Cliente,
  ClienteStore,
  EstadoCliente,
  TipoCliente,
} from './cliente.types'

const STORAGE_KEY = 'disateq:clients:clientes'

function createEmptyStore(): ClienteStore {
  return {
    clientes: [],
    ultimaSincronizacion: null,
  }
}

function loadStore(): ClienteStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyStore()

    const parsed = JSON.parse(raw) as Partial<ClienteStore>

    return {
      clientes: Array.isArray(parsed.clientes) ? parsed.clientes as Cliente[] : [],
      ultimaSincronizacion: typeof parsed.ultimaSincronizacion === 'string'
        ? parsed.ultimaSincronizacion
        : null,
    }
  } catch {
    return createEmptyStore()
  }
}

let store: ClienteStore = loadStore()

function persistStore(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const clienteStore = {
  getClienteById(id: string): Cliente | null {
    return store.clientes.find(cliente => cliente.id === id) ?? null
  },

  getClienteByCodigo(codigo: string): Cliente | null {
    return store.clientes.find(cliente => cliente.codigo === codigo) ?? null
  },

  getClienteByDocumento(numeroDocumento: string): Cliente | null {
    return store.clientes.find(cliente =>
      cliente.identificacionFiscal.numeroDocumento === numeroDocumento
    ) ?? null
  },

  getClientesActivos(): Cliente[] {
    return store.clientes.filter(cliente => cliente.estado === 'ACTIVO')
  },

  getClientesPorTipo(tipo: TipoCliente): Cliente[] {
    return store.clientes.filter(cliente => cliente.tipo === tipo)
  },

  guardarCliente(cliente: Cliente): Cliente {
    const now = new Date().toISOString()
    const exists = store.clientes.some(item => item.id === cliente.id)

    store = {
      ...store,
      clientes: exists
        ? store.clientes.map(item => item.id === cliente.id ? cliente : item)
        : [...store.clientes, cliente],
      ultimaSincronizacion: now,
    }

    persistStore()
    return cliente
  },

  actualizarEstado(id: string, estado: EstadoCliente): Cliente | null {
    const cliente = this.getClienteById(id)
    if (!cliente) return null

    const updated: Cliente = {
      ...cliente,
      estado,
      modificadoEn: new Date().toISOString(),
    }

    this.guardarCliente(updated)
    return updated
  },

  getTodos(): Cliente[] {
    return [...store.clientes]
  },
}
