# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-21 — Sesion completa (manana + tarde)
**Commit activo:** `4b0938f`
**Rama:** `main`
**Migracion SQLite:** v25
**Estado working tree:** LIMPIO

---

## ESTADO GENERAL

Sesion de cierre del sistema de AUDITORIA. Se completaron dos bloques: (1) implementacion del modulo completo de extremo a extremo (Faenas 56-58), y (2) conexion de todas las llamadas a auditoriaService.registrar() en los flujos operacionales existentes (Faenas 59-61). El sistema de trazabilidad queda 100% operativo.

---

## FAENAS DEL DIA — COMMITS

| Commit | Faena | Descripcion |
|---|---|---|
| `7d6a1a3` | 56-TOKEN | chore(css): tokens --dv-mod-auditoria y --dv-mod-auditoria-bg en index.css |
| `f848c43` | 57-RUST | feat(rust): commands/auditoria.rs — registrar (movido desde operadores.rs), obtener_registros, obtener_resumen |
| `2d79ffc` | 58-UI | feat(ui): AuditoriaWorkspace + service layer + integracion App + OperationalBar |
| `2daee30` | DOCS | docs(ux): AUDITORIA registrado en mapa de color canonico de ARQUITECTURA_UX.md |
| `4b0938f` | 59-61 | feat(auditoria): conectar llamadas a auditoriaService en operadores, supervision y comprobantes |

---

## ARQUITECTURA DE ARRANQUE — PATRON DEFINITIVO

### Flujo (produccion)
```
App inicia
  -> POSProvider monta con inicializando=true -> pantalla "DISATEQ" (fondo #0f1117)
  -> useEffect: obtenerEstadoArranque() -> invoke Rust obtener_estado_arranque
  -> SQLite devuelve: sesion activa + movimientos + cajas usadas hoy + ventas
  -> setInitState(estado) -> setInicializando(false)
  -> POSContext.Provider monta con estado real desde SQLite
```

### Keys localStorage ELIMINADAS (ya no existen en el codigo)
- `disateq.pos.cashSession`, `disateq.pos.usedCodes`, `disateq.pos.usedDate`
- `disateq.pos.cashMoves`, `disateq.pos.sessionStats`, `disateq.pos.correlatives`

Limpieza automatica en cada arranque via `limpiarKeysObsoletas()` en `arranque-caja.service.ts`.

### Keys localStorage LEGITIMAS (permanecen)
- `disateq:cash:ui:closingPhase` / `cajaStage` / `contado` — estado UI cierre (efimero)
- `disateq.pos.lastArqueo` — snapshot reimprimir arqueo
- `disateq.pos.visualMode` / `rubro` / `printFlow` — preferencias UI
- `disateq.config.business` — configuracion negocio
- `disateq:operator:accesos` — bitacora accesos (diferido a SQLite)

---

## MODULO AUDITORIA — ESTADO COMPLETO (implementado hoy)

### Arquitectura de la cadena completa

```
auditoria_operacion (SQLite, v24)
  WRITE: commands/auditoria.rs::registrar_auditoria_operacion
         <- auditoriaService.registrar() <- ConfigWorkspace (PIN), otros puntos
  READ:  commands/auditoria.rs::obtener_registros_auditoria  (filtros opcionales)
         commands/auditoria.rs::obtener_resumen_auditoria    (ultimos 30 dias, por dominio)
         <- auditoriaService.obtenerRegistros() / obtenerResumen()
         <- AuditoriaWorkspace.tsx
```

### Archivos del dominio
- `src-tauri/src/commands/auditoria.rs` — modulo Rust propio; structs RegistroAuditoria + ResumenAuditoriaDominio; tres comandos
- `src/domains/auditoria/auditoria.service.ts` — interfaces RegistroAuditoria, ResumenAuditoriaDominio, FiltrosAuditoria; metodos obtenerRegistros() y obtenerResumen() con mapeo snake->camelCase
- `src/modules/config/AuditoriaWorkspace.tsx` — dos paneles (lista+filtros / detalle); carga async con Promise.all; sin props, sin localStorage

### Integracion en navegacion
- `App.tsx`: rama `activeModule === "auditoria"` renderiza AuditoriaWorkspace
- `OperationalBar.tsx`: `puedeVerAuditoria = (acceso_total || gestionar_operadores) && !isBlocking`; `tieneAcceso("auditoria")` lee del ref correctamente
- Accent: `#7B6EA0` | BG: `#F5F3FB` | Token CSS: `--dv-mod-auditoria` / `--dv-mod-auditoria-bg`

### Nota de migracion (Rust)
- `registrar_auditoria_operacion` fue movido de `commands/operadores.rs` a `commands/auditoria.rs`
- El path en `lib.rs invoke_handler` fue actualizado: `commands::auditoria::registrar_auditoria_operacion`
- `commands/mod.rs` tiene `pub mod auditoria;`

### Operaciones auditables — 100% conectadas

| TipoOperacion | Archivo | Punto de registro |
|---|---|---|
| `CONFIGURACION_PIN_AUTORIZACION` | ConfigWorkspace.tsx | handleSavePinAdmin() |
| `CREACION_OPERADOR` | OperadoresWorkspace.tsx | handleSave() rama create |
| `BAJA_OPERADOR` | OperadoresWorkspace.tsx | handleConfirmBaja() |
| `CAMBIO_PIN_OPERADOR` | OperadoresWorkspace.tsx | savePinViewMode() |
| `CAMBIO_ROL_OPERADOR` | OperadoresWorkspace.tsx | handleSave() rama edit (guard: rol cambiado) |
| `CORRECCION_ARQUEO` | SupervisionCajaWorkspace.tsx | handleAuthorize() cuando authType=correccion_cierre |
| `CORRECCION_APERTURA` | SupervisionCajaWorkspace.tsx | handleAuthorize() cuando authType=correccion_apertura |
| `CIERRE_EXTEMPORANEO` | SupervisionCajaWorkspace.tsx | handleAuthorize() cuando authType=cierre_extemporaneo |
| `ANULACION_COMPROBANTE` | ComprobantesWorkspace.tsx | handleVoid() callback post-autorizacion |

---

## ESTADO DE MODULOS CLAVE

### Arranque de caja (definitivo desde sesion anterior)
- `obtener_estado_arranque` (Rust, sesion_caja.rs): una transaccion, devuelve sesion + movimientos + cajas usadas hoy + ventas
- `arranque-caja.service.ts`: mapeo de tipos, reconstruccion de stats, limpieza de keys obsoletas
- `POSContext.tsx`: arranque async con pantalla de carga
- `useCaja.ts`: recibe `initialState: EstadoArranque`, sin localStorage
- `useSessionStats.ts`: recibe `initialStats?: SessionStats`, sin localStorage

### `autorizacion_supervision` (v25)
- `cierreAutorizado` en `CashWorkspace.tsx`: polling cada 10s via SQLite
- `getCurrentSessionId()`: normaliza `sesion.id` con `.replace(/^'|'$/g, "")`
- `mapSesionCajaRow()`: normaliza `boxCode` con `.replace(/^'|'$/g, "")`

### AUDITORIA (nuevo — completo desde hoy)
- Ver seccion MODULO AUDITORIA arriba.

---

## PENDIENTES ACTIVOS (priorizados)

### CRITICO
1. **`useBitacora.ts` aun usa localStorage** para `opLogs` (`disateq.pos.opLogs`) y `turnEvents`. Logs efimeros — inconsistente con arquitectura definitiva. Diferido aceptable.

### IMPORTANTE
2. **`supervision-authorization.service.ts`** — `getAuthorizationForSession` carga todas las autorizaciones para filtrar en memoria. Ineficiente. Pendiente comando Rust dedicado.

### DIFERIDO ACEPTABLE
3. **BOX_DEFS estatico en `useCaja.ts`** — no se recarga desde SQLite.
4. **Deudas naming GLOSARIO seccion 8** — `ActualizarProveedorInput`, `TicketLineDTO`, `BoxSlotType`, `OperatorRecord`, etc.
5. **Subopciones ABASTECIMIENTO hardcodeadas** (farmacia unica).
6. **`accesosStore` bitacora localStorage** — migracion futura a SQLite.
7. **D-PRECIOS-1, F2 doble movimiento FEFO**.
8. **`desactivar_proveedor` / `desactivar_producto_comercial`** en Rust.
9. **Sistema de auditoria completo** — todos los TipoOperacion declarados estan conectados. No hay pendientes en este dominio.

---

## APRENDIZAJES CRITICOS ACUMULADOS

### Tauri 2 camelCase
- JS invoke envia parametros en camelCase; Tauri convierte a snake_case antes de Rust
- La respuesta Rust llega en snake_case; el mapeo a camelCase se hace en el service layer TS
- Nunca enviar snake_case desde el service layer — causa silent parameter mismatch

### SQLite single source of truth
- localStorage eliminado de todos los flujos de negocio criticos
- Patron: optimistic UI + SQLite-confirmed + rollback on failure
- `limpiarKeysObsoletas()` corre en cada arranque para limpiar instancias antiguas

### Separacion de dominios Rust
- Cada dominio de negocio tiene su propio archivo en `commands/`
- `registrar_auditoria_operacion` vivia en `operadores.rs` — incorrecto; movido a `auditoria.rs`
- La cohesion de dominio en Rust es tan importante como en TS

### Cargo check warnings preexistentes (no son de esta sesion)
- `unit_price` en `thermal.rs` — campo no leido
- `tipo_documento` en `thermal.rs` — campo no leido
- Ambos son deuda preexistente, no tocar sin tarea especifica

---

## PROTOCOLO PARA PROXIMA SESION

1. Leer `CURRENT_CONTEXT.md` (este archivo).
2. `git status` — verificar working tree limpio.
3. Evaluar prioridad: pendiente #1 (useBitacora localStorage) o pendiente #2 (comando Rust supervision) o deudas naming GLOSARIO seccion 8.
4. Si se trabaja en auditoria: verificar en runtime que AuditoriaWorkspace carga registros reales al navegar al modulo (debe mostrar al menos CONFIGURACION_PIN_AUTORIZACION si el PIN fue configurado).

---

## COMANDOS UTILES

```powershell
# Ver registros de auditoria
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT tipo_operacion, operador_alias, resultado, registrado_en FROM auditoria_operacion ORDER BY registrado_en DESC LIMIT 20;"

# Ver sesiones activas
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT id, caja_codigo, operador_nombre, estado FROM sesion_caja WHERE estado = 'ABIERTA';"

# Ver autorizaciones pendientes
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT id, caja_code, session_id, type, status FROM autorizacion_supervision WHERE status = 'emitida';"

# Version de migraciones
sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" "SELECT MAX(version) FROM schema_migrations;"

# Limpiar DB para pruebas
Remove-Item "$env:APPDATA\com.disateq.vendor\disateq.db"

# TypeScript check
cd D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop
npx tsc -p tsconfig.app.json --noEmit

# Cargo check
cd D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src-tauri
cargo check
```
