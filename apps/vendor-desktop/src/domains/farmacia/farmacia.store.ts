import { create } from 'zustand'
import type {
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  PrincipioActivo,
  ProductoComercial,
  Proveedor,
  ResumenInventarioFarmacia,
  ServicioFarmacia,
  TipoRecursoOperacional,
} from './types'
import {
  crearProductoComercial,
  crearProductoGenerico,
  obtenerProductosComerciales,
  obtenerProveedores,
  obtenerInventarioFarmacia,
  obtenerServiciosFarmacia,
  listarPrincipiosActivos,
} from './farmacia.service'

interface FarmaciaState {
  productosComerciales: ProductoComercial[]
  proveedores: Proveedor[]
  servicios: ServicioFarmacia[]
  cargando: boolean
  error: string | null
  resumenInventario: ResumenInventarioFarmacia[]
  principiosActivos: PrincipioActivo[]
  cargarProductosComerciales(filtroNombre?: string, soloActivos?: boolean): Promise<void>
  cargarProveedores(soloActivos?: boolean): Promise<void>
  cargarServicios(soloActivos?: boolean): Promise<void>
  cargarResumenInventario(): Promise<void>
  cargarPrincipiosActivos(): Promise<void>
  crearProductoCompleto(
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId' | 'tipoRecurso'>,
    tipoRecurso: TipoRecursoOperacional,
  ): Promise<string>
  limpiarError(): void
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const useFarmaciaStore = create<FarmaciaState>()((set) => ({
  productosComerciales: [],
  proveedores: [],
  servicios: [],
  resumenInventario: [],
  principiosActivos: [],
  cargando: false,
  error: null,

  async cargarProductosComerciales(filtroNombre?: string, soloActivos?: boolean): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const productosComerciales = await obtenerProductosComerciales(filtroNombre, soloActivos)
      set({ productosComerciales, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarProveedores(soloActivos?: boolean): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const proveedores = await obtenerProveedores(soloActivos)
      set({ proveedores, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarServicios(soloActivos?: boolean): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const servicios = await obtenerServiciosFarmacia(soloActivos)
      set({ servicios, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarResumenInventario(): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const resumenInventario = await obtenerInventarioFarmacia()
      set({ resumenInventario, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarPrincipiosActivos(): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const principiosActivos = await listarPrincipiosActivos()
      set({ principiosActivos, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async crearProductoCompleto(
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId' | 'tipoRecurso'>,
    tipoRecurso: TipoRecursoOperacional,
  ): Promise<string> {
    set({ cargando: true, error: null })
    try {
      const productoGenericoId = await crearProductoGenerico(generico)
      const productoComercialId = await crearProductoComercial({
        ...comercial,
        productoGenericoId,
        tipoRecurso,
      })
      set({ cargando: false })
      return productoComercialId
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  limpiarError(): void {
    set({ error: null })
  },
}))
