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
- **OPERADORES + ROLES:** ciclo de vida completo · PIN · bloques · capacidades · roles configurables.
- **AJUSTES:** BusinessConfig · OpsConfig · rubro · visualMode · printFlow. Hardcode eliminado.
- **LOGIN:** distinción LOGIN vs Runtime Principal formalizada. Drag funcional. Flash eliminado.

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
- Documentación operacional parcialmente desactualizada (`03_CURRENT_PHASE.md`, `02_ACTIVE_RUNTIME_CONTEXT.md`).

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

- Principio de Persistencia Operacional validado.
- Producto sobrevivió auditoría operacional.
- Turno sobrevivió auditoría operacional.
- Empresa observada como convergencia de identidades — no asumir como realidad operacional simple.
- Identidad histórica validada como requisito de trazabilidad.
- Áreas operacionales identificadas como contextuales al rubro — no universalizables.
- Fenómenos operacionales muestran mayor universalidad que estructuras.
- Método DISATEQ de Descubrimiento Operacional formalizado.

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
