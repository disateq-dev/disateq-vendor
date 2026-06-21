# BITÁCORA DE DECISIONES — DISATEQ Vendor™

Registro append-only de descubrimientos, decisiones y deuda confirmados por
el Director de Producto. Distinto de CURRENT_CONTEXT.md (estado de trabajo
efímero) y de CONTRATO_ARQUITECTURA/GLOSARIO (doctrina consolidada) — esta
bitácora es el paso intermedio: aquí se acumula hasta que algo se promueve a
doctrina (con confirmación de Fernando) o se resuelve.

**Estados:** CONSOLIDADO · A EVALUAR · PENDIENTE DE IMPLEMENTAR · RESUELTO

**Regla de mantenimiento (desde 2026-06-21):** Esta bitácora contiene
ÚNICAMENTE entradas con estado CONSOLIDADO o RESUELTO **mientras siguen
siendo relevantes para trabajo activo**. En cuanto una entrada se cierra del
todo y ya no requiere consulta rutinaria, se mueve a
`docs/00-governance/BITACORA_HISTORICA.md` (nunca se elimina, solo se deja
de cargar por defecto). Las entradas PENDIENTE DE IMPLEMENTAR y A EVALUAR
permanecen aquí siempre hasta resolverse. Este archivo se reorganizó por
primera vez el 2026-06-21: de 21 entradas acumuladas desde el 13 de junio,
18 ya CONSOLIDADAS/RESUELTAS se archivaron en BITACORA_HISTORICA.md, quedando
aquí solo las 3 genuinamente abiertas.

---

## 2026-06-13 — Seed de catálogo (HOV) es acumulativo entre rubros
**Contexto:** `seedCatalogoFromRubro` (commit 6855097) crea HOVs para el
rubro activo pero no retira las de rubros anteriores. Al cambiar de rubro
en pruebas, VENTAS muestra productos mezclados de múltiples rubros.
**Decisión:** aceptado como dato de prueba por ahora.
**Estado:** PENDIENTE DE IMPLEMENTAR — resolver al diseñar gestión real de
catálogo/rubro en CONFIG (retirar/suspender HOVs del rubro saliente, o
filtrar catálogo proyectado por rubro activo además de contexto).

---

## 2026-06-13 — Discrepancia GLOSARIO §6 vs. storage keys reales de inventory
**Contexto:** GLOSARIO marca `disateq:inventory:items` como "ya correcto",
pero `domains/inventory/persistence.ts` usa `inv_v0_items`/`inv_v0_movimientos`.
**Decisión:** no migrar ahora (fuera de alcance de la corrección de hoy).
**Estado:** PENDIENTE DE IMPLEMENTAR — candidato a entrada en GLOSARIO §8
(Tabla de Conflictos Resueltos) cuando se aborde la migración de storage keys
del dominio inventory.

---

## 2026-06-20 — IngresosMercaderiaWorkspace: flujo de un solo paso, sin recepción parcial

**Contexto:** PurchasesWorkspace (prototipo localStorage) maneja un flujo de
dos tiempos: registrar pedido esperado (estado "registrada") → confirmar
llegada después, posiblemente parcial (estados "recibida_parcial" /
"recibida"). Se evaluó si IngresosMercaderiaWorkspace para farmacia (SQLite)
debía replicar ese mismo mecanismo.

**Decisión:** Flujo simplificado a un solo paso. El operador registra
exactamente lo que tiene físicamente en sus manos en el momento del ingreso.
No existe estado intermedio "pendiente de llegar" en el dominio farmacia.
Cada ingreso es un hecho consumado: se confirma con lote (si aplica) y
movimiento tipo "entrada" en la misma operación.

**Decisión derivada — lote genérico:** cuando el proveedor no provee número
de lote visible, el operador puede continuar con un lote genérico tipo
`SIN-LOTE-{fecha}`. La fecha de vencimiento queda en null (no se fuerza una
fecha estimada) hasta que el operador la actualice después. Criterio: no
bloquear al operador en el mostrador; ajustar tras validar en uso real.

**Decisión derivada — búsqueda de producto en el ingreso:** el buscador
muestra cada presentación comercial como fila de resultado independiente
(no un selector de producto + selector de presentación en dos pasos). Mismo
criterio: empezar simple, ajustar según uso real antes de sofisticar.

**Estado:** A EVALUAR EN USO REAL — Fernando validó "hay que probarlo para
ver si conviene, pero por ahora así se maneja". Revisar después de operación
real en mostrador si el lote genérico sin fecha y el listado plano de
presentaciones generan fricción o confusión.
