export type TipoRecursoOperacional = 'MEDICAMENTO' | 'PRODUCTO_GENERAL' | 'SERVICIO'

export type CategoriaGeneral = 'CUIDADO_PERSONAL' | 'BEBE' | 'DISPOSITIVO_MEDICO' | 'SUPLEMENTO' | 'HIGIENE' | 'OTRO'

export interface ProductoGeneral {
  id: string
  nombre: string
  categoriaGeneral: CategoriaGeneral
  unidadVenta: string
  codigoBarras?: string
  estado: string
  creadoEn: string
  modificadoEn: string
}

export type FormaFarmaceutica =
  | 'TABLETA'
  | 'TABLETA_RECUBIERTA'
  | 'TABLETA_MASTICABLE'
  | 'TABLETA_LIB_PROLONGADA'
  | 'CAPSULA'
  | 'CAPSULA_BLANDA'
  | 'COMPRIMIDO'
  | 'COMPRIMIDO_RECUBIERTO'
  | 'COMPRIMIDO_MASTICABLE'
  | 'SOLUCION_ORAL'
  | 'SOLUCION_INYECTABLE'
  | 'SOLUCION_OFTALMICA'
  | 'SOLUCION_TOPICA'
  | 'SUSPENSION_ORAL'
  | 'SUSPENSION_INYECTABLE'
  | 'JARABE'
  | 'POLVO_SUSPENSION_ORAL'
  | 'POLVO_SOLUCION_INYECTABLE'
  | 'CREMA'
  | 'POMADA'
  | 'UNGUENTO'
  | 'GEL'
  | 'OVULO'
  | 'SUPOSITORIO'
  | 'AMPOLLA'
  | 'VIAL'
  | 'FRASCO_GOTERO'
  | 'SPRAY'
  | 'INHALADOR'
  | 'PARCHE'
  | 'OTRO'

export type CategoriaFarmacia =
  | 'ANALGESICO'
  | 'ANTIBIOTICO'
  | 'ANTIHISTAMINICO'
  | 'ANTIINFLAMATORIO'
  | 'ANTIACIDO'
  | 'VITAMINA'
  | 'TOPICO'
  | 'OFTALMICO'
  | 'INYECTABLE'
  | 'DISPOSITIVO'
  | 'CUIDADO_PERSONAL'
  | 'BEBE'
  | 'OTRO'

export type CondicionVenta = 'SIN_RECETA' | 'CON_RECETA' | 'CONTROLADO'

export type TipoFormaVenta = 'PRESENTACION_ORIGINAL' | 'FRACCION' | 'PACK' | 'PROMOCION'

export type TipoServicioFarmacia =
  | 'INYECTABLE'
  | 'NEBULIZACION'
  | 'CONTROL_GLUCOSA'
  | 'CONTROL_PRESION'
  | 'TEST_EMBARAZO'
  | 'CURACION'
  | 'OTRO'

export type EstadoLote = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'AGOTADO'

export interface ProductoGenerico {
  id: string
  ifa: string
  concentracion: string
  formaFarmaceutica: FormaFarmaceutica
  categoriaFarmacia: CategoriaFarmacia
  permiteFraccion: boolean
  creadoEn: string
  principiosActivos?: PrincipioActivo[]
}

export type EstadoRegistroSanitario = 'VIGENTE' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO'

export interface ProductoComercial {
  id: string
  productoGenericoId: string
  nombreComercial: string
  nombreFabricante: string
  nombreTitular?: string
  paisOrigen: string
  registroSanitario?: string
  estadoRegistroSanitario: EstadoRegistroSanitario
  codigoDIGEMID?: string
  codigoInterno?: string
  condicionVenta: CondicionVenta
  requiereLote: boolean
  requiereCadenaFrio: boolean
  estado: string
  creadoEn: string
  modificadoEn: string
  ifa?: string
  concentracion?: string
  formaFarmaceutica?: string
  categoriaFarmacia?: string
}

export interface PresentacionComercial {
  id: string
  productoComercialId: string
  descripcion: string
  fraccionDIGEMID: number
  unidadConteo: string
  factorConversionBase: number
  codigoBarras?: string
  proveedorHabitualId?: string
  costoCompra?: number
  stockMinimo: number
  creadoEn: string
}

export interface NodoFraccionamiento {
  id: string
  presentacionId: string
  nodoPadreId?: string
  nombreFormaVenta: string
  tipoFormaVenta: TipoFormaVenta
  unidadesEnNodoPadre?: number
  unidadesBase: number
  esVendible: boolean
  esComprable: boolean
  descripcionPromo?: string
  estado: string
  creadoEn: string
}

export interface Lote {
  id: string
  presentacionId: string
  numeroLote: string
  fechaVencimiento: string
  fechaFabricacion?: string
  cantidadIngresada: number
  cantidadDisponible: number
  proveedorId?: string
  precioCompra?: number
  estado: EstadoLote
  creadoEn: string
}

export interface AsignacionLote {
  loteId: string
  numeroLote: string
  fechaVencimiento: string
  unidadesAsignadas: number
}

export type TipoValorOperacional =
  | 'VENTA_NORMAL'
  | 'VENTA_MAYOREO'
  | 'VENTA_FRECUENTE'
  | 'VENTA_PROMOCION'

export type EstadoValorOperacional = 'ACTIVO' | 'INACTIVO'

export interface ValorOperacionalFarmacia {
  id: string
  nodoId: string
  tipo: TipoValorOperacional
  valor: number
  moneda: string
  condicionCantidadMinima?: number
  condicionContextoId?: string
  condicionIdentidadId?: string
  vigenciaDesde: string
  vigenciaHasta?: string
  estado: EstadoValorOperacional
  creadoEn: string
  modificadoEn: string
}

export interface Proveedor {
  id: string
  razonSocial: string
  ruc?: string
  nombreContacto?: string
  telefono?: string
  condicionesPago?: string
  estado: string
  creadoEn: string
}

export interface ServicioFarmacia {
  id: string
  nombre: string
  tipoServicio: TipoServicioFarmacia
  descripcion?: string
  duracionMinutos?: number
  estado: string
  creadoEn: string
}

export interface EjecucionServicio {
  id: string
  servicioId: string
  operadorId: string
  turnoId?: string
  pedidoId?: string
  timestampInicio: string
  timestampFin?: string
  duracionMinutos?: number
  observacion?: string
  creadoEn: string
}

export interface RegistroReporteDIGEMID {
  CodProd?: string
  Precio1_Empaque?: number
  Precio2_Unitario?: number
  precio_unitario_derivado?: number
  validacion_digemid: string
  nombre_comercial?: string
  registro_sanitario?: string
  ifa?: string
  concentracion?: string
  fraccion?: number
}

export interface ResultadoReporteDIGEMID {
  total_ok: number
  total_inconsistentes: number
  inconsistentes: RegistroReporteDIGEMID[]
  csv?: string
}

export interface CrearProductoGenericoInput {
  ifa: string
  concentracion: string
  formaFarmaceutica: FormaFarmaceutica
  categoriaFarmacia: CategoriaFarmacia
  permiteFraccion: boolean
}

export interface CrearProductoComercialInput {
  productoGenericoId: string
  nombreComercial: string
  nombreFabricante: string
  nombreTitular?: string
  paisOrigen?: string
  registroSanitario?: string
  codigoDIGEMID?: string
  condicionVenta: CondicionVenta
  requiereLote: boolean
  requiereCadenaFrio: boolean
}

export interface ModificarProductoComercialInput {
  id: string
  nombreComercial: string
  nombreFabricante: string
  nombreTitular?: string
  paisOrigen: string
  registroSanitario?: string
  estadoRegistroSanitario?: EstadoRegistroSanitario
  codigoDIGEMID?: string
  codigoInterno?: string
}

export interface CorregirDatosOperacionalesInput {
  id: string
  condicionVenta: CondicionVenta
  requiereLote: boolean
  requiereCadenaFrio: boolean
  motivo: string
  operadorId: string
}

export interface CrearPresentacionInput {
  productoComercialId: string
  descripcion: string
  fraccionDIGEMID: number
  unidadConteo: string
  factorConversionBase: number
  codigoBarras?: string
  proveedorHabitualId?: string
  costoCompra?: number
}

export interface CrearNodoInput {
  presentacionId: string
  nodoPadreId?: string
  nombreFormaVenta: string
  tipoFormaVenta: TipoFormaVenta
  unidadesEnNodoPadre?: number
  unidadesBase: number
  esVendible: boolean
  esComprable: boolean
  descripcionPromo?: string
}

export interface RegistrarLoteInput {
  presentacionId: string
  numeroLote: string
  fechaVencimiento: string
  fechaFabricacion?: string
  cantidadIngresada: number
  proveedorId?: string
  precioCompra?: number
}

export interface RegistrarMovimientoInput {
  itemId: string
  tipo: string
  unidadesBase: number
  loteId?: string
  nodoId?: string
  causa: string
  referenciaId?: string
  operadorId: string
  runtimeId: string
}

export interface CrearProveedorInput {
  razonSocial: string
  ruc?: string
  nombreContacto?: string
  telefono?: string
  condicionesPago?: string
}

export interface CrearServicioFarmaciaInput {
  nombre: string
  tipoServicio: TipoServicioFarmacia
  descripcion?: string
  duracionMinutos?: number
}

export interface RegistrarEjecucionServicioInput {
  servicioId: string
  operadorId: string
  turnoId?: string
  pedidoId?: string
  timestampInicio: string
  timestampFin?: string
  duracionMinutos?: number
  observacion?: string
}

export interface DatosRuc {
  razonSocial: string
  direccion: string
  estado: string
  condicion: string
  tipo: string
}

export interface ModificarProveedorInput {
  id: string
  razonSocial: string
  ruc?: string
  nombreContacto?: string
  telefono?: string
  condicionesPago?: string
}

export interface LineaIngreso {
  presentacionId: string
  productoNombre: string
  presentacionDescripcion: string
  cantidad: number
  costoUnitario?: number
  requiereLote: boolean
  numeroLote?: string
  fechaVencimiento?: string
  esLoteGenerico: boolean
}

export interface RegistrarIngresoInput {
  proveedorId: string
  operadorId: string
  runtimeId: string
  lineas: {
    presentacionId: string
    cantidad: number
    costoUnitario?: number
    requiereLote: boolean
    numeroLote?: string
    fechaVencimiento?: string
    esLoteGenerico: boolean
  }[]
}

export interface ResultadoBusquedaPresentacion {
  presentacionId: string
  productoComercialId: string
  productoNombre: string
  descripcion: string
  requiereLote: boolean
  fabricante: string
}

export interface CrearValorOperacionalInput {
  nodoId: string
  tipo: TipoValorOperacional
  valor: number
  moneda?: string
  condicionCantidadMinima?: number
  vigenciaDesde: string
  vigenciaHasta?: string
}

export interface ModificarValorOperacionalInput {
  id: string
  valor?: number
  condicionCantidadMinima?: number
  vigenciaHasta?: string
  estado?: EstadoValorOperacional
}

export interface ResumenInventarioFarmacia {
  productoId: string
  nombreComercial: string
  requiereLote: boolean
  presentacionId: string
  descripcion: string
  unidadConteo: string
  totalDisponible: number
  lotesVigentes: number
  proximoVencimiento?: string
  stockMinimo: number
}

export interface PrincipioActivo {
  id: string
  nombreDci: string
  descripcion?: string
  activo: boolean
  esEsencialMinsa: boolean
  esPsicotropico: boolean
}

export interface AsignacionPrincipiosInput {
  productoGenericoId: string
  principioActivoIds: string[]
  operadorId: string
  motivo?: string
}
