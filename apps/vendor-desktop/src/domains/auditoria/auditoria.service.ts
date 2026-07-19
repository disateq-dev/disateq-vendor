import { invoke } from "@tauri-apps/api/core";

// Rubros canónicos del sistema — universal, multi-rubro
export type RubroAuditoria =
  | "SISTEMA"
  | "FARMACIA"
  | "OPTICA"
  | "ABARROTES"
  | "FOOD_FAST"
  | "PANADERIA"
  | "ZAPATERIA"
  | "REPARACION"
  | "CELULARES";

// Dominios canónicos — transversales a todos los rubros
export type DominioAuditoria =
  | "IDENTIDAD"
  | "CAJA"
  | "COMPROBANTE"
  | "INVENTARIO"
  | "CONFIGURACION"
  | "CATALOGO";

// Tipos de operación — sin prefijo = universal, con prefijo RUBRO_ = específico
export type TipoOperacion =
  // IDENTIDAD — universal
  | "CAMBIO_PIN_OPERADOR"
  | "CAMBIO_PIN_AUTORIZACION"
  | "CREACION_OPERADOR"
  | "BAJA_OPERADOR"
  | "CAMBIO_ROL_OPERADOR"
  // CONFIGURACION — universal
  | "CAMBIO_CONFIG_ESTABLECIMIENTO"
  | "CONFIGURACION_PIN_AUTORIZACION"
  // CAJA — universal
  | "CORRECCION_ARQUEO"
  | "CIERRE_EXTEMPORANEO"
  | "CORRECCION_APERTURA"
  // COMPROBANTE — universal
  | "ANULACION_COMPROBANTE"
  // INVENTARIO — universal (el contenido varía por rubro)
  | "AJUSTE_STOCK_MANUAL"
  | "BAJA_LOTE"
  // CATALOGO — específico farmacia
  | "FARMACIA_MODIFICACION_PRECIO_DIGEMID"
  | "FARMACIA_MODIFICACION_REGISTRO_SANITARIO";

export type ResultadoAuditoria = "EXITOSO" | "FALLIDO";

export interface RegistroAuditoriaInput {
  rubro: RubroAuditoria;
  dominio: DominioAuditoria;
  tipoOperacion: TipoOperacion;
  operadorId: string;
  operadorAlias: string;
  ejecutadoPor: string;
  detalle?: Record<string, unknown>;
  resultado: ResultadoAuditoria;
}

export const auditoriaService = {
  async registrar(input: RegistroAuditoriaInput): Promise<void> {
    try {
      await invoke<void>("registrar_auditoria_operacion", {
        rubro:         input.rubro,
        dominio:       input.dominio,
        tipoOperacion: input.tipoOperacion,
        operadorId:    input.operadorId,
        operadorAlias: input.operadorAlias,
        ejecutadoPor:  input.ejecutadoPor,
        detalle:       input.detalle ? JSON.stringify(input.detalle) : null,
        resultado:     input.resultado,
      });
    } catch {
      // La auditoría nunca bloquea la operación principal
      // El fallo queda silencioso — se registrará en error_log en versión futura
    }
  },
};
