# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-11
**Último commit:** `711e79e`
**Rama:** `main`
**Working tree:** limpio

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
- Deuda menor: interfaz `FormularioNuevoNodo` declarada dentro de función — limpieza postergada.

### Faenas 14-19: Plan Pedido a Proveedor — COMPLETO ✅

| Paso | Faena | Commit | Descripción |
|---|---|---|---|
| 1 | 14 | `cee790c` | Migración v14 — tablas `pedido_proveedor` + `linea_pedido_proveedor` |
| 2 | 15 | `55a9c3c` | 8 comandos Rust: crear, obtener, confirmar, tránsito, cancelar, recibir, badge |
| 3 | 16 | `e0c0be3` | Dominio TS: types + service + store (`usePedidoProveedorStore`) |
| 4 | 17 | `fd85cc6` | UI: `PedidoProveedorWorkspace` + tab "Pedidos" en OperationalBar |
| 5 | 18 | `e2cfe41` | Puente INGRESOS ↔ Pedido: `vincular_ingreso_a_pedido`, badge en `LineaIngresoCard` |
| 6 | 19 | `711e79e` | Badge "Llegan N" en `InventarioFarmaciaWorkspace` con datos reales. **Cierra H4.** |

**Mapa de integridad de flujos — PedidoProveedor:**

| Flujo | SQLite | Store Zustand | Badge INVENTARIO | Estado |
|---|---|---|---|---|
| Crear pedido | ✅ | ✅ refresca pedidos | — | Cerrado |
| Confirmar pedido | ✅ | ✅ pedidos + pendientes | ✅ al navegar | Cerrado |
| Marcar en tránsito | ✅ | ✅ pedidos | ✅ al navegar | Cerrado |
| Cancelar pedido | ✅ | ✅ pedidos + pendientes | ✅ al navegar | Cerrado |
| Recibir líneas (manual) | ✅ | ✅ pedidos + líneas + pendientes | ✅ al navegar | Cerrado |
| Confirmar ingreso → vincular (puente) | ✅ fire-and-forget | ⚠️ eventual¹ | ⚠️ al navegar | Aceptado |

¹ El puente es fire-and-forget — SQLite se actualiza correctamente. El store en memoria y el badge se actualizan la próxima vez que el operador navega a PEDIDOS o INVENTARIO. Decisión consciente de consistencia eventual dentro del mismo terminal.

**Mapa de integridad global (todos los flujos):**

| Flujo | SQLite | LS-HOV | LS-VALOR | Zustand resumen | Estado |
|---|---|---|---|---|---|
| Crear producto (Stepper) | ✅ | ✅ | ✅ | ✅ | Cerrado |
| Confirmar ingreso | ✅ | — | ✅ | ✅ | Cerrado |
| Despacho post-venta | ✅ | — | — | ✅ | Cerrado |
| Modificar precio (PreciosTab) | ✅ | — | ✅ | — | ⚠️ menor* |
| Crear servicio | ✅ | ✅ | ✅ | — | N/A** |
| Agregar forma de venta | ✅ | ✅ | — | — | Cerrado |
| Crear pedido proveedor | ✅ | — | — | ✅ store pedidos | Cerrado |
| Recibir líneas pedido | ✅ | — | — | ✅ store pedidos + pendientes | Cerrado |
| Confirmar ingreso → vincular pedido | ✅ | — | — | ⚠️ eventual¹ | Aceptado |

*PreciosTab modifica precio de venta, no stock — `resumenInventario` no aplica.
**SERVICIO no tiene stock — `resumenInventario` no aplica.

---

## Estado de hallazgos críticos (H1-H5)

| Hallazgo | Descripción | Estado |
|---|---|---|
| H1 | HOVs no reconstruibles desde SQLite si localStorage se borra | ✅ Cerrado (Faena 11) |
| H2 | LS-VALOR no se rehidrata desde SQLite al arrancar | ✅ Cerrado (Faena 11) |
| H3 | Stock en VENTAS siempre 0 | ✅ Cerrado (Faena 10) |
| H4 | Badge "Llegan N" siempre 0 — purchases huérfano | ✅ Cerrado (Faena 19) |
| H5 | Stock VENTAS obsoleto post-venta | ✅ Cerrado (Faena 10) |

**Todos los hallazgos críticos de la auditoría de data-flow están cerrados.**

---

## Estado de deuda técnica vigente

### Deuda de infraestructura
**D4 — Logging estructurado local:** `ErrorLogger` WARN/ERROR/CRITICAL, SQLite + visibilidad CONFIG. Requiere decisiones de UX. **Diferido.**

### Deuda de INGRESOS
**D-INGRESOS-4 — Bonus distribuidor:** `unidades_facturadas` y `unidades_recibidas`. Complejidad media-alta. **Diferido.**

### Deuda de PRECIOS
**D-PRECIOS-1 — Precio por lote:** complejidad alta. **Diferido.**
**D-PRECIOS-2 — `valorVenta` redundante en `proyectarAHov`:** una línea. **Commit de oportunidad.**

### Deuda de design system (decisiones pendientes)
- `--dv-color-edit` token para `#005BE3` (EDITAR buttons) — sin decisión.
- `ComboboxFiltrado.tsx` Check icon token — sin decisión.
- `OperationalBar.tsx` refactor a `var(--dv-mod-*)` tokens — postergado.
- `FormularioNuevoNodo` interfaz declarada dentro de función — limpieza menor.

### Deuda de naming (§8 GLOSARIO)
14 términos pendientes de migración. Sesión dedicada antes de segundo rubro.

---

## Próxima ventana de trabajo — prioridad sugerida

1. **D4 — Logging estructurado local** — antes de crecer en módulos nuevos.
2. **D-PRECIOS-2** — una línea, commit de oportunidad.
3. **Design system** — `--dv-color-edit`, `ComboboxFiltrado`, `OperationalBar`, `FormularioNuevoNodo`.
4. **Naming §8 GLOSARIO** — sesión dedicada antes de segundo rubro.
5. **D-INGRESOS-4** — bonus distribuidor, requiere decisión de alcance.

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
**Schema SQLite:** `db/schema.rs` | Migraciones: `db/migrations.rs` (v14 activa)
**Dominio farmacia:** `domains/farmacia/`
**Dominio catálogo:** `domains/catalog/` — hov, valor-operacional, servicio, startup-integrity
**Dominio pedido proveedor:** `domains/farmacia/pedido-proveedor/` ✅ completo
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Git:** siempre `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`
**App:** `npm run tauri dev` desde `apps/vendor-desktop`

**Almacenes de datos activos:**
- SQLite `disateq.db`: fuente de verdad persistente. Incluye `pedido_proveedor` y `linea_pedido_proveedor` desde v14.
- `localStorage / disateq:catalog:hovs`: catálogo HOV. Se reconstruye desde SQLite si vacío.
- `localStorage / disateq:catalog:valores-operacionales`: precios de venta vigentes por `hovId`.
- Zustand `useFarmaciaStore.resumenInventario`: stock real farmacia. Se hidrata al login, refresca tras ingresos y despachos.
- Zustand `usePedidoProveedorStore`: pedidos, líneas por pedido, pendientes por presentación.

**Contrato escritura doble (D3 — política arquitectónica irrevocable):**
Toda operación que modifica stock o valores en SQLite debe refrescar el store Zustand correspondiente. Puntos activos: `fefo-despacho.service.ts`, `useIngresosMercaderia.ts` (x2).

**Proceso de arranque farmacia (D2):**
1. `verificarIntegridadCacheFarmacia()` — reconstruye HOVs y valores desde SQLite si localStorage vacío
2. `cargarResumenInventario()` — hidrata Zustand con stock real

**Ciclo operacional PedidoProveedor:**
```
BORRADOR → CONFIRMADO → EN_TRANSITO → RECIBIDO_PARCIAL → RECIBIDO
                      ↘ CANCELADO (desde BORRADOR, CONFIRMADO o EN_TRANSITO)
```
- Badge "Llegan N": suma `cantidad_pedida - cantidad_recibida` en pedidos `CONFIRMADO|EN_TRANSITO`
- Puente automático: `onConfirmarIngreso` llama `vincular_ingreso_a_pedido` por cada línea (fire-and-forget, FIFO)

**Flujos validados en runtime:**
- MEDICAMENTO Stepper ✅
- SERVICIO Stepper ✅
- PRODUCTO_GENERAL Stepper ✅
- PresentacionesTab ✅ incluyendo "Agregar forma de venta"
- PreciosTab ✅
- PedidoProveedorWorkspace ✅ pendiente validación runtime en app real
- InventarioFarmaciaWorkspace ✅ con badge "Llegan N" real
