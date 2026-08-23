# DISATEQ VENDOR™ — COMPROBANTES: ARQUITECTURA Y ESTADO REAL

Documento generado por auditoría directa de código (no existía documento
previo dedicado a comprobantes). Fecha: 2026-08-02.

## Modelo de datos

**Ubicación canónica:** `domains/documents/comprobante.types.ts`

`Comprobante` es el documento fiscal emitido a partir de un Pedido. Campos
clave: `id`, `tipo`, `serie`, `correlativo`, `codigoUnico` (`SERIE-00000001`),
`esFormal`, `requiereEnvioSUNAT`, `leyendaNoFormal`, `emisor`, `receptor`,
`lineas[]`, `subtotal/igv/isc/total`, `metodoPago`, `tributario`, `estado`,
`estadoSUNAT`, `cdr`, `motivoAnulacion`, `operadorId`, `emitidoEn`.

**Tipos de comprobante:** `FACTURA · BOLETA · NOTA_CREDITO · NOTA_DEBITO ·
TIQUE_VENTA · COTIZACION`

**Clasificación formal/no formal** (`clasificarTipo` en `comprobante.service.ts`):
- FACTURA / BOLETA / NOTA_CREDITO / NOTA_DEBITO → formales, `requiereEnvioSUNAT: true`
- TIQUE_VENTA → no formal, lleva leyenda "ESTE DOCUMENTO NO ES UN COMPROBANTE DE PAGO CON VALOR TRIBUTARIO"
- COTIZACION → no formal, lleva leyenda "ESTE DOCUMENTO ES UNA COTIZACIÓN..."

**Estados (`EstadoComprobante`):** `EMITIDO · REFERENCIADO · ANULADO`
**Estado SUNAT (`EstadoSUNAT`):** `PENDIENTE · ENVIADO · ACEPTADO · RECHAZADO · NO_APLICA`

## Reglas de validación (`comprobante.validator.ts`)

- **FACTURA:** requiere RUC (11 dígitos, prefijo 10/20), bloquea receptor genérico, advierte si se ingresó DNI donde se espera RUC.
- **BOLETA:** bloquea emisión >S/700 con receptor genérico (exige DNI/CE/Pasaporte); advierte cerca de S/700 (S/600–700) y si se ingresó un RUC.
- **NOTA_CREDITO / NOTA_DEBITO:** exige referenciar una FACTURA o BOLETA existente, no anulada.
- **TIQUE_VENTA / COTIZACION:** sin restricciones.

## Flujo de emisión

`CobroPanel.tsx` (módulo VENTAS/preventa) → `emitirComprobante()` /
`crearComprobante()` (valida, calcula ISC, arma objeto) →
`registrarComprobanteEnSQLite()` → comando Rust `registrar_comprobante`, que en
una sola transacción SQLite: inserta en `comprobante`, inserta cada línea en
`linea_comprobante`, y actualiza `correlativo` (upsert `siguiente = correlativo+1`).

**Conversión Tique/Cotización → Boleta/Factura** (`convertirAFormal`, invocado
desde `ComprobantesWorkspace.tsx`): crea un comprobante nuevo formal
referenciando el origen (`comprobanteOrigenId`), y marca el origen como
`REFERENCIADO` vía comando `marcar_comprobante_referenciado`.

**Anulación** (`anularComprobante` en `comprobante.service.ts` / comando
`anular_comprobante_sqlite`): bloquea anular un ya-anulado; si es formal y
`estadoSUNAT === 'ACEPTADO'`, exige Nota de Crédito en vez de anulación
directa; motivo obligatorio.

## Series y correlativos

**Series hardcodeadas en código**, no configurables desde UI:
`T001` (tique), `B001` (boleta), `F001` (factura), `C001` (cotización) —
definidas en `CobroPanel.tsx` (`DOC_SERIES`) y repetidas de forma independiente
en `ComprobantesWorkspace.tsx` para la conversión a formal.

La autoridad real del correlativo vive en SQLite, tabla `correlativo`
(`serie` PK, `siguiente`, `ultimo_emitido`), actualizada atómicamente junto
con el insert del comprobante — no hay riesgo de condición de carrera dentro
de una misma instalación. `codigo_unico` tiene constraint UNIQUE, y
`(serie, correlativo)` tiene índice único.

Esto es consistente con `docs/03-arquitectura/ARQUITECTURA_SYNC.md` (líneas
179–198), que ya documenta como pendiente que la serie provenga de
configuración asignada por el Nexo en vez de estar hardcodeada — confirmado
en código real, no solo en doctrina.

## Configuración (emisor / negocio)

`config/business.ts` — **localStorage**, no SQLite (`disateq.config.business`).
Incluye `ruc`, `razonSocial`, `direccion`, `telefono`, `tasaIGV` (18% default),
`imprimirRefComprobanteEnDespacho`. Se edita desde el formulario general de
negocio en `ConfigWorkspace.tsx` — **no existe una pantalla dedicada a
"Configuración de Comprobantes"** (series, numeración, tipos habilitados);
lo que hoy configura series es código fuente, no UI.

## Persistencia SQLite (`migrations.rs`)

Tablas: `comprobante`, `linea_comprobante`, `correlativo`, `evento_comprobante`
(esta última registra eventos como `REIMPRESION`). Índices sobre `venta_id`,
`sesion_id`, `emitido_en`, y único sobre `(serie, correlativo)`.

## Comandos Tauri (`commands/comprobantes.rs`)

`registrar_comprobante` · `obtener_siguiente_correlativo` ·
`obtener_comprobantes_sesion` · `obtener_comprobantes_historial` ·
`obtener_comprobante_detalle` · `anular_comprobante_sqlite` ·
`actualizar_estado_sunat` · `obtener_todos_correlativos` ·
`marcar_comprobante_referenciado` · `registrar_evento_comprobante`.

## Superficies de UI

Dos paneles independientes leen comprobantes desde SQLite, con caminos de
escritura distintos:

1. **`ComprobantesWorkspace.tsx`** (módulo COMPROBANTES) — vista Sesión/Historial, detalle, anular, convertir a formal.
2. **`DocumentosPanel.tsx`** (módulo CASH/TURNO, dentro de sesión activa) — reimprimir, anular.

## Integración SUNAT

El modelo de datos anticipa el ciclo completo (`estadoSUNAT`, `cdr`,
`fechaEnvioSUNAT`, comando `actualizar_estado_sunat`), pero **no se encontró
ningún cliente/servicio que envíe comprobantes a SUNAT**. Hoy
`estadoSUNAT` queda en `PENDIENTE` (formales) o `NO_APLICA` (tique/cotización)
sin mecanismo automático que lo mueva a `ENVIADO/ACEPTADO/RECHAZADO`.

---

## Hallazgos — deuda técnica detectada (evidencia directa, no opinión)

1. **Anulación divergente entre las dos superficies de UI.**
   `DocumentosPanel.tsx` anula correctamente vía `anularComprobanteEnSQLite`
   (persiste en la base real). `ComprobantesWorkspace.tsx` anula vía
   `anularComprobante()` de `usePOS()` → `useComprobantes.ts` →
   `comprobante.store.ts`, un store **en memoria que arranca vacío en cada
   carga** (`loadStore()` siempre devuelve `createEmptyStore()`, nunca se
   hidrata desde SQLite). El botón ANULAR del workspace "oficial" de
   comprobantes probablemente no persiste el cambio en la base de datos.
   **Severidad: alta — requiere verificación en runtime antes de confiar en
   la función ANULAR de COMPROBANTES.** Ver entrada correspondiente en
   `docs/00-governance/BITACORA_DECISIONES.md` (2026-08-02).

2. **`comprobante.store.ts` y `correlativo.store.ts` son stores en memoria
   no conectados a SQLite**, aparentemente residuo de una etapa previa a la
   migración a SQLite. `correlativoStore.hidratarDesdeDb()` existe pero no
   se encontró ningún caller — sugiere una conexión planeada y nunca cerrada.

3. **`DocumentosPanel.tsx` filtra por `'BOLETA_VENTA'` / `'FACTURA_ELECTRONICA'`**,
   valores que no existen en `TipoComprobante` (los reales son `'BOLETA'` /
   `'FACTURA'`). El filtro de tipo en ese panel nunca puede coincidir con
   datos reales — filtro roto en silencio.

4. **Series hardcodeadas y duplicadas** en dos archivos distintos
   (`CobroPanel.tsx` y `ComprobantesWorkspace.tsx`) — cualquier cambio de
   serie requiere editar código en dos lugares, con riesgo de divergencia.

5. **Emisor vive en localStorage, el resto del dominio vive en SQLite** —
   inconsistencia de capa de persistencia dentro del mismo dominio funcional.

6. **Sin integración SUNAT real** — el modelo de datos está listo, no hay
   servicio de envío.
