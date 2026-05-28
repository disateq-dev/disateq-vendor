# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Microfase actual
TURNO — ACTIVIDAD RECIENTE ✅ VALIDADA Y CONSOLIDADA

## Estado validado

### INVENTARIOS
- CAPA 0+1 consolidadas y validadas
- reservas operacionales
- reconciliación mínima
- temporalidad mínima
- disponibilidad contextual
- UX operacional humanizada
- identidad visual contextual validada

### COMPRAS
- CAPA 0 mínima operativa ✅
- CAPA 1 recepción parcial incremental ✅ VALIDADA
- integración COMPRAS ↔ INVENTARIOS operacional
- causalidad explícita por línea (`compra:XXXXXXXX`)
- estados automáticos: PENDIENTE → LLEGÓ PARCIAL → RECIBIDO
- UX operacional humanizada
- identidad visual contextual aplicada
- DEV·RESET + badge pendientes SubContextBar

### TURNO
- auditoría operacional completa ✅
- fix prereq contingencia en recovery (Guard 4)
- fix nombre operador en pre-open card (real vs hardcoded)
- eliminado código muerto (BLOCK_OPERATORS, operatorFromCode, validateCtgAuth)
- **ACTIVIDAD RECIENTE** ✅ CONSOLIDADA
  - `src/modules/cash/services/session-history.service.ts`
  - `disateq.pos.sessionHistory` — hasta 50 entradas, localStorage
  - `disateq.pos.currentSessionId` — pareo apertura/cierre
  - señal: `ok` (diferencia cero) · `warn` (diferencia) · `~ pendiente` (crash)
  - filtro por bloque del operador (`boxCode[0] === operatorBlockPrefix`)
  - columnas: CAJA · FUNCIÓN · APERTURA · CIERRE · ESTADO · (reimpresión)
  - FUNCIÓN = "PRINCIPAL" / "SECUNDARIA 01" / "SECUNDARIA 02" / "CONTINGENCIA"
  - botón reimpresión por fila — usa `e.arqueo` con fallback a `lastArqueo`
  - `arqueo: ArqueoData` guardado en entry al cerrar sesión
  - headers sin indicador de bloque numérico
  - botón "Reimprimir arqueo anterior" eliminado del panel izquierdo
  - layout 3 columnas pre-apertura alineado con turno abierto (320/360/flex-1)
  - empty state: "Sin actividad registrada en este bloque"

### AJUSTES
- CAPA 1 NEGOCIO + OPERACIÓN ✅ VALIDADA
- UX sub-navegación contextual ✅ VALIDADA
- `src/config/business.ts` — BusinessConfig persistida en `disateq.config.business`
- `src/config/ops.ts` — OpsConfig persistida en `disateq.config.ops`
- hardcode `businessName` eliminado de CashWorkspace y CobroPanel
- hardcode `CTG_PIN = "1234"` eliminado de cash-rules.service
- `canOpenSession` recibe `expectedCtgPin` como parámetro runtime
- `ModulesBar` — "CONFIG" → "AJUSTES"
- `ConfigSubView` — 4 sub-vistas: Negocio · Operación · Rubro · Experiencia
- Sub-navegación en SubContextBar (mismo patrón TURNO/ABASTECIMIENTO)
- Botón "Aplicar" (operacional) en lugar de "Guardar" (CRUD)

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

## Branching
- `main` es la rama canónica desde 2026-05-28
- `recovery/context-restoration` archivada en remote como referencia histórica

## Próximo foco posible
- VENTAS CAPA 1 (si hay dolor operacional identificado)
- COMPROBANTES integración real (businessRuc, businessAddr, businessPhone desde config)
- consolidación documental (docs/philosophy/* si hay deriva)

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
"La arquitectura puede ser sofisticada.
El lenguaje visible debe ser humano, operacional y contextual."
