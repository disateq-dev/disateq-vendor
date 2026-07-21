# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-20 — Sesion de tarde/noche
**Commit activo:** `62e8889`
**Rama:** `main`
**Migracion SQLite:** v25
**Estado working tree:** LIMPIO

---

## ESTADO GENERAL

Sesion de alta intensidad arquitectonica. Se resolvieron tres pendientes criticos del ciclo anterior y se ejecuto la Faena 55 completa — la migracion definitiva de localStorage a SQLite como unica fuente de verdad para el estado operacional de caja.

---

## FAENAS DEL DIA — COMMITS

| Commit | Faena | Descripcion |
|---|---|---|
| `89a6771` | 53 | Fix cash: detectar cierre_activo desde SQLite por polling — cierreAutorizado reactivo a sesion VEN independiente de instancia MAESTRO |
| `431b4fd` | 54a | Fix cash: blindaje defensivo en getCurrentSessionId — normalizar sesion.id contra comillas fisicas residuales |
| `13cc93d` | 55-Rust | feat(rust): comando obtener_estado_arranque — sesion activa, movimientos, cajas usadas hoy y ventas en una sola transaccion SQLite |
| `c3b7cca` | 55-SVC | feat(cash): arranque-caja.service.ts — mapeo de estado inicial desde SQLite, elimina dependencia de localStorage en arranque |
| `5caaddf` | 55-CAJA+CTX | refactor(cash): migrar arranque de localStorage a SQLite — useCaja y POSContext leen estado inicial desde obtenerEstadoArranque, eliminan recoverOperationalState |
| `6c33bcb` | 55-STATS | refactor(stats): eliminar localStorage de useSessionStats — stats y correlativos arrancan desde SQLite via initialStats, sin persistencia local |
| `62e8889` | 55-CLEAN | chore(cash): limpiar keys localStorage obsoletas en arranque |

---

## ARQUITECTURA DE ARRANQUE — NUEVO PATRON (definitivo)

### Flujo anterior (eliminado)
```
App inicia -> recoverOperationalState() sincrono -> lee localStorage -> monta POSContext
```

### Flujo nuevo (produccion)
```
App inicia
  -> POSProvider monta con inicializando=true -> pantalla "DISATEQ" (fondo #0f1117)
  -> useEffect: obtenerEstadoArranque() -> invoke Rust obtener_estado_arranque
  -> SQLite devuelve: sesion activa + movimientos + cajas usadas hoy + ventas
  -> setInitState(estado) -> setInicializando(false)
  -> POSContext.Provider monta con estado real desde SQLite
```

### Keys localStorage ELIMINADAS (ya no existen en el codigo)
- `disateq.pos.cashSession`
- `disateq.pos.usedCodes`
- `disateq.pos.usedDate`
- `disateq.pos.cashMoves`
- `disateq.pos.sessionStats`
- `disateq.pos.correlatives`

Estas keys se limpian automaticamente en cada arranque via `limpiarKeysObsoletas()` en `arranque-caja.service.ts`.

### Keys localStorage LEGITIMAS (permanecen)
- `disateq:cash:ui:closingPhase` — estado UI proceso de cierre (efimero)
- `disateq:cash:ui:cajaStage` — estado UI proceso de cierre (efimero)
- `disateq:cash:ui:contado` — conteos del arqueo en progreso (efimero)
- `disateq.pos.lastArqueo` — snapshot para reimprimir arqueo
- `disateq.pos.visualMode` — preferencia UI
- `disateq.pos.opLogs` — bitacora operacional efimera
- `disateq.pos.rubro` — configuracion rubro
- `disateq.pos.printFlow` — configuracion impresion
- `disateq.config.business` — configuracion negocio
- `disateq:operator:accesos` — bitacora accesos (diferido a SQLite)

---

## ARCHIVOS CLAVE MODIFICADOS HOY

### Nuevo archivo
- `apps/vendor-desktop/src/domains/cash/arranque-caja.service.ts` — wrapper TS del comando Rust, mapeo de tipos, reconstruccion de SessionStats desde ventas, limpieza de keys obsoletas

### Reescritos completamente
- `apps/vendor-desktop/src/hooks/useCaja.ts` — 407 lineas -> 245 lineas; recoverOperationalState eliminado; sin useEffect de persistencia LS; recibe initialState: EstadoArranque
- `apps/vendor-desktop/src/hooks/useSessionStats.ts` — 132 lineas -> 83 lineas; loadSessionStats/saveSessionStats/loadCorrelatives/saveCorrelatives eliminados; arranca con initialStats o NULL_STATS
- `apps/vendor-desktop/src/context/POSContext.tsx` — arranque async; pantalla de carga; recoverOperationalState eliminado; useCaja recibe initialState

### Modificados
- `apps/vendor-desktop/src-tauri/src/commands/sesion_caja.rs` — nuevo comando obtener_estado_arranque al final
- `apps/vendor-desktop/src-tauri/src/lib.rs` — registro de obtener_estado_arranque en invoke_handler
- `apps/vendor-desktop/src/modules/cash/CashWorkspace.tsx` — useEffect polling cierreAutorizado desde SQLite cada 10s
- `apps/vendor-desktop/src/modules/cash/services/session-history.service.ts` — blindaje replace en getCurrentSessionId

---

## APRENDIZAJES CRITICOS DE LA SESION

### 1. cierreAutorizado requiere polling cross-instancia
- MAESTRO y VEN son instancias separadas de la app (sesiones distintas)
- `window.dispatchEvent` es local a la ventana — no cruza instancias
- Solucion: useEffect con setInterval de 10s en CashWorkspace consultando SQLite directamente
- El callback `onAutorizarCierre` del `SupervisionCajaWorkspace` se mantiene como backup sincrono para el caso de misma instancia

### 2. `obtener_estado_arranque` — columnas de venta
- La tabla `venta` NO tiene columnas `cash_component`, `mixto_yap_component`, `serie_comprobante`, `correlativo_comprobante`
- La query de ventas usa solo: `total`, `metodo_pago`, `tipo_comprobante`
- Los componentes mixtos no estan persistidos en `venta` — se acumulan el total en `cash` como aproximacion conservadora

### 3. Arranque async en React — patron correcto
- `useState(recoverOperationalState)` sincrono es el anti-patron que se elimino
- El patron correcto: `useState(true)` para `inicializando` + `useEffect` que resuelve y llama `setInicializando(false)`
- Mientras `inicializando === true`: retornar pantalla minima (no `null`, no fragmento vacio — un div real para que Tauri renderice algo)

### 4. `docCorrelatives` en useSessionStats
- Solo es estado informativo de UI (rangos del turno)
- El motor real de numeracion vive en `correlativoStore` — independiente
- Arranca siempre vacio sin riesgo de duplicar correlativos

---

## PENDIENTES ACTIVOS (priorizados)

### CRITICO
1. **`useBitacora.ts` aun usa localStorage** para `opLogs` (`disateq.pos.opLogs`) y `turnEvents`. No es una deuda de integridad critica (son logs efimeros) pero es inconsistente con la arquitectura definitiva. Diferido aceptable por ahora.

### IMPORTANTE
2. **Token CSS `--dv-mod-auditoria-bg`** — `index.css` no tiene token canonico para AUDITORIA. Accent `#7B6EA0` hardcodeado.
3. **`AuditoriaWorkspace`** — tabla `auditoria_operacion` existe (v24), UI de consulta pendiente.
4. **`supervision-authorization.service.ts`** — `getAuthorizationForSession` carga todas las autorizaciones para filtrar. Ineficiente. Pendiente comando Rust dedicado.

### DIFERIDO ACEPTABLE
5. **BOX_DEFS estatico en `useCaja.ts`** — no se recarga desde SQLite.
6. **Deudas naming GLOSARIO seccion 8** — `ActualizarProveedorInput`, `TicketLineDTO`, etc.
7. **Subopciones ABASTECIMIENTO hardcodeadas** (farmacia unica).
8. **`accesosStore` bitacora localStorage** — migracion futura a SQLite.
9. **D-PRECIOS-1, F2 doble movimiento FEFO**.
10. **`desactivar_proveedor` / `desactivar_producto_comercial`** en Rust.

---

## ESTADO DE MODULOS CLAVE

### Arranque de caja (NUEVO — definitivo)
- `obtener_estado_arranque` (Rust, sesion_caja.rs): una transaccion, devuelve sesion + movimientos + cajas usadas hoy + ventas
- `arranque-caja.service.ts`: mapeo de tipos, reconstruccion de stats, limpieza de keys obsoletas
- `POSContext.tsx`: arranque async con pantalla de carga, `inicializando` state
- `useCaja.ts`: recibe `initialState: EstadoArranque`, sin localStorage
- `useSessionStats.ts`: recibe `initialStats?: SessionStats`, sin localStorage

### `autorizacion_supervision` (v25)
- `cierreAutorizado` en `CashWorkspace.tsx`: polling cada 10s via `loadAuthorizations()` + `getCurrentSessionId()`
- `getCurrentSessionId()`: normaliza `sesion.id` con `.replace(/^'|'$/g, "")`
- `mapSesionCajaRow()`: normaliza `boxCode` con `.replace(/^'|'$/g, "")`
- Bug de comillas fisicas en datos historicos: resuelto (DB actual estaba limpia)

### `useCaja.ts` (reescrito)
- Sin `recoverOperationalState`, sin `loadSession`, sin `saveSession`, sin `loadMoves`, sin `saveMoves`
- Sin `useEffect` de persistencia localStorage
- Recibe `initialState: EstadoArranque` — unico punto de inicializacion
- `openCashSession`, `closeCashSession`, `correctAperturaData`, `addCashMove`, `updateCashMove`, `editCashMove` — sin cambios en logica interna

### `session-history.service.ts`
- `getCurrentSessionId()` — normaliza `sesion.id` con replace
- `mapSesionCajaRow()` — normaliza `boxCode` con replace
- `loadSessionHistory()` — `obtenerHistorialSesionesSQLite(60)`

---

## PROTOCOLO PARA PROXIMA SESION

1. Leer `CURRENT_CONTEXT.md` (este archivo).
2. Verificar estado del working tree con `git status`.
3. Evaluar si ejecutar prueba de arranque en runtime (abrir la app y verificar que la pantalla de carga aparece y desaparece correctamente).
4. Si hay sesion activa en SQLite al arrancar: verificar que `CashWorkspace` muestra el turno abierto correctamente con movimientos reconstituidos.
5. Continuar con pendiente #2 (token CSS AUDITORIA) o pendiente #3 (AuditoriaWorkspace UI) segun prioridad operacional.

---

## COMANDOS UTILES

```powershell
# Ver sesiones activas
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT id, caja_codigo, operador_nombre, estado FROM sesion_caja WHERE estado = 'ABIERTA';"

# Ver autorizaciones pendientes
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT id, caja_code, session_id, type, status FROM autorizacion_supervision WHERE status = 'emitida';"

# Version de migraciones
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT MAX(version) FROM schema_migrations;"

# Limpiar DB para pruebas (localStorage ya no necesita limpiarse manualmente)
Remove-Item "$env:APPDATA\com.disateq.vendor\disateq.db"

# TypeScript check
cd D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop
npx tsc -p tsconfig.app.json --noEmit

# Cargo check
cd D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src-tauri
cargo check
```
