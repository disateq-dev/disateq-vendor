import { invoke } from '@tauri-apps/api/core'
import type {
  AsignacionPrincipiosInput,
  AsignacionLote,
  CorregirDatosOperacionalesInput,
  CrearPrincipioActivoInput,
  CrearValorOperacionalInput,
  ModificarProductoComercialInput,
  ModificarPrincipioActivoInput,
  ModificarProveedorInput,
  ModificarValorOperacionalInput,
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  CrearProveedorInput,
  DatosRuc,
  EstadoRegistroSanitario,
  Lote,
  ModificarNodoInput,
  ModificarPresentacionInput,
  NodoFraccionamiento,
  PresentacionComercial,
  PrincipioActivo,
  PrincipioActivoDetalle,
  ProductoComercial,
  ProductoGenerico,
  Proveedor,
  RegistrarIngresoInput,
  RegistrarLoteInput,
  RegistrarMovimientoInput,
  ResultadoReporteDIGEMID,
  ResultadoBusquedaPresentacion,
  ResumenInventarioFarmacia,
  ValorOperacionalFarmacia,
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

interface ProductoGenericoRespuesta {
  id: string
  ifa: string
  concentracion: string
  forma_farmaceutica: string
  categoria_farmacia: string
  permite_fraccion: boolean
  creado_en: string
}

interface ProductoComercialRespuesta {
  id: string
  producto_generico_id: string
  nombre_comercial: string
  nombre_fabricante: string
  nombre_titular?: string
  pais_origen: string
  registro_sanitario?: string
  estado_registro_sanitario: string
  codigo_digemid?: string
  codigo_interno?: string
  condicion_venta: string
  tipo_recurso: string
  requiere_lote: boolean
  requiere_cadena_frio: boolean
  estado: string
  creado_en: string
  modificado_en: string
  ifa: string
  concentracion: string
  forma_farmaceutica: string
  categoria_farmacia: string
}

interface PresentacionComercialRespuesta {
  id: string
  producto_comercial_id: string
  descripcion: string
  fraccion_digemid: number
  unidad_conteo: string
  factor_conversion_base: number
  codigo_barras?: string
  proveedor_habitual_id?: string
  costo_compra?: number
  stock_minimo: number
  creado_en: string
}

interface NodoFraccionamientoRespuesta {
  id: string
  presentacion_id: string
  nodo_padre_id?: string
  nombre_forma_venta: string
  tipo_forma_venta: string
  unidades_en_nodo_padre?: number
  unidades_base: number
  es_vendible: boolean
  es_comprable: boolean
  descripcion_promo?: string
  estado: string
  creado_en: string
}

interface AsignacionLoteRespuesta {
  lote_id: string
  numero_lote: string
  fecha_vencimiento: string
  unidades_asignadas: number
}

interface LoteRespuesta {
  id: string
  presentacion_id: string
  numero_lote: string
  fecha_vencimiento: string
  fecha_fabricacion?: string
  cantidad_ingresada: number
  cantidad_disponible: number
  proveedor_id?: string
  precio_compra?: number
  estado: string
  creado_en: string
}

interface ValorOperacionalRespuesta {
  id: string
  nodo_id: string
  tipo: string
  valor: number
  moneda: string
  condicion_cantidad_minima?: number
  condicion_contexto_id?: string
  condicion_identidad_id?: string
  vigencia_desde: string
  vigencia_hasta?: string
  estado: string
  creado_en: string
  modificado_en: string
}

interface ResumenInventarioFarmaciaRespuesta {
  producto_id: string
  nombre_comercial: string
  requiere_lote: boolean
  presentacion_id: string
  descripcion: string
  unidad_conteo: string
  total_disponible: number
  lotes_vigentes: number
  proximo_vencimiento?: string
  stock_minimo: number
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

function traducirProductoGenerico(r: ProductoGenericoRespuesta): ProductoGenerico {
  return {
    id: r.id,
    ifa: r.ifa,
    concentracion: r.concentracion,
    formaFarmaceutica: r.forma_farmaceutica as ProductoGenerico['formaFarmaceutica'],
    categoriaFarmacia: r.categoria_farmacia as ProductoGenerico['categoriaFarmacia'],
    permiteFraccion: r.permite_fraccion,
    creadoEn: r.creado_en,
  }
}

function traducirProductoComercial(r: ProductoComercialRespuesta): ProductoComercial {
  return {
    id: r.id,
    productoGenericoId: r.producto_generico_id,
    nombreComercial: r.nombre_comercial,
    nombreFabricante: r.nombre_fabricante,
    nombreTitular: r.nombre_titular,
    paisOrigen: r.pais_origen,
    registroSanitario: r.registro_sanitario,
    estadoRegistroSanitario: r.estado_registro_sanitario as EstadoRegistroSanitario,
    codigoDIGEMID: r.codigo_digemid,
    codigoInterno: r.codigo_interno,
    condicionVenta: r.condicion_venta as ProductoComercial['condicionVenta'],
    tipoRecurso: r.tipo_recurso as ProductoComercial['tipoRecurso'],
    requiereLote: r.requiere_lote,
    requiereCadenaFrio: r.requiere_cadena_frio,
    estado: r.estado,
    creadoEn: r.creado_en,
    modificadoEn: r.modificado_en,
    ifa: r.ifa,
    concentracion: r.concentracion,
    formaFarmaceutica: r.forma_farmaceutica,
    categoriaFarmacia: r.categoria_farmacia,
  }
}

function traducirPresentacionComercial(r: PresentacionComercialRespuesta): PresentacionComercial {
  return {
    id: r.id,
    productoComercialId: r.producto_comercial_id,
    descripcion: r.descripcion,
    fraccionDIGEMID: r.fraccion_digemid,
    unidadConteo: r.unidad_conteo,
    factorConversionBase: r.factor_conversion_base,
    codigoBarras: r.codigo_barras,
    proveedorHabitualId: r.proveedor_habitual_id,
    costoCompra: r.costo_compra,
    stockMinimo: r.stock_minimo,
    creadoEn: r.creado_en,
  }
}

function traducirNodoFraccionamiento(r: NodoFraccionamientoRespuesta): NodoFraccionamiento {
  return {
    id: r.id,
    presentacionId: r.presentacion_id,
    nodoPadreId: r.nodo_padre_id,
    nombreFormaVenta: r.nombre_forma_venta,
    tipoFormaVenta: r.tipo_forma_venta as NodoFraccionamiento['tipoFormaVenta'],
    unidadesEnNodoPadre: r.unidades_en_nodo_padre,
    unidadesBase: r.unidades_base,
    esVendible: r.es_vendible,
    esComprable: r.es_comprable,
    descripcionPromo: r.descripcion_promo,
    estado: r.estado,
    creadoEn: r.creado_en,
  }
}

function traducirAsignacionLote(r: AsignacionLoteRespuesta): AsignacionLote {
  return {
    loteId: r.lote_id,
    numeroLote: r.numero_lote,
    fechaVencimiento: r.fecha_vencimiento,
    unidadesAsignadas: r.unidades_asignadas,
  }
}

function traducirLote(r: LoteRespuesta): Lote {
  return {
    id: r.id,
    presentacionId: r.presentacion_id,
    numeroLote: r.numero_lote,
    fechaVencimiento: r.fecha_vencimiento,
    fechaFabricacion: r.fecha_fabricacion,
    cantidadIngresada: r.cantidad_ingresada,
    cantidadDisponible: r.cantidad_disponible,
    proveedorId: r.proveedor_id,
    precioCompra: r.precio_compra,
    estado: r.estado as Lote['estado'],
    creadoEn: r.creado_en,
  }
}

function traducirValorOperacional(r: ValorOperacionalRespuesta): ValorOperacionalFarmacia {
  return {
    id: r.id,
    nodoId: r.nodo_id,
    tipo: r.tipo as ValorOperacionalFarmacia['tipo'],
    valor: r.valor,
    moneda: r.moneda,
    condicionCantidadMinima: r.condicion_cantidad_minima,
    condicionContextoId: r.condicion_contexto_id,
    condicionIdentidadId: r.condicion_identidad_id,
    vigenciaDesde: r.vigencia_desde,
    vigenciaHasta: r.vigencia_hasta,
    estado: r.estado as ValorOperacionalFarmacia['estado'],
    creadoEn: r.creado_en,
    modificadoEn: r.modificado_en,
  }
}

function traducirResumenInventario(r: ResumenInventarioFarmaciaRespuesta): ResumenInventarioFarmacia {
  return {
    productoId: r.producto_id,
    nombreComercial: r.nombre_comercial,
    requiereLote: r.requiere_lote,
    presentacionId: r.presentacion_id,
    descripcion: r.descripcion,
    unidadConteo: r.unidad_conteo,
    totalDisponible: r.total_disponible,
    lotesVigentes: r.lotes_vigentes,
    proximoVencimiento: r.proximo_vencimiento,
    stockMinimo: r.stock_minimo,
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
  const respuesta = await invoke<ProductoGenericoRespuesta[]>('obtener_productos_genericos', {
    filtroIfa: filtroIfa ?? null,
  })
  return respuesta.map((item) => traducirProductoGenerico(item))
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
    tipoRecurso: input.tipoRecurso,
    requiereLote: input.requiereLote,
    requiereCadenaFrio: input.requiereCadenaFrio,
  })
}

export async function obtenerProductosComerciales(
  filtroNombre?: string,
  soloActivos?: boolean,
): Promise<ProductoComercial[]> {
  const respuesta = await invoke<ProductoComercialRespuesta[]>('obtener_productos_comerciales', {
    filtroNombre: filtroNombre ?? null,
    soloActivos: soloActivos ?? null,
  })
  return respuesta.map((item) => traducirProductoComercial(item))
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
  const respuesta = await invoke<PresentacionComercialRespuesta[]>('obtener_presentaciones', {
    productoComercialId,
  })
  return respuesta.map((item) => traducirPresentacionComercial(item))
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
  const respuesta = await invoke<NodoFraccionamientoRespuesta[]>('obtener_nodos_fraccionamiento', {
    presentacionId,
  })
  return respuesta.map((item) => traducirNodoFraccionamiento(item))
}

export async function verificarHistorialPresentacion(presentacionId: string): Promise<boolean> {
  return invoke<boolean>('verificar_historial_presentacion', { presentacionId })
}

export async function verificarHistorialNodo(nodoId: string): Promise<boolean> {
  return invoke<boolean>('verificar_historial_nodo', { nodoId })
}

export async function modificarPresentacion(input: ModificarPresentacionInput): Promise<void> {
  await invoke('modificar_presentacion', {
    id: input.id,
    descripcion: input.descripcion,
    codigoBarras: input.codigoBarras ?? null,
    costoCompra: input.costoCompra ?? null,
    fraccionDigemid: input.fraccionDIGEMID ?? null,
    unidadConteo: input.unidadConteo ?? null,
    factorConversionBase: input.factorConversionBase ?? null,
    motivo: input.motivo ?? null,
    operadorId: input.operadorId ?? null,
  })
}

export async function modificarNodo(input: ModificarNodoInput): Promise<void> {
  await invoke('modificar_nodo', {
    id: input.id,
    nombreFormaVenta: input.nombreFormaVenta,
    descripcionPromo: input.descripcionPromo ?? null,
    esVendible: input.esVendible,
    tipoFormaVenta: input.tipoFormaVenta ?? null,
    unidadesBase: input.unidadesBase ?? null,
    motivo: input.motivo ?? null,
    operadorId: input.operadorId ?? null,
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
  const respuesta = await invoke<ProveedorRespuesta[]>('obtener_proveedores', {
    soloActivos: soloActivos ?? null,
  })
  return respuesta.map((item) => traducirProveedor(item))
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
  const respuesta = await invoke<AsignacionLoteRespuesta[]>('resolver_lote_fefo', {
    presentacionId,
    unidadesRequeridas,
  })
  return respuesta.map((item) => traducirAsignacionLote(item))
}

export async function obtenerLotesVigentes(presentacionId: string): Promise<Lote[]> {
  const respuesta = await invoke<LoteRespuesta[]>('obtener_lotes_vigentes', {
    presentacionId,
  })
  return respuesta.map((item) => traducirLote(item))
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

export async function actualizarProveedor(input: ModificarProveedorInput): Promise<void> {
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
      unidadesFacturadas: linea.unidadesFacturadas,
      unidadesRecibidas: linea.unidadesRecibidas,
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

export async function desactivarProveedor(id: string): Promise<void> {
  await invoke('desactivar_proveedor', { id })
}

export async function desactivarProductoComercial(id: string): Promise<void> {
  await invoke('desactivar_producto_comercial', { id })
}

export async function eliminarProductoComercialFisico(id: string): Promise<void> {
  await invoke('eliminar_producto_comercial_fisico', { id })
}

export async function obtenerValoresNodo(nodoId: string): Promise<ValorOperacionalFarmacia[]> {
  const respuesta = await invoke<ValorOperacionalRespuesta[]>('obtener_valores_nodo', { nodoId })
  return respuesta.map(traducirValorOperacional)
}

export async function crearValorOperacional(input: CrearValorOperacionalInput): Promise<string> {
  return invoke<string>('crear_valor_operacional', {
    nodoId: input.nodoId,
    tipo: input.tipo,
    valor: input.valor,
    moneda: input.moneda ?? null,
    condicionCantidadMinima: input.condicionCantidadMinima ?? null,
    vigenciaDesde: input.vigenciaDesde,
    vigenciaHasta: input.vigenciaHasta ?? null,
  })
}

export async function modificarValorOperacional(input: ModificarValorOperacionalInput): Promise<void> {
  return invoke<void>('modificar_valor_operacional', {
    id: input.id,
    valor: input.valor ?? null,
    condicionCantidadMinima: input.condicionCantidadMinima ?? null,
    vigenciaHasta: input.vigenciaHasta ?? null,
    estado: input.estado ?? null,
  })
}

export async function obtenerInventarioFarmacia(): Promise<ResumenInventarioFarmacia[]> {
  const respuesta = await invoke<ResumenInventarioFarmaciaRespuesta[]>('obtener_inventario_farmacia')
  return respuesta.map(traducirResumenInventario)
}

export async function modificarStockMinimo(presentacionId: string, stockMinimo: number): Promise<void> {
  return invoke<void>('modificar_stock_minimo', { presentacionId, stockMinimo })
}

export async function reactivarProductoComercial(id: string): Promise<void> {
  await invoke('reactivar_producto_comercial', { id })
}

export async function modificarProductoComercial(input: ModificarProductoComercialInput): Promise<void> {
  await invoke('modificar_producto_comercial', {
    id: input.id,
    nombreComercial: input.nombreComercial,
    nombreFabricante: input.nombreFabricante,
    nombreTitular: input.nombreTitular ?? null,
    paisOrigen: input.paisOrigen,
    registroSanitario: input.registroSanitario ?? null,
    estadoRegistroSanitario: input.estadoRegistroSanitario ?? null,
    codigoDigemid: input.codigoDIGEMID ?? null,
    codigoInterno: input.codigoInterno ?? null,
  })
}

export async function corregirDatosOperacionales(input: CorregirDatosOperacionalesInput): Promise<void> {
  await invoke('corregir_datos_operacionales', {
    id: input.id,
    condicionVenta: input.condicionVenta,
    requiereLote: input.requiereLote,
    requiereCadenaFrio: input.requiereCadenaFrio,
    motivo: input.motivo,
    operadorId: input.operadorId,
  })
}

export async function verificarHistorialProducto(productoComercialId: string): Promise<boolean> {
  return invoke<boolean>('verificar_historial_producto', { productoComercialId })
}

export async function listarPrincipiosActivos(): Promise<PrincipioActivo[]> {
  const respuesta = await invoke('listar_principios_activos')
  return respuesta as PrincipioActivo[]
}

export async function buscarPrincipiosActivos(query: string): Promise<PrincipioActivo[]> {
  const respuesta = await invoke('buscar_principios_activos', { query })
  return respuesta as PrincipioActivo[]
}

export async function asignarPrincipiosAProducto(input: AsignacionPrincipiosInput): Promise<void> {
  await invoke('asignar_principios_a_producto', {
    productoGenericoId: input.productoGenericoId,
    principioActivoIds: input.principioActivoIds,
    operadorId: input.operadorId,
    motivo: input.motivo,
  })
}

export async function obtenerPrincipiosDeProducto(productoGenericoId: string): Promise<{
  id: string
  nombreDci: string
  descripcion?: string
  orden: number
}[]> {
  const respuesta = await invoke('obtener_principios_de_producto', { productoGenericoId })
  return respuesta as {
    id: string
    nombreDci: string
    descripcion?: string
    orden: number
  }[]
}

export async function obtenerPrincipioActivo(id: string): Promise<PrincipioActivoDetalle> {
  const respuesta = await invoke('obtener_principio_activo', { id })
  return respuesta as PrincipioActivoDetalle
}

export async function crearPrincipioActivo(input: CrearPrincipioActivoInput): Promise<string> {
  return invoke<string>('crear_principio_activo', {
    nombreDci: input.nombreDci,
    descripcionUso: input.descripcionUso,
    grupoTerapeutico: input.grupoTerapeutico,
    condicionVenta: input.condicionVenta,
    esCombinacion: input.esCombinacion,
    esPsicotropico: input.esPsicotropico,
    esEsencialMinsa: input.esEsencialMinsa,
  })
}

export async function modificarPrincipioActivo(input: ModificarPrincipioActivoInput): Promise<void> {
  await invoke('modificar_principio_activo', {
    id: input.id,
    nombreDci: input.nombreDci,
    descripcionUso: input.descripcionUso,
    grupoTerapeutico: input.grupoTerapeutico,
    condicionVenta: input.condicionVenta,
    esCombinacion: input.esCombinacion,
    esPsicotropico: input.esPsicotropico,
    esEsencialMinsa: input.esEsencialMinsa,
    motivo: input.motivo,
    operadorId: input.operadorId,
  })
}
