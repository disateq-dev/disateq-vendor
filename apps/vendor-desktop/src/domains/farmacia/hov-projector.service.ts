import type { NodoFraccionamiento, PresentacionComercial, ProductoComercial, TipoRecursoOperacional, ValorOperacionalFarmacia } from './types'
import type { TipoValorOperacional as TipoValorOperacionalCatalogo } from '../catalog/valor-operacional.types'
import { crearHOV, reactivarHOV, retirarHOV } from '../catalog/hov.service'
import { crearValor, suspenderValor } from '../catalog/valor-operacional.service'
import type { ServicioCatalogo } from '../catalog/servicio.types'
import * as hovStore from '../catalog/hov.store'
import * as valorStore from '../catalog/valor-operacional.store'

/**
 * Proyecta un Nodo de Fraccionamiento vendible hacia la capa de venta (HOV).
 * Idempotente: si ya existe una HOV para este nodo, la reutiliza o reactiva
 * en vez de duplicarla. No hace nada si el nodo no es vendible.
 */
export function proyectarAHov(
  nodo: NodoFraccionamiento,
  presentacion: PresentacionComercial,
  productoComercial: ProductoComercial,
  valorVenta: number | null,
  contextoOperacionalId: string,
  tipoRecurso: TipoRecursoOperacional,
  ubicacionFisica?: string,
  precioVenta?: number,
): void {
  if (!nodo.esVendible) return

  let hov = hovStore.getAllHOVs().find(h => h.nodoFraccionamientoId === nodo.id) ?? null

  if (!hov) {
    hov = crearHOV({
      nombre: `${productoComercial.nombreComercial} · ${nodo.nombreFormaVenta}`,
      productoId: productoComercial.id,
      nodoFraccionamientoId: nodo.id,
      tipoRecurso,
      unidadDespacho: nodo.nombreFormaVenta,
      factorConversion: nodo.unidadesBase,
      costoBase: presentacion.costoCompra && presentacion.costoCompra > 0 ? presentacion.costoCompra : 0.01,
      codigoBarras: presentacion.codigoBarras,
      category: productoComercial.categoriaFarmacia,
      contextoOperacionalId,
      ubicacionFisica,
    })
  } else if (hov.estado === 'RETIRADA') {
    hov = reactivarHOV(hov.id)
  }

  if (valorVenta !== null && valorVenta > 0) {
    sincronizarValorHov(nodo, valorVenta)
  }

  if (precioVenta !== undefined && precioVenta > 0) {
    sincronizarValorHov(nodo, precioVenta)
  }
}

/**
 * Retira la HOV asociada a un nodo (o a todos los nodos de un producto
 * comercial dado de baja). No borra — marca RETIRADA para preservar
 * trazabilidad de ventas pasadas.
 */
export function retirarHovDeNodo(nodoId: string): void {
  const hov = hovStore.getAllHOVs().find(h => h.nodoFraccionamientoId === nodoId)
  if (hov && hov.estado === 'ACTIVA') {
    retirarHOV(hov.id, 'Nodo de fraccionamiento desactivado')
  }
}

export function retirarHovsDeProducto(productoComercialId: string): void {
  const hovs = hovStore.getAllHOVs().filter(h => h.productoId === productoComercialId && h.estado === 'ACTIVA')
  hovs.forEach(h => retirarHOV(h.id, 'Producto comercial dado de baja'))
}

export function reactivarHovsDeProducto(productoComercialId: string): void {
  const hovs = hovStore.getAllHOVs().filter(h => h.productoId === productoComercialId && h.estado === 'RETIRADA')
  hovs.forEach(h => reactivarHOV(h.id))
}

/**
 * Sincroniza el valor de venta de una HOV con el valor operacional vigente
 * de Farmacia. Suspende el valor NORMAL anterior antes de crear el nuevo —
 * nunca deja dos valores NORMAL activos para la misma HOV.
 */
export function sincronizarValorHov(nodo: NodoFraccionamiento, nuevoValor: number): void {
  const hov = hovStore.getAllHOVs().find(h => h.nodoFraccionamientoId === nodo.id)
  if (!hov) return

  const activos = valorStore.getValoresActivosPorHOV(hov.id).filter(v => v.tipo === 'NORMAL')
  activos.forEach(v => suspenderValor(v.id))

  crearValor({
    hovId: hov.id,
    tipo: 'NORMAL',
    valor: nuevoValor,
    moneda: 'PEN',
    condiciones: { cantidadMinima: null, contextoOperacionalId: null, identidadOperacionalId: null },
    vigencia: { desde: new Date().toISOString(), hasta: null },
  })
}

export function sincronizarValorOperacionalFarmacia(
  nodo: NodoFraccionamiento,
  valorFarmacia: Pick<ValorOperacionalFarmacia, 'tipo' | 'valor' | 'vigenciaDesde' | 'estado'> &
    Partial<Pick<ValorOperacionalFarmacia, 'moneda' | 'condicionCantidadMinima' | 'vigenciaHasta'>>,
): void {
  const tipoCatalogoPorTipoFarmacia: Partial<Record<ValorOperacionalFarmacia['tipo'], TipoValorOperacionalCatalogo>> = {
    VENTA_NORMAL: 'NORMAL',
    VENTA_MAYOREO: 'MAYORISTA',
    VENTA_PROMOCION: 'OFERTA',
  }

  if (valorFarmacia.tipo === 'VENTA_FRECUENTE') {
    console.warn('La sincronización de precio para cliente frecuente no está implementada porque el sistema de catálogo no tiene forma de identificar al cliente en el momento de la venta')
    return
  }

  const tipoCatalogo = tipoCatalogoPorTipoFarmacia[valorFarmacia.tipo]
  if (tipoCatalogo === undefined) return

  const hov = hovStore.getAllHOVs().find(h => h.nodoFraccionamientoId === nodo.id)
  if (!hov) return

  const activos = valorStore.getValoresActivosPorHOV(hov.id).filter(v => v.tipo === tipoCatalogo)
  activos.forEach(v => suspenderValor(v.id))

  if (valorFarmacia.estado === 'ACTIVO') {
    crearValor({
      hovId: hov.id,
      tipo: tipoCatalogo,
      valor: valorFarmacia.valor,
      moneda: valorFarmacia.moneda ?? 'PEN',
      condiciones: {
        cantidadMinima: tipoCatalogo === 'MAYORISTA' ? valorFarmacia.condicionCantidadMinima ?? null : null,
        contextoOperacionalId: null,
        identidadOperacionalId: null,
      },
      vigencia: {
        desde: valorFarmacia.vigenciaDesde,
        hasta: valorFarmacia.vigenciaHasta ?? null,
      },
    })
  }
}

export function proyectarServicioAHov(
  servicio: ServicioCatalogo,
  contextoOperacionalId: string,
  precioVenta?: number,
): void {
  let hov = hovStore.getAllHOVs().find(h => h.servicioId === servicio.id) ?? null

  if (!hov) {
    hov = crearHOV({
      nombre: servicio.nombre,
      servicioId: servicio.id,
      productoId: undefined,
      nodoFraccionamientoId: undefined,
      tipoRecurso: 'SERVICIO',
      unidadDespacho: 'servicio',
      factorConversion: 1,
      costoBase: precioVenta ?? 0,
      contextoOperacionalId,
    })
  } else if (hov.estado === 'RETIRADA') {
    hov = reactivarHOV(hov.id)
  }

  if (precioVenta !== undefined && precioVenta > 0) {
    const activos = valorStore.getValoresActivosPorHOV(hov.id).filter(v => v.tipo === 'NORMAL')
    activos.forEach(v => suspenderValor(v.id))
    crearValor({
      hovId: hov.id,
      tipo: 'NORMAL',
      valor: precioVenta,
      moneda: 'PEN',
      condiciones: {
        cantidadMinima: null,
        contextoOperacionalId: null,
        identidadOperacionalId: null,
      },
      vigencia: {
        desde: new Date().toISOString(),
        hasta: null,
      },
    })
  }
}
