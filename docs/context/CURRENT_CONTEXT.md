# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 01 Jul 2026
**Commit activo:** `eb9b89d` — "refactor(design-tokens): unificar --dv-color-danger a #DC2626, eliminar tokens -border sin uso, migrar identidad COMPROBANTES a #7B4F6E" (verificado limpio: `git status --short` sin cambios, `npx tsc --noEmit` sin errores)

---

## DEUDA TÉCNICA REGISTRADA

- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — mapea a `--dv-color-new`, pendiente aplicar
- Botón EDITAR usa `#005BE3` hardcodeado en varios workspaces (`OperadoresWorkspace.tsx`, `CajasWorkspace.tsx`, `RolesOperacionalesWorkspace.tsx`, link "Cambiar" del PIN), sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit` o no: **todavía no tomada**.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT` y `MODULE_BG` como objetos JS hardcodeados con los 7 colores de módulo, **sin consumir los tokens `--dv-mod-*` de `index.css`** — dos fuentes de verdad independientes que pueden desincronizarse (ya ocurrió con el refinamiento de paleta TURNO). Pendiente refactor: que este archivo lea `var(--dv-mod-*)` en lugar de duplicar los hex. Afecta los 7 módulos.
- **Auditoría estática de color incompleta en CONFIG y resto de ABASTECIMIENTO.** El pase de limpieza global (punto 7, completado esta sesión) auditó a fondo TURNO/CAJA/CONFIG-shell/VENTAS/CLIENTES/REPORTES/COMPROBANTES, pero encontró — sin buscarlo — que COMPROBANTES tenía una identidad de color completa (`#C05050`/`#FBF4F4`) que nadie había registrado ni migrado nunca. Eso significa que `CapacidadesWorkspace.tsx`, `CatalogoWorkspace.tsx` (CONFIG) y el resto de ABASTECIMIENTO que no se tocó a este nivel de detalle (`CatalogoFarmaciaWorkspace.tsx`, `IngresosMercaderiaWorkspace.tsx`, `ProveedoresWorkspace.tsx`, `InventarioFarmaciaWorkspace.tsx`, `PrincipiosActivosWorkspace.tsx` — solo se migró su identidad de módulo en una sesión anterior, no se auditó exhaustivamente) podrían tener su propio "COMPROBANTES escondido". No confirmado ni descartado — pendiente de auditoría.
- Exclusiones deliberadas de la migración de rojo destructivo (punto 7, no son bugs, son decisiones documentadas de esa sesión): `LEVEL_CFG.regularización` en `RolesOperacionalesWorkspace.tsx` sigue con `bg-red-50`/`text-red-600` (no estaba en el alcance confirmado); `ReportesWorkspace.tsx` línea ~598 (badge "N anulaciones en el período") sigue con `bg-red-50 text-red-600`; en `ComprobantesWorkspace.tsx` quedaron intactos `hover:bg-red-100`, `text-red-500` (ícono `AlertTriangle`), `focus:border-red-400` y `bg-red-300` (estado disabled) por no tener token equivalente definido.

---

## DECISIONES DE DISEÑO ACTIVAS

### Tipografía — doctrina formal
Definida en `docs/design-system/typography.md`. Fuente única del proyecto: **Inter Tight Variable** (`@fontsource-variable/inter-tight`), aplicada vía `--font-sans` en `index.css`. Reemplazó a Inter (fuente previa) tras evaluación comparativa con mockup — elegida por proporciones más condensadas, ideales para la densidad operacional del proyecto, sin perder la altura-x ni los pesos variables de la familia original.

### Sistema de tokens de color `--dv-*`
Definido en `apps/vendor-desktop/src/index.css`. **43 tokens** en cuatro grupos:
- Estructurales: `--dv-surface-base/panel/field`, `--dv-border/border-strong`, `--dv-text-primary/secondary/muted`
- Acciones: `--dv-color-confirm` (verde sólido `#3B6B34`, confirmar/cerrar), `--dv-color-new` (verde outline `#45b356`, iniciar/crear), `--dv-color-danger` (`#DC2626`, **actualizado esta sesión**, antes `#8B3A2A`) + `--dv-color-danger-dark` (`#B91C1C`, **token nuevo esta sesión**, variante hover) + `-bg`/`-border`, `--dv-color-exit-*`
- Identidad de módulo: `--dv-mod-ventas/abastecimiento/turno/config/clientes/reportes/comprobantes`. De estos, **solo `--dv-mod-abastecimiento` conserva `-bg` y `-border`** (`DetalleProducto.tsx` los consume activamente — es el único módulo con ese patrón real en código). Los `-border` de ventas/config/clientes/reportes/comprobantes **se eliminaron esta sesión** por no tener ningún uso real: todo el resto del proyecto usa accent+opacidad (`border-[#hex]/40`) en vez del trío accent/bg/border.
- Inputs: `--dv-input-bg/border/border-focus/ring-focus/text/placeholder`

**Paleta de identidad confirmada:**
- TURNO: `#C59B6D` · bg `#FFF5E6`
- VENTAS: `#128C7E` · bg `#E2F3F0`
- ABASTECIMIENTO: `#3B6B34` · bg `#E8F0E6` · border `#A8C9A0` (único módulo con border-token activo, ver arriba)
- CLIENTES: `#1E7E4F` · bg `#F0FAF4`
- REPORTES: `#5C5FA8` · bg `#ECEDF5`
- COMPROBANTES: `#7B4F6E` · bg `#F0EAF0` (**el shell/nav ya usaba este valor correctamente; lo que estaba desincronizado era la pantalla interna `ComprobantesWorkspace.tsx`, que usaba `#C05050`/`#FBF4F4` — corregido esta sesión**)
- CONFIG: `#4A5265` · bg `#EAECF0`

**Regla de texto/ícono sobre fondo de módulo:** cuando el accent de un módulo es claro/suave, el texto e íconos pequeños sobre fondo claro reutilizan el accent mismo, NO el color de borde (`--mod-border`). El borde está pensado para trazos sutiles de 1px, no para legibilidad de texto.

**Regla de "hex literal espejo del token" (confirmada y reforzada esta sesión):** ningún workspace (excepto `DetalleProducto.tsx`) consume `var(--dv-mod-*)` directamente — cada archivo usa el hex literal que coincide con el valor del token, incluyendo variantes con opacidad Tailwind (`border-[#128C7E]/40`). Esto es intencional, no deuda: permite opacidad modificable vía Tailwind, algo que no funciona de forma confiable sobre `var()` con hex plano. `index.css` es la fuente de verdad para lectura humana y para los pocos componentes que sí usan `var()` (`DetalleProducto.tsx`); los workspaces son espejos deliberados.

**Nota sobre `--dv-color-exit`:** token distinto de identidad de módulo, no debe compartir valor con ningún accent de módulo.

**Regla de uso:** color de módulo solo en barra de acento del header, ícono activo en OperationalBar y botón primario del módulo. Nunca en bordes de inputs ni fondos de superficie.

**Regla de acción verde:** `--dv-color-new` (outline) = iniciar/crear algo nuevo. `--dv-color-confirm` (sólido) = confirmar/cerrar una acción existente. No son intercambiables.

**Regla de rojo destructivo (confirmada esta sesión):** `--dv-color-danger` (`#DC2626`) es el único rojo destructivo del sistema. Se expresa de tres formas equivalentes en código — hex literal (`#dc2626`/`#DC2626`), clase Tailwind (`text-red-600`/`bg-red-50`/`border-red-200`, que resuelven exactamente a los mismos hex por casualidad de la paleta por defecto de Tailwind) — y ambas coexisten hoy. La migración de esta sesión unificó el token y las ocurrencias auditadas de la capa Tailwind en los archivos tocados; no se hizo un barrido completo del proyecto (ver DEUDA TÉCNICA, exclusiones deliberadas).

### Mapa real de módulo por archivo
La ubicación de carpeta **no** determina la identidad de módulo — el ruteo real en `App.tsx` + `OperationalBar.tsx` + `ConfigWorkspace.tsx` sí:

| Archivo | Carpeta física | Módulo real | Token de identidad |
|---|---|---|---|
| `CashWorkspace.tsx` | `modules/cash/` | TURNO | `--dv-mod-turno` |
| `SupervisionCajaWorkspace.tsx` | `modules/cash/` | TURNO (sub-tab de cash) | `--dv-mod-turno` |
| `RolesOperacionalesWorkspace.tsx` | `modules/config/` | CONFIG | `--dv-mod-config` |
| `OperadoresWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `CajasWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `AutorizacionEjecucionCard.tsx` | `modules/cash/` | TURNO (usado dentro de `CashWorkspace.tsx`) | `--dv-mod-turno` |

`RolesWorkspace.tsx` (`modules/cash/`) era código huérfano — eliminado (commit `79143f6`).

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

### Doctrina multi-rubro (`docs/00-governance/GLOSARIO.md` §2-3)
`farmacia/` es un dominio específico de rubro, **no** el nombre genérico de abastecimiento. ABASTECIMIENTO es la categoría/módulo contenedor multi-rubro (núcleo estándar compartido — navegación, identidad de color `--dv-mod-abastecimiento`). `farmacia/` es hoy su único inquilino. Futuros rubros irán como `abastecimiento/<rubro>/` hermano (UI) y `domains/<rubro>/` hermano (lógica de dominio) — nunca dentro de `farmacia/`. El color no se subdivide por rubro.

### Punto 7 — limpieza global de remanentes de color — completada esta sesión
Commit `eb9b89d`. Alcance real fue 6 archivos (no 4 como estaba estimado) — apareció un hallazgo no previsto durante la auditoría:

- **`OperationalBar.tsx`** — los dos remanentes de color puro sin token (`#201E1E` en opciones secundarias inactivas de `renderOpcion`, `#121416` en label de módulo inaccesible) migrados a `var(--dv-text-primary)`.
- **`--dv-color-danger`** unificado a `#DC2626`/`#B91C1C`/`#FEF2F2`/`#FECACA` (ver "Sistema de tokens" arriba). Migrada también la capa Tailwind equivalente en `CajasWorkspace.tsx`, `ReportesWorkspace.tsx`, `ComprobantesWorkspace.tsx`, `RolesOperacionalesWorkspace.tsx` (ocurrencia puntual en `codeError`) — con exclusiones deliberadas documentadas en DEUDA TÉCNICA.
- **Tokens `--dv-mod-*-border` sin uso** eliminados de `index.css`: ventas, config, clientes, reportes, comprobantes. **`--dv-mod-abastecimiento-border` se mantuvo** — verificado que `DetalleProducto.tsx` lo consume activamente junto con `--dv-color-danger-border`/`-bg` y `--dv-color-exit-border` (es el único componente del proyecto que usa `var()` para estos tokens en vez de hex literal espejo).
- **Hallazgo D, no estaba en el radar:** `ComprobantesWorkspace.tsx` nunca había pasado por ninguna migración de identidad de módulo — usaba `#C05050`/`#FBF4F4`, sin relación con el token congelado `--dv-mod-comprobantes` (`#7B4F6E`/`#F0EAF0`) que el nav bar (`OperationalBar.tsx`) sí usa correctamente. A diferencia de CLIENTES (donde el código tenía razón y el token estaba desactualizado), acá el token estaba bien y el código nunca se tocó — probablemente porque COMPROBANTES no apareció en la cola de migración de sesiones anteriores (que cubrió TURNO/CONFIG/ABASTECIMIENTO/VENTAS, nunca COMPROBANTES). Migrado a `#7B4F6E`/`#F0EAF0`.

Todos los cambios auditados archivo por archivo vía filesystem antes de aprobar `tsc`/commit — el reporte de Codex resultó preciso en esta ocasión (sin discrepancias entre lo reportado y el estado real de los archivos).

---

## PRÓXIMA VENTANA DE TRABAJO

1. Decidir `--dv-color-edit` (botón EDITAR, `#005BE3`) — pendiente
2. Aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx` — pendiente
3. Auditoría estática de color en CONFIG (`CapacidadesWorkspace.tsx`, `CatalogoWorkspace.tsx`) y resto de ABASTECIMIENTO (`CatalogoFarmaciaWorkspace.tsx`, `IngresosMercaderiaWorkspace.tsx`, `ProveedoresWorkspace.tsx`, `InventarioFarmaciaWorkspace.tsx`, `PrincipiosActivosWorkspace.tsx`) — descartar o confirmar si repiten el patrón "COMPROBANTES escondido" encontrado en el punto 7
4. Refactor `OperationalBar.tsx`: que `MODULE_ACCENT`/`MODULE_BG` lean `var(--dv-mod-*)` en vez de duplicar hex
5. Evaluaciones visuales en app real (NuevoProductoStepper, flujos CORREGIR/DESACTIVAR)
6. Prueba end-to-end IngresosMercaderiaWorkspace
7. Brecha 8: registro de sustancias controladas/psicotrópicos (identificada, no implementada)
8. Laboratorios master table (decisión pendiente: tabla maestra vs texto libre)
9. `BoxSlotType → TipoCaja` naming migration
10. `Operador.codigo` cleanup

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo
2. Confirmar con Fernando la prioridad de la próxima ventana (el pase de limpieza global de color, punto 7 del historial, quedó cerrado esta sesión — la continuación natural sería la auditoría estática pendiente de CONFIG/ABASTECIMIENTO, punto 3 de arriba, pero no asumir sin confirmar)
3. Leer filesystem antes de diseñar cualquier prompt — no asumir identidad de módulo por ubicación de carpeta, verificar ruteo real en `App.tsx`/`OperationalBar.tsx`
