# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 02 Jul 2026
**Commit activo:** pendiente — sesión completa (recolor ABASTECIMIENTO + doctrina de botones/inputs), verificada limpia (`npx tsc --noEmit` sin errores en todos los pasos). Fernando debe actualizar este hash tras `git commit`.

---

## DEUDA TÉCNICA REGISTRADA

- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — mapea a `--dv-color-new`, pendiente aplicar
- Botón EDITAR usa `#005BE3` hardcodeado en varios workspaces (`OperadoresWorkspace.tsx`, `CajasWorkspace.tsx`, `RolesOperacionalesWorkspace.tsx`, link "Cambiar" del PIN, y también en `InventoryWorkspace.tsx` — filtro/botón "ajuste" y botón "Aplicar" de reconciliación), sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit` o no: **todavía no tomada**.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT` y `MODULE_BG` como objetos JS hardcodeados con los 7 colores de módulo, **sin consumir los tokens `--dv-mod-*` de `index.css`** — dos fuentes de verdad independientes que pueden desincronizarse (ya ocurrió con TURNO, CapacidadesWorkspace, ComprobantesWorkspace y ahora ABASTECIMIENTO). Pendiente refactor: que este archivo lea `var(--dv-mod-*)` en lugar de duplicar los hex. Afecta los 7 módulos. **Decisión vigente: dejarlo para el final del hilo de color**, una vez que la paleta esté 100% confirmada y quieta.
- `InventoryWorkspace.tsx` conserva `#2A7CA8` (un solo uso, texto "Ingreso reciente" en `DisponibilidadCard`) — evaluado y descartado como identidad de módulo (es un highlight puntual de estado), no como remanente.
- Exclusiones deliberadas de la migración de rojo destructivo (no son bugs, son decisiones documentadas): `LEVEL_CFG.regularización` en `RolesOperacionalesWorkspace.tsx` sigue con `bg-red-50`/`text-red-600`; `ReportesWorkspace.tsx` línea ~598 (badge "N anulaciones en el período") sigue con `bg-red-50 text-red-600`; en `ComprobantesWorkspace.tsx` quedaron intactos `hover:bg-red-100`, `text-red-500` (ícono `AlertTriangle`), `focus:border-red-400` y `bg-red-300` (estado disabled) por no tener token equivalente definido.
- **Doctrina de botones de comando (`ARQUITECTURA_UX.md`) desactualizada frente a `index.css`**: el documento dice "Sólido verde = confirmar" usando `#45b356`, pero `index.css` define `--dv-color-confirm: #3B6B34` como un token distinto de `--dv-color-new: #45b356`, "no intercambiables" según `CURRENT_CONTEXT.md`. Los archivos de `abastecimiento/farmacia/` siguen la doctrina vieja (`#45b356` para confirmar) y `DetalleProducto.tsx` sigue el token nuevo (`#3B6B34`) — dos convenciones conviviendo sin reconciliar. **No resuelto esta sesión** — se dejó `#45b356` en ABASTECIMIENTO porque es la convención ya usada de forma consistente en el módulo (`IngresosMercaderiaWorkspace`, `InventarioFarmaciaWorkspace`, `PrincipiosActivosWorkspace`), pero la contradicción entre documento y token global sigue sin decisión.

---

## DECISIONES DE DISEÑO ACTIVAS

### Política "cero deuda técnica" — gobernanza de auditorías (nueva, 02 Jul 2026)
**Decisión de Fernando, aplica retroactivamente a cómo se audita cualquier módulo:** al intervenir un módulo, no debe quedar deuda técnica, código obsoleto/huérfano ni colores/residuos sin resolver dentro del alcance tocado. No se cierra un módulo como "auditado" si quedan hallazgos sueltos, aunque sean menores o aparezcan fuera del prompt original. Esta sesión encontró dos veces que un prompt de Codex, aunque ejecutado correctamente, no cubría el 100% del patrón (la función `claseRuc()` en `ConsultaSunatProveedor.tsx` y el input de "alerta desde" en `ItemRow` de `InventoryWorkspace.tsx`) — ambos se cerraron antes de dar la sesión por terminada, en vez de registrarlos como pendientes.

### Doctrina de separación cromática módulo vs. comando (nueva, 02 Jul 2026)
**Regla irrevocable:** el color de identidad de un módulo nunca puede coincidir ni acercarse al color de un botón de comando (confirmar, nuevo, cancelar/salir, destructivo). Son dos sistemas de significado distintos. Motivó el recolor completo de ABASTECIMIENTO — el verde `#3B6B34` de identidad de módulo coincidía exactamente con `--dv-color-confirm`. Todo color de módulo se expresa en dos valores: denso (accent) + atenuado hacia blanco (bg) — patrón ya existente en los 7 módulos, ahora formalizado como regla obligatoria para cualquier color nuevo.

### Tipografía — doctrina formal
Definida en `docs/design-system/typography.md`. Fuente única del proyecto: **Inter Tight Variable** (`@fontsource-variable/inter-tight`), aplicada vía `--font-sans` en `index.css`.

### Sistema de tokens de color `--dv-*`
Definido en `apps/vendor-desktop/src/index.css`. **38 tokens** en cuatro grupos:
- Estructurales: `--dv-surface-base/panel/field`, `--dv-border/border-strong`, `--dv-text-primary/secondary/muted`
- Acciones: `--dv-color-confirm` (verde sólido `#3B6B34`), `--dv-color-new` (verde outline `#45b356`), `--dv-color-danger` (`#DC2626`) + `--dv-color-danger-dark` (`#B91C1C`) + `-bg`/`-border`, `--dv-color-exit-*`
- Identidad de módulo: `--dv-mod-ventas/abastecimiento/turno/config/clientes/reportes/comprobantes`. **`--dv-mod-abastecimiento` conserva `-bg` y `-border`** (`DetalleProducto.tsx` los consume activamente vía `var()` — es el único componente con ese patrón real en código; el resto del proyecto usa hex literal espejo con opacidad Tailwind).
- Inputs: `--dv-input-bg/border/border-focus/ring-focus/text/placeholder`. **`--dv-input-border-focus` y `--dv-input-ring-focus` son tokens globales** (mismo valor verde en los 7 módulos, no varían por identidad) — confirmado y aplicado como regla explícita esta sesión tras encontrar que ABASTECIMIENTO usaba su propio accent de módulo en el foco de inputs.

**Paleta de identidad — actualizada 02 Jul 2026:**
- TURNO: `#C59B6D` · bg `#FFF5E6`
- VENTAS: `#128C7E` · bg `#E2F3F0`
- **ABASTECIMIENTO: `#1E88C7` (azul cerúleo) · bg `#E3F1FA` · border `#A0CFE8`** — recolor completo desde verde `#3B6B34`/`#E8F0E6`/`#A8C9A0` (02 Jul 2026). Motivo: doctrina de contraste entre módulos (evitar acumulación de verdes) + colisión directa con `--dv-color-confirm`. Aplicado en 18 archivos: `index.css`, `OperationalBar.tsx`, los 5 `Workspace.tsx` de `abastecimiento/farmacia/`, los 9 componentes de `abastecimiento/farmacia/components/` (excepto `DetalleProducto.tsx`, que hereda vía `var()`), e `InventoryWorkspace.tsx` (identidad ABASTECIMIENTO para rubros no-farmacia).
- CLIENTES: `#1E7E4F` · bg `#F0FAF4`
- REPORTES: `#5C5FA8` · bg `#ECEDF5`
- COMPROBANTES: `#7B4F6E` · bg `#F0EAF0`
- CONFIG: `#4A5265` · bg `#EAECF0`

**Regla de "hex literal espejo del token":** ningún workspace (excepto `DetalleProducto.tsx`) consume `var(--dv-mod-*)` directamente — cada archivo usa el hex literal que coincide con el valor del token. Confirmado consistente tras el recolor de ABASTECIMIENTO.

**Regla de rojo destructivo:** `--dv-color-danger` (`#DC2626`) es el único rojo destructivo del sistema.

**Regla de acción verde:** `--dv-color-new` (`#45b356`, outline) = iniciar/crear. `--dv-color-confirm` (`#3B6B34`, sólido) = confirmar/cerrar en el token global — pero ver DEUDA TÉCNICA arriba: ABASTECIMIENTO usa `#45b356` sólido para confirmar, siguiendo la doctrina de botones de `ARQUITECTURA_UX.md` en vez del token `--dv-color-confirm`. Contradicción no resuelta.

**Regla de uso de color de módulo:** solo en barra de acento del header, ícono activo en OperationalBar y botón primario **de navegación/identidad** — nunca en bordes de inputs, fondos de superficie, ni botones de comando (confirmar/iniciar/cancelar/destructivo). Esta última cláusula se agregó esta sesión tras encontrar el patrón repetido en ABASTECIMIENTO.

**Regla de bordes de input:** siempre `var(--dv-input-border)` en reposo y `var(--dv-input-border-focus)`/`var(--dv-input-ring-focus)` en foco — nunca hex literal de módulo, ni siquiera con opacidad. Incluye estados dinámicos generados por función (ej. validación de RUC), no solo `className` literal — ver caso `claseRuc()` abajo.

### Mapa real de módulo por archivo
La ubicación de carpeta **no** determina la identidad de módulo — el ruteo real en `App.tsx` + `OperationalBar.tsx` + `ConfigWorkspace.tsx` sí.

| Archivo | Carpeta física | Módulo real | Token de identidad |
|---|---|---|---|
| `CashWorkspace.tsx` | `modules/cash/` | TURNO | `--dv-mod-turno` |
| `SupervisionCajaWorkspace.tsx` | `modules/cash/` | TURNO (sub-tab de cash) | `--dv-mod-turno` |
| `RolesOperacionalesWorkspace.tsx` | `modules/config/` | CONFIG | `--dv-mod-config` |
| `CapacidadesWorkspace.tsx` | `modules/config/` | CONFIG | `--dv-mod-config` |
| `OperadoresWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `CajasWorkspace.tsx` | `modules/cash/` | CONFIG (importado por `ConfigWorkspace`) | `--dv-mod-config` |
| `AutorizacionEjecucionCard.tsx` | `modules/cash/` | TURNO (usado dentro de `CashWorkspace.tsx`) | `--dv-mod-turno` |
| `InventoryWorkspace.tsx` | `modules/inventory/` | ABASTECIMIENTO (rubro genérico, `rubro !== 'farmacia'`) | `--dv-mod-abastecimiento` |

`RolesWorkspace.tsx` (`modules/cash/`) y `CatalogoWorkspace.tsx` (`modules/config/`) eran código huérfano — ambos eliminados (commits `79143f6` y `daf1bf4`).

### Ficha producto unificada (CATÁLOGO)
- Vista resumen eliminada — el producto aterriza directo en ficha completa
- Edición inline: misma grilla de lectura se vuelve editable en modo corrigiendo
- Campos críticos bloqueados si `tieneHistorial === true`: condición de venta, refrigerar, vencimiento, IFA
- Código interno bloqueado siempre
- Presentaciones comerciales ocultas en modo corrigiendo
- Footer lectura: PRESENTACIONES / PRECIOS / LIMPIAR

### ComboboxFiltrado — doctrina global
`apps/vendor-desktop/src/components/ComboboxFiltrado.tsx`. Reemplaza todos los `<select>` nativos con más de 5 opciones o que requieran búsqueda. Integrado en `DetalleProducto.tsx`.

### Doctrina multi-rubro (`docs/00-governance/GLOSARIO.md` §2-3)
`farmacia/` es un dominio específico de rubro, **no** el nombre genérico de abastecimiento. ABASTECIMIENTO es la categoría/módulo contenedor multi-rubro (núcleo estándar compartido — navegación, identidad de color `--dv-mod-abastecimiento`). `farmacia/` es hoy su único inquilino con dominio propio; el resto de rubros usa `InventoryWorkspace.tsx` (genérico) hasta que tengan su propio dominio. El color no se subdivide por rubro.

### Auditoría ABASTECIMIENTO completa — sesión 02 Jul 2026 (reemplaza cierre anterior, que fue incompleto)
La auditoría del 01-jul-2026 se dio por cerrada mirando solo los 5 `Workspace.tsx` raíz + `InventoryWorkspace.tsx`. **Nunca se auditaron los 11 componentes reales dentro de `abastecimiento/farmacia/components/`**, que son los que renderizan la mayoría de la UI operativa del módulo. Esta sesión corrigió eso:

1. **Recolor completo verde→azul** (18 archivos) — ver paleta arriba.
2. **Bordes de input con color de módulo** — 9 componentes usaban `border-[#E3F1FA]` (bg del módulo) y `focus:border-[#1E88C7]` (accent del módulo) en vez de los tokens globales de input. Corregido en 10 archivos incluyendo `InventoryWorkspace.tsx` (que tampoco se había revisado a este nivel).
3. **Botones de comando con color de módulo** — `NuevoProductoStepper.tsx` ("Siguiente"/"Guardar"), `BuscadorProductoIngreso.tsx`, `SelectorProveedorIngreso.tsx` (2 botones) e `InventoryWorkspace.tsx` (4 botones: OK/Guardar/Agregar/Separar) usaban el azul de módulo en botones de confirmar/iniciar. Migrados a verde doctrinal (`#45b356` sólido = confirmar, outline = iniciar), decidido caso por caso con Fernando cuando la semántica no era obvia (ej. "Separar" = confirmar porque ejecuta ya; "regístralo ahora" = iniciar porque abre un flujo).
4. **Inconsistencia SUNAT resuelta** — "Consultar SUNAT por RUC" tenía dos tratamientos distintos (outline verde en `BuscadorProveedor.tsx`, sólido azul en `SelectorProveedorIngreso.tsx`); unificado a outline verde en ambos.
5. **Residuo no cubierto por patrón literal** — la función `claseRuc()` en `ConsultaSunatProveedor.tsx` generaba clases dinámicamente (`border-[#1E88C7]` para RUC válido, `border-[#E3F1FA]` por defecto) y no calzaba en los prompts de reemplazo literal. Corregido a mano: válido → `var(--dv-color-confirm)` (semántica de estado, no de módulo), vacío → `var(--dv-input-border)`.
6. **Residuo de paleta aún más antigua, sin relación con ABASTECIMIENTO** — `InventoryWorkspace.tsx` tenía `#2d6b6b`/`#276565`/`#1a4545` en estados hover de botones y pestañas, huérfanos de una generación de color anterior incluso a `#3D8A8A`. Migrados a `#1874A6` (hover del azul nuevo) y `#6b7280` (gris neutro ya usado en el resto del archivo).

**Con esto, ABASTECIMIENTO queda auditado a nivel de componente real, no solo de workspace raíz — precedente para auditar el resto de módulos con el mismo nivel de profundidad (ver política de cero deuda técnica arriba).**

---

## PRÓXIMA VENTANA DE TRABAJO

1. Decidir `--dv-color-edit` (botón EDITAR, `#005BE3`) — pendiente
2. Aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx` — pendiente
3. Refactor `OperationalBar.tsx`: que `MODULE_ACCENT`/`MODULE_BG` lean `var(--dv-mod-*)` en vez de duplicar hex — dejado para el cierre del hilo de color
4. Resolver la contradicción entre `ARQUITECTURA_UX.md` (doctrina de botones, verde `#45b356` = confirmar) y `index.css` (`--dv-color-confirm` = `#3B6B34`, distinto de `--dv-color-new`) — afecta qué verde usan los botones "Guardar" en todo el proyecto, no solo ABASTECIMIENTO
5. Evaluaciones visuales en app real (flujos CORREGIR/DESACTIVAR de `DetalleProducto.tsx` — `NuevoProductoStepper.tsx` ya se auditó a fondo esta sesión)
6. Prueba end-to-end `IngresosMercaderiaWorkspace`
7. Brecha 8: registro de sustancias controladas/psicotrópicos (identificada, no implementada) — probablemente merece sesión dedicada
8. Laboratorios master table (decisión pendiente: tabla maestra vs texto libre)
9. `BoxSlotType → TipoCaja` naming migration
10. `Operador.codigo` cleanup
11. Aplicar el mismo nivel de auditoría profunda (componentes reales, no solo workspaces raíz) a los módulos ya "cerrados": CONFIG, TURNO, COMPROBANTES, CLIENTES, REPORTES, VENTAS — ninguno se ha revisado con el estándar de cero deuda técnica que se estableció hoy

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo
2. Confirmar con Fernando la prioridad de la próxima ventana — no asumir sin confirmar
3. Leer filesystem antes de diseñar cualquier prompt — no asumir identidad de módulo por ubicación de carpeta ni por nombre de archivo, verificar ruteo real en `App.tsx`/`OperationalBar.tsx`/`ConfigWorkspace.tsx`. Si un archivo no aparece en ningún ruteo real, no asumir que es deuda de color — puede ser código huérfano completo
4. **Aplicar la política de cero deuda técnica**: al auditar un módulo, revisar también sus componentes reales (no solo el `Workspace.tsx` raíz), y no cerrar la auditoría si queda algún hallazgo suelto, por menor que sea o esté fuera del prompt original
