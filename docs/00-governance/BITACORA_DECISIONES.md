# BITÁCORA DE DECISIONES — DISATEQ Vendor™

Registro append-only de descubrimientos, decisiones y deuda confirmados por
el Director de Producto. Nunca se purga. Distinto de CURRENT_CONTEXT.md
(estado de trabajo efímero) y de CONTRATO_ARQUITECTURA/GLOSARIO (doctrina
consolidada) — esta bitácora es el paso intermedio: aquí se acumula hasta
que algo se promueve a doctrina (con confirmación de Fernando) o se resuelve.

Estados: CONSOLIDADO · A EVALUAR · PENDIENTE DE IMPLEMENTAR · RESUELTO

---

## 2026-06-13 — Disponibilidad siempre derivada del log de movimientos
**Contexto:** `bridge-catalogo.ts` leía un campo `disponible` inexistente en
`ItemOperacional`, además de una clave de storage incorrecta.
**Decisión:** la disponibilidad NUNCA se lee de un campo estático — siempre
se deriva de `movimientos` vía `deriveDisponibilidad()`.
**Estado:** CONSOLIDADO — refuerza Descubrimiento 1 de CONTRATO_ARQUITECTURA
(Disponibilidad Operacional). No requiere cambio doctrinal, solo registro.

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

## 2026-06-13 — Procedimientos de sesión (lectura de mapa + cierre de módulo)
**Contexto:** sesión de VENTAS requirió lectura en cascada de ~10 archivos
de forma reactiva.
**Decisión:** ver adición a CLAUDE.md (confirmada por el Director).
**Estado:** CONSOLIDADO.
