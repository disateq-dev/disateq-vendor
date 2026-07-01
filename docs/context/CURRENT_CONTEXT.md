# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 01 Jul 2026
**Commit activo:** `0a3e729`

---

## DEUDA TÉCNICA REGISTRADA

- Case `"compras"` huérfano en `App.tsx` (~L118) — deuda menor, limpiar en próximo refactor de App
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `OperationalBar.tsx` L515: label inaccessible módulo conserva `#121416` (tiene opacity:0.3, impacto visual mínimo)
- `OperationalBar.tsx` renderOpcion: opciones secundarias inactivas conservan `color: "#201E1E"` — pendiente pase de limpieza global
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — **corrección:** mapea a `--dv-color-new` (no a `--dv-color-confirm` como se había anotado antes), pendiente aplicar
- `ConfigWorkspace.tsx` usaba acento hardcodeado `#697387`, divergente del token congelado `--dv-mod-config` (`#4A5265`) — **RESUELTO esta sesión**, ver punto "Auditoría final TURNO/CAJA" abajo
- `#dc2626`/`#b91c1c` (rojo destructivo) usado consistentemente en `CashWorkspace.tsx`, `SupervisionCajaWorkspace.tsx`, `OperadoresWorkspace.tsx`, `CajasWorkspace.tsx`, mientras `--dv-color-danger` (`#8B3A2A`) define un tono distinto — **no es una divergencia local de TURNO/CAJA**, es probable que `#dc2626` sea el rojo destructivo real de todo el sistema y `--dv-color-danger` sea el token desactualizado. Decisión de sistema completo, no de bloque — evaluar en el pase de limpieza global (punto 7) revisando VENTAS/ABASTECIMIENTO/etc. antes de tocar cualquier archivo.
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

**Regla de texto/ícono sobre fondo de módulo (aprendizaje de esta sesión):** cuando el accent de un módulo es claro/suave (como TURNO `#C59B6D`), el texto e íconos pequeños sobre fondo claro **reutilizan el accent mismo**, NO el color de borde (`--mod-border`). El borde está pensado para trazos sutiles de 1px, no para legibilidad de texto — usarlo como color de texto produce bajo contraste casi invisible. Se probó primero un cuarto tono oscuro dedicado (`#8A6A45`) pero Fernando prefirió simplificar reusando el accent (opción 1). Esto corrigió una regresión real introducida en `CashWorkspace.tsx` y evitada a tiempo en `SupervisionCajaWorkspace.tsx`.

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
| `AutorizacionEjecucionCard.tsx` | `modules/cash/` | TURNO (usado dentro de `CashWorkspace.tsx` cuando hay autorización supervisora pendiente) | `--dv-mod-turno` — **confirmado esta sesión** |

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

### Auditoría final TURNO/CAJA — bloque cerrado esta sesión
A pedido explícito de Fernando ("no debe quedar ninguna deuda o inconsistencia en este módulo o bloque"), se hizo una segunda pasada de auditoría sobre los 8 archivos tocados hoy más el shell de CONFIG, y se resolvieron dos hallazgos adicionales:

- **`ConfigWorkspace.tsx`** tenía `#697387` hardcodeado (~52 ocurrencias) pese a ser el shell padre que rutea a `RolesOperacionalesWorkspace`/`OperadoresWorkspace`/`CajasWorkspace`, ya migrados a `--dv-mod-config` (`#4A5265`) — el padre no combinaba con sus propios hijos. Migrado en esta sesión. `#c4a87c` (badge "default {rubro}") y todos los colores de estado (verde/rojo/ámbar/naranja) quedaron intactos por ser semánticamente distintos a identidad de módulo.
- **`--dv-mod-turno-border`** (`#EAD4B9`) en `index.css` estaba definido pero sin ningún uso real en el código — todos los bordes de TURNO usan accent + opacidad (`border-[#C59B6D]/50`) en lugar del token de borde independiente. **Eliminado del sistema de tokens** por decisión de Fernando: el patrón real del proyecto es accent+opacidad, no un trío accent/bg/border. Pendiente verificar si el mismo patrón de "borde-token no usado" se repite en los demás módulos (`--dv-mod-ventas-border`, etc.) durante el pase de limpieza global (punto 7) — no se asumió ni se tocó nada fuera de TURNO en esta sesión.

Quedó identificado pero **deliberadamente sin resolver** (ver DEUDA TÉCNICA arriba): la divergencia `#dc2626` vs `--dv-color-danger`, por ser una decisión de sistema completo y no de este bloque.

Con esto, TURNO/CAJA (token base, `OperationalBar`, `CashWorkspace`, `SupervisionCajaWorkspace`, `AutorizacionEjecucionCard`, `RolesOperacionalesWorkspace`, `OperadoresWorkspace`, `CajasWorkspace`, `ConfigWorkspace`) queda visual y estructuralmente consistente.

---

## PRÓXIMA VENTANA DE TRABAJO

Retomar migración de tokens `--dv-*` a workspaces restantes. Orden acordado: **TURNO/CAJA primero**, ya en curso:

1. ~~Aplicar `--dv-mod-config` a `RolesOperacionalesWorkspace.tsx`, `OperadoresWorkspace.tsx`, `CajasWorkspace.tsx`~~ — **COMPLETADO esta sesión**, commit `d96e54f`. Hallazgo relevante: el supuesto inicial (los tres usaban `#697387`) era incorrecto — solo `RolesOperacionalesWorkspace.tsx` usaba `#697387`; `OperadoresWorkspace.tsx` y `CajasWorkspace.tsx` usaban en realidad `#2A7CA8` (accent) y `#1a5f7a` (variante de texto), ambos unificados a `--dv-mod-config` (`#4A5265`) sin crear una segunda variante de texto. No se tocaron `#2154d8` (superficie de "autorización supervisora", estado operacional distinto de identidad de módulo), `#dc2626` (acciones destructivas, diverge de `--dv-color-danger` existente — frente separado, no resuelto), ni `#005BE3` (botón EDITAR, decisión `--dv-color-edit` sigue pendiente, ver punto 2).
2. Decidir `--dv-color-edit` (botón EDITAR, `#005BE3`) — pendiente, no resuelto
3. ~~`CashWorkspace.tsx` (149 KB)~~ — **COMPLETADO esta sesión**, commit `efb28ac`. Hallazgo relevante: esta es la pantalla principal de TURNO (apertura/cierre/movimientos/sucesos — lo que el operador ve el 90% del tiempo) y tenía una **tercera identidad hardcodeada** propia (`#CA6F1E`/`#FEF9E7`/`#7D3C0E`, 40 ocurrencias), distinta tanto del token viejo de `index.css` como del refinado esta sesión. Migrada a `#C59B6D`/`#FFF5E6`/`#EAD4B9`. Se catalogaron los 73 hex distintos del archivo antes de tocar nada; el resto (autorización `#2154d8`/`#1a44be`, verde nuevo/confirmar, rojo destructivo, colores de `pasosCaja`, neutros) quedó intacto — verificado por catálogo completo antes/después, no solo por conteo puntual.
4. ~~`SupervisionCajaWorkspace.tsx`, `AutorizacionEjecucionCard.tsx`~~ — **COMPLETADO esta sesión**, commit `0a3e729`. `SupervisionCajaWorkspace.tsx` confirmado TURNO, mismo trío viejo que `CashWorkspace.tsx` (`#CA6F1E`/`#FEF9E7`/`#7D3C0E`) migrado a la paleta refinada. `AutorizacionEjecucionCard.tsx` confirmado TURNO también — pero su contenedor exterior usaba `#2A7CA8`/`#F2F7FA` (remanente de estilo copiado de Cajas/Operadores), migrado a `#C59B6D`/`#FFF5E6`; su contenido interno (`#2154d8`, superficie "autorización") quedó intacto por ser un concepto distinto a identidad de módulo. **Hallazgo importante de este pase:** el mapeo original `#7D3C0E → #EAD4B9` (definido para TURNO en el punto 3) era incorrecto — `#7D3C0E` cumplía rol de texto/ícono legible, no de borde; usar el border-tone ahí producía bajo contraste. Corregido en el mismo commit (`#EAD4B9` → `#C59B6D` en ambos archivos, incluyendo `CashWorkspace.tsx` que ya estaba commiteado con el error). Ver regla nueva en "Sistema de tokens" arriba.
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
