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

export interface RegistroAuditoria {
  id:            string;
  rubro:         RubroAuditoria;
  dominio:       DominioAuditoria;
  tipoOperacion: TipoOperacion;
  operadorId:    string;
  operadorAlias: string;
  ejecutadoPor:  string;
  detalle:       string | null;
  resultado:     ResultadoAuditoria;
  ipTerminal:    string | null;
  registradoEn:  string;
}

export interface ResumenAuditoriaDominio {
  dominio:  DominioAuditoria;
  total:    number;
  exitosos: number;
  fallidos: number;
  ultimoEn: string | null;
}

export interface FiltrosAuditoria {
  dominio?:       DominioAuditoria;
  tipoOperacion?: TipoOperacion;
  operadorAlias?: string;
  resultado?:     ResultadoAuditoria;
  desde?:         string;
  hasta?:         string;
  limite?:        number;
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
  async obtenerRegistros(filtros: FiltrosAuditoria = {}): Promise<RegistroAuditoria[]> {
    const raw = await invoke<Record<string, unknown>[]>("obtener_registros_auditoria", {
      dominio:       filtros.dominio       ?? null,
      tipoOperacion: filtros.tipoOperacion ?? null,
      operadorAlias: filtros.operadorAlias ?? null,
      resultado:     filtros.resultado     ?? null,
      desde:         filtros.desde         ?? null,
      hasta:         filtros.hasta         ?? null,
      limite:        filtros.limite        ?? null,
    });
    return raw.map(r => ({
      id:            r.id            as string,
      rubro:         r.rubro         as RubroAuditoria,
      dominio:       r.dominio       as DominioAuditoria,
      tipoOperacion: r.tipo_operacion as TipoOperacion,
      operadorId:    r.operador_id   as string,
      operadorAlias: r.operador_alias as string,
      ejecutadoPor:  r.ejecutado_por  as string,
      detalle:       r.detalle        as string | null,
      resultado:     r.resultado      as ResultadoAuditoria,
      ipTerminal:    r.ip_terminal    as string | null,
      registradoEn:  r.registrado_en  as string,
    }));
  },
  async obtenerResumen(): Promise<ResumenAuditoriaDominio[]> {
    const raw = await invoke<Record<string, unknown>[]>("obtener_resumen_auditoria");
    return raw.map(r => ({
      dominio:  r.dominio  as DominioAuditoria,
      total:    r.total    as number,
      exitosos: r.exitosos as number,
      fallidos: r.fallidos as number,
      ultimoEn: r.ultimo_en as string | null,
    }));
  },
};
