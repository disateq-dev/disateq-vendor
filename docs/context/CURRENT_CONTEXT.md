# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 01 Jul 2026
**Commit activo:** `efb28ac`

---

## DEUDA TÉCNICA REGISTRADA

- Case `"compras"` huérfano en `App.tsx` (~L118) — deuda menor, limpiar en próximo refactor de App
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `OperationalBar.tsx` L515: label inaccessible módulo conserva `#121416` (tiene opacity:0.3, impacto visual mínimo)
- `OperationalBar.tsx` renderOpcion: opciones secundarias inactivas conservan `color: "#201E1E"` — pendiente pase de limpieza global
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — **corrección:** mapea a `--dv-color-new` (no a `--dv-color-confirm` como se había anotado antes), pendiente aplicar
- `ConfigWorkspace.tsx` usa acento hardcodeado `#697387`, divergente del token congelado `--dv-mod-config` (`#4A5265`) — mismo patrón de divergencia que ABASTECIMIENTO, pendiente alinear (`RolesOperacionalesWorkspace.tsx` ya fue migrado esta sesión, ver abajo)
- `CatalogoFarmaciaWorkspace.tsx` (y probablemente `IngresosMercaderiaWorkspace.tsx`, `ProveedoresWorkspace.tsx`) usan acento hardcodeado `#0284C7` (azul), divergente del token congelado `--dv-mod-abastecimiento` (`#3B6B34`) — pendiente alinear, decisión ya tomada: la paleta congelada manda
- `OperationalBar.tsx` mantiene `MODULE_ACCENT` y `MODULE_BG` como objetos JS hardcodeados con los 7 colores de módulo, **sin consumir los tokens `--dv-mod-*` de `index.css`** — dos fuentes de verdad independientes que pueden desincronizarse (ya ocurrió con el refinamiento de paleta TURNO esta sesión). Pendiente refactor: que este archivo lea `var(--dv-mod-*)` en lugar de duplicar los hex. Afecta los 7 módulos, no solo TURNO.

---

## DECISIONES DE DISEÑO ACTIVAS

### Tipografía — doctrina formal
Definida en `docs/design-system/typography.md`. Fuente única del proyecto: **Inter Tight Variable** (`@fontsource-variable/inter-tight`), aplicada vía `--font-sans` en `index.css`. Reemplazó a Inter (fuente previa) tras evaluación comparativa con mockup — elegida por proporciones más condensadas, ideales para la densidad operacional del proyecto, sin perder la altura-x ni los pesos variables de la familia original.

### Sistema de tokens de color `--dv-*`
Definido en `apps/vendor-desktop/src/index.css`. **44 tokens** en cuatro grupos:
- Estructurales: `--dv-surface-base/panel/field`, `--dv-border/border-strong`, `--dv-text-primary/secondary/muted`
- Acciones: `--dv-color-confirm` (verde sólido `#3B6B34`, confirmar/cerrar), `--dv-color-new` (verde outline `#45b356`, iniciar/crear — token nuevo agregado esta sesión), `--dv-color-danger-*`, `--dv-color-exit-*`
- Identidad de módulo: `--dv-mod-ventas/abastecimiento/turno/config/clientes/reportes/comprobantes` (+ `-bg` y `-border` de cada uno)
- Inputs: `--dv-input-bg/border/border-focus/ring-focus/text/placeholder`

**Paleta de identidad confirmada:**
- TURNO: `#C59B6D` · bg `#FFF5E6` · border `#EAD4B9` (**refinada esta sesión**, reemplaza `#B85C10` / `#FDF0E6` / `#E8B98A`)
- VENTAS: `#2B5EA7` · bg `#E8EFF9`
- ABASTECIMIENTO: `#3B6B34` · bg `#E8F0E6`
- CLIENTES: `#2E7D7A` · bg `#E3F2F1`
- REPORTES: `#5C5FA8` · bg `#ECEDF5`
- COMPROBANTES: `#7B4F6E` · bg `#F0EAF0`
- CONFIG: `#4A5265` · bg `#EAECF0`

**Nota sobre `--dv-color-exit`:** coincidía históricamente en hex con el TURNO viejo (`#B85C10`/`#FDF0E6`/`#E8B98A`) por casualidad de definición, no por relación semántica. Al refinar TURNO esta sesión, `--dv-color-exit*` se dejó intacto — son tokens distintos (acción de salida reversible vs. identidad de módulo) y no deben compartir valor.

**Regla de uso:** color de módulo solo en barra de acento del header, ícono activo en OperationalBar y botón primario del módulo. Nunca en bordes de inputs ni fondos de superficie.

**Regla de acción verde:** `--dv-color-new` (outline) = iniciar/crear algo nuevo. `--dv-color-confirm` (sólido) = confirmar/cerrar una acción existente. No son intercambiables aunque el hex sea visualmente similar.

**Pendiente sin decidir:** botón EDITAR usa `#005BE3` (azul) hardcodeado en varios workspaces, sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit` o no: **todavía no tomada**, quedó pendiente cuando la conversación derivó hacia tipografía.

### Mapa real de módulo por archivo (corregido esta sesión)
La ubicación de carpeta **no** determina la identidad de módulo — el ruteo real en `App.tsx` + `OperationalBar.tsx` + `ConfigWorkspace.tsx` sí:

| Archivo | Carpeta física | Módulo real | Token de identidad |
|---|---|---|---|
| `CashWorkspace.tsx` | `modules/cash/` | TURNO | `--dv-mod-turno` |
| `SupervisionCajaWorkspace.tsx` | `modules/cash/` | TURNO (sub-tab de cash) | `--dv-mod-turno` |
| `RolesOperacionalesWorkspace.tsx` | `modules/config/` | CONFIG | `--dv-mod-config` |
| `OperadoresWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `CajasWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `AutorizacionEjecucionCard.tsx` | `modules/cash/` | Por confirmar (probablemente TURNO, usado dentro de supervisión) | Por confirmar |

`RolesWorkspace.tsx` (`modules/cash/`) era código huérfano (`MOCK_ROLES`, nunca importado) — **eliminado** esta sesión, commit `79143f6`.

### Ficha producto unificada (CATÁLOGO)
- Vista resumen eliminada — el producto aterriza directo en ficha completa
- Edición inline: misma grilla de lectura se vuelve editable en modo corrigiendo
- Campos críticos bloqueados si `tieneHistorial === true`: condición de venta, refrigerar, vencimiento, IFA
- Código interno bloqueado siempre (estabilidad operativa del operador)
- Presentaciones comerciales ocultas en modo corrigiendo
- Footer lectura: PRESENTACIONES / PRECIOS / LIMPIAR

### ComboboxFiltrado — doctrina global
Componente en `apps/vendor-desktop/src/components/ComboboxFiltrado.tsx`.
Reemplaza todos los `<select>` nativos con más de 5 opciones o que requieran búsqueda.
Integrado en: `DetalleProducto.tsx` (condición de venta, refrigerar, vencimiento, estado del registro sanitario).

---

## PRÓXIMA VENTANA DE TRABAJO

Retomar migración de tokens `--dv-*` a workspaces restantes. Orden acordado: **TURNO/CAJA primero**, ya en curso:

1. ~~Aplicar `--dv-mod-config` a `RolesOperacionalesWorkspace.tsx`, `OperadoresWorkspace.tsx`, `CajasWorkspace.tsx`~~ — **COMPLETADO esta sesión**, commit `d96e54f`. Hallazgo relevante: el supuesto inicial (los tres usaban `#697387`) era incorrecto — solo `RolesOperacionalesWorkspace.tsx` usaba `#697387`; `OperadoresWorkspace.tsx` y `CajasWorkspace.tsx` usaban en realidad `#2A7CA8` (accent) y `#1a5f7a` (variante de texto), ambos unificados a `--dv-mod-config` (`#4A5265`) sin crear una segunda variante de texto. No se tocaron `#2154d8` (superficie de "autorización supervisora", estado operacional distinto de identidad de módulo), `#dc2626` (acciones destructivas, diverge de `--dv-color-danger` existente — frente separado, no resuelto), ni `#005BE3` (botón EDITAR, decisión `--dv-color-edit` sigue pendiente, ver punto 2).
2. Decidir `--dv-color-edit` (botón EDITAR, `#005BE3`) — pendiente, no resuelto
3. ~~`CashWorkspace.tsx` (149 KB)~~ — **COMPLETADO esta sesión**, commit `efb28ac`. Hallazgo relevante: esta es la pantalla principal de TURNO (apertura/cierre/movimientos/sucesos — lo que el operador ve el 90% del tiempo) y tenía una **tercera identidad hardcodeada** propia (`#CA6F1E`/`#FEF9E7`/`#7D3C0E`, 40 ocurrencias), distinta tanto del token viejo de `index.css` como del refinado esta sesión. Migrada a `#C59B6D`/`#FFF5E6`/`#EAD4B9`. Se catalogaron los 73 hex distintos del archivo antes de tocar nada; el resto (autorización `#2154d8`/`#1a44be`, verde nuevo/confirmar, rojo destructivo, colores de `pasosCaja`, neutros) quedó intacto — verificado por catálogo completo antes/después, no solo por conteo puntual.
4. `SupervisionCajaWorkspace.tsx`, `AutorizacionEjecucionCard.tsx` — confirmar identidad (probable TURNO) y migrar
5. Migrar ABASTECIMIENTO: `CatalogoFarmaciaWorkspace.tsx`, `IngresosMercaderiaWorkspace.tsx`, `ProveedoresWorkspace.tsx` — de `#0284C7` a `#3B6B34` (paleta congelada manda, decisión ya tomada)
6. VENTAS: `SalesWorkspace.tsx`, `PreVentaWorkspace.tsx`, `ClientesWorkspace.tsx`, `ReportesWorkspace.tsx`
7. Pase de limpieza global de remanentes — los items de deuda técnica de color registrados arriba + `renderOpcion` en OperationalBar + `ConfigWorkspace.tsx` (`#697387` pendiente) + `#dc2626` vs `--dv-color-danger` en `OperadoresWorkspace.tsx`/`CajasWorkspace.tsx`
8. Evaluaciones visuales en app real (NuevoProductoStepper, flujos CORREGIR/DESACTIVAR)
9. Prueba end-to-end IngresosMercaderiaWorkspace
10. Brecha 8: registro de sustancias controladas/psicotrópicos (identificada, no implementada)
11. Laboratorios master table (decisión pendiente: tabla maestra vs texto libre)
12. `BoxSlotType → TipoCaja` naming migration
13. `Operador.codigo` cleanup
14. Orphaned `"compras"` case en `App.tsx`

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo
2. Confirmar con Fernando la prioridad de la próxima ventana (probablemente continuar con RolesOperacionalesWorkspace/Operadores/Cajas → `--dv-mod-config`)
3. Leer filesystem antes de diseñar cualquier prompt — no asumir identidad de módulo por ubicación de carpeta, verificar ruteo real en `App.tsx`/`OperationalBar.tsx`
