# CURRENT_CONTEXT — DISATEQ Vendor(tm)
**Ultima actualizacion:** 2026-07-22 tarde -- Bloque 1 auditoria cerrado
**Commit activo:** b6e413f . **Rama:** main . **Migracion SQLite:** v25 . **Working tree:** LIMPIO

## ESTADO GENERAL
Auditoria Integral en curso (8 bloques). Bloque 1 (cash/) CERRADO -- 3 bugs resueltos
(P3 camelCase supervision-authorization, P4 bitacora vacia tras reinicio, P1 GLOSARIO S8
actualizado). Dos deudas diferidas con decision consciente documentada en GLOSARIO S8
(P2 hooks fuera de domains/cash/, P5 sin comando Rust dedicado para
getAuthorizationForSession).

## GOBERNANZA
CLAUDE.md: Codex CLI exclusivamente codigo de aplicacion, nunca documentacion.
Claude es guardian de documentacion -- la escribe directo, siempre mostrando en chat
para aprobacion antes de escribir.

## COMMITS DE LA SESION (mas reciente primero)
b6e413f docs(governance): GLOSARIO S8 -- terminos cash/ exentos y deudas diferidas
669c923 fix(cash): reconstruir eventos de turno en arranque -- bitacora no queda vacia
f8c0df9 fix(cash): supervision-authorization usa camelCase en invoke
a1f527e chore(context): actualizar CURRENT_CONTEXT -- gobernanza documental clarificada

## AUDITORIA INTEGRAL -- ESTADO
Bloque 1 (cash/): CERRADO.
Bloques 2-8: Pendiente.

## PROXIMO PASO
Iniciar Bloque 2: dominios sales/ y preventa/.
Leer: domains/sales/pedido.types.ts . domains/sales/pedido.service.ts .
domains/sales/venta.service.ts . domains/preventa/state/preventa.store.ts

## PROTOCOLO PROXIMA SESION
1. Leer este archivo. 2. git log --oneline -5. 3. Iniciar Bloque 2.
