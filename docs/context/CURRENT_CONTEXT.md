# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-12
**Último commit:** `ec34c16`
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

Flujo post-Paso C:
```
useCaja.openCashSession()   → INSERT sesion_caja (SQLite) + localStorage
useCaja.closeCashSession()  → UPDATE sesion_caja (SQLite) + localStorage
useCaja.addCashMove()       → INSERT movimiento_caja (SQLite) + localStorage
useCaja.updateCashMove()    → UPDATE movimiento_caja (SQLite) + localStorage
useBitacora.addTurnEvent()  → INSERT evento_turno (SQLite) + localStorage
```

Diferido aceptable del Paso C:
- `session-history.service.ts` → sigue leyendo de localStorage.
  Migración a lectura SQLite requiere hacerla async — sesión dedicada futura.

**Paso D — Operadores en SQLite ← SIGUIENTE**

---

## Sesiones completadas (12 Jul 2026)

### Faena 21: D-PRECIOS-2
Commit `5eee80f`. ✅

### Faena 22: Design system — 4 ítems
Commits `0ffc39c`, `822b783`. ✅

### Faena 23-24: §8 GLOSARIO completo
Commits `6fc73e3`, `9ed3e31`. **Segundo rubro desbloqueado.** ✅

### Faena 25: Paso A — Persistencia de venta en SQLite
Commit `dce94d3`. ✅

### Faena 26: Paso B — Comprobante en SQLite

| Sub-paso | Commit |
|---|---|
| B-1 migración v17 | `f8248de` |
| B-2 7 comandos Rust | `fa26809` |
| B-3 comprobante-sqlite.service.ts + fix §8 residual | `8eb2e08` |
| B-4 integración CobroPanel | `340d0c1` |

### Faena 27: Paso C — Turno/sesión en SQLite

| Sub-paso | Commit |
|---|---|
| C-1 migración v18 | `d7e6870` |
| C-2 8 comandos Rust sesion_caja | `e69bb11` |
| C-3 sesion-caja-sqlite.service.ts | `345d0ce` |
| C-4 integración useCaja + useBitacora | `ec34c16` |

---

## Estado de hallazgos críticos (H1-H5)

Todos cerrados.

---

## Estado de deuda técnica vigente

### Diferido aceptable
- `session-history.service.ts` → lectura histórica de sesiones sigue en localStorage. Migración a async SQLite en sesión dedicada futura.
- F2 — doble movimiento `despacharConFefo` productos con lote. Diferido hasta eliminar `inventoryService` legacy.

### Deuda de INGRESOS
- **D-INGRESOS-4 — Bonus distribuidor:** `unidades_facturadas` vs `unidades_recibidas`. Complejidad media-alta. **Diferido.**

### Deuda de PRECIOS
- **D-PRECIOS-1 — Precio por lote:** complejidad alta. **Diferido.**

### Deuda arquitectónica — Cajas
- **CajasWorkspace desacoplada de blocks.store:** mock data. Requiere sesión dedicada. **Diferido.**

### Deudas funcionales — Dominio farmacia
- `desactivar_proveedor` — comando Rust faltante
- `desactivar_producto_comercial` — comando Rust faltante
- `desactivar_servicio_farmacia` — comando Rust faltante

---

## Próxima ventana de trabajo — prioridad

1. **Paso D — Operadores en SQLite** ← siguiente integración real
2. **D-INGRESOS-4** — bonus distribuidor
3. **Segundo rubro** — desbloqueado por §8; consolidar flujo SQLite primero
4. **session-history.service.ts** — migración lectura a SQLite (async)

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v18 activa)
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`

**Bases de datos activas:**
- **`disateq.db`** — migraciones v1–v18. Tablas activas de negocio:
  - v16: `venta`, `linea_venta`
  - v17: `comprobante`, `linea_comprobante`, `correlativo`
  - v18: `sesion_caja`, `movimiento_caja`, `evento_turno`
  - + catálogo farmacia completo, lotes, movimientos, ingresos, pedidos, error_log
- **`catalogo_digemid.sqlite`** — solo lectura, ~18,397 medicamentos DIGEMID

**Dominios TS activos:**
- `domains/catalog/` — hov, valor-operacional, servicio, startup-integrity
- `domains/farmacia/` — farmacia.store, fefo-despacho, pedido-proveedor
- `domains/sales/` — pedido, venta.service ✅
- `domains/preventa/` — LineaPreVenta, preventa.store, preventa.service ✅
- `domains/documents/` — comprobante.*, bridge-comprobante, comprobante-sqlite.service ✅
- `domains/cash/` — turn-events.store, sesion-caja-sqlite.service ✅
- `domains/logging/` — error-logger ✅
- `domains/operator/` — operator.store, roles.store, blocks.store, accesos.store

**Comandos Rust registrados — dominios completos:**
- `commands/ventas.rs` — registrar_venta, obtener_ventas_sesion, obtener_venta_detalle
- `commands/comprobantes.rs` — 7 comandos
- `commands/sesion_caja.rs` — 8 comandos
- `commands/pedidos.rs` — 9 comandos
- `commands/log.rs` — 3 comandos
- + farmacia: productos, presentaciones, proveedores, lotes, movimientos, servicios, valores, ingresos, reportes, integraciones, catalogo_maestro

**Tokens de color activos (`index.css`):**
- `--dv-color-edit: #005BE3`
- `--dv-color-new: #45b356`
- `--dv-color-confirm: #3B6B34`
- `--dv-color-danger: #DC2626`
- `--dv-color-exit: #B85C10`

**Naming canónico — dominio operator:**
- `Operador.alias` (campo `codigo` eliminado)
- `definirCajasDeBloque()`, `DefinicionCaja`, `TipoCaja`

**sessionKey canónico:** `"{boxCode}-{openedAt.toISOString()}"` — PK de `sesion_caja`, `sesion_id` en `comprobante`, `movimiento_caja`, `evento_turno`.

**Contrato escritura doble (D3):** toda operación SQLite refresca Zustand correspondiente.

**Ciclo operacional completo post-Pasos A+B+C:**
```
Apertura turno → INSERT sesion_caja (C)
  Cobro → despacharConFefo() (A)
        → INSERT venta + lineas (A)
        → INSERT comprobante + lineas + UPSERT correlativo (B)
        → INSERT evento_turno (C)
  Movimiento caja → INSERT movimiento_caja (C)
Cierre turno → UPDATE sesion_caja (C)
```

**Logging (D4):** `logInfo/logWarn/logError/logCritical` desde `domains/logging/error-logger`. `modulo` en kebab-case.

**Reglas de apertura de sesión (obligatorias):**
1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmación explícita de Fernando.
4. Entregar comandos git exactos.
5. Reescribir este archivo completo al cerrar sesión.
6. Al cerrar módulo: ejecutar mapa de integridad de flujos (Rule #6).
