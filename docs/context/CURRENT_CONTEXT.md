# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** 2026-07-17
**Último commit:** `e087322`
**Rama:** `main`
**Working tree:** limpio

---

## ⚠️ DIRECTIVA ESTRATÉGICA ACTIVA — Fase de integración real

**Decisión de Fernando (12 Jul 2026):** abandonar mocks y datos ficticios. Todo flujo nuevo opera contra SQLite. Los flujos existentes en localStorage migran progresivamente.

**Directiva adicional (16 Jul 2026):** cero soluciones temporales. Cada decisión se toma como si fuera la que llega a producción.

---

## Estado de migraciones SQLite

| Versión | Contenido | Estado |
|---|---|---|
| v1–v15 | Schema core, catálogo farmacia, correcciones, IFA, servicios, config, pedidos, error_log | ✅ |
| v16 | `venta`, `linea_venta` | ✅ |
| v17 | `comprobante`, `linea_comprobante`, `correlativo` | ✅ |
| v18 | `sesion_caja`, `movimiento_caja`, `evento_turno` | ✅ |
| v19 | `operador`, `rol` + seed FTEJADA (reemplazado en v23) | ✅ |
| v20 | `movimiento.unidades_facturadas`, `venta/comprobante.sincronizado_en` | ✅ |
| v21 | `sesion_caja.arqueo_json`, `sesion_caja.correction_json` | ✅ |
| v22 | `bloque_operacional` + seed base=900 | ✅ |
| v23 | Elimina FTEJADA · Crea MAESTRO (SYS001/ADMIN) + SOPORTE (SYS002/SOP) con estado=SISTEMA · `asegurar_operador_sistema` en cada arranque | ✅ |

---

## Sesiones completadas

### Faenas 21–31: ver historial anterior ✅

### Faena 32 ✅ — CajasWorkspace completo en SQLite + naming canónico TipoCaja
Commits: `f4cef9f`, `8be18a0`, `831c52d`, `382be6e`
- E-1→E-4: migración v22, `blocks.store.ts`, `bloque-operacional-sqlite.service.ts`, `useCaja.ts`, `cash-rules.service.ts`, `StatusBar`, `CobroPanel`, `CashWorkspace`
- E-5→E-6: `useBloques.ts`, `CajasWorkspace.tsx` — MOCK_BLOCKS eliminado, SQLite conectado
- Deuda §8 liquidada: `TipoCaja = PRINCIPAL|AUXILIAR|EXCEPCIONAL` irrevocable

### Faena 33 ✅ — Operadores MAESTRO y SOPORTE permanentes
Commit: `e087322`

**Arquitectura implementada — Fase 1 (sin VPS):**
- `Cargo.toml`: dependencia `sha2 0.10`
- `build.rs`: lee `DISATEQ_SYSTEM_PIN` del entorno, emite warning si no definida, no falla el build
- `migrations v23`: elimina operador FTEJADA, crea MAESTRO y SOPORTE con `estado = 'SISTEMA'`
- `asegurar_operador_sistema()`: función auxiliar que recrea los operadores SISTEMA en cada arranque si fueron eliminados — indestructibles
- `verificar_pin_sistema`: comando Rust sin DB — compara SHA-256(pin_ingresado) vs SHA-256(DISATEQ_SYSTEM_PIN). Retorna `Err("SISTEMA_NO_CONFIGURADO")` si la variable no está definida
- `package.json`: script `tauri` carga `.env.build` automáticamente antes de `tauri dev` — cero pasos manuales
- `useOperadores.ts`: `ocultarOperadoresSistema()` filtra estado=SISTEMA de la UI de gestión; `loginOperator` tiene guard `if (!op) return false` y rama SISTEMA separada
- `LoginScreen.tsx`: operadores SISTEMA visibles al final del selector como `"⚙ ACCESO TÉCNICO · {alias}"`

**Credenciales de producto:**
- `MAESTRO` (SYS001) — rol ADMIN, `acceso_total`, bloque 900
- `SOPORTE` (SYS002) — rol SOP, capacidades operativas estándar, bloque 900
- PIN: variable `DISATEQ_SYSTEM_PIN` en `.env.build` (ignorado por git, patrón `.env.*`)
- `.env.build` ubicación: `apps/vendor-desktop/src-tauri/.env.build` — NO commitear nunca

**Fase 2 (con VPS — futuro):** reemplazar `verificar_pin_sistema` por verificación TOTP contra `machine_id`. El campo `pin` de MAESTRO/SOPORTE queda vacío con marcador `'TOTP'`. La UI no cambia.

---

## Estado de deuda técnica vigente

### Diferido aceptable
- `accesosStore` → bitácora de accesos en localStorage — migración futura a `acceso_operador`
- `changeOperatorPin` / `changeOperatorPinById` → sin escritura SQLite aún
- `supervision-authorization.service.ts` → autorizaciones en localStorage — migración futura
- F2 — doble movimiento `despacharConFefo` productos con lote — diferido hasta eliminar `inventoryService` legacy
- `BOX_DEFS` estático en `useCaja.ts` — derivar desde SQLite en fase futura (no bloquea producción)

### Deuda de PRECIOS
- **D-PRECIOS-1 — Precio por lote:** complejidad alta. Diferido.

### Deudas de naming — GLOSARIO §8 (baja prioridad, no bloquean)
- `ActualizarProveedorInput` → `ModificarProveedorInput`
- `TicketLineDTO` / `TicketLineBridge` → `LineaPreVenta`
- `emitidoPor` → `operadorId`
- `disponible/bajo_stock/agotado` → mayúsculas
- `actualizar_proveedor` → `modificar_proveedor`
- `desactivar_servicio_catalogo` → entidad canónica §11

---

## Próxima ventana de trabajo — prioridad

1. **Auditoría UIX/funcional completa** — Login → Config → Turno → Ventas → Comprobantes → Clientes → Reportes → Abastecimiento
2. **Arquitectura segundo rubro** — desbloqueada
3. **`supervision-authorization.service.ts`** — migración a SQLite
4. **Portal administrativo VPS** — paso natural tras completar rubros (habilitará Fase 2 de autenticación SISTEMA)

---

## Arquitectura de referencia rápida

**Monorepo:** `D:\DisateQ-DEV\Proyectos\disateq-vendor`
**Rust:** `apps/vendor-desktop/src-tauri/src/`
**TypeScript:** `apps/vendor-desktop/src/`
**TS check:** `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
**Rust check:** `cargo check` desde `apps/vendor-desktop/src-tauri`
**Dev:** `npm run tauri` desde `apps/vendor-desktop` (carga `.env.build` automáticamente)
**Git:** `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]`

**Naming canónico — dominio bloques:**
- `TipoCaja` = `"PRINCIPAL" | "AUXILIAR" | "EXCEPCIONAL"` — irrevocable
- `DefinicionCaja.tipoCaja`, `CashBox.tipoCaja` (no `.type`)
- Prereq `AUXILIAR` = `String(Number(code) - 1)` — geométrico
- Prereq `EXCEPCIONAL` = `code[0] + "00"`

**Naming canónico — dominio operadores:**
- `Operador.alias` (campo `codigo` eliminado)
- `EstadoOperador` = `"ACTIVO" | "SUSPENDIDO" | "INACTIVO" | "BLOQUEADO" | "SISTEMA"`
- Operadores SISTEMA: invisibles en UI gestión, visibles en login como acceso técnico

**Invariante D-INGRESOS-4 (irrevocable):**
- `lote.cantidad_disponible` = unidades físicas recibidas — FEFO opera sobre lo físico
- `movimiento.unidades_facturadas` = trazabilidad fiscal
- `linea_pedido_proveedor.cantidad_recibida` += `cantidad_facturada` — reconciliación fiscal

**sessionKey canónico:** `"{boxCode}-{openedAt.toISOString()}"` — PK de `sesion_caja`

**Tokens de color activos (`index.css`):**
- `--dv-color-edit: #005BE3`
- `--dv-color-new: #45b356`
- `--dv-color-confirm: #3B6B34`
- `--dv-color-danger: #DC2626`
- `--dv-color-exit: #B85C10`

**Comandos Rust registrados — bloques:**
`crear_bloque_operacional`, `obtener_bloques_operacionales`, `actualizar_auxiliares_bloque`, `activar_bloque_operacional`, `desactivar_bloque_operacional`

**Comandos Rust registrados — operadores:**
`obtener_operadores`, `obtener_roles`, `crear_operador`, `actualizar_operador`, `actualizar_estado_operador`, `actualizar_pin_operador`, `actualizar_capacidades_operador`, `crear_rol`, `actualizar_rol`, `actualizar_capacidades_rol`, `verificar_pin_sistema` ✅

**Comandos Rust registrados — sesion_caja:**
`abrir_sesion_caja`, `cerrar_sesion_caja`, `actualizar_sesion_caja_correction`, `registrar_movimiento_caja`, `actualizar_movimiento_caja`, `registrar_evento_turno`, `obtener_sesion_activa`, `obtener_historial_sesiones`, `obtener_movimientos_sesion`

**Reglas de apertura de sesión (obligatorias):**
1. Leer este archivo antes de cualquier acción.
2. Auditar archivos relevantes desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmación explícita de Fernando.
4. Entregar comandos git exactos — nunca `-am`, siempre `git add` explícito.
5. Reescribir este archivo completo al cerrar sesión.
6. Al cerrar módulo: ejecutar mapa de integridad de flujos (Rule #6).

**CRÍTICO — `.env.build`:**
- Ruta: `apps/vendor-desktop/src-tauri/.env.build`
- Contenido: `DISATEQ_SYSTEM_PIN=<valor>`
- Nunca commitear — protegido por `.gitignore` patrón `.env.*`
- Si se pierde: recrear con `Set-Content` en PowerShell antes de compilar
