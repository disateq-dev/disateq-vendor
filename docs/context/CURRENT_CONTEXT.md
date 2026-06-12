# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Último commit
refactor(config): mover CajasWorkspace de TURNO a CONFIG/AJUSTES + eliminar SubContextBar.tsx huérfano (998083e)

## Cambios sin commitear
Ninguno.

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de madurez operacional avanzada con normalización estructural completa.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## RECORRIDO SISTEMÁTICO POR DOMINIOS — estado

Auditoría módulo por módulo bajo formato de cuatro dimensiones
(orientación · densidad de información · flujos de acción · consistencia de shell)
con severidad 🔴 Crítico / 🟡 Importante / 🟢 Menor / ⚪ OK.

| Módulo | Estado |
|---|---|
| LOGIN | ✅ Auditado |
| TURNO / CAJA | ✅ Auditado (commit b2a6fea) — cierre de turno reestructurado en 3 sheets 30/30/40 (ver sesión 2026-06-11) |
| VENTAS | ⬜ Pendiente — siguiente en el recorrido |
| COMPROBANTES | ⬜ Pendiente |
| CLIENTES | ⬜ Pendiente |
| REPORTES | ⬜ Pendiente |
| INVENTARIOS | ⬜ Pendiente |
| COMPRAS | ⬜ Pendiente |
| OPERADORES / ROLES | ⬜ Pendiente |
| CONFIG / AJUSTES | ⬜ Pendiente |

**Nota de prioridad:** la capa sync/ (Fase 1 en adelante) queda en stand-by
hasta completar el recorrido de módulos. Diseño arquitectónico ya documentado
en `ARQUITECTURA_SYNC.md` — no se pierde, solo espera. Razón: sin Portal/Nexo
aún no hay extremo-a-extremo que probar; el recorrido de módulos tiene impacto
inmediato en distribución.

---

## Sesión 2026-06-12 — fix proporciones 30/30/40 (flex) + 3 pendientes abiertos para próxima ventana

Continuación inmediata de la ronda 4 (sesión 2026-06-11). Fernando reportó que
todas las sheets del lado derecho en CashWorkspace tenían el borde derecho
pegado al borde de la ventana, sin margen — bug presente desde el origen,
imperceptible a 740px, evidente a 1366px tras el fix de ventana responsive.

### Completado (sin commit todavía)

- **Causa raíz**: `w-[30%]`/`w-[40%]` + `gap-2` en flexbox — `gap` se SUMA a
  los anchos en porcentaje (no se resta), el total excede el 100% por 16px
  (2 gaps), y `overflow-hidden` recorta ese excedente quitando el margen
  derecho de la sheet más a la derecha.
- **Fix aplicado** (Codex, 1 prompt, verificado vía filesystem MCP):
  `apps/vendor-desktop/src/modules/cash/CashWorkspace.tsx` —
  `w-[30%]` → `flex-[3]` (4 ocurrencias: LEFT, CENTER "CAJAS DISPONIBLES",
  Sheet 2 "ARQUEO FONDO DE CAMBIO", MOVIMIENTOS) y `w-[40%]` → `flex-[4]`
  (3 ocurrencias: RIGHT "APERTURAS Y CIERRES ANTERIORES", Sheet 3 "ARQUEO
  CAJA · CIERRE DE TURNO", SUCESOS DEL TURNO). Resto de clases intactas.
  `npx tsc -b` sin errores nuevos. Conteo final verificado: 4× `flex-[3]`,
  3× `flex-[4]`, cero `w-[30%]`/`w-[40%]` restantes.
- **Commiteado y pusheado**: commit `024930f` (sesión 2026-06-12).

### 3 pendientes abiertos para la próxima ventana (en orden a decidir con Fernando)

1. **Hallazgo C — RESUELTO (commit `f9095fb`)**: pill "Supervisión" (CASH_TABS)
   ahora filtrado por `useCapacidad("reaperturar_cierres")` en `OperationalBar.tsx`
   — aplicado en `renderPills()` y en el handler de teclado (`acc.puedeSupervisarCaja`).
   Auditado vía filesystem MCP, `npx tsc -b` sin errores nuevos.

2. **Hallazgo D — RESUELTO (commit `998083e`)**: `CajasWorkspace` movido de
   TURNO a CONFIG/AJUSTES. Cambios en 4 archivos:
   - `App.tsx`: `CashSubView` pierde `"cajas"` → `"turno" | "supervision-caja"`;
     `ConfigSubView` gana `"cajas"` (entre `operadores` y `roles`).
   - `OperationalBar.tsx`: `CASH_TABS` sin `cajas` (queda Gestión · Supervisión);
     `CONFIG_TABS` con `cajas` después de `operadores`.
   - `CashWorkspace.tsx`: removido import y routing de `CajasWorkspace`.
   - `ConfigWorkspace.tsx`: `CajasWorkspace` importado desde `../cash/`,
     routing `configSubView === "cajas"`, entradas en `SUB_ICONS`/`SUB_LABELS`
     (icono `LayoutGrid`).
   - **Hallazgo extra**: `layout/SubContextBar.tsx` era código huérfano
     (ya documentado como "eliminado" en el rediseño ContextBar, pero el
     archivo nunca se borró — mantenía copias locales desactualizadas de
     `CASH_TABS`/`CONFIG_TABS` que rompieron `tsc` al quitar `"cajas"` de
     `CashSubView`). Confirmado sin importaciones activas y eliminado.
   - Deuda separada (no resuelta aquí, ya documentada): `CajasWorkspace`
     usa `MOCK_BLOCKS` desconectado de `BLOCK_BASES` real `[100,200,300,400,500,900]`.
   - `npx tsc -b` sin errores. Auditado vía filesystem MCP en los 4 archivos
     + confirmación de eliminación de `SubContextBar.tsx`.

3. **Auditoría sistémica del patrón `w-[N%]` + `gap` (sumando ~100%) — RESUELTA,
   SIN HALLAZGOS**: búsqueda de solo lectura en `apps/vendor-desktop/src/**/*.tsx`
   (excluyendo `CashWorkspace.tsx`, ya corregido) no encontró ningún contenedor
   `gap-N` con hijos `w-[N%]` sumando 90-100%. Casos descartados:
   - `PreVentaGrid.tsx` (footer línea 227): hijos `w-[28%]` suman 56% + centro
     `flex-1` — no aplica.
   - `CajasWorkspace.tsx` (línea 948): `PanelCajas` `w-[35%]` + `PanelGestionCajas`
     `flex-1` — no aplica.
   - `LoginScreen.tsx` (línea 222): `w-[45%]` pero el contenedor padre no usa
     `gap-N` — no aplica.
   No se requiere acción adicional. Sin cambios aplicados.

**Fernando indicó que esta ventana de chat está saturada — continuar en una
ventana nueva.** Leer esta sección al iniciar.

---

## Sesión 2026-06-10 — Refinamiento CIERRE DE TURNO + fix de layout

Continuación del audit TURNO (commit b2a6fea). Trabajo sobre `CashWorkspace.tsx`,
commits `46a2048`, `f8429e0`, `5f38a74`.

### Completado y commiteado

- **Cierre de turno reestructurado en 3 sheets** dentro del panel izquierdo (30%):
  - Sheet 1 — sección "PROGRESO" (3 pasos derivados de `closingPhase`/`cajaStage`
    vía `progresoCierre`): Arqueo Fondo de Cambio · Arqueo de Caja · Confirmar Cierre.
  - Sheet 2 — "ARQUEO FONDO DE CAMBIO" (`closingPhase==="fondo"`): comparación
    `contadoFondo` vs `fondoEsperado`, bloque SOBRANTE/FALTANTE/Fondo cuadrado,
    `motivoFondo` obligatorio si difiere, botón "CONTINUAR A ARQUEO DE CAJA".
  - Sheet 3 — "ARQUEO CAJA · CIERRE DE TURNO" (`closingPhase==="caja"`): barra de
    4 pasos con color (`pasosCaja`: Conteo #2154d8 / Validación #d97706 /
    Comparación #16a34a / Cierre #C05050, `currentIndex` desde `cajaStage`).
  - Tipos nuevos: `ClosingPhase = "none"|"fondo"|"caja"`, `CajaStage =
    "conteo"|"validacion"|"comparacion"|"cierre"`. `ClosingStage` (0-5) queda
    como valor DERIVADO + `setClosingStage()` como setter de compatibilidad —
    código legacy (F9/F10/F4/Enter/Ctrl+Enter, `loadContadoField`) sigue
    funcionando sin reescritura.
  - Panel "PROCESO" (timeline decorativo de 5 pasos, 152px) **queda sin cambios
    estructurales** — Codex lo omitió por riesgo, ver pendientes.

- **Saldo de CAJA DEL DÍA validado**:
  - Tab "SACAR" deshabilitado si `fondoVendidoEsp <= 0` → fallback automático a
    "INGRESAR". Tooltip: "No disponible — no hay saldo en Caja del Día".
  - Monto de retiro no puede exceder `fondoVendidoEsp` — botón "SACAR DINERO"
    deshabilitado + mensaje "Excede el saldo disponible (S/ X.XX)".
  - INGRESAR permanece sin restricciones en todo momento (puede ser primera
    operación del turno: cobro de deuda pendiente, etc.).

- **Tarjetas de confirmación con impresión bajo demanda** — patrón unificado en
  las 6 operaciones de movimientos (CAJA DEL DÍA ingreso/egreso vía
  `lastVendidoMove`; FONDO DE CAMBIO — DI SENCILLO/ME DEVOLVIERON/RECIBÍ
  SENCILLO/YO DEVOLVÍ — vía `lastFondoMove`, título dinámico según
  `move.sourceType`/`refId`/`type`). Cada tarjeta: botón IMPRIMIR (llama
  `handlePrintVoucher` on-demand) + botón ✕ (descarta). Reemplazó el patrón
  anterior de impresión automática + checkbox "Imprimir comprobante"
  (implementado y luego revertido en la misma sesión).

- **UI de movimientos simplificada**:
  - Eliminado indicador "↑ S/ X ↓ S/ Y" duplicado bajo header MOVIMIENTOS (ya
    visible en RESUMEN DEL TURNO).
  - Eliminado campo "Anotación (opcional)" de los 6 formularios (`vendidoObs`/
    `fondoObs` removidos, `addCashMove` recibe `undefined`).
  - Chips de motivo (DI SENCILLO y RECIBÍ SENCILLO — los únicos que los tenían)
    convertidos de permanentes a sugerencias contextuales on-focus
    (`showFondoMotivoSugerencias`/`showPrestadoMotivoSugerencias`, ocultas con
    onBlur delay 150ms o al seleccionar).

- **"Corregir fondo de cambio"** (antes "Corregir apertura"):
  - Botón grande azul preexistente ("CORREGIR FONDO DE CAMBIO" + mensaje fijo)
    eliminado — era redundante con el link discreto.
  - Link discreto renombrado "Corregir apertura" → "Corregir fondo de cambio".
  - Badge visual permanente "Ctrl+ins" eliminado del layout.
  - Tooltip único, sin redundancia: si `canCorrectApertura` → "Sujeta a turno
    sin operaciones · TECLA [Ctrl + Insert]"; si no, mensaje específico según
    causa (movimientos registrados / ventas realizadas / turno con
    operaciones).
  - **PIN de autorización removido** de este flujo específico — operación de
    bajo riesgo (ventana acotada por `canCorrectApertura`: cero movimientos,
    cero ventas, antes de cualquier operación). Trazabilidad vía
    `correctAperturaData`/`recordAperturaCorrection` se mantiene intacta.
    El resto del sistema de PIN de autorización (`useAutorizacion`) NO fue
    tocado.

- **Bug estructural de layout resuelto** (el más relevante de la sesión):
  En la vista turno abierto (`closingStage === 0`), MOVIMIENTOS y SUCESOS DEL
  TURNO estaban envueltos en un `<div className="flex min-h-0 flex-1 gap-2">`
  adicional dentro de `<section>` — sus `w-[30%]`/`w-[40%]` se calculaban sobre
  ese wrapper (~70% del total tras restar el panel izquierdo de 30%), no sobre
  el 100% de `<section>`. Proporciones reales resultantes: ~37.5% / ~25.8% /
  ~34.5% en vez de 30/30/40. Corregido reemplazando el wrapper por un fragment
  `<>...</>` — mismo patrón que ya usaba la vista `!isOpen` (CAJAS
  DISPONIBLES/APERTURAS Y CIERRES, que sí estaba correcta desde el principio).
  Verificado visualmente: proporciones 30/30/40 ahora consistentes en
  pre-apertura y turno abierto.

- **`pr-2` agregado a `<section>` raíz** — alinea el margen derecho de
  APERTURAS Y CIERRES ANTERIORES / SUCESOS DEL TURNO con el resto del shell,
  consistente en las tres vistas (pre-apertura, turno abierto, cierre).

### Pendiente para próxima sesión

- **Reestructuración de CIERRE DE TURNO (`closingStage > 0`) en 3 sheets fijas**,
  consistente con el resto de vistas (30/30/40):
  - Sheet 1 (30%) — "CIERRE DE TURNO" (ya existe, con sección PROGRESO).
  - Sheet 2 (30%) — "ARQUEO FONDO DE CAMBIO" (contenido hoy en stage 1).
  - Sheet 3 (40%) — "ARQUEO CAJA · CIERRE DE TURNO" (contenido hoy en stages
    2-5 + barra de 4 pasos).
  - Eliminar el panel "PROCESO" (timeline decorativo de 152px) — su función
    queda cubierta por PROGRESO (Sheet 1) + barra de 4 pasos (Sheet 3).
  - Diseño pendiente de definir: comportamiento de cada sheet cuando su fase
    no está activa (ej. Sheet 2 en modo solo-lectura/resumen una vez
    completada la fase FONDO; Sheet 3 en placeholder "pendiente" mientras la
    fase activa es FONDO).
  - Decisión tomada: hacerlo con calma en sesión fresca, no al final de una
    sesión larga — alto riesgo de romper JSX en un bloque de ~600 líneas
    (ya ocurrieron 2 roturas de fragment/wrapper esta sesión, ambas resueltas).
- Revisión menor: confirmar que no quedó código muerto del botón
  "CORREGIR FONDO DE CAMBIO" eliminado (handler compartido reutilizado por el
  link discreto).
- Continuar recorrido sistemático: módulo VENTAS (siguiente).

### Nota operativa — gestión de modelo Codex

Codex CLI alcanzó rate limit durante la sesión; cambio a `gpt-5.4-mini` para
tareas mecánicas simples (clases de ancho, renombres de texto) funcionó bien.
Recomendación: modelo pequeño para tareas mecánicas sin ambigüedad, modelo
grande para lógica/estado/JSX estructural complejo.

---

## Sesión 2026-06-11 — CIERRE DE TURNO reestructurado en 3 sheets (30/30/40)

Continuación de la deuda #11 (sesión 2026-06-10). Trabajo sobre `CashWorkspace.tsx`,
3 prompts atómicos a Codex, cada uno verificado vía filesystem MCP contra el archivo
real antes de avanzar al siguiente.

### Completado

- **Prompt 1 — reestructuración base**: el contenedor único de `closingStage > 0`
  (panel flujo flex-1 + panel PROCESO 152px) fue reemplazado por un Fragment con
  dos sheets hermanos, replicando el patrón 30/30/40 ya usado en `!isOpen`:
  - **Sheet 2 (30%, "ARQUEO FONDO DE CAMBIO")**: contenido íntegro de Stage 1
    (~168 líneas movidas).
  - **Sheet 3 (40%, "ARQUEO CAJA · CIERRE DE TURNO")**: barra `pasosCaja` +
    Stages 2-5 íntegros (~87+50+119+114 líneas movidas).
  - Panel PROCESO (timeline decorativo de 5 pasos + snapshot TURNO) eliminado
    por completo — su información ya está cubierta por PROGRESO en Sheet 1.
  - Sin código huérfano (`idx`, `w-[152px]`, referencias a PROCESO).

- **Prompt 2 — Sheet 2, rama "completado"**: cuando `closingPhase === "caja"`
  (closingStage 2-5), Sheet 2 muestra resumen de solo lectura del arqueo de
  fondo ya validado: badge "Fondo de cambio validado", FONDO ESPERADO vs
  FONDO CONTADO, y SOBRANTE/FALTANTE/Fondo cuadrado + motivo registrado
  (usando `fondoDiferenciaFinal.current` / `fondoMotivoFinal.current`, sin
  inputs ni handlers nuevos).

- **Prompt 3 — Sheet 3, rama "pendiente"**: cuando `closingPhase === "fondo"`
  (closingStage 1), Sheet 3 muestra placeholder: barra `pasosCaja` en gris
  fijo (sin `currentIndex`) + empty state ("Completa el arqueo de fondo de
  cambio para continuar" / "El conteo de caja se habilitará al finalizar
  este paso"), mismo patrón visual que el empty state de APERTURAS Y CIERRES
  ANTERIORES.

`npx tsc -b` pasó sin errores nuevos en los tres prompts.

### Resultado

Los tres sheets (30/30/40) quedan completos para todos los estados de
`closingStage > 0`:

| Estado | Sheet 1 (30%) | Sheet 2 (30%) | Sheet 3 (40%) |
|---|---|---|---|
| `closingStage === 1` (fondo) | CIERRE DE TURNO + PROGRESO | Arqueo activo | Placeholder pendiente |
| `closingStage === 2-5` (caja) | CIERRE DE TURNO + PROGRESO | Resumen validado | pasosCaja activo + stage |

Commit `86745e7`.

---

## Sesión 2026-06-11 (ronda 2) — 4 ajustes finos a CIERRE DE TURNO tras evaluación de Fernando

Tras el commit `86745e7`, Fernando evaluó la UI resultante como ADMIN y como
operador VEN, confirmando que el arqueo a ciegas funciona correctamente para
VEN (oculta "Esperado ventas"/conciliación). 4 hallazgos adicionales,
resueltos en 4 prompts atómicos, cada uno verificado vía filesystem MCP.

### Hallazgos y resolución

1. **Botones de acción → a su sheet correspondiente**: los botones de cada
   stage del cierre (CONTINUAR A ARQUEO DE CAJA, GUARDAR CONTEO, COMPARAR
   TOTALES, CONFIRMAR CIERRE, CERRAR TURNO, CANCELAR/RECONTAR) vivían en el
   panel "Actions" de Sheet 1, operando sobre contenido de Sheet 2/Sheet 3.
   Movidos (no duplicados):
   - Stage 1 (CONTINUAR A ARQUEO DE CAJA + CANCELAR) → footer de Sheet 2.
   - Stages 2-5 (GUARDAR CONTEO/CANCELAR · COMPARAR TOTALES/RECONTAR ·
     CONFIRMAR CIERRE/RECONTAR · CERRAR TURNO/CANCELAR) → footer único de
     Sheet 3, con sub-rama según `closingStage`, visible solo si
     `closingPhase === "caja"`.
   - Panel "Actions" de Sheet 1 para `closingStage > 0` queda sin botones de
     stage (solo conserva "CIERRE DE TURNO" para `closingStage === 0`).

2. **PIN de autorización eliminado del cierre normal**: "CONFIRMAR CIERRE"
   (stage 4→5) ya no usa `solicitarAutorizacion(...)` — ahora
   `onClick={() => setClosingStage(5)}` directo. El PIN de autorización queda
   reservado exclusivamente para reapertura/corrección vía
   `SupervisionCajaWorkspace`/`cierreAutorizado` (sin cambios). Como
   consecuencia, `solicitarAutorizacion` quedó sin uso — se eliminó de la
   destructuración (`const { PinAutorizacionModal } = useAutorizacion();`).
   `PinAutorizacionModal` y `cierreAutorizado` siguen en uso sin cambios.

3. **PROGRESO con estilo timeline conectado**: el bloque PROGRESO (antes una
   lista simple con punto/check + label dentro del status card, bajo
   `closingPhase !== "none"`) fue eliminado de ahí y reconstruido con estilo
   timeline (círculos numerados, ✓ en completados, líneas verticales
   conectoras) en el espacio que liberaron los botones movidos, dentro del
   panel "Actions" de Sheet 1. Mantiene el nombre "PROGRESO" y las 3 etapas
   de `progresoCierre` (Arqueo Fondo de Cambio · Arqueo de Caja · Confirmar
   Cierre) sin cambios. Visible solo si `isOpen && closingStage > 0`.

4. **Identidad cromática TURNO restaurada**: las 3 sheets del flujo de cierre
   (status card de Sheet 1, Sheet 2, Sheet 3) volvieron al tema TURNO
   (`border-[#2A7CA8]/50`, header `bg-[#F2F7FA] border-[#2A7CA8]/15`, íconos
   `text-[#1a5f7a]`), reemplazando el tema rojo del contenedor completo. El
   énfasis "cierre/crítico" en rojo permanece en elementos internos: badge
   `{closingStage}/5`, círculo `bg-[#f4f7fb] text-[#b91c1c]`, texto "CERRANDO
   TURNO · X/5" (`text-red-500`), badges SOBRANTE/FALTANTE, botones CONFIRMAR
   CIERRE/CERRAR TURNO.

`npx tsc -b` pasó sin errores nuevos (incluye fix de `solicitarAutorizacion`
sin uso).

### Pendiente

- Auditoría de la **impresión del ticket de cierre**: Fernando señaló que
  "Esperado ventas"/conciliación SISTEMA vs OPERADOR es contenido de
  impresión, no de pantalla — pendiente revisión específica de ese flujo en
  una sesión futura, antes de retomar VENTAS.

Commit `6bebcc0`.

---

## Sesión 2026-06-11 (ronda 3) — arqueo a ciegas universal + bloque ADMIN propio + simetría de shell (8px global)

Tras el commit `6bebcc0`, Fernando revisó la impresión del ticket de cierre,
reportó un conflicto de bloque entre FTEJADA (ADMIN) y Gabriel Ríos Tovar (VEN,
bloque 100), y una asimetría de márgenes en la vista GESTIÓN — que tras
verificación visual resultó ser un descompasé global de espaciado del shell
(borde-a-sheet 12px vs sheet-a-sheet 8px). 4 hallazgos, resueltos en 4 prompts
atómicos, cada uno verificado vía filesystem MCP.

### Hallazgos y resolución

1. **Arqueo a ciegas universal en pantalla, comparación completa solo en
   impresión** (`CashWorkspace.tsx`): hasta ahora Stage 4/5 mostraban en
   pantalla, solo para roles `!esVEN` (ADMIN/SUPERVISOR), los "esp. X.XX"
   inline en "Arqueo contado", el bloque "Desglose efectivo esperado · cómo
   se calcula", el bloque "Conciliación ventas"/"Esperado ventas" +
   CUADRADO/SOBRANTE/FALTANTE (Stage 4), y el bloque final
   CUADRADO/SOBRANTE/FALTANTE (Stage 5) — mientras que en impresión
   `sistemaEsperado` (tabla SISTEMA vs OPERADOR) solo se llenaba para VEN.
   Resolución: los 4 bloques anteriores se eliminaron por completo de Stage
   4/5 (ahora idénticos para todos los roles — arqueo a ciegas universal), y
   `sistemaEsperado` en `handleConfirmClose` se llena siempre, para todos los
   roles — la comparación completa SISTEMA vs OPERADOR queda únicamente en el
   ticket impreso. `esVEN` se conserva (uso legítimo en el filtro de
   historial de APERTURAS Y CIERRES ANTERIORES).

2. **Bloque operacional propio para ADMIN (900)**: FTEJADA (ADMIN) tenía
   `baseBloque: null`, lo que provocaba que su fallback de bloque
   (`operatorBlockPrefix`) cayera sobre el bloque 100 — el mismo asignado a
   Gabriel Ríos Tovar (VEN) — generando la apariencia de "dos operadores en
   CAJA 100". Resolución: `BLOCK_BASES` (`blocks.store.ts`) ahora incluye 900
   (`[100, 200, 300, 400, 500, 900]`), generando automáticamente las cajas 900
   (PRINCIPAL), 901/902 (SECUNDARIAS), 950 (CONTINGENCIA). El SEED de FTEJADA
   (`operator.store.ts`) pasa a `baseBloque: 900`. `SEED_VERSION` subió de
   "5" a "6" — al reiniciar la app, `cargarOperadores()` recarga el SEED
   completo: **todos los operadores registrados manualmente (incluyendo
   Gabriel Ríos Tovar) se pierden** y deben registrarse de nuevo. Solo
   FTEJADA (ADMIN, bloque 900) queda desde el SEED. Decisión confirmada por
   Fernando, quien acepta el reseteo.

3. **Simetría de márgenes en GESTIÓN**: el `<section>` raíz de
   `CashWorkspace` (vista Gestión/Turno) tenía un `pr-2` extra que
   `CajasWorkspace` y `SupervisionCajaWorkspace` no tienen, generando un
   margen derecho distinto al izquierdo entre las tres sub-vistas de CAJA.
   Resolución: `pr-2` eliminado del `<section>` raíz — las tres sub-vistas
   (Gestión, Cajas, Supervisión) comparten ahora el mismo margen simétrico
   provisto por `AppShell`.

4. **Estandarización del margen del shell a 8px** (`AppShell.tsx`): tras
   confirmar visualmente el punto 3, Fernando señaló un segundo descompasé:
   el `<section>` del workspace en AppShell usaba `p-3` (12px) para el margen
   borde-de-ventana → contenido, mientras que dentro de cada módulo (ej.
   CashWorkspace) el espacio entre sheets usa `gap-2` (8px) — 12px vs 8px,
   descompasé visual entre "sheet-a-sheet" y "borde-a-sheet". Resolución:
   `gap-3 p-3` → `gap-2 p-2` en el `<section>` de workspace de `AppShell.tsx`
   — ahora 8px en ambos casos, en TODOS los módulos (no solo CAJA). Cambio
   global de una sola clase, confirmado por Fernando.

`npx tsc -b` pasó sin errores nuevos en los cuatro prompts.

### Pendiente

- Continuar recorrido sistemático: módulo VENTAS (siguiente).

Commit `176f349`.

---

## Sesión 2026-06-11 (ronda 4) — hallazgo arquitectónico: ventana no era responsive

Al calcular el ancho del workspace para validar las proporciones 30/30/40, se
descubrió que `tauri.conf.json` (heredado del arquitecto anterior, sin
documentar como decisión) tenía la ventana en `740x520`, `resizable: false`
— probablemente un placeholder de la pantalla de LOGIN nunca generalizado.
Esto contradice la resolución mínima real exigida a los clientes (1366x768)
y el principio de UI responsive establecido por Fernando, con miras a soporte
futuro de tablets.

### Resuelto hoy (cambio mínimo, una sola edición)

`apps/vendor-desktop/src-tauri/tauri.conf.json`:
- `width`/`height`: 740/520 → **1366/768** (tamaño inicial = mínimo real)
- `resizable`: `false` → **`true`**
- `minWidth`/`minHeight`: nuevos, **1366/768** — la ventana nunca puede ser
  menor a la resolución mínima exigida a clientes.
- Sin cambios en `decorations`, `closable`, `alwaysOnTop`, `center`,
  `maximized`.

El layout interno (AppShell + CashWorkspace) ya usa `flex`/`%`/`gap` —
proporciones 30/30/40 ya son relativas, no requieren cambio para esta parte.

### Deuda priorizada — dos fases separadas

- **Fase A — Responsive de escritorio (PRÓXIMA)**: auditar tipografías y
  espaciados en `px` absolutos (`text-[Npx]`, headers `h-[42px]`, paddings
  fijos), calibrados originalmente para ~724px de workspace, para que no se
  vean "perdidos"/diminutos en 1366px+ de ancho. Sin tocar arquitectura de
  dominios ni doctrina operacional — es un ajuste de escala visual.
- **Fase B — Tablets/táctil (STAND-BY, diseño propio)**: densidad táctil
  (targets ≥44px vs los 24-32px actuales), orientación, posibles layouts
  alternativos para pantallas angostas — rediseño de Modern Operational UI
  por tipo de dispositivo, documentado aparte (mismo tratamiento que
  `ARQUITECTURA_SYNC.md`: diseño completo, en stand-by hasta su turno).

No bloquea el recorrido sistemático de módulos. Fase A se prioriza para
cuando termine el recorrido de TURNO/inicio de VENTAS, o antes si Fernando lo
considera urgente.

Commit `4ffc2ac`.

---

## Resumen del audit TURNO — 9 hallazgos resueltos (commit b2a6fea)

| # | Hallazgo | Resolución |
|---|---|---|
| 1 | Sub-tabs FONDO DE CAMBIO con terminología técnica | Renombrados a "DI SENCILLO" · "ME DEVOLVIERON" · "RECIBÍ SENCILLO" · "YO DEVOLVÍ" |
| 2 | Historial pre-apertura mostraba sesiones de otros operadores a VEN | Filtrado por operadorId para rol VEN |
| 3 | Corrección de apertura sin elemento visible | Botón visible con estado activo/inactivo + tooltip explicativo (refinado en sesión 2026-06-10) |
| 4 | Campo zeroMotive sin guía contextual | Texto "Declaras S/ 0.00 en caja — indica el motivo para continuar" |
| 5 | Transición Stage 3→4 sin confirmación visual | Indicador "✓ Conteos registrados a las HH:MM" usando validatedAt |
| 6 | Imprimir arqueo disponible antes del conteo completo | Habilitado solo desde Stage 3 (validatedAt !== null) |
| 7 | SubViews TURNO sin identidad en ContextBar | Pills expandidas: Gestión · Cajas · Supervisión (CASH_TABS en OperationalBar.tsx) |
| 8 | Storage keys UI con separador legacy `.` | Renombradas a `disateq:cash:ui:closingPhase`/`cajaStage` y `disateq:cash:ui:contado` |
| 9 | "ESTADO DE APERTURA Y CIERRES" impreciso | Renombrado a "APERTURAS Y CIERRES ANTERIORES" |

Archivos modificados: `CashWorkspace.tsx`, `OperationalBar.tsx`

---

## SHELL — arquitectura visual validada en runtime

```
Topbar          64px  — bg-[#0f1f3d] · nombre negocio + logo + botón Power (app_exit)
ContextBar      52px  — única banda operacional · expandible por módulo
Workspace       flex-1 — p-3 gap-3
Footbar         26px  — bg-[#0a1628] · estado turno + reloj + firma
```

Header total: 116px (ganancia de 42px sobre sistema anterior de 158px)

---

## ContextBar — estado final validado

Archivo: `src/layout/OperationalBar.tsx` — exporta únicamente `ContextBar`
Archivo: `src/layout/AppShell.tsx` — monta `Topbar` + `ContextBar`

**Identidad visual:**
- Inactivo: solo icono + texto, sin fondo, sin borde — texto al 70% opacidad
- Activo: línea inferior `border-b-[3px]` cromática + fondo sutil — sin cuadros ni bordes laterales
- Cursor navMode: misma línea al 50% opacidad + fondo más tenue
- `active` determina MOD_ON — `display` (hover-preview) no activa el indicador cromático

**Expansión inline:**
- Click en módulo con subtabs → expande, muestra pills inline, oculta resto
- Click en anchor → colapsa, vuelve vista global
- Módulos con subtabs: `cash` (Gestión · Cajas · Supervisión), `abastecimiento`, `config`
- Módulos sin subtabs: navegan directamente

**Navegación keyboard-first:**

| Shortcut | Acción |
|---|---|
| `Shift+Enter` | Toggle modo navegación ContextBar |
| `←→` en navMode | Navegar módulos (salta sin acceso) |
| `Enter` en navMode | Activar módulo · expandir si tiene subtabs |
| `←→` en expanded | Navegar pills de subtabs |
| `Enter` en expanded | Activar pill enfocada |
| `Escape` en expanded | Colapsa pills · vuelve a navMode en módulo activo |
| `Escape` en navMode | Desactiva modo navegación completamente |

**Implementación técnica:**
- `stateRef` + `accessRef`: lectura fresca sin stale closures
- `useEffect` con `[]`: handler registrado una sola vez
- `e.code`: independiente del idioma del teclado
- `navModeRef` en AppShell: escucha `pos:navMode` para no interferir con Escape

---

## Footbar — estado final validado

Archivo: `src/layout/ShortcutsBar.tsx`

**Lado izquierdo** — estado del turno (text-white/50, 10.5px, font-semibold):
```
● TURNO ABIERTO · CAJA 100 · PC-VENTAS01 · 09:14 · 20h02m
○ SIN TURNO OPERATIVO  (cuando no hay turno)
```

**Lado derecho** — todo en text-white, 10px:
```
17:18 · 08 JUN  |  DisateQ VENDOR v1.0  |  @fhertejada™
```

Dependencias: solo `cashSession` de `usePOS()`. Sin `sessionStats`, `cashMoves`, `DocRange`.

---

## Identidad cromática por módulo

| Módulo | Color | Fondo topbar | Borde |
|---|---|---|---|
| TURNO / CAJA | `#2A7CA8` | `bg-[#F2F7FA]` | `border-[#2A7CA8]/15` |
| VENTAS | `#45b356` | `bg-[#F2FAF3]` | `border-[#45b356]/15` |
| COMPROBANTES | `#C05050` | `bg-[#FBF4F4]` | `border-[#C05050]/15` |
| CLIENTES | `#1e7e4f` | `bg-[#F0FAF4]` | `border-[#1e7e4f]/15` |
| REPORTES | `#2154d8` | `bg-[#F0F4FF]` | `border-[#2154d8]/15` |
| ABASTECIMIENTO | `#3D8A8A` | `bg-[#F0F7F7]` | `border-[#3D8A8A]/15` |
| CONFIG | `#697387` | `bg-[#F4F5F7]` | `border-[#697387]/15` |

**Reglas irrevocables:**
- La SheetTopbar solo contiene icono + texto. Sin badges, contadores, toggles ni botones.
- Tabs, toggles y filtros van en el body, inmediatamente debajo de la topbar.
- Badges de estado van en el body como contexto, nunca en la topbar.
- Botones de acción definitiva van en SheetBottomBar, nunca en el body.
- El color cromático pertenece al módulo, no al estado del sheet.

---

## Topbar — estado final

- Datos izquierda: `nombreComercial`, `alias`, `ruc`, `razonSocial` — todos de `BusinessConfig`
- Leídos con `useMemo([])` — correcto para datos estáticos por sesión
- Botón Power: `invoke("app_exit")` → `app.exit(0)` — cierre total de la app
- `closable: false` en `tauri.conf.json` — intencional, solo Power cierra

---

## Lo que está construido y validado

### TURNO / CAJA — AUDITADO ✅
Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección · recovery.
Arqueo a ciegas UNIVERSAL (todos los roles): Stage 4/5 ya no muestran esperados del
sistema ni resultado de conciliación para nadie — idéntico para VEN/ADMIN/SUPERVISOR.
Ticket de cierre incluye SIEMPRE la sección SISTEMA vs OPERADOR (tú a tú), para
todos los roles — la comparación completa queda solo en el ticket impreso (ronda 3,
sesión 2026-06-11).
Lenguaje operacional en FONDO DE CAMBIO · historial filtrado por operador para VEN ·
corrección de apertura visible (sin PIN, ventana acotada) · guías contextuales ·
pills Gestión/Cajas/Supervisión · cierre de turno reestructurado en 3 sheets 30/30/40
(Sheet 1 CIERRE DE TURNO + PROGRESO timeline · Sheet 2 ARQUEO FONDO DE CAMBIO · Sheet 3
ARQUEO CAJA · CIERRE DE TURNO, con ramas activa/completada/pendiente según fase) ·
botones de cada stage en su sheet correspondiente · PIN de autorización fuera del
cierre normal (reservado para reapertura vía SUPERVISIÓN) · identidad cromática
TURNO consistente en las 3 sheets del cierre · márgenes simétricos 12px/12px en
Gestión/Cajas/Supervisión (8px global, sin `pr-2`, AppShell `gap-2 p-2`) · panel
PROCESO eliminado · proporciones
30/30/40 verificadas en pre-apertura, turno abierto y cierre de turno.

### FONDO DE CAMBIO
Ciclo "DI SENCILLO" → "ME DEVOLVIERON" y "RECIBÍ SENCILLO" → "YO DEVOLVÍ" validados.
(Antes: RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN — misma lógica, lenguaje operacional nuevo)
Tarjetas de confirmación con impresión bajo demanda en las 4 operaciones.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante.
Tres modos de búsqueda: nombre/código · calculadora inline · escáner.
Vista Lista y Visual · Feedback verde 600ms al agregar.

### COMPROBANTES
Workspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir · PIN de Autorización.

### CLIENTES
Workspace completo · StatsBar · Filtros · F2 · PanelDetalle · Formulario inline · guards.

### REPORTES
Workspace completo · Cuatro tipos · Cuatro períodos · IMPRIMIR · EXCEL · PDF A4.

### INVENTARIOS CAPA 0+1
177 productos · movimientos causales · disponibilidad derivada · reservas · alertas.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS.

### OPERADORES + ROLES
Ciclo de vida completo · PIN SHA-256 · Bloque Operacional · capacidades · roles configurables.
SEED: FTEJADA / 1234 · ADMIN · acceso_total · bloque 900 (propio, fuera del rango
operativo 100-500) · versión 6 (ronda 3, sesión 2026-06-11 — reset de operadores
manuales al próximo reinicio: Gabriel Ríos Tovar debe registrarse de nuevo).
`BLOCK_BASES` = [100, 200, 300, 400, 500, 900].

---

## Deudas técnicas identificadas

### Arquitectura

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 1 | `POSContext.tsx` — orquestador puro · deuda resuelta | — | ✅ Cerrada |
| 2 | Imports directos de storage en componentes UI — viola DIP | Medio | Media |

### Funcionalidad

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 3 | UIX Stage 5 cierre — fila diferencia para roles no VEN | — | ✅ Cerrada |
| 4 | Historial de búsqueda por sesión — ArrowUp en input vacío | Bajo | Baja |
| 11 | CIERRE DE TURNO (closingStage > 0) — reestructurar en 3 sheets 30/30/40, eliminar panel PROCESO | — | ✅ Cerrada (sesión 2026-06-11) |

### Seguridad

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 5 | PINs de operador en texto plano | — | ✅ Cerrada |
| 6 | Sin cifrado de localStorage | — | ✅ Resuelta por arquitectura — localStorage es caché temporal |
| 7 | Sin timeout de inactividad — sesión permanece activa indefinidamente | Medio | Media |

### Regulatorio

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 8 | Integración SUNAT real pendiente | Alto | Fase 6 del roadmap sync |

### Normalización GLOSARIO

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 9 | `emitidoPor` en `Comprobante` — debería ser `operadorId` | Bajo | Baja |
| 10 | `EstadoDisponibilidad` en minúsculas en `inventory/types.ts` | Bajo | Baja |

---

## Arquitectura de sincronización — CONSOLIDADA Y DOCUMENTADA (en stand-by)

Documento completo: `docs/03-arquitectura/ARQUITECTURA_SYNC.md`

**Modelo:** MSP — DISATEQ como socio tecnológico
**Topología:** Edge (terminales) → Nexo DISATEQ (primario + secundario) · hasta 5 equipos por cliente en V1
**Tres rutas:** internet automático · LAN peer-to-peer · .dsync manual
**Conflictos:** event-sourcing · LWW · determinista para correlativos
**Correlativos:** series por terminal · store actual ya compatible · asignación desde Nexo en Portal
**Contingencia Nexo:** failover automático y silencioso · nexo.config.json con endpoints priorizados
**Contingencia terminal:** fallo siempre acotado · recuperación desde disco o tickets · terminalId único
**Recuperación:** terminales son el respaldo del Nexo · reconstrucción desde colas locales
**Dos proyectos:** VENDOR (sync/ + SUNAT) · PORTAL (Nexo · licencias · actualizaciones · RustDesk)

**Estado:** diseño completo, Fase 1 (cola de eventos) especificada y lista para Codex.
En stand-by hasta completar el recorrido sistemático de módulos — ver sección de arriba.
Tipos y API del store quedan documentados a continuación para no perder el trabajo.

### Fase 1 — Cola de eventos (especificación lista, en espera)

Archivos a crear:
```
src/sync/event-queue.types.ts
src/sync/event-queue.store.ts
```

Tipos definidos y listos para Codex:
- `SyncDominio`: pedidos · comprobantes · inventario · clientes · turno · configuracion
- `SyncOperacion`: CREAR · MODIFICAR · ANULAR · CERRAR · REGISTRAR
- `SyncEstado`: PENDIENTE · ENVIANDO · CONFIRMADO · FALLIDO
- `SyncEvent`: id · terminalId · clienteId · dominio · operacion · entidadId · payload · creadoEn · estado · intentos · ultimoIntento · confirmedAt · errorMsg
- `NexoEndpoint`: url · prioridad · activo
- `NexoConfig`: clienteId · terminalId · endpoints[] · timeoutMs · retryIntervalMs

API del store:
- `encolar(dominio, operacion, entidadId, payload): SyncEvent`
- `marcarEnviando(eventId): void`
- `confirmar(eventId): void`
- `registrarFallo(eventId, errorMsg): void`
- `obtenerPendientes(): SyncEvent[]`
- `obtenerTodos(): SyncEvent[]`
- `purgarConfirmados(): void`
- `resumen(): { pendientes: number; fallidos: number; ultimoSync: string | null }`

Puntos de integración (una línea por dominio, tras implementar el store):
- `pedido.store.ts` → encolar tras `concretarPedido()` y `abandonarPedido()`
- `comprobante.store.ts` → encolar tras `emitirComprobante()` y `anularComprobante()`
- `CashWorkspace` → encolar tras `closeCashSession()`
- `cliente.store.ts` → encolar tras crear/modificar cliente
- `inventory` → encolar tras cada `MovimientoOperacional`

Lo que NO entra en la cola:
- Estado UI efímero · PreVenta · TurnEvents · configuración de UI local

---

## Inventario de shortcuts globales

| Shortcut | Lugar | Acción |
|---|---|---|
| `Shift+Enter` | ContextBar | Toggle modo navegación |
| `←→` | ContextBar navMode | Navegar módulos |
| `Enter` | ContextBar navMode | Activar módulo |
| `Escape` | ContextBar navMode | Salir sin activar |
| `←→` | ContextBar expanded | Navegar pills |
| `Enter` | ContextBar expanded | Activar pill |
| `Escape` | ContextBar expanded | Volver a navMode |
| `Ctrl+Shift+L` | AppShell | Logout operador |
| `Escape` | AppShell | Focus búsqueda VENTAS |
| `F2` | SalesWorkspace | Focus búsqueda |
| `Ctrl+Enter` | SalesWorkspace | Abrir cobro |
| `Ctrl+Insert` | CashWorkspace | Corregir fondo de cambio (sin PIN, link discreto, ventana acotada) |
| `F9` | CashWorkspace stage 2 | Guardar conteo |
| `F4` | CashWorkspace stages 3/4 | Recontar |
| `F10` | CashWorkspace stage 3 | Comparar totales |
| `Ctrl+Enter` | CashWorkspace stage 5 | Confirmar cierre |
| `F2` | ClientesWorkspace | Focus búsqueda |
| `F2` | ComprobantesWorkspace | Focus búsqueda |
| `Escape` | LoginScreen | Salir app |
| `Ctrl+Shift+O` | LoginScreen | Switch keypad/pin-change |

---

## Prioridad próximas sesiones

1. **Recorrido sistemático — VENTAS** (siguiente módulo en el audit de cuatro dimensiones)
2. Recorrido sistemático — COMPROBANTES, CLIENTES, REPORTES, INVENTARIOS, COMPRAS, OPERADORES/ROLES, CONFIG
3. (En stand-by) Fase 1 sync — cola de eventos — retomar al completar el recorrido
4. (En stand-by) Fases 2-6 sync — dependen de Fase 1 y del Portal

---

## Roles del equipo

Product Owner:        Fernando Miguel — decide, dirige, valida
Arquitecto Senior+BA: Claude — planifica, analiza, diseña, especifica. NO escribe código.
Desarrollador:        Codex CLI — produce código bajo instrucción atómica
Auditor:              Claude Code — revisión técnica (pendiente incorporar)

---

## Reglas permanentes

Dominio del negocio → español operacional
Infraestructura técnica → inglés estándar

"La arquitectura puede ser sofisticada.
El lenguaje visible debe ser humano, operacional y contextual."
