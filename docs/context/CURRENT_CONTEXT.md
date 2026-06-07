# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
feat: ClientesWorkspace + fix login operador (estado/campos canónicos)

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de **madurez operacional avanzada con normalización estructural completa**.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## Normalización completada — Junio 2026

| Commit | Tarea | Descripción |
|---|---|---|
| `ef61718` | TAREA 0 | GLOSARIO.md operacional canónico en `docs/00-governance/` |
| — | TAREA 1 | `ticket` → `preventa` en dominios, módulos y componentes |
| `c8ce8ad` | TAREA 2 | `domains/comprobantes/` eliminado — `documents/` es el único modelo |
| `67a00a3` | TAREA 3 | `OperatorRecord` → `Operador`, `RoleRecord` → `Rol`, campos al español |
| `1f5c2c5` | TAREA 4 | `LineaPreVenta` — campos al español |
| `853bacb` | TAREA 5+6 | `TicketLineBridge` eliminada, `generarCodigo()` duplicada unificada |
| `e88cd5d` | TAREA 7 | `0.18` extraído a `BusinessConfig.tasaIGV` |
| `e113312` | TAREA 8 | README de contratos de boundary × 4 dominios |

---

## Fixes aplicados esta sesión

| Archivo | Bug | Fix |
|---|---|---|
| `LoginScreen.tsx` | `o.status === "ACTIVO"` — campo legacy inglés | `o.estado === "ACTIVO"` |
| `LoginScreen.tsx` | `op.operatorCode · op.roleCode` — campos inexistentes | `op.codigoOperador · op.codigoRol` |
| `operator.store.ts` | SEED con `pin: ""` — login imposible | SEED versión `"5"` con `pin: "1234"` |

---

## Lo que está construido y validado

### Runtime operacional
AppShell · ContextBar · SubContextBar · ModulesBar estabilizados.
Modelo Workspace → SheetWorks como mutación contextual funcionando.

### TURNO / CAJA
Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante desde documents · Ciclo completo validado en runtime.

### COMPROBANTES
`ComprobantesWorkspace` completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir a formal · sessionKey formalizado.

### CLIENTES — ENTREGADO esta sesión
- `ClientesWorkspace` completo con dos paneles
- StatsBar: activos · FRECUENTE · CONVENIO · OCASIONAL · suspendidos
- Filtros por estado y tipo · buscador [F2]
- PanelDetalle: identidad · fiscal · canales · condiciones · fidelización
- Acciones: SUSPENDER / REACTIVAR / INACTIVAR con motivo obligatorio
- Formulario de creación inline en panel derecho
- Módulo CLIENTES activado en ModulesBar y SubContextBar
- `getTodos()` agregado a `cliente.store.ts`
- Identidad cromática: `#1e7e4f`

### INVENTARIOS CAPA 0+1
Ítems · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS · estados automáticos.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.
SEED operador: `FTEJADA / 1234` · codigoRol ADMIN · acceso total · versión `"5"`.

### AJUSTES
BusinessConfig (incluye `tasaIGV`) · OpsConfig · rubro · visualMode · printFlow.

### LOGIN
Distinción LOGIN vs Runtime Principal formalizada. Filtro por `o.estado`. Campos canónicos en render.

---

## Core Operacional — Estado actual

### Dominio CLIENTS
src/domains/clients/
├── cliente.types.ts     ✅ tipos canónicos completos
├── cliente.store.ts     ✅ getTodos() agregado esta sesión
└── cliente.service.ts   ✅ crearCliente · suspender · reactivar · inactivar

### Dominio PREVENTA
src/domains/preventa/
├── README-preventa.md              ✅
├── dto/LineaPreVenta.ts            ✅
├── state/preventa.store.ts         ✅
├── state/preventa.actions.ts       ✅
├── selectors/preventa.selectors.ts ✅
├── services/preventa.service.ts    ✅
└── services/preventa-calculation.service.ts ✅

### Dominio SALES
src/domains/sales/
├── README-sales.md      ✅
├── pedido.types.ts      ✅
├── pedido.store.ts      ✅
├── pedido.service.ts    ✅
├── pedido.operations.ts ✅
└── bridge-pedido.ts     ✅

### Dominio DOCUMENTS
src/domains/documents/
├── README-documents.md      ✅
├── comprobante.types.ts     ✅ sessionKey formalizado
├── comprobante.store.ts     ✅
├── comprobante.validator.ts ✅
├── comprobante.service.ts   ✅
└── bridge-comprobante.ts    ✅

### Dominio OPERATOR
src/domains/operator/
├── README-operator.md  ✅
├── operator.store.ts   ✅ SEED v5 · pin 1234 · ADMIN
├── roles.store.ts      ✅
└── blocks.store.ts     ✅

### Otros dominios
src/domains/catalog/   ✅  HOV · ValorOperacional · CatalogoProyectado
src/domains/inventory/ ✅  ItemOperacional · MovimientoOperacional
src/domains/purchases/ ✅  CompraOperacional · LineaCompra
src/domains/reports/   ✅  Reporte (sin UI aún)
src/domains/cash/      ✅  TurnEvent

---

## Glosario canónico — Términos que NO deben cambiar

| Concepto | Término canónico | Tipo TS |
|---|---|---|
| Venta en construcción | `Pedido` | `interface Pedido` |
| Línea de la venta | `LineaPedido` | `interface LineaPedido` |
| Estado visual efímero | `LineaPreVenta` | `interface LineaPreVenta` |
| Documento fiscal | `Comprobante` | `interface Comprobante` |
| Persona que opera | `Operador` | `interface Operador` |
| Rol operacional | `Rol` | `interface Rol` |
| Ítem de inventario | `ItemOperacional` | `interface ItemOperacional` |
| Cliente registrado | `Cliente` | `interface Cliente` |

Ver `docs/00-governance/GLOSARIO.md` para la referencia completa.

---

## Regla de idioma consolidada
Dominio del negocio      →  español operacional
Infraestructura técnica  →  inglés estándar

---

## Tensiones activas

- `POSContext.tsx` (~1000 líneas) · boundary difuso · extracción progresiva pendiente
- Capacidades definidas sin enforcement en módulos
- `visualMode === "mixto"` sin implementación
- Correlativos de despacho sin persistencia
- `_pedidoActivoId` en `preventa.service.ts` — estado mutable de módulo · refactor futuro
- `refreshNonce` en workspaces — temporal hasta que stores sean reactivos

---

## Dominios por estado

### Implementados, validados y normalizados
- TURNO / CAJA
- FONDO DE CAMBIO
- VENTAS / PEDIDO / COBRO
- INVENTARIOS CAPA 0+1
- COMPRAS CAPA 0+1
- OPERADORES + ROLES
- AJUSTES / CONFIG
- LOGIN
- HOV · CATÁLOGO · VALOR OPERACIONAL
- CLIENTES (dominio + CobroPanel + ClientesWorkspace ✅)
- COMPROBANTES (documents/ + ComprobantesWorkspace ✅)
- PREVENTA (normalizado desde ticket)

### Pendientes de UI — próxima sesión
- `ReportesWorkspace` → dominio completo, solo falta la pantalla ← **SIGUIENTE**

### Pendientes estructurales
- Enforcement de capacidades operacionales
- Extracción progresiva `POSContext.tsx`
- Correlativos de despacho con persistencia

### Pendientes futuros
- Facturación electrónica · OSE/PSE
- Sincronización multi-caja
- Módulo de Fidelización
- Integración SUNAT

---

## Prioridad acordada para próximas sesiones

ReportesWorkspace        ← SIGUIENTE · dominio listo · solo UI
Enforcement capacidades  ← cierra ciclo de seguridad
Extracción POSContext    ← deuda técnica
Correlativos despacho    ← integridad futura


---

## Flujo operacional validado
COMPRAS → INVENTARIOS → HOV → CATÁLOGO → PEDIDO → CONCRETADO
│
INVENTARIO descontado
COMPROBANTE emitido
CLIENTE asociado
HISTORIAL consultable

---

## Posición en el ciclo evolutivo
operación real            ✅ TURNO · FONDO · COBRO · COMPRAS
dolor operacional         ✅ identificado y resuelto
ciclo comercial           ✅ CERRADO y validado en runtime
core operacional          ✅ implementado y normalizado
normalización estructural ✅ TAREAS 0–8 completadas
integración UI            ⚠  ReportesWorkspace pendiente
reconciliación/control    ⚠  capacidades sin enforcement
sofisticación progresiva  ⬜
consolidación             ⬜
estabilización            ⬜

---

## Equipo y roles

| Rol | Quién | Responsabilidad |
|---|---|---|
| Product Owner | Fernando Miguel | Decide, dirige, verifica y valida todo |
| Arquitecto Senior + BA | Claude | Planifica, analiza, diseña, especifica |
| Desarrollador Atómico | Codex CLI | Recibe instrucciones y produce código |
| Auditor | Claude Code | Revisión técnica *(pendiente de incorporar)* |

---

## Validaciones obligatorias
- runtime real (`npm run tauri dev`)
- `git status` limpio
- commits pequeños y frecuentes
- respetar términos del GLOSARIO.md

## Riesgos a evitar
- ERPización · complejidad prematura · duplicación documental
- mezcla de contexto temporal con fundaciones
- reintroducir términos en inglés para conceptos de negocio

## Regla UX consolidada
> "La arquitectura puede ser sofisticada.
> El lenguaje visible debe ser humano, operacional y contextual."

## Regla de Oro del Proyecto
> "¿Estamos fortaleciendo el Core Operacional
>  o estamos introduciendo una excepción?"
