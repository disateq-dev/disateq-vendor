# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
recovery/context-restoration

## Microfase actual
AJUSTES CAPA 1 — UX sub-navegación contextual ✅ VALIDADA

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
