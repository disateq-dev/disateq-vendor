import { invoke } from '@tauri-apps/api/core'
import type {
  AsignacionLote,
  ActualizarProveedorInput,
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  CrearProveedorInput,
  CrearServicioFarmaciaInput,
  DatosRuc,
  Lote,
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
  ProductoGenerico,
  Proveedor,
  RegistrarEjecucionServicioInput,
  RegistrarIngresoInput,
  RegistrarLoteInput,
  RegistrarMovimientoInput,
  ResultadoReporteDIGEMID,
  ResultadoBusquedaPresentacion,
  ServicioFarmacia,
} from './types'

interface ProveedorRespuesta {
  id: string
  razon_social: string
  ruc?: string
  nombre_contacto?: string
  telefono?: string
  condiciones_pago?: string
  estado: string
  creado_en: string
}

interface DatosRucRespuesta {
  razon_social: string
  direccion: string
  estado: string
  condicion: string
  tipo: string
}

function traducirProveedor(respuesta: ProveedorRespuesta): Proveedor {
  return {
    id: respuesta.id,
    razonSocial: respuesta.razon_social,
    ruc: respuesta.ruc,
    nombreContacto: respuesta.nombre_contacto,
    telefono: respuesta.telefono,
    condicionesPago: respuesta.condiciones_pago,
    estado: respuesta.estado,
    creadoEn: respuesta.creado_en,
  }
}

export async function crearProductoGenerico(input: CrearProductoGenericoInput): Promise<string> {
  return invoke<string>('crear_producto_generico', {
    ifa: input.ifa,
    concentracion: input.concentracion,
    formaFarmaceutica: input.formaFarmaceutica,
    categoriaFarmacia: input.categoriaFarmacia,
    permiteFraccion: input.permiteFraccion,
  })
}

export async function obtenerProductosGenericos(filtroIfa?: string): Promise<ProductoGenerico[]> {
  return invoke<ProductoGenerico[]>('obtener_productos_genericos', {
    filtroIfa: filtroIfa ?? null,
  })
}

export async function crearProductoComercial(input: CrearProductoComercialInput): Promise<string> {
  return invoke<string>('crear_producto_comercial', {
    productoGenericoId: input.productoGenericoId,
    nombreComercial: input.nombreComercial,
    nombreFabricante: input.nombreFabricante,
    nombreTitular: input.nombreTitular ?? null,
    paisOrigen: input.paisOrigen ?? null,
    registroSanitario: input.registroSanitario ?? null,
    codigoDigemid: input.codigoDIGEMID ?? null,
    condicionVenta: input.condicionVenta,
    requiereLote: input.requiereLote,
    requiereCadenaFrio: input.requiereCadenaFrio,
  })
}

export async function obtenerProductosComerciales(
  filtroNombre?: string,
  soloActivos?: boolean,
): Promise<ProductoComercial[]> {
  return invoke<ProductoComercial[]>('obtener_productos_comerciales', {
    filtroNombre: filtroNombre ?? null,
    soloActivos: soloActivos ?? null,
  })
}

export async function crearPresentacion(input: CrearPresentacionInput): Promise<string> {
  return invoke<string>('crear_presentacion', {
    productoComercialId: input.productoComercialId,
    descripcion: input.descripcion,
    fraccionDigemid: input.fraccionDIGEMID,
    unidadConteo: input.unidadConteo,
    factorConversionBase: input.factorConversionBase,
    codigoBarras: input.codigoBarras ?? null,
    proveedorHabitualId: input.proveedorHabitualId ?? null,
    costoCompra: input.costoCompra ?? null,
  })
}

export async function obtenerPresentaciones(productoComercialId: string): Promise<PresentacionComercial[]> {
  return invoke<PresentacionComercial[]>('obtener_presentaciones', {
    productoComercialId,
  })
}

export async function crearNodo(input: CrearNodoInput): Promise<string> {
  return invoke<string>('crear_nodo', {
    presentacionId: input.presentacionId,
    nodoPadreId: input.nodoPadreId ?? null,
    nombreFormaVenta: input.nombreFormaVenta,
    tipoFormaVenta: input.tipoFormaVenta,
    unidadesEnNodoPadre: input.unidadesEnNodoPadre ?? null,
    unidadesBase: input.unidadesBase,
    esVendible: input.esVendible,
    esComprable: input.esComprable,
    descripcionPromo: input.descripcionPromo ?? null,
  })
}

export async function obtenerNodosFraccionamiento(presentacionId: string): Promise<NodoFraccionamiento[]> {
  return invoke<NodoFraccionamiento[]>('obtener_nodos_fraccionamiento', {
    presentacionId,
  })
}

export async function crearProveedor(input: CrearProveedorInput): Promise<string> {
  return invoke<string>('crear_proveedor', {
    razonSocial: input.razonSocial,
    ruc: input.ruc ?? null,
    nombreContacto: input.nombreContacto ?? null,
    telefono: input.telefono ?? null,
    condicionesPago: input.condicionesPago ?? null,
  })
}

export async function obtenerProveedores(soloActivos?: boolean): Promise<Proveedor[]> {
  return invoke<Proveedor[]>('obtener_proveedores', {
    soloActivos: soloActivos ?? null,
  })
}

export async function registrarLote(input: RegistrarLoteInput): Promise<string> {
  return invoke<string>('registrar_lote', {
    presentacionId: input.presentacionId,
    numeroLote: input.numeroLote,
    fechaVencimiento: input.fechaVencimiento,
    fechaFabricacion: input.fechaFabricacion ?? null,
    cantidadIngresada: input.cantidadIngresada,
    proveedorId: input.proveedorId ?? null,
    precioCompra: input.precioCompra ?? null,
  })
}

export async function resolverLoteFefo(
  presentacionId: string,
  unidadesRequeridas: number,
): Promise<AsignacionLote[]> {
  return invoke<AsignacionLote[]>('resolver_lote_fefo', {
    presentacionId,
    unidadesRequeridas,
  })
}

export async function obtenerLotesVigentes(presentacionId: string): Promise<Lote[]> {
  return invoke<Lote[]>('obtener_lotes_vigentes', {
    presentacionId,
  })
}

export async function registrarMovimiento(input: RegistrarMovimientoInput): Promise<string> {
  return invoke<string>('registrar_movimiento', {
    itemId: input.itemId,
    tipo: input.tipo,
    unidadesBase: input.unidadesBase,
    loteId: input.loteId ?? null,
    nodoId: input.nodoId ?? null,
    causa: input.causa,
    referenciaId: input.referenciaId ?? null,
    operadorId: input.operadorId,
    runtimeId: input.runtimeId,
  })
}

export async function crearServicioFarmacia(input: CrearServicioFarmaciaInput): Promise<string> {
  return invoke<string>('crear_servicio_farmacia', {
    nombre: input.nombre,
    tipoServicio: input.tipoServicio,
    descripcion: input.descripcion ?? null,
    duracionMinutos: input.duracionMinutos ?? null,
  })
}

export async function obtenerServiciosFarmacia(soloActivos?: boolean): Promise<ServicioFarmacia[]> {
  return invoke<ServicioFarmacia[]>('obtener_servicios_farmacia', {
    soloActivos: soloActivos ?? null,
  })
}

export async function registrarEjecucionServicio(input: RegistrarEjecucionServicioInput): Promise<string> {
  return invoke<string>('registrar_ejecucion_servicio', {
    servicioId: input.servicioId,
    operadorId: input.operadorId,
    turnoId: input.turnoId ?? null,
    pedidoId: input.pedidoId ?? null,
    timestampInicio: input.timestampInicio,
    timestampFin: input.timestampFin ?? null,
    duracionMinutos: input.duracionMinutos ?? null,
    observacion: input.observacion ?? null,
  })
}

export async function generarReporteDIGEMID(codigoEstab: string): Promise<ResultadoReporteDIGEMID> {
  return invoke<ResultadoReporteDIGEMID>('generar_reporte_digemid', {
    codigoEstab,
  })
}

export async function buscarProveedores(termino: string, soloActivos?: boolean): Promise<Proveedor[]> {
  const respuesta = await invoke<ProveedorRespuesta[]>('buscar_proveedores', {
    termino,
    soloActivos: soloActivos ?? null,
  })
  return respuesta.map((proveedor) => traducirProveedor(proveedor))
}

export async function consultarRuc(ruc: string): Promise<DatosRuc> {
  const respuesta = await invoke<DatosRucRespuesta>('consultar_ruc', { ruc })
  return {
    razonSocial: respuesta.razon_social,
    direccion: respuesta.direccion,
    estado: respuesta.estado,
    condicion: respuesta.condicion,
    tipo: respuesta.tipo,
  }
}

export async function actualizarProveedor(input: ActualizarProveedorInput): Promise<void> {
  return invoke<void>('actualizar_proveedor', {
    id: input.id,
    razonSocial: input.razonSocial,
    ruc: input.ruc ?? null,
    nombreContacto: input.nombreContacto ?? null,
    telefono: input.telefono ?? null,
    condicionesPago: input.condicionesPago ?? null,
  })
}

export async function registrarIngreso(input: RegistrarIngresoInput): Promise<string[]> {
  return invoke<string[]>('registrar_ingreso', {
    proveedorId: input.proveedorId,
    operadorId: input.operadorId,
    runtimeId: input.runtimeId,
    lineas: input.lineas.map((linea) => ({
      presentacionId: linea.presentacionId,
      cantidad: linea.cantidad,
      costoUnitario: linea.costoUnitario ?? null,
      requiereLote: linea.requiereLote,
      numeroLote: linea.numeroLote ?? null,
      fechaVencimiento: linea.fechaVencimiento ?? null,
      esLoteGenerico: linea.esLoteGenerico,
    })),
  })
}

export async function buscarPresentacionesParaIngreso(termino: string): Promise<ResultadoBusquedaPresentacion[]> {
  const productos = (await obtenerProductosComerciales(termino, true)).slice(0, 8)
  const presentacionesPorProducto = await Promise.all(
    productos.map(async (producto): Promise<ResultadoBusquedaPresentacion[]> => {
      const presentaciones = await obtenerPresentaciones(producto.id)
      return presentaciones.map((presentacion) => ({
        presentacionId: presentacion.id,
        productoComercialId: producto.id,
        productoNombre: producto.nombreComercial,
        descripcion: presentacion.descripcion,
        requiereLote: producto.requiereLote,
        fabricante: producto.nombreFabricante,
      }))
    }),
  )
  return presentacionesPorProducto.flat().slice(0, 8)
}
