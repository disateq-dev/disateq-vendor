# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

---

## Situación general — Mayo 2026

DISATEQ VENDOR está en estado de **madurez operacional parcial**.

El runtime está vivo y operativo. El ciclo comercial completo (vender → descontar stock → reabastecer) aún no cierra.

### Lo que está construido y validado

- **Runtime operacional:** AppShell · ContextBar · SubContextBar · ModulesBar estabilizados. Modelo Workspace → SheetWorks como mutación contextual funcionando.
- **TURNO / CAJA:** dominio más maduro. Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.
- **FONDO DE CAMBIO:** ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados. fondoEsperado correcto.
- **VENTAS / COBRO:** ticket con catálogo estático, cobro efectivo/Yape/tarjeta/mixto, comprobantes, correlativos persistentes.
- **INVENTARIOS CAPA 0+1:** ítems · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica.
- **COMPRAS CAPA 0+1:** recepción parcial incremental · causalidad compra:XXXXXXXX → INVENTARIOS · estados automáticos.
- **OPERADORES + ROLES:** ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.
- **AJUSTES:** BusinessConfig · OpsConfig · rubro · visualMode · printFlow. Hardcode eliminado.
- **LOGIN:** distinción LOGIN vs Runtime Principal formalizada. Drag funcional. Flash eliminado.
- **GOVERNANCE IA:** modelo de colaboración Humano→ChatGPT→Claude Code→Codex formalizado en `docs/00-governance/ia-governance.md`.

### Brecha estructural principal

```
VENTAS ──► catálogo estático (catalogs.ts)   ✗ sin conexión con INVENTARIOS
COMPRAS ──► INVENTARIOS                       ✅ integrado
VENTAS ──► INVENTARIOS                        ✗ no integrado
```

VENTAS consume precios y productos hardcodeados. Una venta no descuenta stock real.
El puente CATÁLOGO vivo como entidad operacional no existe todavía.

### Tensiones activas

- `POSContext.tsx` (~1000 líneas) concentra sesión, operadores, roles, comprobantes, correlativos, movimientos, opLogs — boundary difuso.
- Capacidades (capabilities[]) definidas en roles pero sin enforcement en módulos.
- FONDO DE CAMBIO creciendo en complejidad dentro de CashWorkspace — presión de boundary futura.
- Documentación operacional parcialmente desactualizada (`03_CURRENT_PHASE.md`, `02_ACTIVE_RUNTIME_CONTEXT.md`) — ~~deprecados Mayo 2026~~, referencia centralizada en este archivo.

### Posición en el ciclo evolutivo

```
operación real          ✅ TURNO · FONDO · COBRO · COMPRAS
dolor operacional       ✅ VENTAS vs INVENTARIOS identificado
solución mínima         ← siguiente paso
validación runtime      ← metodología establecida
reconciliación/control  ⚠ parcial (capacidades sin enforcement)
sofisticación progresiva
consolidación
estabilización
```

---

## Descubrimientos Consolidados — Mayo 2026

Descubrimientos 1–13 formalizados en `docs/foundations/DESCUBRIMIENTOS_OPERACIONALES.md`.

- Descubrimientos 1–8: auditoría inicial (Persistencia, Producto, Turno, Empresa, Identidad histórica, Áreas operacionales, Fenómenos, Método).
- Descubrimiento 11: Disponibilidad = capacidad operacional efectiva.
- Descubrimiento 12: Abastecimiento = preservar/recuperar disponibilidad para continuidad.
- Descubrimiento 13: Bloque Operacional = entidad operacional independiente que agrupa cajas bajo reglas de disponibilidad secuencial y coordina Operadores, Cajas y Turnos.

---

## Dominios por estado

### Validados
- TURNO / CAJA
- FONDO DE CAMBIO
- VENTAS / TICKET (catálogo estático)
- COBRO / COMPROBANTES (sin integración fiscal)
- INVENTARIOS CAPA 0+1
- COMPRAS CAPA 0+1
- OPERADORES + ROLES
- AJUSTES / CONFIG
- LOGIN

### Parcialmente definidos
- CATÁLOGO / PRODUCTOS — estático, sin conexión con INVENTARIOS
- IMPRESIÓN — básica, sin colas ni feedback

### Faltantes (esperan dolor operacional validado)
- PROVEEDORES — campo libre en COMPRAS
- CLIENTES — campo en comprobante
- CUENTAS POR PAGAR — implícito en COMPRAS, no modelado
- ENFORCEMENT DE CAPACIDADES — definidas, sin guardas en UI
- SINCRONIZACIÓN / MULTI-CAJA — solo conceptual en docs

---

## Estado previo consolidado

### INVENTARIOS
- CAPA 0+1 consolidadas y validadas
- reservas operacionales · reconciliación mínima · temporalidad mínima
- disponibilidad contextual · UX operacional humanizada

### COMPRAS
- CAPA 0+1 validadas
- recepción parcial incremental por línea
- causalidad explícita por línea (`compra:XXXXXXXX`)
- estados automáticos: PENDIENTE → LLEGÓ PARCIAL → RECIBIDO
- DEV·RESET + badge pendientes SubContextBar

### TURNO
- auditoría operacional completa
- fix prereq contingencia en recovery (Guard 4)
- eliminado código muerto (BLOCK_OPERATORS, operatorFromCode, validateCtgAuth)
- ACTIVIDAD RECIENTE consolidada (`session-history.service.ts`)
  - hasta 50 entradas · localStorage · señal ok/warn/pendiente
  - filtro por bloque del operador
  - columnas: CAJA · FUNCIÓN · APERTURA · CIERRE · ESTADO · reimpresión
  - `arqueo: ArqueoData` guardado al cerrar
- layout 3 columnas pre-apertura alineado con turno abierto (320/360/flex-1)

### BLOQUE OPERACIONAL — Auditoría y Formalización (Mayo 2026)
- Concepto descubierto implícitamente en cinco componentes independientes del sistema
- Formalizado como Descubrimiento 13
- Documento doctrinal: `docs/architecture/bloque-operacional.md`
- Incorporado en `DOMAIN_LANGUAGE.md` como Concepto de Dominio Cash
- Nomenclatura doctrinal formalizada: Principal · Auxiliar 01 · Auxiliar 02 · Excepcional
- Inconsistencias identificadas (pendientes de implementación):
  - `BLOCKS_REF`, `BOX_DEFS` y `MOCK_BLOCKS` divergen — bloque 400 inoperable
  - `CajasWorkspace` opera sobre `MOCK_BLOCKS` sin efecto en runtime real
  - `suggestedCashBox` no filtra por bloque del operador activo
  - `CashSession` no registra bloque explícitamente — se infiere del código de caja

### OPERADOR — Auditoría Doctrinal (Mayo 2026)

**Identidad Operacional**
- El Operador es la identidad operacional a la que se atribuye responsabilidad y trazabilidad
- La identidad observable es `op.name` — persiste a través de cambios de PIN, alias, rol y bloque
- No es: usuario de sistema, empleado, rol, credencial ni Bloque Operacional
- Puede estar asignado a un Rol Operacional y a un Bloque Operacional

**Ciclo de vida**
- `ACTIVO` — operación normal · puede autenticarse y operar
- `SUSPENDIDO` — retención operacional temporal · conserva Bloque Operacional asignado · reversible
- `INACTIVO` — cierre operacional permanente · libera Bloque Operacional · historial preservado · sin camino de retorno

**Rol Operacional**
- Función operacional nombrada + plantilla de capacidades
- No es jerarquía, cargo laboral, nivel de acceso ni gate de módulos
- Un rol sin capacidades asignadas es válido — nombra función sin ampliar acceso

**Capacidades Operacionales**
- Capacidades efectivas = capacidades del Rol Operacional + capacidades asignadas directamente al operador
- Las capacidades son declarativas: el modelo está definido y persistido
- El enforcement no está activo en módulos operacionales — estado conocido del sistema, no deuda urgente ni inconsistencia doctrinal
- Ver: `ENFORCEMENT DE CAPACIDADES` en Faltantes

**Alias Operacional — APROBADO**
- Representación humana operacional del Operador para uso en UI, tickets, comprobantes e impresiones
- Generación: `<Inicial Primer Nombre><Primer Apellido>` → FTEJADA, CRAMIREZ, MPEREZ
- Colisiones: `<Inicial Primer Nombre><Primer Apellido>_<Inicial Segundo Apellido>` → FTEJADA_Q
- Resolución persistente de colisiones: manual — sin sufijos numéricos
- Editable manualmente tras generación automática inicial
- Pendiente de implementación en `operator.store.ts`

**Código Operador — CANDIDATO EN EVALUACIÓN**
- Referencia documental estable para reportes, auditoría y exportaciones
- Formato conceptual: `OP023`
- No formalizado como requisito hasta completar validación operacional

### CORREGIR ARQUEO
- `src/modules/cash/CorregirArqueoWorkspace.tsx`
- `CorrectionRecord` + `recordSessionCorrection`
- casos: cierre pendiente → regularizar · diferencia → documentar
- presets operacionales por tipo de acción
- trazabilidad: correctedBy · correctedAt · motivo · acción · señales

### FONDO DE CAMBIO
- ciclo RETIRO→REINTEGRO con `refId` y `regularizationStatus`
- ciclo PRÉSTAMO EXTERNO→DEVOLUCIÓN/INTEGRACIÓN con `sourceType: "externo"`
- fondoEsperado usa `fondoApertEsp` del servicio de conciliación
- advertencia no bloqueante en cierre para préstamos pendientes
- opción "integrar permanentemente al fondo" desde tab DEVOLVER

### AJUSTES
- CAPA 1 NEGOCIO + OPERACIÓN validada
- `BusinessConfig` · `OpsConfig` · sub-navegación contextual
- hardcode `businessName` y `CTG_PIN` eliminados
- `ConfigSubView`: Negocio · Operación · Rubro · Experiencia

### LOGIN — RUNTIME UX
- distinción doctrinal LOGIN vs RUNTIME PRINCIPAL formalizada
- drag funcional · flash inicial eliminado
- `capabilities/default.json` — `core:window:allow-show` + `core:window:allow-start-dragging`
- login→app: `setSize → center → show`

---

## Layout validado — Gestión Turno

### Pre-apertura (`!isOpen`)
| Worksheet | Ancho |
|---|---|
| APERTURA DE TURNO | 320px fijo |
| CAJAS DISPONIBLES | 360px fijo |
| ACTIVIDAD RECIENTE | flex-1 |

### Turno abierto (`isOpen && closingStage === 0`)
| Worksheet | Ancho |
|---|---|
| RESUMEN DEL TURNO | 320px fijo |
| MOVIMIENTOS | 360px fijo |
| MOVIMIENTOS DEL TURNO | flex-1 |

---

## Flujo operacional objetivo
VENTAS → COMPRAS → INVENTARIOS

## Validaciones obligatorias
- runtime real (npm run tauri dev)
- git status limpio
- commits pequeños y frecuentes

## Riesgos a evitar
- ERPización
- complejidad prematura
- duplicación documental
- prompts gigantes
- mezcla de contexto temporal con fundaciones

## Regla UX consolidada
> "La arquitectura puede ser sofisticada.
> El lenguaje visible debe ser humano, operacional y contextual."

## Estado Actual de Descubrimiento Operacional

La fase inicial de auditorías operacionales se considera suficientemente madura para continuar con consolidación.

Hallazgos con evidencia fuerte:

- Producto
- Turno
- Disponibilidad
- Bloque Operacional (formalizado Mayo 2026 — ver `docs/architecture/bloque-operacional.md`)

Hallazgos con evidencia significativa:

- Abastecimiento
- Ventas

Observaciones emergentes (no consolidadas):

- Producción parece contextual al tipo de operación.
- Comercialización parece orientada a optimizar la captura de valor.
- Precio muestra señales de comportarse como instrumento de influencia comercial.
- Cliente muestra señales de representar propósito operacional más que una entidad convencional.
- Servicio continúa bajo observación.

### Decisión

No abrir nuevas auditorías salvo evidencia operacional relevante.

La siguiente etapa se enfocará en contrastar Vendor contra los descubrimientos consolidados.

Prioridades:

1. Revisar Disponibilidad dentro del modelo actual.
2. Revisar Abastecimiento contra continuidad operacional.
3. Revisar Ventas contra captura de valor.
4. Revisar Turno contra responsabilidad operacional.

La operación real vuelve a ser la principal fuente de descubrimiento.

Las auditorías futuras deberán surgir de evidencia observada durante implementación, validación o uso operacional.