# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 30 Jun 2026
**Commit activo:** `2d84bf3`

---

## DEUDA TÉCNICA REGISTRADA

- Case `"compras"` huérfano en `App.tsx` (~L118) — deuda menor, limpiar en próximo refactor de App
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando (arranca en primer módulo)

---

## PRÓXIMA VENTANA DE TRABAJO

Cola pendiente (sin prioridad definida aún):
1. Evaluaciones visuales de workspaces CATÁLOGO (NuevoProductoStepper, flujos CORREGIR/DESACTIVAR)
2. Prueba end-to-end IngresosMercaderiaWorkspace
3. Brecha 8: registro de sustancias controladas/psicotrópicos (identificada, no implementada)
4. Laboratorios master table (decisión pendiente: tabla maestra vs texto libre)
5. `BoxSlotType → TipoCaja` naming migration
6. CSS flex audit (`flex w-[N%] + gap` → `flex-[N]`)
7. ClientesWorkspace, ReportesWorkspace

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo
2. Confirmar con Fernando la prioridad de la próxima ventana
3. Leer filesystem antes de diseñar cualquier prompt
