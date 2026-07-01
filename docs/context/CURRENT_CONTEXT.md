# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 30 Jun 2026
**Commit activo:** `ae3c1eb`

---

## DEUDA TÉCNICA REGISTRADA

- Case `"compras"` huérfano en `App.tsx` (~L118) — deuda menor, limpiar en próximo refactor de App
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando

---

## DECISIONES DE DISEÑO ACTIVAS

### Sistema de tokens de color `--dv-*`
Definido en `apps/vendor-desktop/src/index.css`. 34 tokens en cuatro grupos:
- Estructurales: `--dv-surface-base/panel/field`, `--dv-border/border-strong`, `--dv-text-primary/secondary/muted`
- Acciones: `--dv-color-confirm`, `--dv-color-danger-*`, `--dv-color-exit-*`
- Identidad de módulo: `--dv-mod-ventas/abastecimiento/turno/config` (+ `-bg` y `-border` de cada uno)
- Inputs: `--dv-input-bg/border/border-focus/ring-focus/text/placeholder`

**Regla de uso:** color de módulo solo en barra de acento del header, ícono activo en OperationalBar y botón primario del módulo. Nunca en bordes de inputs ni fondos de superficie.

### ComboboxFiltrado — doctrina global
Componente en `apps/vendor-desktop/src/components/ComboboxFiltrado.tsx`.
Reemplaza todos los `<select>` nativos con más de 5 opciones o que requieran búsqueda.
Props: `opciones`, `valor`, `onChange`, `placeholder`, `disabled`, `className`.
Exports: `ComboboxFiltrado` + `OpcionComboboxFiltrado`.

### Ficha producto unificada (CATÁLOGO)
- Vista resumen eliminada — el producto aterriza directo en ficha completa
- Edición inline: misma grilla de lectura se vuelve editable en modo corrigiendo
- Campos críticos bloqueados si `tieneHistorial === true`: condición de venta, refrigerar, vencimiento, IFA
- Código interno bloqueado siempre (estabilidad operativa del operador)
- Presentaciones comerciales ocultas en modo corrigiendo
- Footer lectura: PRESENTACIONES / PRECIOS / LIMPIAR

---

## PRÓXIMA VENTANA DE TRABAJO

Cola pendiente (prioridad a definir con Fernando):
1. **Aplicar tokens `--dv-*` a componentes existentes** — reemplazo sistemático módulo por módulo; primer candidato: `OperationalBar.tsx` y workspaces de ABASTECIMIENTO
2. **Reemplazar `<select>` nativos con `ComboboxFiltrado`** — primer candidato: campos de modo corrigiendo en `DetalleProducto.tsx` (condición de venta, refrigerar, vencimiento, estado del registro)
3. Evaluaciones visuales de workspaces CATÁLOGO (NuevoProductoStepper, flujos CORREGIR/DESACTIVAR en app real)
4. Prueba end-to-end IngresosMercaderiaWorkspace
5. Brecha 8: registro de sustancias controladas/psicotrópicos (identificada, no implementada)
6. Laboratorios master table (decisión pendiente: tabla maestra vs texto libre)
7. `BoxSlotType → TipoCaja` naming migration
8. CSS flex audit (`flex w-[N%] + gap` → `flex-[N]`)
9. ClientesWorkspace, ReportesWorkspace

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo
2. Confirmar con Fernando la prioridad de la próxima ventana
3. Leer filesystem antes de diseñar cualquier prompt
