# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
5991982 — feat: ComprobantesWorkspace completo

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de **madurez operacional avanzada con normalización estructural completa**.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

La normalización terminológica y estructural (TAREAS 0–8) fue completada en sesión anterior.
`ComprobantesWorkspace` entregado y validado en esta sesión.

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

## Lo que está construido y validado

### Runtime operacional
AppShell · ContextBar · SubContextBar · ModulesBar estabilizados.
Modelo Workspace → SheetWorks como mutación contextual funcionando.

### TURNO / CAJA
Dominio más maduro. Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados. fondoEsperado correcto.

### VENTAS / COBRO
- Catálogo vivo desde HOV · ya no usa catalogs.ts estático
- Pedido como entidad operacional · reemplaza Ticket doctrinalmente
- Valor resuelto por contexto · ya no precio hardcodeado
- Factor de conversión implementado en HOV
- ClienteBuscador integrado en CobroPanel
- Comprobante emitido desde dominio documents
- Ciclo completo validado en runtime real

### COMPROBANTES — ENTREGADO Junio 2026
- `ComprobantesWorkspace` completo con dos paneles
- Vista Sesión / Historial con filtrado por `sessionKey`
- `StatsBar`: total vendido, EFE, YAP, TAR, anulados
- Filtros por tipo (NOTA/BOL/FAC/COT) y estado (EMITIDO/ANULADO/REFERENCIADO)
- `PanelDetalle` con emisor, receptor, líneas, totales tributarios (base + IGV + total)
- Acción anular con motivo obligatorio
- Acción convertir a formal (TIQUE/COTIZACION → BOLETA/FACTURA)
- `sessionKey` formalizado en `Comprobante` (campo canónico, sin cast)
- `refreshNonce` como mecanismo de recarga post-conversión

### INVENTARIOS CAPA 0+1
ítems · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra:XXXXXXXX → INVENTARIOS · estados automáticos.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.

### AJUSTES
BusinessConfig (incluye `tasaIGV`) · OpsConfig · rubro · visualMode · printFlow.

### LOGIN
Distinción LOGIN vs Runtime Principal formalizada. Drag funcional. Flash eliminado.

---

## Core Operacional — Estado actual

### Dominio PREVENTA
```
src/domains/preventa/
├── README-preventa.md              ✅
├── dto/LineaPreVenta.ts            ✅ campos canónicos en español
├── state/preventa.store.ts         ✅ usePreVentaStore · EstadoPreVenta
├── state/preventa.actions.ts       ✅ crearLineaPreVenta
├── selectors/preventa.selectors.ts ✅ useLineasPreVenta
├── services/preventa.service.ts    ✅ preVentaService
└── services/preventa-calculation.service.ts ✅ calcularTotalesPreVenta(lineas, tasaIGV)
```

### Dominio SALES
```
src/domains/sales/
├── README-sales.md          ✅
├── pedido.types.ts          ✅
├── pedido.store.ts          ✅
├── pedido.service.ts        ✅ generarCodigo() — fuente única
├── pedido.operations.ts     ✅
└── bridge-pedido.ts         ✅ solo traducción
```

### Dominio DOCUMENTS
```
src/domains/documents/
├── README-documents.md      ✅
├── comprobante.types.ts     ✅ sessionKey formalizado
├── comprobante.store.ts     ✅
├── comprobante.validator.ts ✅
├── comprobante.service.ts   ✅ convertirAFormal integrado en workspace
└── bridge-comprobante.ts    ✅
```

### Dominio OPERATOR
```
src/domains/operator/
├── README-operator.md       ✅
├── operator.store.ts        ✅ Operador · EstadoOperador · AsignacionBloque
├── roles.store.ts           ✅ Rol · campos en español
└── blocks.store.ts          ✅
```

### Otros dominios
```
src/domains/catalog/   ✅  HOV · ValorOperacional · CatalogoProyectado
src/domains/clients/   ✅  Cliente · IdentificacionFiscal
src/domains/inventory/ ✅  ItemOperacional · MovimientoOperacional
src/domains/purchases/ ✅  CompraOperacional · LineaCompra
src/domains/reports/   ✅  Reporte (sin UI)
src/domains/cash/      ✅  TurnEvent
```

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

Ver `docs/00-governance/GLOSARIO.md` para la referencia completa.

---

## Regla de idioma consolidada

```
Dominio del negocio      →  español operacional
Infraestructura técnica  →  inglés estándar
```

---

## Tensiones activas

- `POSContext.tsx` (~1000 líneas) · boundary difuso · extracción progresiva pendiente
- Capacidades definidas sin enforcement en módulos
- `visualMode === "mixto"` sin implementación
- Correlativos de despacho sin persistencia
- `_pedidoActivoId` en `preventa.service.ts` — estado mutable de módulo · refactor futuro
- `refreshNonce` en `ComprobantesWorkspace` — temporal hasta que `convertirAFormal` sea reactiva via `POSContext`

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
- CLIENTES (dominio + CobroPanel)
- COMPROBANTES (documents/ + ComprobantesWorkspace ✅)
- PREVENTA (normalizado desde ticket)

### Pendientes de UI
- `ClientesWorkspace`  → módulo de gestión de clientes
- `ReportesWorkspace`  → visualización y exportación

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

## Flujo operacional validado
```
COMPRAS → INVENTARIOS → HOV → CATÁLOGO → PEDIDO → CONCRETADO
                                                        │
                                              INVENTARIO descontado
                                              COMPROBANTE emitido
                                              CLIENTE asociado
                                              HISTORIAL consultable
```

---

## Posición en el ciclo evolutivo

```
operación real            ✅ TURNO · FONDO · COBRO · COMPRAS
dolor operacional         ✅ identificado y resuelto
ciclo comercial           ✅ CERRADO y validado en runtime
core operacional          ✅ implementado y normalizado
normalización estructural ✅ TAREAS 0–8 completadas
integración UI            ⚠  ClientesWorkspace · ReportesWorkspace pendientes
reconciliación/control    ⚠  capacidades sin enforcement
sofisticación progresiva  ⬜
consolidación             ⬜
estabilización            ⬜
```

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
