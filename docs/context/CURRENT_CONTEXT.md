# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último Commit:** `6b1c2b8` — feat(cash): convertir AutorizacionEjecucionCard a worksheet con reemplazo condicional + badge de trazabilidad de correcciones.

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

## Próxima Ventana de Trabajo (Plan de Acción Inmediato)
1.  **Diseño conceptual pendiente (en frío):** regla de bloqueo operacional —
    impedir operaciones normales (apertura de turno, ventas, etc.) si existen
    autorizaciones supervisoras `emitida`/`ejecutada` sin validar para el
    bloque/operador activo. Con la visibilidad ya resuelta en este ciclo, esta
    pieza pasa de ser un bloqueador funcional a una mejora de gobernanza —
    definir alcance: qué tipos bloquean, a quién, y qué se bloquea.
2.  **Continuar recorrido sistemático:** módulo VENTAS.

---
*Nota del Sistema: Ventana de chat previa saturada. Iniciar sesión limpia leyendo este contexto atómico.*
