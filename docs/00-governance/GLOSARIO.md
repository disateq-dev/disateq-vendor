# GLOSARIO OPERACIONAL CANÓNICO

## DISATEQ Vendor™

### Estado del Documento

Documento de autoridad permanente.
Aprobado por: Director de Producto — Junio 2026.

---

## Propósito

Este documento define el **término único y canónico** para cada concepto operacional del sistema.

Todo el codebase — tipos, interfaces, funciones, variables, componentes, directorios y documentación — debe usar exactamente los términos aquí definidos, en todas las capas, sin excepción.

Un equipo nuevo que lea este glosario debe poder navegar el código sin necesidad de traducción mental.

---

## Regla de Oro del Idioma

```
Dominio del negocio   →  español operacional
Infraestructura técnica  →  inglés estándar
```

**Español operacional:** tipos, interfaces, funciones, métodos, variables y componentes que representen conceptos del negocio.

**Inglés estándar:** palabras reservadas del lenguaje, APIs de librerías externas, patrones de infraestructura (`useState`, `localStorage`, `Promise`, `Record<K,V>`, `index.ts`).

No se requieren comentarios que traduzcan términos. El término correcto en el lugar correcto es su propia documentación.

---

## 1. Entidades Principales

### Pedido

**Qué es:** la venta en construcción desde que el operador agrega el primer producto hasta que se concreta o abandona.

**Término canónico:** `Pedido`

**Tipo TypeScript:** `interface Pedido`

**Reemplaza definitivamente:** `Ticket`, `SaleOrder`, `PreVenta`, `sale`, `order`

**Ubicación canónica:** `domains/sales/pedido.types.ts`

---

### LineaPedido

**Qué es:** cada producto individual dentro de un Pedido, con su cantidad, valor aplicado y trazabilidad.

**Término canónico:** `LineaPedido`

**Tipo TypeScript:** `interface LineaPedido`

**Reemplaza definitivamente:** `TicketLineDTO`, `TicketLineBridge`, `OrderLine`, `line`, `lines`, `item`

**Ubicación canónica:** `domains/sales/pedido.types.ts`

---

### EstadoPedido

**Qué es:** el ciclo de vida operacional de un Pedido.

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `ABIERTO` | El operador está agregando productos |
| `CONFIRMADO` | El pedido fue revisado y confirmado |
| `EN_COBRO` | Se inició el proceso de cobro |
| `CONCRETADO` | La venta fue completada exitosamente |
| `ABANDONADO` | La venta fue cancelada con motivo registrado |

**Reemplaza definitivamente:** cualquier estado en inglés (`open`, `confirmed`, `completed`, `cancelled`)

---

### Comprobante

**Qué es:** el documento fiscal emitido como consecuencia de un Pedido concretado (Nota de Venta, Boleta, Factura, Cotización).

**Término canónico:** `Comprobante`

**Tipo TypeScript:** `interface Comprobante`

**Reemplaza definitivamente:** el modelo duplicado en `domains/comprobantes/types/comprobante.types.ts` — ese directorio será eliminado. El modelo canónico y único vive en `domains/documents/comprobante.types.ts`.

**Ubicación canónica:** `domains/documents/comprobante.types.ts`

---

### LineaComprobante

**Qué es:** cada línea de producto dentro de un Comprobante emitido.

**Término canónico:** `LineaComprobante`

**Tipo TypeScript:** `interface LineaComprobante`

**Reemplaza definitivamente:** `ComprobanteLineItem`

**Ubicación canónica:** `domains/documents/comprobante.types.ts`

---

### EstadoComprobante

**Qué es:** el ciclo de vida operacional y tributario de un Comprobante.

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `EMITIDO` | Documento generado y válido |
| `REFERENCIADO` | Documento convertido a uno formal (ej. Tique → Boleta) |
| `ANULADO` | Documento anulado con motivo registrado |

**Reemplaza definitivamente:** `active`, `cancelled`, `status: "active" | "cancelled"`

---

### Operador

**Qué es:** la persona que usa el sistema durante una sesión operacional.

**Término canónico:** `Operador`

**Tipo TypeScript:** `interface Operador`

**Reemplaza definitivamente:** `OperatorRecord`, `operator` (como tipo de negocio), `emitidoPor` (se reemplaza por `operadorId` o `operador`)

**Ubicación canónica:** `domains/operator/operador.types.ts` (a crear durante normalización)

**Nota:** `OperatorRecord` era el nombre de implementación antes de este glosario. El tipo de negocio se llamará `Operador`. Los campos que antes decían `operator` en contexto de negocio pasarán a decir `operador` o `operadorId`.

---

### EstadoOperador

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `ACTIVO` | Puede operar el sistema |
| `SUSPENDIDO` | Bloqueado temporalmente con motivo |
| `INACTIVO` | Dado de baja del sistema |

**Ya correcto en `operator.store.ts` — se mantiene.**

---

### ItemOperacional

**Qué es:** un producto físico registrado en el sistema de inventario, identificado por su `itemId`.

**Término canónico:** `ItemOperacional`

**Tipo TypeScript:** `interface ItemOperacional`

**Reemplaza definitivamente:** el uso de `productId` cuando la referencia apunta a un ítem de inventario (no a una HOV). La distinción es: `hovId` referencia una HOV; `itemId` referencia un ítem de inventario.

**Ubicación canónica:** `domains/inventory/types.ts` — ya correcto, se mantiene.

---

### EstadoDisponibilidad

**Estados canónicos:** elevados a mayúsculas para consistencia con el resto del sistema.

| Estado | Significado operacional |
|---|---|
| `DISPONIBLE` | Stock suficiente para operar |
| `BAJO_STOCK` | Por debajo del umbral mínimo configurado |
| `AGOTADO` | Sin existencia disponible |

**Reemplaza definitivamente:** `disponible`, `bajo_stock`, `agotado` (minúsculas)

---

## 2. Directorio Canónico de Dominios

```
domains/
├── sales/          ← Pedido · LineaPedido · concreción
├── preventa/       ← Estado visual efímero (antes: ticket/)
├── catalog/        ← HOV · ValorOperacional · CatalogoProyectado
├── documents/      ← Comprobante · LineaComprobante (ÚNICO — comprobantes/ eliminado)
├── inventory/      ← ItemOperacional · MovimientoOperacional · Reserva
├── purchases/      ← CompraOperacional · LineaCompra
├── clients/        ← Cliente · IdentificacionFiscal
├── operator/       ← Operador (antes: OperatorRecord)
├── cash/           ← TurnEvent (turno y caja)
└── reports/        ← Reporte (proyecciones — sin persistencia)
```

---

## 3. Directorio Canónico de Módulos (UI)

```
modules/
├── preventa/       ← PreVentaGrid · CobroPanel (antes: ticket/)
├── sales/          ← SalesWorkspace · ClienteBuscador · PresentacionSheet
├── comprobantes/   ← ComprobantesWorkspace (conectado a domains/documents/)
├── inventory/      ← InventoryWorkspace
├── purchases/      ← PurchasesWorkspace
├── cash/           ← CashWorkspace
├── config/         ← ConfigWorkspace · CapacidadesWorkspace · RolesWorkspace
└── login/          ← LoginWorkspace
```

---

## 4. Convención de Nombres de Funciones

Todo método o función que opere sobre una entidad de negocio sigue la forma:

```
verboOperacional + Entidad
```

### Verbos canónicos aprobados

| Verbo | Uso | Ejemplo |
|---|---|---|
| `crear` | Instanciar una entidad nueva | `crearPedido()` |
| `agregar` | Añadir un elemento a una colección | `agregarLinea()` |
| `modificar` | Cambiar un campo de una entidad existente | `modificarCantidad()` |
| `confirmar` | Avanzar el estado a CONFIRMADO | `confirmarPedido()` |
| `concretar` | Completar la operación exitosamente | `concretarPedido()` |
| `abandonar` | Cancelar con motivo registrado | `abandonarPedido()` |
| `anular` | Invalidar un documento emitido | `anularComprobante()` |
| `emitir` | Generar un documento formal | `emitirComprobante()` |
| `registrar` | Persistir un evento o movimiento | `registrarEntrada()` |
| `resolver` | Calcular o derivar un valor | `resolverValor()` |
| `cargar` | Leer desde persistencia | `cargarOperadores()` |
| `guardar` | Escribir en persistencia | `guardarPedido()` |
| `traducir` | Convertir entre tipos de capas distintas | `traducirALineaPedido()` |

**Reemplaza definitivamente:** `addProduct()`, `addLine()`, `confirmEmit()`, `voidComprobante()`, `loadOperators()`, `saveOperators()`

---

## 5. Convención de Campos de Referencia

Cuando un tipo hace referencia a otra entidad, el campo lleva el sufijo del tipo referenciado:

```typescript
// ✅ Correcto
pedidoId: string         // referencia a Pedido
hovId: string            // referencia a HOV
itemId: string           // referencia a ItemOperacional
operadorId: string       // referencia a Operador
comprobanteId: string    // referencia a Comprobante

// ❌ Incorrecto
productId: string        // ambiguo — ¿HOV o ítem?
operator: string         // campo de negocio en inglés
emitidoPor: string       // mezcla de idiomas (emitido=español, por=preposición, valor=string id)
```

---

## 6. Convención de Storage Keys

Todas las claves de `localStorage` siguen el patrón:

```
disateq:{dominio}:{entidad}
```

| Clave canónica | Reemplaza |
|---|---|
| `disateq:sales:pedidos` | ya correcto |
| `disateq:documents:comprobantes` | ya correcto |
| `disateq:inventory:items` | ya correcto |
| `disateq:preventa:estado` | `disateq:ticket:*` (si existiera) |
| `disateq:operators` | `disateq.pos.operators` (punto → dos puntos) |

---

## 7. Separación PreVenta / Pedido

Esta es la distinción arquitectónica más importante del sistema. Un equipo nuevo debe entenderla desde el primer día.

```
PreVenta (domains/preventa/)
────────────────────────────
Naturaleza:   estado visual efímero
Persistencia: memoria RAM (Zustand)
Ciclo de vida: dura mientras el operador arma la venta en pantalla
Responsabilidad: renderizado inmediato, feedback visual, UX de cobro
Tipos clave:  LineaPreVenta (antes TicketLineDTO)

Pedido (domains/sales/)
────────────────────────
Naturaleza:   registro operacional persistente
Persistencia: localStorage → sincronización futura
Ciclo de vida: ABIERTO → CONCRETADO / ABANDONADO
Responsabilidad: trazabilidad, descuento de inventario, base del comprobante
Tipos clave:  Pedido, LineaPedido, EventoPedido
```

**La PreVenta alimenta visualmente al operador.**
**El Pedido registra operacionalmente la venta.**
**Son dos capas del mismo flujo, no dos implementaciones del mismo concepto.**

---

## 8. Tabla de Conflictos Resueltos

Registro de los términos que existían antes de este glosario y fueron unificados.

| Término anterior | Capa | Término canónico | Estado |
|---|---|---|---|
| `Ticket` | `domains/ticket/` | `PreVenta` / `Pedido` | Pendiente de migración |
| `TicketLineDTO` | `domains/ticket/dto/` | `LineaPreVenta` | Pendiente de migración |
| `TicketLineBridge` | `domains/sales/bridge-pedido.ts` | `LineaPreVenta` | Pendiente de migración |
| `OperatorRecord` | `domains/operator/` | `Operador` | Pendiente de migración |
| `active / cancelled` | `domains/comprobantes/types/` | `EMITIDO / ANULADO` | Pendiente — directorio a eliminar |
| `ComprobanteLineItem` | `domains/comprobantes/types/` | `LineaComprobante` | Pendiente — directorio a eliminar |
| `voidComprobante()` | `POSContext.tsx` | `anularComprobante()` | Pendiente de migración |
| `addLine()` | `domains/ticket/` | `agregarLinea()` | Pendiente de migración |
| `addProduct()` | `domains/ticket/` | `agregarProducto()` | Pendiente de migración |
| `emitidoPor` (string) | `domains/documents/` | `operadorId` | Pendiente de migración |
| `loadOperators()` | `domains/operator/` | `cargarOperadores()` | Pendiente de migración |
| `saveOperators()` | `domains/operator/` | `guardarOperadores()` | Pendiente de migración |
| `disponible/bajo_stock/agotado` | `domains/inventory/` | `DISPONIBLE/BAJO_STOCK/AGOTADO` | Pendiente de migración |

---

## 9. Lo que NO cambia

Estos términos ya son correctos y no requieren modificación:

- `HOV` — nombre operacional establecido y conocido por el equipo
- `ValorOperacional` — correcto y consistente
- `MovimientoOperacional` — correcto y consistente
- `CompraOperacional` — correcto y consistente
- `CatalogoProyectado` — correcto y consistente
- `ItemOperacional` — correcto y consistente
- `EventoPedido` — correcto y consistente
- Estados de `Pedido` — ya en español y mayúsculas
- Estados de `Operador` — ya en español y mayúsculas
- Estados de `HOV` — ya en español y mayúsculas
- `crearPedido()`, `agregarLinea()`, `confirmarPedido()`, `concretarPedido()` — ya correctos
- Storage keys bajo `disateq:` con dos puntos — ya correctos

---

## Regla de Continuidad

Cualquier término nuevo introducido en el sistema debe:

1. No existir ya en este glosario con otro nombre.
2. Seguir la forma `VerboCamelCase` para funciones y `NombreEntidad` para tipos.
3. Estar en español si representa un concepto del negocio.
4. Ser aprobado por el Director de Producto antes de ser usado en código.

---

*Documento generado por el Comité de Arquitectura — Junio 2026.*
*Próxima revisión: al completar la normalización estructural (TAREAS 1–8).*
