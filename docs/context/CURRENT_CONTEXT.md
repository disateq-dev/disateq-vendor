# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
b44c8db — feat: Core operacional completo

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de **madurez operacional avanzada**.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## Lo que está construido y validado

### Runtime operacional
AppShell · ContextBar · SubContextBar · ModulesBar estabilizados.
Modelo Workspace → SheetWorks como mutación contextual funcionando.

### TURNO / CAJA
Dominio más maduro. Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados. fondoEsperado correcto.

### VENTAS / COBRO — ACTUALIZADO Junio 2026
- Catálogo vivo desde HOV · ya no usa catalogs.ts estático
- Pedido como entidad operacional · reemplaza Ticket doctrinalmente
- Valor resuelto por contexto · ya no precio hardcodeado
- Factor de conversión implementado en HOV
- ClienteBuscador integrado en CobroPanel
- Comprobante emitido desde dominio documents
- Ciclo completo validado en runtime real

### INVENTARIOS CAPA 0+1
ítems · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra:XXXXXXXX → INVENTARIOS · estados automáticos.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.

### AJUSTES
BusinessConfig · OpsConfig · rubro · visualMode · printFlow. Hardcode eliminado.

### LOGIN
Distinción LOGIN vs Runtime Principal formalizada. Drag funcional. Flash eliminado.

---

## Core Operacional — Implementado Junio 2026

### Dominio CATALOG
src/domains/catalog/
├── hov.types.ts                ✅
├── hov.store.ts                ✅
├── hov.service.ts              ✅
├── valor-operacional.types.ts  ✅
├── valor-operacional.store.ts  ✅
├── valor-operacional.service.ts ✅
├── valor-operacional.resolver.ts ✅
├── catalogo.types.ts           ✅
├── catalogo.service.ts         ✅
└── bridge-catalogo.ts          ✅

### Dominio SALES
src/domains/sales/
├── pedido.types.ts             ✅
├── pedido.store.ts             ✅
├── pedido.service.ts           ✅
├── pedido.operations.ts        ✅
└── bridge-pedido.ts            ✅

### Dominio CLIENTS
src/domains/clients/
├── cliente.types.ts            ✅
├── cliente.store.ts            ✅
└── cliente.service.ts          ✅

### Dominio DOCUMENTS
src/domains/documents/
├── comprobante.types.ts        ✅
├── comprobante.store.ts        ✅
├── comprobante.validator.ts    ✅
├── comprobante.service.ts      ✅
└── bridge-comprobante.ts       ✅

### Dominio REPORTS
src/domains/reports/
├── reporte.types.ts            ✅
├── reporte.service.ts          ✅
├── reporte.printer.ts          ✅
└── reporte.exporter.ts         ✅

---

## Decisiones Arquitectónicas Consolidadas

- PEDIDO reemplaza doctrinalmente a Ticket
- HOV es entidad Core · factor de conversión vive en HOV
- El operador selecciona HOV · nunca Producto directamente
- Catálogo es proyección viva · no maestro de datos
- Valor Operacional pertenece al contexto · no al Producto ni a la HOV
- Valor LIBRE opera dentro de rango protegido · nunca por debajo del costo
- Cliente es identidad externa opcional en el Pedido
- Comprobante es consecuencia del Pedido · no parte de él
- Reportes son proyecciones temporales · no almacenan datos
- Producto vive en INVENTARIOS · VENTAS nunca lo toca directamente
- Flujo completo: COMPRAS → INVENTARIOS → HOV → CATÁLOGO → PEDIDO → INVENTARIOS

---

## Brecha estructural principal
ANTES:
VENTAS ──► catálogo estático (catalogs.ts)   ✗
AHORA:
VENTAS ──► CATÁLOGO vivo (HOV + Disponibilidad + Valor)  ✅
VENTAS ──► INVENTARIOS (factor de conversión)            ✅
VENTAS ──► COMPROBANTES (dominio documents)              ✅
VENTAS ──► CLIENTES (ClienteBuscador en CobroPanel)      ✅

---

## Tensiones activas

- POSContext.tsx (~1000 líneas) · boundary difuso · extracción progresiva pendiente
- Capacidades definidas sin enforcement en módulos
- visualMode === "mixto" sin implementación
- Correlativos de despacho sin persistencia

---

## Dominios por estado

### Implementados y validados
- TURNO / CAJA
- FONDO DE CAMBIO
- VENTAS / PEDIDO / COBRO
- INVENTARIOS CAPA 0+1
- COMPRAS CAPA 0+1
- OPERADORES + ROLES
- AJUSTES / CONFIG
- LOGIN
- HOV · CATÁLOGO · VALOR OPERACIONAL
- CLIENTES (dominio + CobroPanel)
- COMPROBANTES
- REPORTES (dominio · sin UI)

### Pendientes de UI
- ClientesWorkspace      → módulo de gestión de clientes
- ComprobantesWorkspace  → historial de documentos
- ReportesWorkspace      → visualización y exportación

### Pendientes estructurales
- Enforcement de capacidades operacionales
- Extracción progresiva POSContext.tsx
- Correlativos de despacho con persistencia
- Alias Operacional en operator.store.ts
- Código Operador en operator.store.ts

### Pendientes futuros
- Facturación electrónica · OSE/PSE
- Sincronización multi-caja
- Módulo de Fidelización
- Integración SUNAT

---

## Posición en el ciclo evolutivo
operación real           ✅ TURNO · FONDO · COBRO · COMPRAS
dolor operacional        ✅ identificado y resuelto
ciclo comercial          ✅ CERRADO y validado en runtime
core operacional         ✅ implementado · 30 archivos
integración UI           ⚠ workspaces pendientes
reconciliación/control   ⚠ capacidades sin enforcement
sofisticación progresiva ⬜
consolidación            ⬜
estabilización           ⬜

---

## Flujo operacional validado
COMPRAS → INVENTARIOS → HOV → CATÁLOGO → PEDIDO → CONCRETADO
│
INVENTARIO descontado
COMPROBANTE emitido
CLIENTE asociado

## Validaciones obligatorias
- runtime real (npm run tauri dev)
- git status limpio
- commits pequeños y frecuentes

## Riesgos a evitar
- ERPización
- complejidad prematura
- duplicación documental
- mezcla de contexto temporal con fundaciones

## Regla UX consolidada
> "La arquitectura puede ser sofisticada.
> El lenguaje visible debe ser humano, operacional y contextual."

## Regla de Oro del Proyecto
> "¿Estamos fortaleciendo el Core Operacional
>  o estamos introduciendo una excepción?"
