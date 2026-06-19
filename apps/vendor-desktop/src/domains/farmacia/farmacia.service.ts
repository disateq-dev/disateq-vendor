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
    forma_farmaceutica: input.formaFarmaceutica,
    categoria_farmacia: input.categoriaFarmacia,
    permite_fraccion: input.permiteFraccion,
  })
}

export async function obtenerProductosGenericos(filtroIfa?: string): Promise<ProductoGenerico[]> {
  return invoke<ProductoGenerico[]>('obtener_productos_genericos', {
    filtro_ifa: filtroIfa ?? null,
  })
}

export async function crearProductoComercial(input: CrearProductoComercialInput): Promise<string> {
  return invoke<string>('crear_producto_comercial', {
    producto_generico_id: input.productoGenericoId,
    nombre_comercial: input.nombreComercial,
    nombre_fabricante: input.nombreFabricante,
    nombre_titular: input.nombreTitular ?? null,
    pais_origen: input.paisOrigen ?? null,
    registro_sanitario: input.registroSanitario ?? null,
    codigo_digemid: input.codigoDIGEMID ?? null,
    condicion_venta: input.condicionVenta,
    requiere_lote: input.requiereLote,
    requiere_cadena_frio: input.requiereCadenaFrio,
  })
}

export async function obtenerProductosComerciales(
  filtroNombre?: string,
  soloActivos?: boolean,
): Promise<ProductoComercial[]> {
  return invoke<ProductoComercial[]>('obtener_productos_comerciales', {
    filtro_nombre: filtroNombre ?? null,
    solo_activos: soloActivos ?? null,
  })
}

export async function crearPresentacion(input: CrearPresentacionInput): Promise<string> {
  return invoke<string>('crear_presentacion', {
    producto_comercial_id: input.productoComercialId,
    descripcion: input.descripcion,
    fraccion_digemid: input.fraccionDIGEMID,
    unidad_conteo: input.unidadConteo,
    factor_conversion_base: input.factorConversionBase,
    codigo_barras: input.codigoBarras ?? null,
    proveedor_habitual_id: input.proveedorHabitualId ?? null,
    costo_compra: input.costoCompra ?? null,
  })
}

export async function obtenerPresentaciones(productoComercialId: string): Promise<PresentacionComercial[]> {
  return invoke<PresentacionComercial[]>('obtener_presentaciones', {
    producto_comercial_id: productoComercialId,
  })
}

export async function crearNodo(input: CrearNodoInput): Promise<string> {
  return invoke<string>('crear_nodo', {
    presentacion_id: input.presentacionId,
    nodo_padre_id: input.nodoPadreId ?? null,
    nombre_forma_venta: input.nombreFormaVenta,
    tipo_forma_venta: input.tipoFormaVenta,
    unidades_en_nodo_padre: input.unidadesEnNodoPadre ?? null,
    unidades_base: input.unidadesBase,
    es_vendible: input.esVendible,
    es_comprable: input.esComprable,
    descripcion_promo: input.descripcionPromo ?? null,
  })
}

export async function obtenerNodosFraccionamiento(presentacionId: string): Promise<NodoFraccionamiento[]> {
  return invoke<NodoFraccionamiento[]>('obtener_nodos_fraccionamiento', {
    presentacion_id: presentacionId,
  })
}

export async function crearProveedor(input: CrearProveedorInput): Promise<string> {
  return invoke<string>('crear_proveedor', {
    razon_social: input.razonSocial,
    ruc: input.ruc ?? null,
    nombre_contacto: input.nombreContacto ?? null,
    telefono: input.telefono ?? null,
    condiciones_pago: input.condicionesPago ?? null,
  })
}

export async function obtenerProveedores(soloActivos?: boolean): Promise<Proveedor[]> {
  return invoke<Proveedor[]>('obtener_proveedores', {
    solo_activos: soloActivos ?? null,
  })
}

export async function registrarLote(input: RegistrarLoteInput): Promise<string> {
  return invoke<string>('registrar_lote', {
    presentacion_id: input.presentacionId,
    numero_lote: input.numeroLote,
    fecha_vencimiento: input.fechaVencimiento,
    fecha_fabricacion: input.fechaFabricacion ?? null,
    cantidad_ingresada: input.cantidadIngresada,
    proveedor_id: input.proveedorId ?? null,
    precio_compra: input.precioCompra ?? null,
  })
}

export async function resolverLoteFefo(
  presentacionId: string,
  unidadesRequeridas: number,
): Promise<AsignacionLote[]> {
  return invoke<AsignacionLote[]>('resolver_lote_fefo', {
    presentacion_id: presentacionId,
    unidades_requeridas: unidadesRequeridas,
  })
}

export async function obtenerLotesVigentes(presentacionId: string): Promise<Lote[]> {
  return invoke<Lote[]>('obtener_lotes_vigentes', {
    presentacion_id: presentacionId,
  })
}

export async function registrarMovimiento(input: RegistrarMovimientoInput): Promise<string> {
  return invoke<string>('registrar_movimiento', {
    item_id: input.itemId,
    tipo: input.tipo,
    unidades_base: input.unidadesBase,
    lote_id: input.loteId ?? null,
    nodo_id: input.nodoId ?? null,
    causa: input.causa,
    referencia_id: input.referenciaId ?? null,
    operador_id: input.operadorId,
    runtime_id: input.runtimeId,
  })
}

export async function crearServicioFarmacia(input: CrearServicioFarmaciaInput): Promise<string> {
  return invoke<string>('crear_servicio_farmacia', {
    nombre: input.nombre,
    tipo_servicio: input.tipoServicio,
    descripcion: input.descripcion ?? null,
    duracion_minutos: input.duracionMinutos ?? null,
  })
}

export async function obtenerServiciosFarmacia(soloActivos?: boolean): Promise<ServicioFarmacia[]> {
  return invoke<ServicioFarmacia[]>('obtener_servicios_farmacia', {
    solo_activos: soloActivos ?? null,
  })
}

export async function registrarEjecucionServicio(input: RegistrarEjecucionServicioInput): Promise<string> {
  return invoke<string>('registrar_ejecucion_servicio', {
    servicio_id: input.servicioId,
    operador_id: input.operadorId,
    turno_id: input.turnoId ?? null,
    pedido_id: input.pedidoId ?? null,
    timestamp_inicio: input.timestampInicio,
    timestamp_fin: input.timestampFin ?? null,
    duracion_minutos: input.duracionMinutos ?? null,
    observacion: input.observacion ?? null,
  })
}

export async function generarReporteDIGEMID(codigoEstab: string): Promise<ResultadoReporteDIGEMID> {
  return invoke<ResultadoReporteDIGEMID>('generar_reporte_digemid', {
    codigo_estab: codigoEstab,
  })
}

export async function buscarProveedores(termino: string, soloActivos?: boolean): Promise<Proveedor[]> {
  const respuesta = await invoke<ProveedorRespuesta[]>('buscar_proveedores', {
    termino,
    solo_activos: soloActivos ?? null,
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
    razon_social: input.razonSocial,
    ruc: input.ruc ?? null,
    nombre_contacto: input.nombreContacto ?? null,
    telefono: input.telefono ?? null,
    condiciones_pago: input.condicionesPago ?? null,
  })
}

export async function registrarIngreso(input: RegistrarIngresoInput): Promise<string[]> {
  return invoke<string[]>('registrar_ingreso', {
    proveedor_id: input.proveedorId,
    operador_id: input.operadorId,
    runtime_id: input.runtimeId,
    lineas: input.lineas.map((linea) => ({
      presentacion_id: linea.presentacionId,
      cantidad: linea.cantidad,
      costo_unitario: linea.costoUnitario ?? null,
      requiere_lote: linea.requiereLote,
      numero_lote: linea.numeroLote ?? null,
      fecha_vencimiento: linea.fechaVencimiento ?? null,
      es_lote_generico: linea.esLoteGenerico,
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
