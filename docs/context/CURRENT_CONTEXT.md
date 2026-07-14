# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-13
**Último commit:** `d6eb12c`
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

Sub-pasos completados:
- D-1: migración v19 — tablas `operador` + `rol` con seed inicial (4 roles + ADMIN)
- D-2: `commands/operadores.rs` — 10 comandos Rust
- D-3: `mod.rs` + `lib.rs` — módulo y handlers registrados
- D-4: `operador-sqlite.service.ts` — 10 funciones invoke con interfaces `OperadorRow` y `RolRow`
- D-5: `useOperadores.ts` — carga desde SQLite, migración one-shot desde localStorage, escritura dual en todas las operaciones

Flujo post-Paso D:
```
useOperadores mount   → SELECT operador/rol (SQLite) + migración one-shot si vacío
createOperator()      → INSERT operador (SQLite) + setOperators (Zustand)
updateOperatorData()  → UPDATE operador (SQLite) + setOperators (Zustand)
setOperatorStatus()   → UPDATE estado_operador (SQLite) + setOperators (Zustand)
resetOperatorPin()    → UPDATE pin_operador (SQLite) + setOperators (Zustand)
releaseOperatorBlock() → UPDATE base_bloque=NULL (SQLite) + setOperators (Zustand)
updateOperatorCapabilities() → UPDATE capacidades (SQLite) + setOperators (Zustand)
createRole()          → INSERT rol (SQLite) + setRoles (Zustand)
updateRoleData()      → UPDATE rol (SQLite) + setRoles (Zustand)
setRoleActive()       → UPDATE activo+capacidades (SQLite) + setRoles (Zustand)
updateRoleCapabilities() → UPDATE capacidades_rol (SQLite) + setRoles (Zustand)
loginOperator()       → hashPinAsync() → verificarPin() en memoria (sin SQLite)
```

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

Sesión 13 Jul 2026 — adicionalmente:
- Push de `main` a `origin` completado (primera vez — 2959 objetos subidos)
- `origin/main` tracking configurado con `--set-upstream`
- Análisis de seguridad PIN: SHA-256 con salt estático — riesgo bajo en producción Tauri (DevTools deshabilitado en release); `pin_salt` agregado a tabla para futura mejora PBKDF2
- Análisis PWA vs Tauri: Tauri es la decisión correcta por impresión térmica ESC/POS nativa

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

### Artefacto pendiente de limpieza
- `apps/vendor-desktop/docs/roles-equipo.md` — generado por Codex, no pertenece al proyecto. Eliminar en próxima oportunidad.
- `apps/cargo-check-temp/` — directorio no rastreado (Codex artifact). Eliminar en próxima oportunidad.

### Backlog v2.0 — Multi-POS con sincronización LAN
**Decisión Fernando (14 Jul 2026):** DISATEQ Vendor™ v2.0 soportará 2–4 cajas simultáneas por establecimiento con stock compartido. Patrón arquitectónico elegido: híbrido offline-first con nodo principal LAN + sync hacia VPS.

Patrón:
- Cada PC corre Tauri + SQLite local (igual que hoy)
- PC principal expone API REST liviana en LAN — actúa como árbitro de stock
- Estrategia de reserva: lock liviano con timeout 300ms → modo degradado optimista si el nodo no responde
- Sincronización hacia VPS: cola de eventos, en tiempo real cuando hay red

**Preparación a incorporar en v1.0 (costo mínimo, máximo valor futuro):**
- Agregar columna `sincronizado_en TEXT NULL` en tablas `venta` y `comprobante`
- NULL = pendiente de sync con nodo central; timestamp = ya sincronizado
- Se incorpora en la próxima migración SQLite que toquemos (v20 o superior)

---

## Próxima ventana de trabajo — prioridad

1. **D-INGRESOS-4** — bonus distribuidor (alta complejidad, requiere diseño cuidadoso)
2. **session-history.service.ts** — migración lectura a SQLite (async)
3. **Segundo rubro** — desbloqueado por §8; consolidar flujo SQLite primero
4. **Limpieza artefactos** — `roles-equipo.md`, `cargo-check-temp/`

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v19 activa)
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`

**Bases de datos activas:**
- **`disateq.db`** — migraciones v1–v19. Tablas activas de negocio:
  - v16: `venta`, `linea_venta`
  - v17: `comprobante`, `linea_comprobante`, `correlativo`
  - v18: `sesion_caja`, `movimiento_caja`, `evento_turno`
  - v19: `operador`, `rol`
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
- `domains/operator/` — operator.store, roles.store, blocks.store, accesos.store, operador-sqlite.service ✅

**Comandos Rust registrados — dominios completos:**
- `commands/ventas.rs` — 3 comandos
- `commands/comprobantes.rs` — 7 comandos
- `commands/sesion_caja.rs` — 8 comandos
- `commands/operadores.rs` — 10 comandos ✅ NUEVO
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
- `pin_salt` — columna presente en tabla `operador`, NULL en seed y en nuevos operadores hasta implementar PBKDF2

**sessionKey canónico:** `"{boxCode}-{openedAt.toISOString()}"` — PK de `sesion_caja`, `sesion_id` en `comprobante`, `movimiento_caja`, `evento_turno`.

**Contrato escritura doble (D3):** toda operación SQLite refresca Zustand correspondiente.

**Ciclo operacional completo post-Pasos A+B+C+D:**
```
Apertura turno → INSERT sesion_caja (C)
  Cobro → despacharConFefo() (A)
        → INSERT venta + lineas (A)
        → INSERT comprobante + lineas + UPSERT correlativo (B)
        → INSERT evento_turno (C)
  Movimiento caja → INSERT movimiento_caja (C)
Cierre turno → UPDATE sesion_caja (C)

Gestión operador → INSERT/UPDATE operador (D)
Gestión rol → INSERT/UPDATE rol (D)
Login → verificarPin() en memoria desde Zustand cargado desde SQLite (D)
```

**Logging (D4):** `logInfo/logWarn/logError/logCritical` desde `domains/logging/error-logger`. `modulo` en kebab-case.

**Reglas de apertura de sesión (obligatorias):**
1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmación explícita de Fernando.
4. Entregar comandos git exactos.
5. Reescribir este archivo completo al cerrar sesión.
6. Al cerrar módulo: ejecutar mapa de integridad de flujos (Rule #6).
