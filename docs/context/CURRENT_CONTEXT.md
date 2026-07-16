# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-16
**Último commit:** `6f850f0`
**Rama:** `main`
**Working tree:** limpio

---

## ⚠️ DIRECTIVA ESTRATÉGICA ACTIVA — Fase de integración real

**Decisión de Fernando (12 Jul 2026):** abandonar mocks y datos ficticios. El proyecto entra en fase de integración real. Todo flujo nuevo debe operar contra SQLite. Los flujos existentes en localStorage deben migrar progresivamente.

### Estado de integración localStorage ↔ SQLite

**Paso A — Persistencia de venta ✅ COMPLETADO (commit `dce94d3`)**

**Paso B — Comprobante en SQLite ✅ COMPLETADO**
Commits: `f8248de`, `fa26809`, `8eb2e08`, `340d0c1`
Tablas: `comprobante`, `linea_comprobante`, `correlativo` (v17)

**Paso C — Turno/sesión en SQLite ✅ COMPLETADO**
Commits: `d7e6870`, `e69bb11`, `345d0ce`, `ec34c16`
Tablas: `sesion_caja`, `movimiento_caja`, `evento_turno` (v18)

**Paso D — Operadores en SQLite ✅ COMPLETADO**
Commits: `7489622`, `98a62bc`, `8d1612f`, `d6eb12c`
Tablas: `operador`, `rol` (v19)

**Migración v20 ✅ COMPLETADA — commit `82f6dc9`**
- `movimiento.unidades_facturadas REAL` — trazabilidad fiscal de bonus distribuidor
- `venta.sincronizado_en TEXT` — preparación Multi-POS v2.0
- `comprobante.sincronizado_en TEXT` — preparación Multi-POS v2.0

Diferido aceptable del Paso D:
- `accesosStore` (bitácora de accesos) sigue en localStorage — cap 200 eventos
- `session-history.service.ts` sigue leyendo de localStorage — migración async pendiente
- `changeOperatorPin` / `changeOperatorPinById` — no tienen escritura SQLite aún (uso infrecuente)

---

## Sesiones completadas

### Faena 21: D-PRECIOS-2 — Commit `5eee80f` ✅
### Faena 22: Design system — 4 ítems — Commits `0ffc39c`, `822b783` ✅
### Faena 23-24: §8 GLOSARIO completo — Commits `6fc73e3`, `9ed3e31` ✅ — Segundo rubro desbloqueado
### Faena 25: Paso A — Venta en SQLite — Commit `dce94d3` ✅
### Faena 26: Paso B — Comprobante en SQLite — Commits `f8248de`→`340d0c1` ✅
### Faena 27: Paso C — Turno/sesión en SQLite — Commits `d7e6870`→`ec34c16` ✅
### Faena 28: Paso D — Operadores en SQLite — Commits `7489622`→`d6eb12c` ✅

Sesión 13 Jul 2026:
- Push de `main` a `origin` completado (primera vez — 2959 objetos subidos)
- `origin/main` tracking configurado con `--set-upstream`
- Análisis de seguridad PIN: SHA-256 con salt estático — riesgo bajo en producción Tauri (DevTools deshabilitado en release); `pin_salt` agregado a tabla para futura mejora PBKDF2
- Análisis PWA vs Tauri: Tauri es la decisión correcta por impresión térmica ESC/POS nativa

### Faena 29: Sesión 16 Jul 2026 ✅
- Limpieza artefactos Codex: `apps/vendor-desktop/docs/roles-equipo.md` eliminado — commit `8b729c0`
- `apps/cargo-check-temp/` eliminado del filesystem (untracked)
- Auditoría comandos Rust desactivación: los 3 ya estaban implementados y registrados — deuda funcional cerrada
- CURRENT_CONTEXT actualizado — commit `a40eef1`

### Faena 30: D-INGRESOS-4 — Bonus Distribuidor ✅ CERRADO — Sesión 16 Jul 2026
Commits: `82f6dc9`, `9a39762`, `6f850f0`

**Problema resuelto:** el sistema ahora distingue entre unidades facturadas (lo que dice el documento fiscal del distribuidor → para pedido y costos) y unidades recibidas (lo que llegó físicamente → para lote, inventario y movimiento). Antes había un único campo `cantidad` que mezclaba ambas magnitudes, corrompiendo el inventario en casos de bonus.

**Alcance implementado:**
- E-1 (`82f6dc9`): migración v20 — `movimiento.unidades_facturadas`, `venta.sincronizado_en`, `comprobante.sincronizado_en`
- E-2 (`9a39762`): `ingresos.rs` — struct `LineaIngreso` con `unidades_recibidas` + `unidades_facturadas`; lote y movimiento usan `unidades_recibidas`; `movimiento.unidades_facturadas` registra el dato fiscal. `pedidos.rs` — `vincular_ingreso_a_pedido` reconcilia con `cantidad_facturada`
- E-3 (`6f850f0`): `types.ts` — `LineaIngreso` y `RegistrarIngresoInput` actualizados; `farmacia.service.ts` — mapeo corregido; `useIngresosMercaderia.ts` — `LineaIngresoDraft` extiende con `tieneBonus`, `lineaValida()` usa `unidadesFacturadas`, `onConfirmarIngreso` mapea correctamente, `vincular_ingreso_a_pedido` recibe ambos campos; `LineaIngresoCard.tsx` — campo principal = `unidadesFacturadas`, control secundario `+ Agregar bonus distribuidor` activa campo `unidadesRecibidas`

**Rule #6 — Mapa de integridad verificado:**
```
UI LineaIngresoCard
  → unidadesFacturadas (campo principal visible)
  → tieneBonus → activa campo unidadesRecibidas

useIngresosMercaderia.onConfirmarIngreso
  → RegistrarIngresoInput { unidadesFacturadas, unidadesRecibidas }
  → farmacia.service.registrarIngreso() → invoke registrar_ingreso
  → invoke vincular_ingreso_a_pedido { cantidadRecibida: unidadesRecibidas, cantidadFacturada: unidadesFacturadas }

Rust commands/ingresos.rs
  → lote.cantidad_ingresada = unidades_recibidas  ← FÍSICO
  → lote.cantidad_disponible = unidades_recibidas ← FÍSICO (FEFO opera sobre esto)
  → movimiento.unidades_base = unidades_recibidas ← FÍSICO
  → movimiento.unidades_facturadas = unidades_facturadas ← FISCAL (trazabilidad)

Rust commands/pedidos.rs vincular_ingreso_a_pedido
  → restante = cantidad_facturada  ← reconcilia con documento fiscal
  → UPDATE linea_pedido_proveedor.cantidad_recibida += a_recibir
```

---

## Estado de hallazgos críticos

Todos cerrados (H1-H5 previos).

---

## Estado de deuda técnica vigente

### Diferido aceptable
- `session-history.service.ts` → lectura histórica de sesiones sigue en localStorage. Migración a async SQLite en sesión dedicada futura.
- `accesosStore` → bitácora de accesos (LOGIN_OK/FAIL, PIN_RESETEADO) sigue en localStorage con cap 200. Migración futura a tabla `acceso_operador`.
- `changeOperatorPin` / `changeOperatorPinById` → no tienen escritura SQLite aún.
- F2 — doble movimiento `despacharConFefo` productos con lote. Diferido hasta eliminar `inventoryService` legacy.

### Deuda de PRECIOS
- **D-PRECIOS-1 — Precio por lote:** complejidad alta. **Diferido.**

### Deuda arquitectónica — Cajas
- **CajasWorkspace desacoplada de blocks.store:** mock data. Requiere sesión dedicada. **Diferido.**

### Deudas funcionales — Dominio farmacia
- ~~`desactivar_proveedor`~~ ✅ CERRADO
- ~~`desactivar_producto_comercial`~~ ✅ CERRADO
- ~~`desactivar_servicio_farmacia`~~ ✅ CERRADO (implementado como `desactivar_servicio_catalogo`)
- ~~`D-INGRESOS-4 — Bonus distribuidor`~~ ✅ CERRADO — commits `82f6dc9`, `9a39762`, `6f850f0`

### Deuda de naming — Dominio farmacia (baja prioridad, no bloquea)
- `desactivar_servicio_catalogo` expone nombre técnico de tabla; GLOSARIO §11 usa `ServicioFarmacia`. No urgente.
- `actualizar_proveedor` en `proveedores.rs` usa verbo `actualizar` — canónico §4: `modificar`. Idem `ActualizarProveedorInput` → `ModificarProveedorInput`. Baja urgencia.

### Deudas de naming — GLOSARIO §8 pendientes
- `BoxSlotType` / `BoxSlotDef` / campo `code` → `TipoCaja` / `DefinicionCaja` / `codigo`
- `ActualizarProveedorInput` → `ModificarProveedorInput`
- `TicketLineDTO` / `TicketLineBridge` → `LineaPreVenta`
- `emitidoPor` → `operadorId`
- `disponible/bajo_stock/agotado` → `DISPONIBLE/BAJO_STOCK/AGOTADO`

### Backlog v2.0 — Multi-POS con sincronización LAN
**Decisión Fernando (14 Jul 2026):** v2.0 soportará 2–4 cajas por establecimiento con stock compartido.
Patrón: híbrido offline-first con nodo principal LAN + sync hacia VPS.
Preparación ya incorporada en v20: `sincronizado_en` en `venta` y `comprobante`.

---

## Próxima ventana de trabajo — prioridad

1. **`session-history.service.ts`** — migración lectura a SQLite (async, diferido aceptable, ahora sube en prioridad)
2. **Segundo rubro** — desbloqueado por §8; iniciar arquitectura
3. **`CajasWorkspace`** — desacoplar de mock data (sesión dedicada)
4. **Deudas de naming §8** — cleanup de naming en lote cuando haya ventana

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v20 activa)
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`

**Bases de datos activas:**
- **`disateq.db`** — migraciones v1–v20. Tablas activas de negocio:
  - v16: `venta`, `linea_venta`
  - v17: `comprobante`, `linea_comprobante`, `correlativo`
  - v18: `sesion_caja`, `movimiento_caja`, `evento_turno`
  - v19: `operador`, `rol`
  - v20: `movimiento.unidades_facturadas`, `venta.sincronizado_en`, `comprobante.sincronizado_en`
  - + catálogo farmacia completo, lotes, movimientos, ingresos, pedidos, error_log
- **`catalogo_digemid.sqlite`** — solo lectura, ~18,397 medicamentos DIGEMID

**Dominios TS activos:**
- `domains/catalog/` — hov, valor-operacional, servicio, startup-integrity
- `domains/farmacia/` — farmacia.store, fefo-despacho, pedido-proveedor, farmacia.service ✅
- `domains/sales/` — pedido, venta.service ✅
- `domains/preventa/` — LineaPreVenta, preventa.store, preventa.service ✅
- `domains/documents/` — comprobante.*, bridge-comprobante, comprobante-sqlite.service ✅
- `domains/cash/` — turn-events.store, sesion-caja-sqlite.service ✅
- `domains/logging/` — error-logger ✅
- `domains/operator/` — operator.store, roles.store, blocks.store, accesos.store, operador-sqlite.service ✅

**Módulos abastecimiento farmacia actualizados:**
- `IngresosMercaderiaWorkspace.tsx` — UI de ingreso con bonus distribuidor ✅
- `hooks/useIngresosMercaderia.ts` — lógica con `tieneBonus`, `unidadesFacturadas`, `unidadesRecibidas` ✅
- `components/LineaIngresoCard.tsx` — control `+ Agregar bonus distribuidor` ✅

**Comandos Rust registrados — dominios completos:**
- `commands/ventas.rs` — 3 comandos
- `commands/comprobantes.rs` — 7 comandos
- `commands/sesion_caja.rs` — 8 comandos
- `commands/operadores.rs` — 10 comandos ✅
- `commands/pedidos.rs` — 9 comandos (vincular_ingreso_a_pedido actualizado v20)
- `commands/ingresos.rs` — registrar_ingreso actualizado v20 ✅
- `commands/log.rs` — 3 comandos
- `commands/proveedores.rs` — 5 comandos ✅
- `commands/productos.rs` — múltiples ✅
- `commands/servicios.rs` — 5 comandos ✅
- + presentaciones, lotes, movimientos, valores, reportes, integraciones, catalogo_maestro

**Tokens de color activos (`index.css`):**
- `--dv-color-edit: #005BE3`
- `--dv-color-new: #45b356`
- `--dv-color-confirm: #3B6B34`
- `--dv-color-danger: #DC2626`
- `--dv-color-exit: #B85C10`

**Naming canónico — dominio operator:**
- `Operador.alias` (campo `codigo` eliminado)
- `definirCajasDeBloque()`, `DefinicionCaja`, `TipoCaja`
- `pin_salt` — columna presente en tabla `operador`

**sessionKey canónico:** `"{boxCode}-{openedAt.toISOString()}"` — PK de `sesion_caja`.

**Contrato escritura doble (D3):** toda operación SQLite refresca Zustand correspondiente.

**Invariante D-INGRESOS-4 (irrevocable):**
- `lote.cantidad_disponible` = `unidades_recibidas` — FEFO opera sobre lo físico
- `movimiento.unidades_facturadas` = `unidades_facturadas` — trazabilidad fiscal
- `linea_pedido_proveedor.cantidad_recibida` += `cantidad_facturada` — reconciliación fiscal

**Logging (D4):** `logInfo/logWarn/logError/logCritical` desde `domains/logging/error-logger`. `modulo` en kebab-case.

**Reglas de apertura de sesión (obligatorias):**
1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmación explícita de Fernando.
4. Entregar comandos git exactos.
5. Reescribir este archivo completo al cerrar sesión.
6. Al cerrar módulo: ejecutar mapa de integridad de flujos (Rule #6).
