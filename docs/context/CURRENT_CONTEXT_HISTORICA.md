# CURRENT_CONTEXT_HISTORICA — DISATEQ Vendor™

Documento histórico. NO se lee por defecto al abrir sesión — solo bajo necesidad puntual de
contexto pasado (ej. "¿cómo se resolvió H2?", "¿qué se hizo en la sesión del DNI/RUC?").
Recibe el detalle purgado de `CURRENT_CONTEXT.md` cada vez que este se resume al cierre de
sesión, según el principio Activo/Histórico establecido en `CLAUDE.md` §3.7. Nunca se borra
información — solo se deja de cargar automáticamente.

---

## SESIÓN 2026-07-24 — Sprint FLUJO NUCLEAR H2/H5/H10 + INTEGRACIONES DNI/RUC

**Commit de cierre:** a59d9fa · **Rama:** main · **Migración SQLite:** v29

### Corrección de gobernanza documental (fin de sesión)
Se detectó que el protocolo de `CURRENT_CONTEXT.md` nunca exigía explícitamente leer
`CLAUDE.md` al abrir sesión — Fernando asumía que era lectura por defecto; no lo era. Se
corrigió `CLAUDE.md` §3 agregando el paso 0 de apertura de sesión obligatoria (lee CLAUDE.md
+ CURRENT_CONTEXT.md, en ese orden, cada sesión sin excepción). Se detectó además que
`CONTRATO_ARQUITECTURA.md`, citado dos veces en `CLAUDE.md` §4 y en `docs/INDICE.md` como
autoridad doctrinal vigente, NO EXISTE en el repositorio — es residuo de una plantilla de
apertura de sesión obsoleta (confirmado en sesiones anteriores contra filesystem). Corregido
en ambos documentos: `docs/DOCTRINA.md` queda como única autoridad doctrinal citada.
`CURRENT_CONTEXT.md` excedía el límite de 30 líneas establecido en `CLAUDE.md` §3.6 (tenía
más de 150, con diagnóstico completo de bugs ya resueltos) — nunca se había aplicado el
principio Activo/Histórico §3.7 a este documento específico (no existía este archivo). Se
creó este documento y se purgó el activo a formato resumen ejecutivo.

### ITEM 0 / H2 — Correlativo fallback y falso éxito en emisión — CERRADO (a59d9fa)
Diagnóstico confirmado contra código real (no solo el resumen de contexto): la tabla
`comprobante` ya tenía `UNIQUE INDEX(serie, correlativo)` desde migración v17, por lo que la
integridad de datos nunca estuvo realmente en riesgo de duplicado silencioso. El problema
real, más grave que el hallazgo original: si el registro en SQLite fallaba, el catch
construía un comprobante alterno con correlativo calculado desde `correlativoStore` (memoria,
no sincronizado) y NUNCA revisaba el resultado `{ ok }` de `registrarComprobanteEnSQLite` —
el operador veía "SE GUARDÓ EL DOCUMENTO" aunque el comprobante no se hubiera grabado.
Corrección en dos iteraciones:
  1) `buildComprobanteData()` eliminada por completo. Lógica de `confirmEmit()` y
     `handleImprimir()` unificada en `emitirYRegistrarComprobante()`. `obtenerSiguienteCorrelativoSQLite()`
     ya no absorbe errores con fallback a 1 — propaga la excepción. `_ejecutarSideEffects()`
     verifica `{ ok }` real de `registrarComprobanteEnSQLite` y de `concretarVenta`; ante fallo,
     lanza excepción en vez de continuar. `recordSale()` movido a DESPUÉS de la confirmación
     real de éxito (antes se ejecutaba antes del try). catch ahora usa `showNotice()` sin
     ningún `setConfirmSheet` de éxito falso.
  2) Remanente encontrado en auditoría post-commit: `docNumber`/`nextCorrelative` (calculados
     desde `correlativoStore`) seguían siendo el número mostrado en el badge previo al cobro
     y el número enviado al cliente por WhatsApp/email en `despacharPorCanal()`, pudiendo no
     coincidir con el `codigoUnico` real grabado en SQLite. Corregido: badge conserva la
     previsualización pero con `title="Número previsto — se confirma al emitir"`;
     `despacharPorCanal()` ahora recibe el `Comprobante` ya emitido y usa `comprobante.codigoUnico`;
     el envío por canal se dispara DESPUÉS de una emisión exitosa confirmada, nunca antes.
Validado: `npx tsc -p tsconfig.app.json --noEmit` limpio. `cargo check` limpio (solo los 2
warnings pre-existentes de `thermal.rs`). Ambas corridas por Fernando en PowerShell.
Archivos: `comprobante-sqlite.service.ts`, `CobroPanel.tsx`.

### ITEM 1 — Verificación integración DNI/RUC — CERRADO
URL base y token configurados en AJUSTES → Integraciones.
PROBAR CONEXIÓN: exitoso. GUARDAR: exitoso. Persistencia SQLite confirmada.

### ITEM 2 — ClienteBuscador conectado a Tauri — CERRADO (c5dc08d)
Eliminado: `parsearHtmlSunat`, fetch directo SUNAT/RENIEC (inoperable por CORS),
interfaces `DatosDNI` y `DatosRUC` (código muerto).
Agregado: `invoke("consultar_dni")` en `FormularioDNI` y `FormularioBoleta`.
          `invoke("consultar_ruc")` en `FormularioRUC`.
Manejo explícito de `INTEGRACION_NO_CONFIGURADA` con mensaje al operador.
Caché local vía `clienteStore` preservada: búsqueda local siempre primero.
Chips RENIEC / SUNAT conservados (fuente semántica, no técnica).

### ITEM 3 / H10 — Bloqueo agregar producto sin turno — CERRADO (02e09f1)
Validación `cashSession.isOpen` al inicio de `addProductToTicket`.
`showNotice` "Abre el turno para poder vender" como feedback inmediato.
Operador descubre bloqueo al primer producto, no al momento de cobrar.

### ITEM 3 / H5 — Ajuste de precio por VEN con política configurable — CERRADO (72fea35)
Migración v29 (fbbe47a):
  - Columnas `precio_edicion_modo` (DEFAULT `PISO_COSTO`) y
    `precio_edicion_margen_minimo` (DEFAULT 0.10) en `config_establecimiento`.
  - Capacidad `editar_precio_venta` agregada a roles GES y VEN.
  - Idempotente vía `pragma_table_info` y contains check.
Comando `obtener_config_precios_venta` en `db_commands.rs`, registrado en `lib.rs`.
`SalesWorkspace`: `puedeEditarPrecio = useCapacidad("editar_precio_venta")`.
                  Carga config desde SQLite al montar vía invoke.
`PresentacionSheet`: campo ajuste visible SOLO si:
  - `puedeEditarPrecio=true`
  - `tipoValor` in [NORMAL, PREFERENCIAL, MAYORISTA]
  - `valorAplicado !== null`
  - `costoBase > 0` (costo registrado en HOV)
  OFERTA: siempre bloqueado.
  LIBRE (sin precio): flujo existente sin cambios (error de config, no se premia).
  Tres modos: SIN_LIMITE (piso=0), PISO_COSTO (piso=costoBase),
              MARGEN_MINIMO (piso=costoBase*(1+margen)).
  Precio pre-poblado con valor actual al abrir ajuste.
  Error inline si precio < piso permitido.
  Configuración de política en AJUSTES: PENDIENTE (sprint posterior, deuda registrada).

### HALLAZGOS FLUJO NUCLEAR DE VENTAS — snapshot al cierre de sesión
CRÍTICOS — todos CERRADOS esta sesión: H2 (a59d9fa), H5 (72fea35), H10 (02e09f1).
FUNCIONALES — PENDIENTES:
  H4 — Modo VISUAL: área de imagen en tiles vacía (span vacío, rectángulo gris).
  H6 — Afectación tributaria expuesta al cajero VEN — debería ser fija o restringida a GES+.
  H7 — N. Crédito / N. Débito visibles pero disabled sin contexto — confunden al operador.
  H8 — Descuento manual sin validación de capacidad ni autorización.
  H9 — ConfirmacionRecetaPanel: absolute sobre catálogo, PreVentaGrid accesible por debajo.
UX — PENDIENTES:
  H11 — Modo LISTA vacío: mensaje igual cuando catálogo vacío que cuando espera query.
  H12 — `_saleCounter`: contador global, se resetea en hot-reload. No correlativo real.

### HALLAZGOS FLUJO CLIENTES — snapshot al cierre de sesión
ARQUITECTURA — PENDIENTES:
  D1 — ClienteBuscador NO debe consultar RENIEC/SUNAT (responsabilidad de módulo CLIENTES).
  D2 — ClienteBuscador crea clientes con `crearCliente()` como efecto secundario del cobro.
       Contamina CRM con perfiles incompletos.
  D3 — `clienteStore` es localStorage. Pendiente sprint migración Clientes a SQLite.
  D4 — CERRADO PARCIALMENTE (c5dc08d): `consultar_dni`/`consultar_ruc` conectados al buscador.
       Pendiente: refactor arquitectural completo cuando D3 se resuelva.
UX CLIENTE BUSCADOR — PENDIENTES: C2, C4, C5, C7 — pendientes sprint rediseño flujo clientes.

### INTEGRACIONES DNI/RUC — estado al cierre
Migración v28: columnas `consulta_doc_url` + `consulta_doc_token` en `config_establecimiento`.
4 comandos en `consultas_peru.rs`: `consultar_dni`, `consultar_ruc`,
`obtener_config_integraciones`, `guardar_config_integraciones`.
`IntegracionesWorkspace.tsx` en AJUSTES → Integraciones operativo y verificado.
Proveedor activo: my.apidev.pro con Bearer token configurado y persistido.
Caché local: `clienteStore.getClienteByDocumento` siempre primero — API solo si no hay local.

### DEUDA EXPLÍCITA — histórico completo al cierre de sesión
- `correlativoStore.confirmarEmision()` nunca se invoca en el flujo real (post-H2). No es
  riesgo de integridad (SQLite es la única fuente para la emisión real desde H2), pero el
  badge de previsualización en `CobroPanel` puede mostrar un número desincronizado del
  estado real de SQLite hasta el próximo reinicio de la app (rehidrata vía `hidratarDesdeDb`
  en `POSContext`). Menor, cosmético.
- `CobroPanel.tsx`: `sessionKey` construido manualmente como string.
- `bridge-comprobante.ts`: `correlativoAUsar = input.correlativoExterno ?? 1` — fallback
  interno de `emitirComprobante()`. Ya no se alcanza en la práctica porque `CobroPanel`
  siempre pasa un `correlativoExterno` válido (obtenido de SQLite) o lanza excepción antes
  de llegar aquí. Guarda defensiva, no prioritaria.
- `bridge-catalogo.ts`: `margenMinimoConfigurable` hardcodeado a 0.15 — pendiente conectar a BD.
- `ConfigWorkspace.tsx`: sin pantalla de configuración para política de precios (deuda v1.1).
- `thermal.rs`: `unit_price` y `tipo_documento` sin uso (warnings pre-existentes).
- `DocumentosPanel.tsx`: ANULAR usa `window.confirm` en lugar de PIN GESTOR.
- `DocumentosPanel.tsx`: REIMPRIMIR registra evento pero no imprime.
- `DocumentosPanel.tsx`: CONVERTIR sin comando Rust.
- `ClienteBuscador.tsx`: `crearCliente()` como efecto secundario del cobro (D2).
- `clients/cliente.store.ts`: localStorage activo (D3).
- `purchases/persistence.ts` + `purchases/store.ts`: localStorage activo.

### ARQUITECTURA MULTI-RUBRO (referencia general, no exclusiva de esta sesión)
`TipoRecursoOperacional = 'MEDICAMENTO' | 'PRODUCTO_GENERAL' | 'SERVICIO'` rubro-agnóstico.
`venta.service.ts` desacoplado de `useFarmaciaStore`.

### CONVENCIÓN TAURI 2 — CRÍTICO (referencia general, no exclusiva de esta sesión)
Tauri 2 convierte automáticamente parámetros JS camelCase a snake_case antes de Rust.
NO convierte: claves de objetos anidados en arrays, ni claves de respuesta JSON.
Solución: parámetros invoke en camelCase, `#[serde(rename_all = "camelCase")]` en structs Rust.

### DATOS DE PRUEBA EN BD (referencia general)
Script: `scripts/seed_prueba_ventas.py` (idempotente, `INSERT OR IGNORE`).
Producto: AMOXICILINA 500MG PRUEBA · LAB PRUEBA SAC.
IDs: `pg-prueba-001`, `pc-prueba-001`, `pres-prueba-001`.
Nodos: `nodo-prueba-caja` (CAJA x10 · S/5.00) + `nodo-prueba-capsula` (CAPSULA · S/0.50).

### AUDITORÍA INTEGRAL — estado al cierre
Bloque 1 (cash/): CERRADO. Bloque 2 (sales/ + preventa/): CERRADO COMPLETO. Bloques 3-8: PENDIENTES.
