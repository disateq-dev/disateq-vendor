# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último Commit:** `13a4648` — feat(cash): ticket de impresión especial para corrección de cierre — comando Tauri print_correccion + HTML fallback, impresión automática al ejecutar.

---

## Situación General (Junio 2026)
Ciclo comercial validado en runtime: BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO.
Módulo TURNO / CAJA auditado — incluyendo SUPERVISIÓN, sin hallazgos críticos pendientes.

---

## Recorrido de Dominios (Matriz de Estado)
*   **LOGIN:** ✅ Auditado.
*   **TURNO / CAJA:** ✅ Auditado — incluye SUPERVISIÓN. Ver "Ciclo SUPERVISIÓN —
    visibilidad de autorizaciones para VEN" abajo para el detalle completo.
*   **VENTAS:** ⬜ Pendiente (Siguiente módulo en el recorrido).
*   **COMPROBANTES | CLIENTES | REPORTES | INVENTARIOS | COMPRAS | OPERADORES | CONFIG:** ⬜ Pendientes.

---

## Ciclo SUPERVISIÓN — visibilidad de autorizaciones para VEN (commits `ecbc513` → `6b1c2b8`)

### Hallazgo de origen
Verificación funcional (ADMIN + VEN) detectó que, aunque ADMIN emite una
autorización de corrección (`correccion_apertura`, `correccion_cierre`,
`cierre_extemporaneo`), **el operador VEN no tenía forma de verla ni
ejecutarla**. Causa raíz: desde Hallazgo D (sesión anterior), `CajasWorkspace`
(donde vivía la ejecución) se movió de TURNO a AJUSTES, módulo gateado por
`useCapacidad("gestionar_operadores")` — capacidad que el rol VEN
(`roles.store.ts`, seed) **no tiene** (`capacidades: ["gestionar_clientes"]`).
Resultado: VEN nunca accede a AJUSTES → nunca ve "Cajas" → nunca ve la
autorización pendiente, sin importar que ADMIN ya la emitió.

### Resolución — 3 rondas, mismos 2 archivos nuevos/editados

**Fase 1 (extracción, sin cambio de comportamiento):**
- Nuevo archivo `apps/vendor-desktop/src/modules/cash/AutorizacionEjecucionCard.tsx`
  — extrae la UI + lógica de ejecución (`handleExec`, formularios para los 3
  tipos de corrección, `markAuthorizationExecuted`) que antes vivía embebida
  en `PanelGestionCajas` dentro de `CajasWorkspace.tsx`. Componente
  reutilizable, props: `activeAuth`, `targetSession`, `operatorName`,
  `onExecuted`. (`CajasWorkspace.tsx` no se tocó — deuda menor de duplicación
  documentada, no resuelta).

**Fase 2 (integración funcional en Gestión Turno):**
- `CashWorkspace.tsx`: nuevo estado `authRefresh` + `useMemo
  pendingCorrectionAuth` vía `getActiveAuthorizationsForBlock(operatorBlockPrefix)`
  filtrando `type !== "cierre_activo"` (ese tipo ya tiene su propio flujo vía
  `handleConfirmClose`). `targetSessionForAuth` resuelto desde
  `sessionHistory`. `handleCorrectionExecuted` refresca historial + auth.
  Refresco también al entrar a `cashSubView === "turno"`.
- Resultado: cualquier operador (VEN incluido) ve la autorización pendiente
  **solo si pertenece a su propio bloque** (`operatorBlockPrefix`), sin pasar
  por AJUSTES.

**Ronda de UX (worksheet + trazabilidad):**
- `AutorizacionEjecucionCard.tsx`: convertido de card flotante a **worksheet**
  con header de 42px + `rounded-[28px]` (mismo lenguaje visual que el resto de
  TURNO). Título dinámico vía `AUTH_CARD_TITLES`: "CIERRE EXTEMPORÁNEO
  PENDIENTE" / "CORRECCIÓN DE CIERRE PENDIENTE" / "CORRECCIÓN DE APERTURA
  PENDIENTE" / "CIERRE DE SESIÓN ACTIVA".
- `CashWorkspace.tsx`: la worksheet de autorización pendiente ahora
  **reemplaza** (no apila) la card "APERTURA DE TURNO" / "RESUMEN DEL TURNO"
  mientras `closingStage === 0 && pendingCorrectionAuth`. Al ejecutarse
  (`onExecuted` → `authRefresh++` → `pendingCorrectionAuth = null`), vuelve
  automáticamente a la card normal.
- `CashWorkspace.tsx` — tabla "APERTURAS Y CIERRES ANTERIORES": nuevo badge
  **"✎ corregido"** cuando `SessionEntry.correction` existe (dato que ya se
  guardaba vía `recordSessionCorrection`/`recordAperturaCorrection` pero no se
  mostraba). Tooltip con tipo de corrección, autor, fecha, motivo y — para
  `cierre_extemporaneo` — la fecha operacional real vs. fecha de registro.

`npx tsc -b` limpio en todas las rondas. Todos los archivos auditados vía
filesystem MCP.

### Nota de Fernando
Detalles finos de pulido visual de este ciclo (espaciados, micro-ajustes) se
revisarán en la fase Beta — no bloquean el cierre de este hallazgo.

### Deuda documentada (no resuelta, baja prioridad)
- `CajasWorkspace.tsx` (`PanelGestionCajas`) conserva su propia copia inline
  de la lógica de ejecución de autorizaciones — duplicada con
  `AutorizacionEjecucionCard.tsx`. Unificar cuando se retome CONFIG/AJUSTES.

---

## Ciclo BLOQUEO OPERACIONAL — autorizaciones pendientes bloquean navegación (commit `c8c0045`)

### Las 7 decisiones de diseño (Fernando, sesión "en frío")
1. Bloquean los 3 tipos de corrección: `correccion_apertura`, `correccion_cierre`,
   `cierre_extemporaneo` (NO `cierre_activo`, que tiene su propio flujo).
2. Alcance: solo el operador cuyo `operatorBlockPrefix` coincide con el bloque
   de la autorización.
3. Bloqueo total: navegación fija en TURNO › Gestión (VENTAS y demás módulos
   deshabilitados) hasta regularizar.
4. Mecanismo: la worksheet `AutorizacionEjecucionCard` (ya existente) es el
   único punto de resolución.
5. Escape: botón "No puedo regularizar ahora" con MOTIVO obligatorio
   (`MIN_MOTIVO_LEN`), sin PIN.
6. La postergación es un **recordatorio recurrente**: vuelve a bloquear al
   abrir un nuevo turno (o reiniciar la app).
7. "Supervisión" (dentro de TURNO) sigue gobernada solo por
   `reaperturar_cierres` — el bloqueo no la afecta ni la oculta.

### Arquitectura — 5 archivos, 5 prompts atómicos, todos auditados
- **`supervision-authorization.service.ts`**: `CajaAuthorization` gana
  `postponedMotivo?/postponedAt?/postponedBy?` + nueva función
  `markAuthorizationPostponed(id, motivo, postponedBy)`.
- **`POSContext.tsx`**: nuevo estado **en memoria** `acknowledgedAuthIds:
  Set<string>` + `acknowledgeAuthorization(id)`, expuestos en el Provider.
  `useEffect` que reinicia el Set a `new Set()` cuando cambia
  `cashSession.openedAt` (nuevo turno abierto) — implementa la recurrencia del
  punto 6 sin lógica de fechas: al ser estado en memoria, también se reinicia
  al recargar/reiniciar la app.
- **`OperationalBar.tsx`** (`ContextBar`): calcula `operatorBlockPrefix`,
  `pendingAuth` (vía `getActiveAuthorizationsForBlock`, filtrando
  `type !== "cierre_activo"`) e `isBlocking = pendingAuth && !acknowledgedAuthIds.has(pendingAuth.id)`.
  Todas las capacidades `puedeVer*` se combinan con `&& !isBlocking`; nuevo
  `puedeVerSales = !isBlocking` (VENTAS antes no tenía gating). Nuevo
  `useEffect` fuerza `onChange("cash")` + `onCashSubViewChange("turno")`
  mientras `isBlocking`.
- **`AutorizacionEjecucionCard.tsx`**: nuevo botón "No puedo regularizar
  ahora" → textarea de motivo (mín. `MIN_MOTIVO_LEN`) →
  `markAuthorizationPostponed` + `onPostponed()`. Solo visible para los 3
  tipos bloqueantes (no `cierre_activo`).
- **`CashWorkspace.tsx`**: consume `acknowledgedAuthIds`/`acknowledgeAuthorization`;
  `handleCorrectionExecuted` y nuevo `handleCorrectionPostponed` llaman
  `acknowledgeAuthorization(pendingCorrectionAuth.id)`; render de la worksheet
  condicionado a `pendingCorrectionAuth && !acknowledgedAuthIds.has(...)`, con
  `onPostponed={handleCorrectionPostponed}`.

`npx tsc -b` limpio en los 5 pasos. Commit `c8c0045`.

### Nota de Fernando
Detalles finos de pulido de este ciclo también quedan para Beta — ver hallazgos
nuevos abajo, reportados inmediatamente después del commit.

---

## Ciclo CORRECCIÓN DE CIERRE — tabla ORIGINAL/CORREGIDO (Hallazgo 5, commit `a641776`)

### Diseño confirmado por Fernando
Flujo de roles clarificado: OPERADOR AUTORIZADO (ADMIN/SUP/asignado) opera
desde SU PC → solo AUTORIZA. OPERADOR VENTAS (autorizado) opera desde SU PC de
ventas → único que EJECUTA, vía `AutorizacionEjecucionCard`. Para
`correccion_apertura` el flujo ya estaba bien (solo corrige fondo de cambio).
El gap era `correccion_cierre`: no había forma de ver/corregir la modalidad de
pago (Efectivo/Yape/Tarjeta) del arqueo de cierre.

**Tabla 2 columnas** (NO 3 — se descartó mostrar "ESPERADO"): **ORIGINAL**
(solo lectura, = `contadoEfe/Yape/Tar` del `targetSession.arqueo`) y
**CORREGIDO** (input editable, pre-llenado con ORIGINAL, sobrescribible).
TOTAL siempre calculado. Recalcula en vivo: `nuevaDiferencia = nuevoTotal −
sistemaEsperado.total` (usado internamente, NO mostrado como columna);
`newSignal = nuevaDiferencia === 0 ? "ok" : "warn"`. Reemplaza el toggle manual
anterior "✓ Sin diferencias/⚠ Con diferencias" SOLO para `correccion_cierre`
(`cierre_extemporaneo` mantiene su flujo original con fecha + toggle ok/warn,
sin cambios). Caso "sin cambios" (CORREGIDO===ORIGINAL) es válido — el motivo
documenta la revisión aunque no haya ajuste numérico.

### Fase A — completada (commit `a641776`)
- **`session-history.service.ts`**: `CorrectionRecord` extendido con
  `prevContado?: {efe,yape,tar,total}`, `newContado?: {efe,yape,tar,total}`,
  `newDiferencia?: number`. `recordSessionCorrection` ahora también actualiza
  `e.arqueo.{contadoEfe,contadoYape,contadoTar,contadoTotal,diferencia}` cuando
  `correction.newContado` existe — mantiene consistencia con "APERTURAS Y
  CIERRES" y reimpresión.
- **`AutorizacionEjecucionCard.tsx`**: nuevos estados `newEfe/newYape/newTar`
  inicializados desde `targetSession?.arqueo` (o "0.00"); derivados
  `prevEfeNum/.../prevTotalNum`, `newEfeNum/.../newTotalNum`, `esperadoTotal`
  (de `sistemaEsperado.total`), `newDiferenciaCalc`, `newSignalCalc`.
  `handleExec()` separado en 3 ramas explícitas (`cierre_extemporaneo` sin
  cambios, `correccion_cierre` nuevo con `prevContado/newContado/newDiferencia`,
  `correccion_apertura` sin cambios). Render del formulario combinado separado
  en dos bloques independientes — extemporáneo igual que antes, y nuevo bloque
  para `correccion_cierre` con la tabla grid 3 columnas
  Modalidad/Original/Corregido (inputs editables Efe/Yape/Tar, fila Total
  calculada, indicador "✓ Cuadrado"/"⚠ Con diferencia").

`npx tsc -b` limpio. Commit `a641776`.

### Fase B — COMPLETADA Y COMMITEADA (commit `13a4648`): ticket de impresión
especial "CORRECCIÓN DE CIERRE".
- **`thermal.rs`**: struct `CorreccionPrintData` + `build_correccion_escpos`
  (reutiliza `four_col`/`diff_str`/`money`/`Buf`). Layout: header "CORRECCION
  DE CIERRE" + Caja/Sesión + Autorizado por/Ejecutado por/Motivo (con
  wrapping) + tabla 4 columnas CONCEPTO/ORIGINAL/CORREGIDO/DIFER.
  (Efectivo/Yape/Tarjetas + TOTAL doble-altura) + footer "CORRECCION
  REGISTRADA".
- **`lib.rs`**: comando `print_correccion(printer, data: CorreccionPrintData)`
  registrado en `invoke_handler`.
- **`printTicket.ts`**: interfaz `CorreccionPrintData` (camelCase),
  `diffStrHtml`, `buildCorreccionHTML`, `printCorreccion` (HTML/navegador),
  `printCorreccionThermal` (invoke `print_correccion`).
- **`AutorizacionEjecucionCard.tsx`**: imports `loadBusinessConfig` +
  funciones de impresión; en `handleExec` rama `correccion_cierre`, tras
  `recordSessionCorrection`, construye `CorreccionPrintData` (negocio, caja,
  sesión vía `fmtDt`, autorizante/ejecutante, motivo, montos
  `prev*/new*Num`) y dispara `setTimeout(..., 120) →
  printCorreccionThermal("TIQUE", ...).catch(() => printCorreccion(...))`.

`cargo check`/`npx tsc -b` limpios en los 4 prompts. Commit `13a4648`.

**Ciclo CORRECCIÓN DE CIERRE (Hallazgo 5) — RESUELTO Y CERRADO.**

---

## HALLAZGOS PENDIENTES — sesión siguiente (sin iniciar)

Fernando probó la app y reportó 4 hallazgos adicionales sobre la columna
izquierda de Gestión Turno (`CashWorkspace.tsx`). **Ninguno fue diseñado ni
implementado aún** — quedan para después de cerrar Fase B:

1. **Worksheet "APERTURA DE TURNO"** no ocupa toda el área que le corresponde;
   se corta y deja fuera el botón "APERTURAR".
2. **Worksheet "RESUMEN DEL TURNO"** mismo problema — corta el botón de avance,
   que además debe renombrarse a **"IR A CIERRE DE TURNO"**.
3. **Worksheet "CIERRE DE TURNO"** mismo problema de corte; además la barra de
   **PROGRESO** (hoy un card aparte en "Actions") debe vivir **dentro** de esta
   worksheet.
4. **Patrón general**: el botón que ejecuta la acción principal debe ir al
   final, como **footsheet interno de la worksheet**, color **verde**, y
   ejecutarse con **ENTER**. Implica reestructurar las 3 worksheets de la
   columna izquierda (hoy: card de altura fija + spacer + bloque "Actions"
   separado) hacia worksheet de altura completa con footsheet integrado.

---

## Próxima Ventana de Trabajo (Plan de Acción Inmediato)
1.  **Rediseño de las 3 worksheets de Gestión Turno** (Hallazgos 1-4, abajo):
    APERTURA DE TURNO / RESUMEN DEL TURNO / CIERRE DE TURNO — altura completa,
    footsheet interno verde con acción principal por ENTER, PROGRESO integrado
    en CIERRE DE TURNO, renombrar botón de RESUMEN a "IR A CIERRE DE TURNO".
2.  **Continuar recorrido sistemático:** módulo VENTAS (sigue en espera).

---
*Nota del Sistema: Ventana de chat previa saturada. Iniciar sesión limpia leyendo este contexto atómico.*
