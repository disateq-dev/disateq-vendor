# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-23 — Sesion Grupo F (Auditoria Integral Bloque 2 CERRADA)
**Commit activo:** ver git log · **Rama:** main · **Migracion SQLite:** v26 · **Working tree:** LIMPIO

## ESTADO GENERAL
Auditoria Integral en curso (8 bloques). Bloque 1 (cash/) CERRADO. Bloque 2
(sales/ + preventa/) CERRADO COMPLETO — Grupos A, B, C, D, E y F cerrados.

## GOBERNANZA
CLAUDE.md: Codex CLI exclusivamente codigo de aplicacion, nunca documentacion.
Claude es guardian de documentacion — la escribe directo, siempre mostrando en chat
para aprobacion antes de escribir.
Principio UX establecido: skeleton/spinner solo cuando la espera es perceptible (>=3s).
Cargas sub-segundo no requieren indicador visual.

## COMMITS DE ESTA SESION (mas reciente primero)
docs(farmacia): JSDoc aclaratorio en ProductoGeneral y ProductoGenerico — prevenir confusion de nomenclatura
feat(despacho): imprimir referencia de comprobante en ticket de despacho — configurable por negocio via imprimirRefComprobanteEnDespacho
fix(preventa): tipar tipoPrecio con TipoValorOperacional — eliminar string literal RESUELTO, propagar tipoValor y codigoBarras desde bridge

## COMMITS SESION ANTERIOR (referencia)
822ed20 feat(inventory): migrar inventory.store a SQLite — eliminar localStorage, hidratacion desde obtener_inventario_farmacia
b4be88e chore(cleanup): eliminar datos de prueba — catalogs seed, catalog-bridge, hov.migration, rubro-seed
97d9145 feat(catalog): migrar hov.store y valor-operacional.store a SQLite — eliminar localStorage, rehidratar siempre al arranque
11f4d13 feat(comprobantes): migrar lista y detalle a SQLite — eliminar comprobanteStore de ComprobantesWorkspace
24957f4 fix(documents): migrar convertirAFormal a SQLite — correlativo y persistencia sin localStorage

## AUDITORIA INTEGRAL — ESTADO
Bloque 1 (cash/): CERRADO.
Bloque 2 (sales/ + preventa/): CERRADO COMPLETO.

### Grupo F — CERRADO COMPLETO (esta sesion)

P6 CERRADO:
- tipoPrecio tipado con TipoValorOperacional en LineaPreVenta, preventa.actions, preventa.service
- String literal 'RESUELTO' eliminado — nunca existio en el dominio
- bridge-pedido: AddProductBridgeInput recibe tipoValor: TipoValorOperacional | null
- traducirALineaPreVenta: tipoPrecio = requiereValorManual ? 'LIBRE' : (tipoValor ?? 'NORMAL')
- Cuatro call-sites en SalesWorkspace.tsx actualizados (handleConfirmarForma pasa tipoValor real; resto pasa null)

P7 CERRADO:
- bridge-pedido: codigoBarras: input.codigoBarras (no input.hovId)
- AddProductBridgeInput: campo codigoBarras?: string anadido

P13 CERRADO — decision de producto:
- dispatchCorrelative reset-por-apertura es correcto para ticket de despacho (documento operacional efimero)
- NUEVO: comprobanteRef?: string anadido a DispatchData
- buildDispatchHTML y buildDispatchAppend renderizan comprobanteRef condicionalmente (negrita, bajo el numero de despacho)
- BusinessConfig: imprimirRefComprobanteEnDespacho: boolean, default true para todos los rubros
- CobroPanel.confirmEmit y handleImprimir propagan comprobanteRef si la config lo habilita
- ConfigWorkspace.handleSaveNegocio preserva el campo al guardar datos del negocio

P17 CERRADO — deuda documental:
- ProductoGeneral: JSDoc aclaratorio — articulo no farmaceutico (PRODUCTO_GENERAL), NO es ProductoGenerico
- ProductoGenerico: JSDoc aclaratorio — entidad DCI/IFA farmaceutica (molecula), NO confundir
  con concepto comercial 'generico' (condicionVenta=SIN_RECETA en ProductoComercial)

## DEUDA EXPLICITA REGISTRADA
- bridge-comprobante.ts: correlativoAUsar = input.correlativoExterno ?? 1
  fallback a 1 es temporal — aceptable hasta que todos los call-sites pasen correlativo externo
- CobroPanel.tsx buildComprobanteData (fallback del catch): usa nextCorrelative del closure
  (correlativoStore in-memory, hidratado desde SQLite) — riesgo bajo, documentado
- ComprobantesWorkspace.tsx: spinner de detalle puede ser imperceptible — evaluar en produccion
- startup-integrity.service.ts: JSDoc menciona "Si LS-HOV esta vacio" — texto residual,
  sin impacto en comportamiento — limpiar en proxima oportunidad
- persistence.ts: loadMovimientos() exportada como wrapper de compatibilidad — sin localStorage

## HALLAZGOS DE CATALOGO
Tres fuentes de catalogo coexisten en farmacia:
1. catalogs.ts (rubros con catalog:[]) — estructura conservada para tipos, sin datos seed
2. catalogo_digemid.sqlite (DIGEMID oficial, 18397 registros) — solo lectura
3. disateq.db (SQLite operacional) — unica fuente de verdad

## ARQUITECTURA MULTI-RUBRO
TipoRecursoOperacional = 'MEDICAMENTO' | 'PRODUCTO_GENERAL' | 'SERVICIO' es rubro-agnostico.
venta.service.ts: desacoplado de useFarmaciaStore — servicio rubro-neutro.
pedido.store.ts: localStorage eliminado — SQLite como unica fuente de verdad.

## PATRON ESTABLECIDO — SQLite como unica fuente de verdad
Todas las stores operacionales criticas migradas:
- operadores, turno/sesion, comprobantes, correlativos: SQLite
- hov.store, valor-operacional.store: memoria rehidratada desde SQLite al arranque
- inventory.store: memoria rehidratada desde SQLite al arranque
- localStorage eliminado de todos los flujos operacionales de negocio

## PRINCIPIO UX ESTABLECIDO
Skeleton/spinner solo cuando la espera es perceptible (>=3s). SQLite local es
tipicamente sub-segundo — evaluar en uso real antes de agregar indicadores.

## ORDEN DE TRABAJO PROXIMA SESION
1. Confirmar cuales bloques de la Auditoria Integral siguen pendientes (Bloques 3-8)
2. Definir siguiente bloque a auditar o evaluar si se abre nuevo frente de desarrollo
3. Candidato identificado: startup-integrity.service.ts JSDoc residual (minimo, puede ir en proximo bloque)

## PROTOCOLO PROXIMA SESION
1. Leer este archivo. 2. git log --oneline -5. 3. Confirmar orden de trabajo.
4. Esperar confirmacion antes de generar prompts.
