# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-24 — Sprint FLUJO NUCLEAR H5/H10 + INTEGRACIONES DNI/RUC
**Commit activo:** 72fea35 · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** LIMPIO

## ESTADO GENERAL
Auditoria Integral en curso (8 bloques). Bloques 1 y 2 CERRADOS. Bloques 3-8 PENDIENTES.
Sesion enfocada en afinamiento del flujo nuclear de ventas y conexion de integraciones.
Cinco tareas completadas esta sesion (ver commits).

## GOBERNANZA
CLAUDE.md: Codex CLI exclusivamente codigo de aplicacion, nunca documentacion.
Claude es guardian de documentacion — la escribe directo siempre mostrando en chat
para aprobacion antes de escribir.
Principio UX establecido: skeleton/spinner solo cuando la espera es perceptible (>=3s).
Cargas sub-segundo no requieren indicador visual.
REGLA AUDITORIA: Claude lee filesystem directamente — nunca pide a Codex que copie codigo.
El reporte de Codex es solo referencia de trazabilidad, no sustituye la verificacion directa.

## COMMITS DE ESTA SESION (mas reciente primero)
72fea35 feat(ventas): ajuste de precio por VEN con politica configurable (H5)
fbbe47a feat(precios): migracion v29 y comando obtener_config_precios_venta
02e09f1 fix(ventas): bloquear agregar producto sin turno activo (H10)
c5dc08d feat(clientes): conectar consulta DNI/RUC a comandos Tauri en ClienteBuscador

## ITEMS COMPLETADOS ESTA SESION

### ITEM 1 — Verificacion integracion DNI/RUC — CERRADO
URL base y token configurados en AJUSTES → Integraciones.
PROBAR CONEXION: exitoso. GUARDAR: exitoso. Persistencia SQLite confirmada.

### ITEM 2 — ClienteBuscador conectado a Tauri — CERRADO (c5dc08d)
Eliminado: parsearHtmlSunat, fetch directo SUNAT/RENIEC (inoperable por CORS),
interfaces DatosDNI y DatosRUC (codigo muerto).
Agregado: invoke("consultar_dni") en FormularioDNI y FormularioBoleta.
           invoke("consultar_ruc") en FormularioRUC.
Manejo explicito de INTEGRACION_NO_CONFIGURADA con mensaje al operador.
Cache local via clienteStore preservada: busqueda local siempre primero.
Chips RENIEC / SUNAT conservados (fuente semantica, no tecnica).

### ITEM 3 / H10 — Bloqueo agregar producto sin turno — CERRADO (02e09f1)
Validacion cashSession.isOpen al inicio de addProductToTicket.
showNotice "Abre el turno para poder vender" como feedback inmediato.
Operador descubre bloqueo al primer producto, no al momento de cobrar.

### ITEM 3 / H5 — Ajuste de precio por VEN con politica configurable — CERRADO (72fea35)
Migracion v29 (fbbe47a):
  - Columnas precio_edicion_modo (DEFAULT 'PISO_COSTO') y
    precio_edicion_margen_minimo (DEFAULT 0.10) en config_establecimiento.
  - Capacidad editar_precio_venta agregada a roles GES y VEN.
  - Idempotente via pragma_table_info y contains check.
Comando obtener_config_precios_venta en db_commands.rs, registrado en lib.rs.
SalesWorkspace: puedeEditarPrecio = useCapacidad("editar_precio_venta").
               Carga config desde SQLite al montar via invoke.
PresentacionSheet: campo ajuste visible SOLO si:
  - puedeEditarPrecio=true
  - tipoValor in [NORMAL, PREFERENCIAL, MAYORISTA]
  - valorAplicado !== null
  - costoBase > 0 (costo registrado en HOV)
  OFERTA: siempre bloqueado.
  LIBRE (sin precio): flujo existente sin cambios (error de config, no se premia).
  Tres modos: SIN_LIMITE (piso=0), PISO_COSTO (piso=costoBase),
              MARGEN_MINIMO (piso=costoBase*(1+margen)).
  Precio pre-poblado con valor actual al abrir ajuste.
  Error inline si precio < piso permitido.
  Configuracion de politica en AJUSTES: PENDIENTE (sprint posterior, deuda registrada).

## HALLAZGOS FLUJO NUCLEAR DE VENTAS — ESTADO ACTUALIZADO

### CRITICOS — PENDIENTES
H2 — CobroPanel: fallback buildComprobanteData usa nextCorrelative del closure (no SQLite).
     Si correlativo SQLite avanza antes del fallo, fallback puede generar duplicado.
     PENDIENTE — proximo en la cola.

### CRITICOS — CERRADOS ESTA SESION
H5 — CERRADO (72fea35). Ver detalle arriba.
H10 — CERRADO (02e09f1). Ver detalle arriba.

### FUNCIONALES — PENDIENTES
H4 — Modo VISUAL: area de imagen en tiles vacia (span vacio, rectangulo gris).
H6 — Afectacion tributaria expuesta al cajero VEN — deberia ser fija o restringida a GES+.
H7 — N. Credito / N. Debito visibles pero disabled sin contexto — confunden al operador.
H8 — Descuento manual sin validacion de capacidad ni autorizacion.
H9 — ConfirmacionRecetaPanel: absolute sobre catalogo, PreVentaGrid accesible por debajo.

### UX — PENDIENTES
H11 — Modo LISTA vacio: mensaje igual cuando catalogo vacio que cuando espera query.
H12 — _saleCounter: contador global, se resetea en hot-reload. No correlativo real.

## HALLAZGOS FLUJO CLIENTES — ESTADO ACTUALIZADO

### ARQUITECTURA — PENDIENTES
D1 — ClienteBuscador NO debe consultar RENIEC/SUNAT (responsabilidad de modulo CLIENTES).
D2 — ClienteBuscador crea clientes con crearCliente() como efecto secundario del cobro.
     Contamina CRM con perfiles incompletos.
D3 — clienteStore es localStorage. Pendiente sprint migracion Clientes a SQLite.
D4 — CERRADO PARCIALMENTE (c5dc08d): consultar_dni/consultar_ruc conectados al buscador.
     Pendiente: refactor arquitectural completo cuando D3 se resuelva.

### UX CLIENTE BUSCADOR — PENDIENTES
C2, C4, C5, C7 — pendientes sprint rediseno flujo clientes.

## INTEGRACIONES DNI/RUC — ESTADO
Migracion v28: columnas consulta_doc_url + consulta_doc_token en config_establecimiento.
4 comandos en consultas_peru.rs: consultar_dni, consultar_ruc,
obtener_config_integraciones, guardar_config_integraciones.
IntegracionesWorkspace.tsx en AJUSTES → Integraciones operativo y verificado.
Proveedor activo: my.apidev.pro con Bearer token configurado y persistido.
Cache local: clienteStore.getClienteByDocumento siempre primero — API solo si no hay local.

## DEUDA EXPLICITA REGISTRADA
- CobroPanel.tsx: buildComprobanteData fallback del catch usa nextCorrelative del closure (H2)
- CobroPanel.tsx: sessionKey construido manualmente como string
- bridge-comprobante.ts: correlativoAUsar = input.correlativoExterno ?? 1 — fallback temporal
- bridge-catalogo.ts: margenMinimoConfigurable hardcodeado a 0.15 — pendiente conectar a BD
- ConfigWorkspace.tsx: sin pantalla de configuracion para politica de precios (deuda v1.1)
- thermal.rs: unit_price y tipo_documento sin uso (warnings pre-existentes)
- DocumentosPanel.tsx: ANULAR usa window.confirm en lugar de PIN GESTOR
- DocumentosPanel.tsx: REIMPRIMIR registra evento pero no imprime
- DocumentosPanel.tsx: CONVERTIR sin comando Rust
- ClienteBuscador.tsx: crearCliente() como efecto secundario del cobro (D2)
- clients/cliente.store.ts: localStorage activo (D3)
- purchases/persistence.ts + purchases/store.ts: localStorage activo

## ARQUITECTURA MULTI-RUBRO
TipoRecursoOperacional = 'MEDICAMENTO' | 'PRODUCTO_GENERAL' | 'SERVICIO' rubro-agnostico.
venta.service.ts desacoplado de useFarmaciaStore.

## CONVENCION TAURI 2 — CRITICO
Tauri 2 convierte automaticamente parametros JS camelCase a snake_case antes de Rust.
NO convierte: claves de objetos anidados en arrays, ni claves de respuesta JSON.
Solucion: parametros invoke en camelCase, #[serde(rename_all = "camelCase")] en structs Rust.

## DATOS DE PRUEBA EN BD
Script: scripts/seed_prueba_ventas.py (idempotente, INSERT OR IGNORE)
Producto: AMOXICILINA 500MG PRUEBA · LAB PRUEBA SAC
IDs: pg-prueba-001, pc-prueba-001, pres-prueba-001
Nodos: nodo-prueba-caja (CAJA x10 · S/5.00) + nodo-prueba-capsula (CAPSULA · S/0.50)

## AUDITORIA INTEGRAL — ESTADO
Bloque 1 (cash/): CERRADO.
Bloque 2 (sales/ + preventa/): CERRADO COMPLETO.
Bloques 3-8: PENDIENTES.

## ORDEN DE TRABAJO PROXIMA SESION (prioridad descendente)
1. H2 — CobroPanel: correlativo fallback en catch (critico, bloqueo produccion)
2. Continuar Auditoria Integral — Bloque 3
3. Sprint migracion Clientes a SQLite (D3 → prerequisito para D1, D2)
4. Sprint DOCUMENTOS: CONVERTIR, PIN GESTOR en ANULAR, impresion real
5. Migracion purchases a SQLite
6. Pantalla configuracion politica de precios en AJUSTES (deuda v1.1)

## PROTOCOLO PROXIMA SESION
1. Leer este archivo.
2. git log --oneline -5.
3. Confirmar orden de trabajo con Fernando.
4. Esperar confirmacion antes de generar prompts.
