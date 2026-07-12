# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-12
**Último commit:** `9ed3e31`
**Rama:** `main`
**Working tree:** limpio (excepto `docs/context/CURRENT_CONTEXT.md` pendiente de commit y `apps/cargo-check-temp/` no rastreado — directorio huérfano de Codex, puede eliminarse con `git clean -fd apps/cargo-check-temp/`)

---

## ⚠️ DIRECTIVA ESTRATÉGICA — PRÓXIMA SESIÓN

**Decisión de Fernando (12 Jul 2026):** abandonar mocks y datos ficticios. El proyecto entra en fase de integración real. Todo flujo nuevo debe operar contra SQLite. Los flujos existentes en localStorage deben migrar progresivamente.

### Objetivo de la próxima sesión: Auditoría de la fractura localStorage ↔ SQLite

El sistema tiene dos mundos que no se tocan:

**Mundo real (SQLite + Rust):** lotes, ingresos, proveedores, pedidos a proveedor, error_log, config_establecimiento. Trazabilidad real, migraciones reales.

**Mundo prototipo (localStorage + Zustand):** venta, cobro, stock operacional, cajas, turno. Funciona visualmente pero no persiste de forma confiable ni descuenta donde debe.

### Plan de apertura de sesión

1. Leer este archivo
2. Auditar los flujos de venta y cobro actuales — mapear exactamente dónde se pierde la cadena hacia SQLite
3. Producir el mapa de fractura completo: qué datos viven en localStorage que deben vivir en SQLite
4. Proponer el orden de integración por columna vertebral mínima:

```
Operador abre turno
→ Busca producto (HOV desde SQLite)          ← ya funciona
→ Agrega al pedido                            ← localStorage
→ Cobra                                       ← localStorage
→ Stock se descuenta en SQLite                ← NO ocurre hoy
→ Comprobante queda registrado en SQLite      ← NO ocurre hoy
→ Cierre de turno cuadra contra SQLite        ← NO ocurre hoy
```

5. Confirmar con Fernando el orden de ataque antes de escribir una sola línea de código

---

## Sesiones completadas (10 Jul 2026)

### Faena 1: SERVICIO como entidad de dominio compartido + precio inicial en creación
Commit `af44bb2` — 14 archivos, 558 inserciones, 182 eliminaciones.

### Faena 2: Migración v13 — seed inicial de config_establecimiento
Commit `d3d3456`.

### Faena 3: Rediseño visual ContextBar
Commits hasta `3d61d96`.

### Faena 4: Auditoría INGRESOS — D-INGRESOS-1, D-INGRESOS-2, D-INGRESOS-3
Commit `b15d5d3`. ✅

---

## Sesiones completadas (11 Jul 2026)

### Faena 5: Historia SERVICIO en VENTAS — D-UX-1, D-UX-2, D-UX-3
Commits `cc944d2`, `35cf4e4`. ✅

### Faena 6: D-INGRESOS-menor — limpieza inline imports
Commit `0357a1f`. ✅

### Faena 7: Validación runtime de flujos pendientes
Todos los flujos principales validados. ✅

### Faena 8: Deuda TypeScript preexistente — 9 errores en 6 archivos
Commit `229b571`. `npx tsc -p tsconfig.app.json --noEmit` → 0 errores ✅

### Faena 9: Auditoría data-flow integrity — mapa completo + análisis estratégico
**5 hallazgos críticos:** H1, H2, H3, H4, H5.
**Política ratificada:** mapa de integridad de flujos al cerrar cada módulo importante.

### Faena 10: D1 — Stock real de farmacia en VENTAS
Commit `4b63856`. **Cierra H3 y H5.** ✅

### Faena 11: D2 — Proceso de arranque con verificación de integridad de caché
Commit `3a6d259`. **Cierra H1 y H2.** ✅

### Faena 12: D3 — Contrato escritura doble en flujos de INGRESOS
Commit `3ac38a1`. **Cierra D3.** ✅

### Faena 13: "Agregar forma de venta" en PresentacionesTab
Commit `e939dcf`. ✅

### Faenas 14-19: Plan Pedido a Proveedor — COMPLETO ✅

| Paso | Faena | Commit | Descripción |
|---|---|---|---|
| 1 | 14 | `cee790c` | Migración v14 — tablas `pedido_proveedor` + `linea_pedido_proveedor` |
| 2 | 15 | `55a9c3c` | 8 comandos Rust: crear, obtener, confirmar, tránsito, cancelar, recibir, badge |
| 3 | 16 | `e0c0be3` | Dominio TS: types + service + store (`usePedidoProveedorStore`) |
| 4 | 17 | `fd85cc6` | UI: `PedidoProveedorWorkspace` + tab "Pedidos" en OperationalBar |
| 5 | 18 | `e2cfe41` | Puente INGRESOS ↔ Pedido: `vincular_ingreso_a_pedido`, badge en `LineaIngresoCard` |
| 6 | 19 | `711e79e` | Badge "Llegan N" en `InventarioFarmaciaWorkspace` con datos reales. **Cierra H4.** |

### Faena 20: D4 — Logging estructurado local
Commit `cf44a26` — 14 archivos, 775 inserciones, 169 eliminaciones. ✅

---

## Sesiones completadas (12 Jul 2026)

### Faena 21: D-PRECIOS-2 — eliminar parámetro redundante `valorVenta` de `proyectarAHov`
Commit `5eee80f`. ✅

### Faena 22: Design system — 4 ítems pendientes
Commit A `0ffc39c` — token `--dv-color-edit: #005BE3` + 7 archivos hardcoded + ComboboxFiltrado Check icon. ✅
Commit B `822b783` — OperationalBar comentarios de sincronización + FormularioNuevoNodo a scope de módulo. ✅

### Faena 23: §8 GLOSARIO — Grupo A+B (naming canónico)
Commit `6fc73e3` — 9 archivos, 26 inserciones, 26 eliminaciones. ✅

### Faena 24: §8 GLOSARIO — Grupo C (naming canónico)
Commit `9ed3e31` — 6 archivos, 24 inserciones, 26 eliminaciones. ✅

**§8 GLOSARIO completo al 100%. Segundo rubro desbloqueado.**

---

## Estado de hallazgos críticos (H1-H5)

Todos cerrados. Ver sesiones anteriores.

---

## Estado de deuda técnica vigente

### Deuda de INGRESOS
**D-INGRESOS-4 — Bonus distribuidor:** `unidades_facturadas` y `unidades_recibidas`. Complejidad media-alta. **Diferido.**

### Deuda de PRECIOS
**D-PRECIOS-1 — Precio por lote:** complejidad alta. **Diferido.**

### Deuda arquitectónica — Cajas
**CajasWorkspace desacoplada de blocks.store:** tipos locales y mock data. Requiere sesión dedicada al implementar persistencia real de cajas. **Diferido — se resuelve en fase de integración real.**

### Deudas funcionales — Dominio farmacia
- `desactivar_proveedor` — comando Rust faltante
- `desactivar_producto_comercial` — comando Rust faltante
- `desactivar_servicio_farmacia` — comando Rust faltante
Bajo impacto operacional inmediato. **Diferido.**

---

## Próxima ventana de trabajo — prioridad sugerida

1. **Auditoría fractura localStorage ↔ SQLite** — ver directiva estratégica arriba
2. **Integración real del flujo de venta** — columna vertebral mínima
3. **D-INGRESOS-4** — bonus distribuidor
4. **Segundo rubro** — desbloqueado por §8 completo

---

## Reglas de apertura de sesión (obligatorias)

1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar a siguiente tarea sin confirmación explícita de Fernando.
4. Entregar comandos git exactos listos para copiar y pegar.
5. Reescribir este archivo completo al cerrar sesión (nunca edición incremental).
6. **Al cerrar un módulo: ejecutar mapa de integridad de flujos antes de declararlo completo.**

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v15 activa)
**Dominio farmacia:** `domains/farmacia/`
**Dominio catálogo:** `domains/catalog/` — hov, valor-operacional, servicio, startup-integrity
**Dominio logging:** `domains/logging/` — error-logger.ts ✅ completo
**Dominio pedido proveedor:** `domains/farmacia/pedido-proveedor/` ✅ completo
**Dominio sales:** `domains/sales/` — pedido.types, pedido.store, pedido.service, pedido.operations, bridge-pedido ✅ canónico
**Dominio preventa:** `domains/preventa/` — LineaPreVenta, preventa.store, preventa.service ✅ canónico
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`
**App:** `npm run tauri dev` desde `apps/vendor-desktop`

**Almacenes de datos activos:**
- SQLite `disateq.db`: fuente de verdad persistente. Incluye `error_log` desde v15.
- `localStorage / disateq:catalog:hovs`: catálogo HOV. Se reconstruye desde SQLite si vacío.
- `localStorage / disateq:catalog:valores-operacionales`: precios de venta vigentes por `hovId`.
- `localStorage / disateq:sales:pedidos`: pedidos activos y concretados (dominio `sales/`).
- Zustand `useFarmaciaStore.resumenInventario`: stock real farmacia. Se hidrata al login, refresca tras ingresos y despachos.
- Zustand `usePedidoProveedorStore`: pedidos, líneas por pedido, pendientes por presentación.
- Archivo `disateq-error.log` en `$APPDATA/com.disateq.vendor/`: log de eventos append-only (canal primario).

**Tokens de color activos (`index.css`):**
- `--dv-color-edit: #005BE3` — botones EDITAR
- `--dv-color-new: #45b356` — botones NUEVO / check icon
- `--dv-color-confirm: #3B6B34` — botones CONFIRMAR/GUARDAR
- `--dv-color-danger: #DC2626` — acciones destructivas
- `--dv-color-exit: #B85C10` — cancelar / salir
- `--dv-mod-*` — colores de módulos. Sincronizar con `MODULE_ACCENT`/`MODULE_BG` en `OperationalBar.tsx`

**Naming canónico — dominio operator:**
- `TipoCaja` (antes `BoxSlotType`) — valores: `"PRINCIPAL"`, `"CONTINGENCIA_1"`, `"CONTINGENCIA_2"`, `"CONTINGENCIA"`
- `DefinicionCaja` (antes `BoxSlotDef`) — campo `codigo` (antes `code`)
- `definirCajasDeBloque()` (antes `blockBoxDefs()`)
- `Operador.codigo` eliminado — usar `Operador.alias` en todos los contextos de UI

**Naming canónico — dominio inventory:**
- `EstadoDisponibilidad`: `'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO'` (mayúsculas)

**Naming canónico — dominio comprobantes:**
- `Comprobante.operadorId` (antes `emitidoPor`)
- `anularComprobante()` en `POSContext` y `useComprobantes` (antes `voidComprobante`)
- `CrearComprobanteInput.operadorId` (antes `emitidoPor`)

**Naming canónico — dominio preventa/ventas:**
- `traducirALineaPreVenta()` en `bridge-pedido.ts` (antes `traducirATicketLine`)
- Storage key `'inv_v0_items'` — NO usar `'disateq:inventory:items'`

**Contrato escritura doble (D3 — política arquitectónica irrevocable):**
Toda operación que modifica stock o valores en SQLite debe refrescar el store Zustand correspondiente. Puntos activos: `fefo-despacho.service.ts`, `useIngresosMercaderia.ts` (x2).

**Proceso de arranque farmacia (D2):**
1. `verificarIntegridadCacheFarmacia()` — reconstruye HOVs y valores desde SQLite si localStorage vacío
2. `cargarResumenInventario()` — hidrata Zustand con stock real

**Logging estructurado (D4 — política arquitectónica):**
- Usar `logInfo/logWarn/logError/logCritical` desde `domains/logging/error-logger`
- `modulo` siempre en kebab-case, igual que el nombre del archivo sin extensión
- Canal archivo: todos los niveles. Canal SQLite: solo WARN, ERROR, CRITICAL

**Ciclo operacional PedidoProveedor:**
```
BORRADOR → CONFIRMADO → EN_TRANSITO → RECIBIDO_PARCIAL → RECIBIDO
                      ↘ CANCELADO (desde BORRADOR, CONFIRMADO o EN_TRANSITO)
```

**Store export pattern:**
Módulos store exportan funciones planas (`getAllHOVs`, `getValoresActivosPorHOV`), NO objetos hook Zustand.

**ConfigSubView activa:**
`"negocio" | "operacion" | "rubro" | "experiencia" | "operadores" | "cajas" | "roles" | "capacidades" | "diagnostico"`
