# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
recovery/context-restoration

## Microfase actual
TURNO — ACTIVIDAD RECIENTE (continuidad operacional) ✅ VALIDADA

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
- persistencia arqueo previo → botón reimprimir en pre-open ✅
- **ACTIVIDAD RECIENTE** ✅ VALIDADA
  - `src/modules/cash/services/session-history.service.ts` — nuevo service
  - `disateq.pos.sessionHistory` — hasta 50 entradas, persistencia localStorage
  - `disateq.pos.currentSessionId` — pareo apertura/cierre entre renders
  - `recordSessionOpen` llamado en `handleOpen` post-`openCashSession`
  - `recordSessionClose` llamado en `handleConfirmClose` pre-`closeCashSession`
  - señal derivada de `moneyIsZero(diferencia)` → `ok` / `warn`
  - `~ pendiente` si sesión sin cierre registrado (crash/reload)
  - filtro por bloque del operador (`boxCode[0] === operatorBlockPrefix`)
  - worksheet completa en columna derecha pre-apertura
  - layout 3 columnas alineado con turno abierto (320 / 360 / flex-1)
  - empty state: "Sin actividad registrada en este bloque"
  - tabla: CAJA · OPERADOR · APERTURA · CIERRE · ESTADO
  - hasta 20 entradas visibles, scroll si hay más

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
- Cada sub-vista es enfocada y no contiene dominios ajenos
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

## Próximo foco posible
- consolidación documental (docs/philosophy/* actualización si hay deriva)
- VENTAS CAPA 1 (si hay dolor operacional identificado)
- COMPROBANTES integración real (businessRuc, businessAddr, businessPhone desde config)
- push / merge a main

## Flujo operacional objetivo
VENTAS → COMPRAS → INVENTARIOS

## Validaciones obligatorias
- runtime real
- npm run tauri dev
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
