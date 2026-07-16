# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-16
**Último commit:** `1cc2772`
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

**Migración v21 ✅ COMPLETADA — commit `660cb7f`**
- `sesion_caja.arqueo_json TEXT` — arqueo de cierre serializado como JSON
- `sesion_caja.correction_json TEXT` — correcciones de supervisión serializadas como JSON

**session-history → SQLite ✅ COMPLETADO — commit `1cc2772`**
- `session-history.service.ts` completamente reescrito: lectura desde `obtenerHistorialSesionesSQLite()`, escritura mediante `actualizarSesionCajaCorrection()`
- `recordSessionOpen` y `recordSessionClose` son no-ops — la escritura la hace `useCaja.ts` directamente
- `recordSessionCorrection` y `recordAperturaCorrection` llaman a `actualizarSesionCajaCorrection()` en SQLite
- `loadSessionHistory()` y `getCurrentSessionId()` son async — todos los consumidores actualizados
- localStorage eliminado del dominio historial de sesiones

Diferido aceptable del Paso D:
- `accesosStore` (bitácora de accesos) sigue en localStorage — cap 200 eventos
- `changeOperatorPin` / `changeOperatorPinById` — no tienen escritura SQLite aún (uso infrecuente)

Diferido aceptable — dominio supervisión:
- `supervision-authorization.service.ts` — autorizaciones de supervisión siguen en localStorage. Migración futura.

---

## Sesiones completadas

### Faenas 21–28: ver historial anterior ✅

### Faena 29: Sesión 16 Jul 2026 ✅
- Limpieza artefactos Codex — commit `8b729c0`
- Auditoría comandos Rust desactivación: los 3 ya implementados — deuda cerrada
- CURRENT_CONTEXT actualizado — commit `a40eef1`

### Faena 30: D-INGRESOS-4 — Bonus Distribuidor ✅ — commits `82f6dc9`, `9a39762`, `6f850f0`
El sistema distingue unidades_facturadas (fiscal) de unidades_recibidas (físico). FEFO opera sobre lo físico. Pedido se reconcilia con lo facturado.

### Faena 31: session-history → SQLite ✅ — commits `660cb7f`, `0f64928`, `1cc2772`

**Alcance:**
- F-1 (`660cb7f`): migración v21 — `arqueo_json` + `correction_json` en `sesion_caja`
- F-2 (`0f64928`): `cerrar_sesion_caja` recibe `arqueo_json`; nuevo comando `actualizar_sesion_caja_correction`
- F-3 (`1cc2772`): capa TS completa — `sesion-caja-sqlite.service.ts`, `session-history.service.ts`, `CashWorkspace.tsx`, `CajasWorkspace.tsx`, `SupervisionCajaWorkspace.tsx`

**Rule #6 verificado:**
```
Apertura  → abrirSesionCajaEnSQLite() → SQLite ✅ | recordSessionOpen() = no-op ✅
Cierre    → cerrarSesionCajaEnSQLite(arqueoJson) → SQLite ✅ | recordSessionClose() = no-op ✅
Corrección → recordSessionCorrection/recordAperturaCorrection → actualizarSesionCajaCorrection() → SQLite ✅
Lectura   → loadSessionHistory() → obtenerHistorialSesionesSQLite(60) → mapSesionCajaRow() ✅
SessionId → getCurrentSessionId() → obtenerSesionActivaSQLite() ✅
localStorage: eliminado de todo el dominio historial ✅
```

---

## Estado de deuda técnica vigente

### Diferido aceptable
- `accesosStore` → bitácora de accesos sigue en localStorage — cap 200 eventos. Migración futura a tabla `acceso_operador`.
- `changeOperatorPin` / `changeOperatorPinById` → sin escritura SQLite aún.
- `supervision-authorization.service.ts` → autorizaciones de supervisión en localStorage. Migración futura.
- F2 — doble movimiento `despacharConFefo` productos con lote. Diferido hasta eliminar `inventoryService` legacy.

### Deuda de PRECIOS
- **D-PRECIOS-1 — Precio por lote:** complejidad alta. **Diferido.**

### Deuda arquitectónica — Cajas
- **CajasWorkspace desacoplada de blocks.store:** mock data (MOCK_BLOCKS). Requiere sesión dedicada. **Alta prioridad próxima.**

### Deudas de naming — GLOSARIO §8 (baja prioridad, no bloquean)
- `BoxSlotType` / `BoxSlotDef` / campo `code` → `TipoCaja` / `DefinicionCaja` / `codigo`
- `ActualizarProveedorInput` → `ModificarProveedorInput`
- `TicketLineDTO` / `TicketLineBridge` → `LineaPreVenta`
- `emitidoPor` → `operadorId`
- `disponible/bajo_stock/agotado` → `DISPONIBLE/BAJO_STOCK/AGOTADO`
- `actualizar_proveedor` → `modificar_proveedor` (verbo no canónico §4)
- `desactivar_servicio_catalogo` → naming técnico correcto; entidad canónica §11 es `ServicioFarmacia`

### Backlog v2.0 — Multi-POS con sincronización LAN
Preparación incorporada en v20: `sincronizado_en` en `venta` y `comprobante`.

---

## Próxima ventana de trabajo — prioridad

1. **`CajasWorkspace`** — desacoplar de MOCK_BLOCKS, conectar a `blocks.store` real (sesión dedicada, alta complejidad)
2. **Segundo rubro** — desbloqueado por §8; iniciar arquitectura
3. **`supervision-authorization.service.ts`** — migración a SQLite (diferido aceptable)
4. **Deudas de naming §8** — cleanup cuando haya ventana

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v21 activa)
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`

**Bases de datos activas:**
- **`disateq.db`** — migraciones v1–v21. Tablas activas de negocio:
  - v16: `venta`, `linea_venta`
  - v17: `comprobante`, `linea_comprobante`, `correlativo`
  - v18: `sesion_caja`, `movimiento_caja`, `evento_turno`
  - v19: `operador`, `rol`
  - v20: `movimiento.unidades_facturadas`, `venta.sincronizado_en`, `comprobante.sincronizado_en`
  - v21: `sesion_caja.arqueo_json`, `sesion_caja.correction_json`
  - + catálogo farmacia completo, lotes, movimientos, ingresos, pedidos, error_log
- **`catalogo_digemid.sqlite`** — solo lectura, ~18,397 medicamentos DIGEMID

**Comandos Rust registrados — sesion_caja:**
- `abrir_sesion_caja` ✅
- `cerrar_sesion_caja` (con arqueo_json) ✅
- `actualizar_sesion_caja_correction` ✅ (nuevo v21)
- `registrar_movimiento_caja` ✅
- `actualizar_movimiento_caja` ✅
- `registrar_evento_turno` ✅
- `obtener_sesion_activa` ✅
- `obtener_historial_sesiones` ✅
- `obtener_movimientos_sesion` ✅

**Servicios TS activos — dominio cash:**
- `sesion-caja-sqlite.service.ts` — 9 funciones, incluye `actualizarSesionCajaCorrection` ✅
- `session-history.service.ts` — 100% SQLite, localStorage eliminado ✅
- `turn-events.store.ts` — sigue en localStorage (eventos de turno en tiempo real, diferido)

**Tokens de color activos (`index.css`):**
- `--dv-color-edit: #005BE3`
- `--dv-color-new: #45b356`
- `--dv-color-confirm: #3B6B34`
- `--dv-color-danger: #DC2626`
- `--dv-color-exit: #B85C10`

**Naming canónico — dominio operator:**
- `Operador.alias` (campo `codigo` eliminado)
- `pin_salt` — columna presente en tabla `operador`

**Invariante D-INGRESOS-4 (irrevocable):**
- `lote.cantidad_disponible` = `unidades_recibidas` — FEFO opera sobre lo físico
- `movimiento.unidades_facturadas` = `unidades_facturadas` — trazabilidad fiscal
- `linea_pedido_proveedor.cantidad_recibida` += `cantidad_facturada` — reconciliación fiscal

**sessionKey canónico:** `"{boxCode}-{openedAt.toISOString()}"` — PK de `sesion_caja`.

**Contrato escritura doble (D3):** toda operación SQLite refresca Zustand correspondiente.

**Reglas de apertura de sesión (obligatorias):**
1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmación explícita de Fernando.
4. Entregar comandos git exactos.
5. Reescribir este archivo completo al cerrar sesión.
6. Al cerrar módulo: ejecutar mapa de integridad de flujos (Rule #6).
