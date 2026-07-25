# Auditoría del Flujo Completo de Ventas — DISATEQ Vendor™

**Fecha:** 2026-07-24
**Commit base:** bd56cff (rama main)
**Alcance:** recorrido operacional completo, desde apertura de turno hasta cierre de caja, auditado contra el código real en disco (no contra documentación).
**Metodología:** Fase 1 (recorrido paso a paso) completada. Fase 2 (barrido de interrelación) y Fase 3 (correcciones) pendientes.

---

## Mapa del flujo auditado

1. Apertura de turno / caja
   1a. Movimientos de caja (ingresos/egresos, fondo de cambio)
2. Búsqueda y captura de producto
3. Armado de preventa / pedido
4. Gestión del pedido activo (máquina de estados)
5. Cliente (DNI/RUC/CE/Pasaporte)
6. Cobro
7. Comprobante (emisión, correlativo)
8. Post-venta inmediata (anular, reimprimir, convertir)
9. Sucesos del turno
10. Cierre de turno / arqueo

---

## 🔴 Hallazgos críticos

### H-C1 — Fallo de concreción de venta se traga en silencio (Paso 4/6)
**Archivos:** `domains/sales/bridge-pedido.ts` (`sincronizarConcrecion`), `domains/sales/venta.service.ts`

Si `confirmarPedido()` lanza una excepción (p. ej. porque el pedido no tiene líneas activas — ver H-C3), el `catch` la ignora y el flujo continúa. `registrarVentaEnSQLite()` no verifica el estado del pedido antes de persistir, y usa `input.pedido.momentoConcrecion ?? new Date().toISOString()` — si `momentoConcrecion` es `null`, el sistema **inventa** una fecha de concreción.

**Consecuencia real:** el comprobante ya se emitió e imprimió (el cliente se retira con su boleta), pero el pedido subyacente puede quedar en estado `ABIERTO` en el store de pedidos, con un timestamp de concreción falso escrito en SQLite. Ese pedido "fantasma abierto" podría reaparecer como pedido activo en la siguiente venta del mismo mostrador y mezclar líneas.

**Prioridad:** máxima — toca directamente la confiabilidad de los registros de venta.

---

### H-C2 — Base de clientes 100% en localStorage (Paso 5)
**Archivo:** `domains/clients/cliente.store.ts`

Confirmación en código de la deuda ya documentada (D3). Todo el store de clientes (`disateq:clients:clientes`) vive en `localStorage`, sin ningún camino hacia SQLite. Cada venta con boleta/factura que registra o actualiza un cliente escribe ahí.

**Consecuencia real:** pérdida total de la base de clientes frecuentes ante limpieza de caché, reinstalación, o corrupción de perfil del sistema operativo. Es dato de negocio permanente, no estado de UI efímero.

**Prioridad:** máxima — ya estaba en el roadmap (D3), esto confirma alcance y gravedad exactos.

---

### H-C3 — Doble motor de resolución de precio (Paso 2/3)
**Archivos:** `domains/sales/pedido.service.ts` (`agregarLinea` → `resolverValor()`), `modules/sales/SalesWorkspace.tsx`, `modules/sales/PresentacionSheet.tsx`

El precio/tipo de valor que se persiste en el pedido operacional (SQLite) se calcula con el motor real `resolverValor()`. El precio/tipo de valor que ve el operador en el ticket visual viene **precalculado** desde el catálogo (`bridge-catalogo.ts`), sin volver a pasar por ese motor.

**Consecuencia real:** el número que el operador ve en pantalla puede no coincidir con el que efectivamente se guarda si el motor operacional aplica una regla (mayorista por cantidad, margen mínimo) que el catálogo pre-computado no conoce. No se detecta visualmente — solo auditando el pedido concretado contra lo cobrado.

**Prioridad:** alta.

---

### H-C4 — Fallo silencioso al agregar línea deja "producto fantasma" en el ticket (Paso 2)
**Archivo:** `domains/preventa/services/preventa.service.ts` (`agregarProductoDesdeHOV`)

```ts
try { agregarLinea({...}) } catch { /* fallo silencioso · el ticket visual no se ve afectado */ }
usePreVentaStore.getState().agregarLinea(traducirALineaPreVenta(input));
```

Si `agregarLinea()` falla, la línea se agrega igual al ticket visual. El pedido operacional en SQLite nunca la recibe.

**Consecuencia real:** si eso llega a cobro, hay una línea cobrada visualmente pero ausente del pedido persistido.

**Prioridad:** alta — comentario en código revela que fue decisión consciente priorizando UX sobre integridad de dato.

---

### H-C5 — Contexto operacional hardcodeado a "default" en el cobro real (Paso 6)
**Archivo:** `modules/preventa/CobroPanel.tsx` (`_ejecutarSideEffects`, `emitirYRegistrarComprobante`)

```ts
preVentaService.obtenerPedidoActivoOCrear("default", "default", cashSession.cashBox?.code ?? "default")
```

`contextoOperacionalId` e `identidadOperacionalId` quedan siempre en el string literal `"default"`, nunca con el bloque/caja real de la sesión activa.

**Consecuencia real:** rompe trazabilidad real de "qué operador/bloque concretó qué pedido" — el dato queda genérico para toda venta que pase por cobro.

**Prioridad:** alta.

---

## 🟡 Hallazgos medios

| # | Hallazgo | Ubicación |
|---|---|---|
| H-M1 | Correlativo mostrado en pantalla (`correlativoStore`, memoria) puede divergir del correlativo real asignado en SQLite al emitir. `confirmarEmision()` nunca se invoca. | `CobroPanel.tsx`, `correlativo.store.ts` |
| H-M2 | Botón COBRAR en el ticket no verifica `cashSession.isOpen` directamente (mitigado: los botones de confirmación dentro del panel de cobro sí lo bloquean). | `domains/preventa/components/PreVentaGrid.tsx` |
| H-M3 | `codigoBarras` aún no se pasa desde `SalesWorkspace` pese al fix ya commiteado en `bridge-pedido.ts` (commit `d46ca2d`). | `modules/sales/SalesWorkspace.tsx` |
| H-M4 | Manejo de error genérico en confirmación de cobro — mismo mensaje para cualquier causa de fallo, sin registro en `error_log`. | `CobroPanel.tsx` (`confirmEmit`, `handleImprimir`) |
| H-M5 | Fire-and-forget sin manejo de error en botón "Devolver" de préstamos pendientes de fondo de cambio. | `modules/cash/CashWorkspace.tsx` |
| H-M6 | Sin control de documento duplicado al crear cliente — dos registros con el mismo DNI/RUC pueden convivir sin fusión ni alerta. | `modules/sales/ClienteBuscador.tsx` |
| H-M7 | Fallback silencioso a correlativo `1` si no se provee explícitamente (no ocurre hoy porque el caller siempre lo provee, pero el tipo permite el caso). | `domains/documents/bridge-comprobante.ts` |
| H-M8 | REIMPRIMIR: el backend ya existe (`registrarEventoComprobanteSQLite`) pero no hay botón en la UI que lo dispare. | `modules/comprobantes/ComprobantesWorkspace.tsx` |

---

## 🟢 Hallazgos menores / cosméticos

| # | Hallazgo | Ubicación |
|---|---|---|
| H-m1 | `README-preventa.md` desactualizado — describe `sales` persistiendo en localStorage; en realidad usa SQLite desde hace varias faenas. | `domains/preventa/README-preventa.md` |
| H-m2 | Mezcla de localStorage para estado efímero de UI (progreso del wizard de cierre de caja) — probablemente intencional, a confirmar con Fernando si debe unificarse. | `modules/cash/CashWorkspace.tsx` |
| H-m3 | Riesgo de carrera: `selectedCode` cae a fallback `"100"` si `cashBoxes` no cargó aún al montar. | `modules/cash/CashWorkspace.tsx` |
| H-m4 | Referencias muertas a clave de localStorage `disateq.pos.turnEvents` en botones de reset — ambas dentro de herramientas visibles solo en modo DEV o de bajo impacto (solo borran, no leen). | `modules/config/ConfigWorkspace.tsx`, `modules/inventory/InventoryWorkspace.tsx` |

---

## ✅ Deuda documentada que resultó ya estar resuelta

Al auditar contra el código real (no contra `CURRENT_CONTEXT.md`), se confirmó que parte de la deuda registrada ya no aplica:

- **ANULAR comprobante**: sí exige PIN de autorización (`useAutorizacion` / `solicitarAutorizacion`) y registra auditoría completa vía `auditoriaService`.
- **CONVERTIR a BOLETA/FACTURA**: comando completo, con autorización, correlativo real, y marcado del comprobante original como `REFERENCIADO`.
- **REIMPRIMIR**: parcialmente pendiente — el backend está listo, falta la UI (ver H-M8).
- **Sucesos del turno**: sí tienen vista real integrada en `CashWorkspace.tsx` (`currentSessionEvents`), correctamente persistidos en SQLite vía `registrarEventoTurnoEnSQLite`.

**Recomendación de proceso:** actualizar `CURRENT_CONTEXT.md` para reflejar este estado real antes de planificar el "Sprint DOCUMENTOS", evitando re-trabajo sobre código ya funcional.

---

## Máquina de estados del pedido (referencia, confirmada correcta)

`pedido.service.ts` implementa correctamente:

```
ABIERTO → CONFIRMADO → EN_COBRO → CONCRETADO
   ↓            ↓            ↓
   └────────ABANDONADO───────┘   (no permitido desde CONCRETADO)
```

Todas las transiciones tienen sus invariantes (no agregar línea a pedido no-ABIERTO, no confirmar sin líneas activas, no abandonar un CONCRETADO). El problema no está en el diseño de la máquina sino en que su fallo no se propaga (ver H-C1).

---

## Próximos pasos sugeridos

1. **Fase 2 — Barrido de interrelación:** confirmar cómo se conectan estos hallazgos entre sí (p. ej. H-C3 + H-C4 + H-C1 son la misma familia de "fallos silenciosos en la cadena de captura→pedido→concreción").
2. **Fase 3 — Correcciones:** priorizar con Fernando, generar prompts atómicos para Codex por hallazgo o por grupo relacionado.
3. Actualizar `README-preventa.md` (H-m1) y `CURRENT_CONTEXT.md` (deuda ya resuelta) como parte de la limpieza documental.
