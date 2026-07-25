# Parches y Soluciones Parciales — Registro de Auditoría

**Fecha:** 2026-07-25
**Propósito:** documentar honestamente qué correcciones de esta sesión (y de la Fase 3 de la Auditoría de Flujo de Ventas en general) resolvieron la causa raíz de un hallazgo, y cuáles resolvieron solo el síntoma visible dejando el defecto de fondo presente en otro lugar del código.

---

## H-C10 — cierre documental, no corrección de código

No hubo parche porque no había bug real en la ruta que importa (`registrar_venta`) — pero la investigación confirma que `pedido_venta` (tabla espejo del borrador en curso) y `venta`/`linea_venta` (registro definitivo) son dos rutas de persistencia paralelas, y **ninguna de las dos valida ni reconcilia contra la otra**. Si algún día divergen — por ejemplo, un pedido queda marcado `CONCRETADO` en `pedido_venta` pero su `registrar_venta` correspondiente falló — no hay ningún mecanismo que lo detecte. Riesgo estructural silencioso, no bug puntual.

## H-C12 — parche parcial, alcance conscientemente recortado

Corregido para `startup-integrity.service.ts` (arranque de sesión): ahora sincroniza todos los tipos de valor activos, no solo `VENTA_NORMAL`. **Pero el `'default'` hardcodeado como `contextoOperacionalId` en el cuarto argumento de `proyectarAHov()`, en ese mismo archivo, sigue intacto** — no era el alcance de H-C12 (que trataba sobre *qué tipos de valor* se sincronizan, no sobre *bajo qué contexto* se proyecta la HOV). Mismo síntoma familiar, causa distinta, solo una resuelta.

## H-C13 — corrección de raíz, pero deliberadamente no retroactiva

El cálculo de `costoBase` prorrateado queda correcto para HOVs nuevas desde el fix en adelante. **Las HOVs que ya existían en base antes del fix, con costo mal calculado, no se corrigen** — seguirán con el dato viejo hasta que se recreen o se fuerce un recálculo manual. Decisión explícita de Fernando ("corregimos solo hacia adelante"), no un descuido — pero es una brecha de datos conocida que debe quedar registrada, no asumida como resuelta.

## H-C14 — corrección de observabilidad, no de la falla misma

Ahora se loguea si `_persistirEnSQLite()` falla al respaldar un pedido en curso. **El comportamiento sigue siendo fire-and-forget** — si falla, el pedido en memoria continúa como si nada, sin backup en SQLite, sin reintento automático, sin alerta al operador, sin bloqueo del flujo. Se ganó visibilidad diagnóstica, no resiliencia funcional.

## Bloque 1 (H-C5/H-C7/H-C9) — primera propuesta de diseño era un parche, detectado antes de ejecutar

La primera propuesta de corrección para `CobroPanel.tsx` resolvía el orden de argumentos ahí, pero dejaba el mismo defecto (`contextoOperacionalId` hardcodeado de forma independiente) presente en `startup-integrity.service.ts` y `bridge-catalogo.ts`. Señalado y detenido antes de generar el prompt para Codex.

---

## Patrón transversal — el hallazgo más importante de este documento

El sistema usa el string literal `'default'` en al menos tres archivos distintos, de forma completamente independiente entre sí, para representar `contextoOperacionalId`:

| Archivo | Función | Uso |
|---|---|---|
| `modules/preventa/CobroPanel.tsx` | `obtenerPedidoActivoOCrear(...)` (×2 invocaciones) | Contexto del pedido en cobro |
| `domains/catalog/startup-integrity.service.ts` | `proyectarAHov(..., 'default', ...)` | Contexto de la HOV al proyectarse en arranque |
| `domains/catalog/bridge-catalogo.ts` | `resolverValor({ contextoOperacionalId: 'default', ... })` dentro de `agruparPorProducto()` | Contexto de resolución de precio visual (relacionado con H-C3) |

**No existe una fuente única real de "cuál es el contexto operacional vigente ahora".** Cada punto define su propio literal, de forma aislada.

### Por qué esto no es un caso hipotético — confirmado contra `docs/00-governance/GLOSARIO.md` §10

La doctrina del proyecto ya define **Contexto de bloque** vs. **Contexto general**: cada operador de Ventas opera sobre su propia caja/turno (bloque), sin ver datos de otros operadores ni de otras cajas. Esto significa que si dos operadores de Ventas abren caja en bloques distintos y venden simultáneamente — escenario normal, no futuro — **sus pedidos deberían distinguirse por contexto de bloque, y hoy no se distinguen**, porque todos los puntos de la tabla anterior caen en el mismo literal `'default'`.

La fuente real ya existe conceptualmente (Bloque Operacional, `BlockBase`, `cashSession.cashBox`) — no hace falta inventar el concepto, solo conectar los tres puntos de la tabla a esa fuente real en vez de al literal fijo.

**Decisión pendiente de diseño (aprobada por Fernando, 2026-07-25):** diseñar la fuente real de `contextoOperacionalId` basada en `cashSession.cashBox` de la sesión activa, y conectar los tres puntos identificados. Alcance cruza Bloque 1 (Ventas), arranque de Catálogo, y precio visual de Catálogo (H-C3) — se aborda como esfuerzo unificado, no recortado por bloque.
