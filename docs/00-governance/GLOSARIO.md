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

### Alias Operacional

**Qué es:** representación humana visible del Operador en pantalla, comprobantes e impresiones — evita exponer el nombre completo fuera de contextos formales. Fusionado desde `philosophy/DOMAIN_LANGUAGE.md` (21-jun-2026), verificado real en `operator.store.ts`.

**Término canónico:** `alias` (campo de `Operador`)

**Algoritmo de generación:** `<Inicial primer nombre><Primer apellido>` en mayúsculas — `generarAlias()`. Ejemplo: Fernando Miguel Tejada Quevedo → `FTEJADA`.

**Resolución de colisiones:** `<Inicial primer nombre><Primer apellido>_<Inicial segundo apellido>` — `resolverAlias()`. No usa sufijos numéricos (`FTEJADA_2`) por legibilidad. Resolución de colisiones persistentes es manual.

**Ubicación canónica:** `domains/operator/operator.store.ts`

---

### Código Operador

**Qué es:** referencia documental estable e inmutable del Operador — independiente de nombre, alias, rol y bloque. No reemplaza el ID técnico ni el Alias Operacional; no debe usarse como surrogate key. Fusionado desde `philosophy/DOMAIN_LANGUAGE.md` (21-jun-2026), verificado real en `operator.store.ts`.

**Término canónico:** `codigoOperador` (campo de `Operador`)

**Formato:** `OP001`, `OP023` — generado por `siguienteCodigoOperador()`.

**Ubicación canónica:** `domains/operator/operator.store.ts`

**Nota — hallazgo de auditoría (21-jun-2026, confirmado por Fernando):** `Operador` tiene también un campo `codigo` que no corresponde ni a `codigoOperador` ni a `alias` — huérfano, sin propósito distinto confirmado. Ver §8, pendiente de limpieza.

---

### Rol

**Qué es:** función operacional nombrada con un conjunto estándar de capacidades asignadas. Nombra qué hace el operador en términos operacionales; un rol sin capacidades es válido. No es jerarquía de autoridad, cargo laboral, nivel de acceso al sistema ni gate de módulos. Fusionado desde `philosophy/DOMAIN_LANGUAGE.md` (21-jun-2026) bajo el nombre doctrinal "Rol Operacional" — el nombre TypeScript real y canónico es `Rol`, ya correcto, no se renombra.

**Término canónico:** `Rol`

**Tipo TypeScript:** `type Rol = { id, codigo, nombre, descripcion, capacidades: string[], requiereBloque: boolean, activo: boolean, creadoEn, creadoPor }`

**Ubicación canónica:** `domains/operator/roles.store.ts`

**Nota:** las capacidades efectivas de un Operador son la unión de las capacidades de su `Rol` asignado más las capacidades asignadas directamente al operador (`Operador.capacidades`).

---

### AsignacionBloque

**Qué es:** registro de asignación de un bloque operacional a un Operador — marca de tiempo de asignación y, si corresponde, de liberación.

**Término canónico:** `AsignacionBloque`

**Tipo TypeScript:** `type AsignacionBloque = { assignedAt: string; releasedAt?: string }`

**Ubicación canónica:** `domains/operator/operator.store.ts`

---

### Bloque Operacional

**Qué es:** unidad operacional de infraestructura de caja — agrupa un conjunto de cajas bajo reglas de disponibilidad secuencial propias. Puede existir sin operador asignado, sin turno activo, y no desaparece cuando su operador es dado de baja. No es una caja individual, una ubicación física, un atributo del operador ni del turno.

**Término canónico:** `BlockBase` (implementación actual — ver nota)

**Tipo TypeScript:** `type BlockBase = 100 | 200 | 300 | 400 | 500 | 900`

**Composición determinista (fuente: `architecture/bloque-operacional.md`, documento autoridad):**

```
bloque(base) = {
  principal:    base
  auxiliar-1:   base + 1
  auxiliar-2:   base + 2
  excepcional:  base + 50
}
```

**Ciclo de vida doctrinal:** `Creado → Disponible → Asignado → En Uso → Liberado → Inactivo`. No implementado hoy como estado explícito — ver nota.

**Ubicación canónica:** `domains/operator/blocks.store.ts`

**Nota — fuente corregida (auditoría 21-jun-2026):** la entrada original de esta sección citaba `DOMAIN_LANGUAGE.md` como única fuente. La fuente doctrinal real y más completa es `architecture/bloque-operacional.md` ("DOCUMENTO AUTORIDAD — CONCEPTO DOCTRINAL", may-2026), que define el ciclo de vida de 6 estados arriba. Hoy en código `Bloque Operacional` es solo un número base (`BlockBase`) sin estado explícito propio — el ciclo de vida se infiere indirectamente de `Operador.baseBloque`/`AsignacionBloque`. No es un error, es una implementación más simple que la doctrina. No se fuerza a converger sin que Fernando lo pida.

---

### TipoCaja

**Qué es:** la categoría operacional de cada caja dentro de un Bloque — Principal, Auxiliar o Excepcional. Dentro de Auxiliar, las cajas se numeran secuencialmente (Auxiliar 01, Auxiliar 02...) según `architecture/bloque-operacional.md` — la numeración gobierna el orden de apertura (Auxiliar 02 solo disponible tras cierre de Auxiliar 01), no introduce un cuarto valor de `TipoCaja`.

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `PRINCIPAL` | Caja de inicio normal de la jornada, sin prerequisitos ni autorización |
| `AUXILIAR` | Continuación operacional tras cierre de la caja anterior del bloque, requiere motivo. Apertura secuencial entre auxiliares numeradas |
| `EXCEPCIONAL` | Apertura de emergencia, solo si la Principal no fue utilizada en la jornada, requiere autorización y motivo. Su apertura impide iniciar la Principal el mismo día |

**Reemplaza definitivamente:** `BoxSlotType` (`"normal" | "contingency-1" | "contingency-2" | "contingencia"`) — ver §8. Fernando confirmó (21-jun-2026) que `contingency-1`/`contingency-2` colapsan en la misma categoría doctrinal `AUXILIAR` — confirmado además por `architecture/bloque-operacional.md`, que ya las trataba como "Auxiliar 01"/"Auxiliar 02" (mismo tipo, secuencia distinta). El patrón `base + 50` para `contingencia` coincide exactamente con la Caja Excepcional documentada.

**Reglas de apertura (fuente: `architecture/bloque-operacional.md`):** apertura secuencial (auxiliar solo abre si la anterior del bloque fue usada y cerrada), apertura excepcional (excepcional solo abre si la principal no se usó, y al abrirse impide la principal el resto del día), exclusividad diaria (una caja cerrada no reabre en la misma jornada), aislamiento de ciclo (el ciclo se reinicia cada jornada). Ninguna de estas reglas está verificada como implementada en `blocks.store.ts` esta sesión — el archivo solo define la composición, no las reglas de transición.

**Ubicación canónica:** `domains/operator/blocks.store.ts`

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
├── reports/        ← Reporte (proyecciones — sin persistencia)
└── farmacia/       ← ProductoGenerico · ProductoComercial · PresentacionComercial · Lote · Proveedor · ServicioFarmacia · EjecucionServicio
```

---

## 3. Directorio Canónico de Módulos (UI)

```
modules/
├── preventa/           ← PreVentaGrid · CobroPanel (antes: ticket/)
├── sales/               ← SalesWorkspace · ClienteBuscador · PresentacionSheet
├── comprobantes/    ← ComprobantesWorkspace (conectado a domains/documents/)
├── inventory/          ← InventoryWorkspace
├── purchases/         ← PurchasesWorkspace
├── cash/                 ← CashWorkspace
├── config/               ← ConfigWorkspace · CapacidadesWorkspace · RolesWorkspace
├── login/                 ← LoginWorkspace
└── abastecimiento/
    └── farmacia/        ← CatalogoFarmaciaWorkspace · ProveedoresWorkspace · IngresosMercaderiaWorkspace
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
| `disateq:inventory:items` (declarado en §6) | `domains/inventory/persistence.ts` | `inv_v0_items` / `inv_v0_movimientos` | Pendiente de migración |
| `ActualizarProveedorInput` (auditoría 21-jun-2026) | `domains/farmacia/types.ts` | `ModificarProveedorInput` | Pendiente de migración — verbo `actualizar` no está en §4, canónico es `modificar` |
| `Operador.codigo` (auditoría 21-jun-2026, confirmado por Fernando) | `domains/operator/operator.store.ts` | Eliminar — no corresponde ni a `codigoOperador` ni a `alias` | Pendiente de migración — campo huérfano, confirmar que ningún consumidor depende de él antes de quitarlo |
| `BoxSlotType` / `BoxSlotDef` / campo `code` (auditoría 21-jun-2026, confirmado por Fernando) | `domains/operator/blocks.store.ts` | `TipoCaja` (`PRINCIPAL/AUXILIAR/EXCEPCIONAL`) / `DefinicionCaja` / campo `codigo` | Pendiente de migración — viola Regla de Oro del Idioma (dominio de negocio en inglés); además colapsa `contingency-1`/`contingency-2` en un solo valor `AUXILIAR` |

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

## 10. Roles Operacionales Canónicos

Cuatro roles base. Roles adicionales se crean por necesidad con sus capacidades específicas.

| Código | Nombre | requiereBloque | Contexto |
|---|---|---|---|
| VEN | Ventas | true | Bloque siempre — opera caja, vende, cobra, emite |
| GES | Gestor | false | General normalmente — bloque en emergencia si se asigna |
| SOP | Soporte | false | General siempre — observación y diagnóstico técnico |
| ADMIN | Administrador | false | General siempre — acceso total, configura el sistema |

### Doctrina de contexto operacional

**Contexto de bloque:** el operador trabaja sobre su propia caja y turno. TURNO y VENTAS son inherentemente de bloque. El operador no debe ver montos acumulados de otros operadores ni datos globales de la sesión. El cierre de turno es "a ciegas" — el operador no ve el total esperado antes de contar el efectivo.

**Contexto general:** el operador supervisa o gestiona el sistema completo. Ve información de todos los operadores, todas las cajas y todos los períodos. No está atado a una caja específica.

### Regla de contexto para GES

GES normalmente opera en contexto general (sin bloque). En emergencia — cuando no hay operador de Ventas disponible — el Admin puede asignarle un bloque y GES asume el contexto de bloque completo, pudiendo operar la caja como un VEN.

### Capacidades base por rol

VEN: gestionar_clientes
GES: observar_comprobantes_global · anular_comprobantes · corregir_arqueos · reaperturar_cierres · regularizar_incidencias · observar_continuidad · ver_reportes · gestionar_clientes · gestionar_inventarios · gestionar_compras
SOP: observar_continuidad
ADMIN: acceso_total

### Nota de UIX pendiente

El rol VEN opera "a ciegas" — ningún monto acumulado de sesión debe ser visible para Ventas. Los totales de venta, el monto esperado en caja y la diferencia de arqueo son visibles solo para GES y ADMIN. Se implementa en la revisión de UIX.

### Ejemplo de rol adicional

Un rol CONTADOR creado por el Admin con capacidades [observar_comprobantes_global, ver_reportes] y requiereBloque: false tendría acceso solo a COMPROBANTES e INFORMES, sin poder operar ninguna caja ni modificar datos.

---

## 11. Entidades — Dominio FARMACIA (ABASTECIMIENTO)

Registradas el 21-jun-2026, tras auditoría de `domains/farmacia/types.ts` contra este glosario. Cubre solo las entidades estables del dominio. `NodoFraccionamiento`, `TipoFormaVenta` y los campos `unidadesBase`/`unidadesEnNodoPadre` quedan **deliberadamente fuera** — son el germen del sistema `FormaVenta`/`FormaCompra`/`UnidadBase` pendiente de rediseño profundo (ver `docs/context/CURRENT_CONTEXT.md`). Registrarlos ahora arriesgaría fijar un nombre que ese rediseño va a cambiar.

### ProductoGenerico

**Qué es:** el principio activo farmacéutico en su forma más abstracta — IFA, concentración, forma farmacéutica y categoría, independiente de marca o fabricante.

**Término canónico:** `ProductoGenerico`

**Tipo TypeScript:** `interface ProductoGenerico`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### ProductoComercial

**Qué es:** la versión comercializada de un `ProductoGenerico` — nombre comercial, fabricante, registro sanitario, condición de venta. Referencia obligatoria vía `productoGenericoId`.

**Término canónico:** `ProductoComercial`

**Tipo TypeScript:** `interface ProductoComercial`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### PresentacionComercial

**Qué es:** la unidad de empaque física de un `ProductoComercial` — descripción, fracción DIGEMID, unidad de conteo, factor de conversión a unidad base.

**Término canónico:** `PresentacionComercial`

**Tipo TypeScript:** `interface PresentacionComercial`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### Lote

**Qué es:** el registro de inventario físico real de una `PresentacionComercial` — número de lote, fecha de vencimiento, cantidad ingresada/disponible, trazabilidad de proveedor y costo.

**Término canónico:** `Lote`

**Tipo TypeScript:** `interface Lote`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### Proveedor

**Qué es:** la entidad comercial externa que suministra mercadería — razón social, RUC, condiciones de pago.

**Término canónico:** `Proveedor`

**Tipo TypeScript:** `interface Proveedor`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

**Nota:** ver §8 — `ActualizarProveedorInput` debe migrar a `ModificarProveedorInput`.

---

### ServicioFarmacia

**Qué es:** un servicio prestado en el local (inyectable, nebulización, control de glucosa, etc.) distinto de la venta de producto.

**Término canónico:** `ServicioFarmacia`

**Tipo TypeScript:** `interface ServicioFarmacia`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### EjecucionServicio

**Qué es:** el registro de que un `ServicioFarmacia` fue efectivamente prestado — operador, turno, pedido asociado, marca de tiempo de inicio/fin.

**Término canónico:** `EjecucionServicio`

**Tipo TypeScript:** `interface EjecucionServicio`

**Reemplaza definitivamente:** N/A — entidad nueva, sin nombre previo en conflicto.

**Ubicación canónica:** `domains/farmacia/types.ts`

---

### EstadoProveedor

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `ACTIVO` | Puede asociarse a presentaciones, lotes e ingresos |
| `INACTIVO` | Dado de baja — no debe ofrecerse en selección de nuevos ingresos |

**Estado de implementación (confirmado por Fernando, 21-jun-2026):** `ACTIVO` es el único valor que el backend escribe hoy — `crear_proveedor` en `proveedores.rs` lo hardcodea. `INACTIVO` queda declarado aquí pero sin comando que lo produzca; falta `desactivar_proveedor`. No es deuda de naming, es deuda funcional — anotar aparte, no bloquea el uso de `ACTIVO` en código nuevo.

---

### EstadoProductoComercial

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `ACTIVO` | Disponible para presentaciones, venta y búsqueda |
| `INACTIVO` | Dado de baja — no debe ofrecerse en catálogo ni búsqueda |

**Estado de implementación (confirmado por Fernando, 21-jun-2026):** mismo patrón que `EstadoProveedor` — `crear_producto_comercial` en `productos.rs` solo escribe `ACTIVO`. Falta `desactivar_producto_comercial`.

---

### EstadoServicioFarmacia

**Estados canónicos:**

| Estado | Significado operacional |
|---|---|
| `ACTIVO` | Disponible para ejecutar y ofrecer al cliente |
| `INACTIVO` | Dado de baja — no debe ofrecerse para nueva ejecución |

**Estado de implementación (confirmado por Fernando, 21-jun-2026):** mismo patrón — `crear_servicio_farmacia` en `servicios.rs` solo escribe `ACTIVO`. Falta `desactivar_servicio_farmacia`.

---

### Pendiente de esta sección

`NodoFraccionamiento`, `TipoFormaVenta`, `ValorOperacionalFarmacia` y el resto del árbol de catálogo quedan pendientes del rediseño de VENTAS — no registrar antes de esa sesión. Esto incluye el `estado` de `NodoFraccionamiento` y de `ValorOperacionalFarmacia`, que tampoco se tipificaron aquí por la misma razón.

**Deuda técnica detectada, fuera del alcance de este glosario:** faltan los comandos `desactivar_proveedor`, `desactivar_producto_comercial` y `desactivar_servicio_farmacia` en `src-tauri/src/commands/`. El filtro `solo_activos` ya existe en los tres `obtener_*`, pero ningún flujo de UI puede producir el estado `INACTIVO` todavía. Sugerido para `docs/context/CURRENT_CONTEXT.md` como pendiente, no resuelto aquí.

---

*Documento generado por el Comité de Arquitectura — Junio 2026.*
*Próxima revisión: al completar la normalización estructural (TAREAS 1–8).*
