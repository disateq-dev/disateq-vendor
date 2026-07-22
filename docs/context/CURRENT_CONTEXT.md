# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-22 manana — gobernanza documental clarificada
**Commit activo:** `c60ec29` · **Rama:** `main` · **Migracion SQLite:** v25 · **Working tree:** LIMPIO

## ESTADO GENERAL
Auditoria Integral iniciada (8 bloques). Bloque 1 (cash/) EN CURSO: resuelto el hallazgo critico — fire-and-forget SQLite sin rollback + mismatch de id cliente/servidor en movimientos de caja (apertura, cierre, movimientos, regularizacion y correccion de apertura ya persisten con confirmacion). Resueltos tambien 2 conflictos doctrinales previos: arqueoOperacional puro (sin ajuste por movimientos) y docs de persistencia cash actualizados a SQLite como fuente unica.

## GOBERNANZA (nuevo, 2026-07-22)
`CLAUDE.md` clarificado: Codex CLI exclusivamente codigo de aplicacion, nunca documentacion. Claude es guardian de documentacion (`docs/`, `CURRENT_CONTEXT.md`, `CLAUDE.md`, bitacoras) — la escribe directo, siempre mostrandola en el chat para aprobacion antes de escribir.

## COMMITS DE LA SESION (mas reciente primero)
`c60ec29` docs(governance): Codex solo codigo, Claude guardian de documentacion · `4231711` corregir_apertura_sesion persiste correccion temprana · `67ff04a` actualizar_movimiento_caja verifica rows_affected · `099a63e` movimientos usan id real SQLite y confirman antes de regularizar · `d2b6733` abrir/cerrar caja persisten antes de mutar estado · `1ebb28f` arqueoOperacional puro · `0315d42` docs persistencia cash corregidos

## AUDITORIA INTEGRAL — ESTADO
Bloque 1 (cash/) EN CURSO. Bloques 2-8 (sales/preventa, comprobantes/documents, operator, abastecimiento/farmacia, config/auditoria, inventory/reports, residuos cross-cutting) Pendiente.

## PENDIENTES BLOQUE 1 (diagnostico hecho, sin resolver)
- Naming en ingles en dominio cash (CashSession/CashMove/TurnEvent) — no registrado en GLOSARIO §8
- Hooks nucleo (useCaja/useSessionStats/useBitacora) fuera de domains/cash/, viven en src/hooks/
- supervision-authorization.service.ts envia snake_case manual — inconsistente con el resto del dominio
- obtener_estado_arranque no reconstruye evento_turno — bitacora de turno vacia tras reinicio
- Falta comando Rust dedicado para getAuthorizationForSession (carga todas y filtra en memoria)

## PROTOCOLO PROXIMA SESION
1. Leer este archivo. 2. git status. 3. Continuar Bloque 1 con los pendientes de arriba, o avanzar a Bloque 2.
