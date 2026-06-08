import type { TipoComprobante } from './comprobante.types'

export interface RegistroCorrelativo {
  serie: string
  tipo: TipoComprobante
  siguiente: number
  ultimoEmitido: number
  creadoEn: string
  actualizadoEn: string
}

export interface CorrelativoStore {
  registros: RegistroCorrelativo[]
}
