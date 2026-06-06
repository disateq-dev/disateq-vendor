export type TipoPeriodo =
  | 'DIA'
  | 'SEMANA'
  | 'MES'
  | 'RANGO'

export type TipoReporte =
  | 'VENTAS'
  | 'ABASTECIMIENTO'
  | 'COMPROBANTES'
  | 'TURNOS'

export type FormatoSalida =
  | 'PANTALLA'
  | 'TERMICO'
  | 'A4'
  | 'EXCEL'

export interface PeriodoReporte {
  tipo: TipoPeriodo
  desde: string
  hasta: string
}

export interface ItemVentaOperador {
  operadorId: string
  nombre: string
  totalVendido: number
  transacciones: number
}

export interface ItemVentaHora {
  hora: number
  totalVendido: number
  transacciones: number
}

export interface ItemVentaProducto {
  hovId: string
  nombre: string
  cantidadVendida: number
  totalGenerado: number
}

export interface DesglosePago {
  efectivo: { monto: number; cantidad: number }
  yape:     { monto: number; cantidad: number }
  tarjeta:  { monto: number; cantidad: number }
  mixto:    { monto: number; cantidad: number }
}

export interface ReporteVentas {
  periodo: PeriodoReporte
  totalVendido: number
  totalTransacciones: number
  desglosePago: DesglosePago
  productosMasVendidos: ItemVentaProducto[]
  ventasPorOperador: ItemVentaOperador[]
  ventasPorHora: ItemVentaHora[]
}

export interface ItemAlertaStock {
  productoId: string
  nombre: string
  disponible: number
  umbralAlerta: number
}

export interface ItemCompraProveedor {
  proveedor: string
  cantidadCompras: number
  montoTotal: number
}

export interface ReporteAbastecimiento {
  periodo: PeriodoReporte
  productosEnAlerta: ItemAlertaStock[]
  comprasDelPeriodo: number
  gastoTotal: number
  resumenProveedores: ItemCompraProveedor[]
}

export interface ItemConteoComprobante {
  tipo: string
  cantidad: number
  total: number
}

export interface ReporteComprobantes {
  periodo: PeriodoReporte
  conteoPorTipo: ItemConteoComprobante[]
  pendientesSUNAT: number
  anulaciones: number
  totalEmitido: number
}

export interface ItemTurno {
  cajaId: string
  operador: string
  apertura: {
    hora: string
    montoInicial: number
  }
  cierre: {
    hora: string
    montoFinal: number
    montoCierre: number
  } | null
  diferencia: number | null
  estado: 'ABIERTO' | 'CERRADO'
}

export interface ReporteTurnos {
  periodo: PeriodoReporte
  turnos: ItemTurno[]
}
