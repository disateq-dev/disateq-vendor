# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 08 Jul 2026
**Commit activo en `main`:** `8ff0f31` — "feat(farmacia): ubicacion fisica de venta en HOV, crear desde stepper y corregir desde ficha"

## Estado — sin trabajo pendiente de commitear

Todo lo diseñado y ejecutado en la sesión del 08 Jul 2026 quedó commiteado y verificado por filesystem, con confirmación explícita en chat (salida real de `git commit`) para cada uno. Cadena completa, más reciente primero:

```
8ff0f31 feat(farmacia): ubicacion fisica de venta en HOV, crear desde stepper y corregir desde ficha
86eca61 feat(farmacia): conectar Catalogo Maestro DIGEMID al Paso 1 del Stepper de registro MEDICAMENTO
2a89b02 fix(catalogo): normalizar prefijo de ruta extendida de Windows en ATTACH DATABASE del catalogo maestro
1c6daaa fix(farmacia): reordenar stepper MEDICAMENTO por orden operacional logico
b4f6b3a feat(catalogo): adjuntar Catalogo Maestro DIGEMID en modo solo lectura
14e51b6 fix(farmacia): retiro/reactivacion simetrica de HOV en baja suave
77f223f feat(farmacia): borrado fisico condicionado para producto_comercial
d161a22 feat(catalog): incorporar Catalogo Maestro Regulatorio DIGEMID (solo lectura)
fa5d6dc feat(catalog): puente HOV Farmacia -> Ventas (Camino A)
```

---

## DEUDA TÉCNICA REGISTRADA

- **Nueva (08 Jul 2026) — `useIngresosMercaderia.ts` no proyecta a HOV.** `onGuardarProductoYAgregarLinea` (registro de producto nuevo desde Ingresos de Mercadería) hace `crearProductoCompleto` → `crearPresentacion` → `crearNodo`, igual que el flujo del Catálogo, pero **nunca llama a `proyectarAHov`**. Un producto creado desde Ingresos no aparece en la búsqueda de VENTAS hasta que alguien lo toque desde el Catálogo. No es deuda de naming, es una brecha funcional real. Requiere su propia sesión de diseño — no se tocó hoy.
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — mapea a `--dv-color-new`, pendiente aplicar
- Botón EDITAR usa `#005BE3` hardcodeado en varios workspaces, sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit`: todavía no tomada.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT`/`MODULE_BG` hardcodeados, sin consumir `--dv-mod-*`. Decisión vigente: dejarlo para el final del hilo de color.
- `InventoryWorkspace.tsx` conserva `#2A7CA8` (highlight puntual) — evaluado y descartado como remanente.
- Exclusiones deliberadas de la migración de rojo destructivo (documentadas): `RolesOperacionalesWorkspace.tsx`, `ReportesWorkspace.tsx` (~línea 598), `ComprobantesWorkspace.tsx`.
- **Doctrina de botones (`ARQUITECTURA_UX.md`) desactualizada frente a `index.css`**: "Sólido verde = confirmar" con `#45b356` en el documento, vs. `--dv-color-confirm: #3B6B34` distinto de `--dv-color-new: #45b356` en el token. ABASTECIMIENTO sigue la doctrina vieja, `DetalleProducto.tsx` sigue el token nuevo. **Dato adicional confirmado 08 Jul 2026:** el color real en código de ABASTECIMIENTO/Farmacia es `#1E88C7` (verificado en `NuevoProductoStepper.tsx` y `CatalogoFarmaciaWorkspace.tsx`), no `#3B6B34` como afirma `ARQUITECTURA_UX.md` §8 para ese módulo — la divergencia es más amplia de lo que el documento reconoce. No resuelto.
- `ServicioFarmacia`/`crear_servicio_farmacia` (Rust) quedan con su nombre actual — la promoción de Servicio a `domains/catalog/` es solo de la capa TypeScript; renombrar el backend Rust es migración aparte, fuera de alcance hasta que un segundo rubro lo necesite.
- Warnings preexistentes en `cargo check`, no generados por esta sesión: campos `unit_price` y `tipo_documento` nunca leídos (módulo no identificado todavía — pendiente de localizar cuando se audite el módulo correspondiente).
- `CatalogoFarmaciaWorkspace.tsx` → botón "Agregar forma de venta" en `PresentacionesTab` sigue siendo `window.alert('Nueva forma de venta pendiente')`, sin implementar. Ya declarado, no resuelto.

---

## DECISIONES DE DISEÑO ACTIVAS

### Política "cero deuda técnica"
Al intervenir un módulo, no debe quedar deuda técnica ni residuos sin resolver dentro del alcance tocado. No se cierra una auditoría con hallazgos sueltos.

### Doctrina de separación cromática módulo vs. comando
El color de identidad de módulo nunca coincide con el color de un botón de comando. Todo color de módulo: denso (accent) + atenuado (bg).

### Tipografía
`docs/design-system/typography.md`. Inter Tight Variable, vía `--font-sans`.

### Sistema de tokens `--dv-*`
`apps/vendor-desktop/src/index.css`, 38+ tokens. Paleta vigente: TURNO `#C59B6D`, VENTAS `#128C7E`, ABASTECIMIENTO `#1E88C7` (bg `#E3F1FA`, border `#A0CFE8`), CLIENTES `#1E7E4F`, REPORTES `#5C5FA8`, COMPROBANTES `#7B4F6E`, CONFIG `#4A5265`.

### Doctrina multi-rubro (`GLOSARIO.md` §2-3)
`farmacia/` es dominio específico de rubro, no genérico de abastecimiento. Resto de rubros usa `InventoryWorkspace.tsx` genérico hasta tener dominio propio.

### `CONTRATO_ARQUITECTURA.md` no existe — confirmado de nuevo 08 Jul 2026
No es un archivo perdido ni renombrado: nunca se creó. Es residuo de la plantilla de apertura de sesión que Fernando reutiliza. Documentos rectores reales: `ARQUITECTURA_UX.md` y `GLOSARIO.md`. Ya registrado en memoria de Claude para no volver a preguntarlo — pendiente que Fernando edite su plantilla de apertura si quiere quitar la mención definitivamente.

### Doctrina de borrado en Farmacia — IRREVOCABLE, confirmada 07 Jul 2026
Nunca borrado duro salvo condición estricta: **sin movimientos NI lotes registrados** (`verificar_historial_producto` verifica ambas tablas). Con historial → baja suave (`estado = INACTIVO`, reversible, HOV retirada/reactivable). Sin historial → borrado físico completo, transaccional en cascada.

### Puente HOV Farmacia → Ventas — completo, simétrico y ahora extendido con ubicación física
`HOV.productoId = ProductoComercial.id`, `HOV.nodoFraccionamientoId = NodoFraccionamiento.id`. Alta (`proyectarAHov`), baja suave (`retirarHovsDeProducto`), reactivación (`reactivarHovsDeProducto`), borrado físico. Validado end-to-end en la app real. **Nota de alcance conocida:** este puente solo se ejercita desde el flujo del Catálogo — el flujo de Ingresos de Mercadería no lo llama (ver Deuda Técnica).

### NuevoProductoStepper — orden operacional MEDICAMENTO
Paso 1 = Identificación (nombre comercial, fabricante, titular, país). Paso 2 = Composición y uso clínico. `terminoBusqueda` precarga `nombreComercial`. PRODUCTO_GENERAL y SERVICIO ya tenían el orden correcto.

### Catálogo Maestro Regulatorio DIGEMID — conectado, validado en runtime con datos reales (08 Jul 2026)
`catalogo_digemid.sqlite` (~13 MB, 18,397 medicamentos) adjuntado vía `ATTACH DATABASE`. Conectado al Paso 1 del Stepper MEDICAMENTO: autocompleta fabricante, titular, registro sanitario, código DIGEMID, IFA/dosis (con soporte de combinaciones multi-principio-activo), y forma farmacéutica (mapeo best-effort vía `mapeo-forma-digemid.utils.ts`, fallback seguro a `OTRO`). `estadoRegistroSanitario` deliberadamente **nunca** se autocompleta — solo se muestra la `situacion` DIGEMID como referencia visual, por riesgo regulatorio de un mapeo automático incorrecto. Validado en `cargo tauri dev` con búsqueda real de "amoxicilina": 18+ coincidencias, prellenado correcto confirmado en los 4 pasos del Stepper.

**Bug de infraestructura encontrado y corregido en el camino:** el `ATTACH DATABASE` fallaba siempre en Windows (`invalid uri authority: ?`) porque `resource_dir()` devuelve rutas con prefijo de ruta extendida `\\?\`, que al convertirse a URI (`file://...`) hacía que SQLite interpretara `?` como el authority de la URI. Fix: `ruta_str.strip_prefix(r"\\?\")` antes de construir el URI, en `lib.rs`. Afecta tanto dev como producción — no era un problema exclusivo del entorno de desarrollo.

### Ubicación física de venta — implementada (08 Jul 2026)
Vive en `HOV.ubicacionFisica` (texto libre, opcional) — no en `ProductoComercial` (demasiado fijo, no varía por forma de venta) ni en `NodoFraccionamiento` (tipo congelado, pendiente de rediseño de `FormaVenta`, ver `GLOSARIO.md` §11). Sin enum de sistema: cada establecimiento determina su propia nomenclatura ("Anaquel 3", "Vitrina refrigerada", etc.), con autocompletado (`obtenerUbicacionesFisicasSugeridas`) basado en valores ya usados por ese mismo establecimiento, ordenados por frecuencia de uso. Se captura al crear (Paso 4 del Stepper, junto al nodo raíz) y se corrige después desde la ficha de detalle (`PresentacionesTab`, patrón Editar/Guardar/Cancelar por nodo vendible). Aplica típicamente al nodo raíz (`PRESENTACION_ORIGINAL`) pero está disponible en cualquier nodo vendible sin restricción forzada.

### Auditoría ABASTECIMIENTO completa — sesión 02 Jul 2026
Recolor verde→azul (18 archivos), bordes de input corregidos, botones de comando migrados a verde doctrinal, inconsistencia SUNAT resuelta. Commiteado en `d7e09ab`/`cde45b6`/`e809768`.

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Revisión funcional de PRESENTACIONES** (`PresentacionesTab`) — nunca probada con datos reales de punta a punta, incluye ahora la edición de ubicación física recién agregada.
2. **Revisión funcional de PRECIOS** (`PreciosTab`) — crear/editar valores operacionales (base, mayoreo, cliente frecuente, promoción), lógica compleja nunca ejercitada en runtime.
3. **Revisión funcional del registro de PRODUCTO_GENERAL** (Stepper, 2 pasos) — nunca probado.
4. **Revisión funcional del registro de SERVICIO** (Stepper, 1 paso) — nunca probado.
5. **Diseñar cómo `useIngresosMercaderia.ts` debe proyectar a HOV** — hoy un producto creado desde Ingresos nunca aparece en VENTAS.
6. Implementar Servicio como concepto compartido en `domains/catalog/` (decisión confirmada, no implementada — `NuevoProductoStepper.guardarServicio()` sigue fabricando un `ProductoComercial` falso)
7. Diseñar flujo de "Pendientes de Revisión" (151) y "No Farmacéuticos" (1,248) del Catálogo Maestro
8. Implementar "Agregar forma de venta" en `PresentacionesTab` (hoy `window.alert` sin funcionalidad)
9. Decidir `--dv-color-edit` (`#005BE3`)
10. Aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx`
11. Refactor `OperationalBar.tsx` a `var(--dv-mod-*)`
12. Resolver contradicción `ARQUITECTURA_UX.md` vs. `index.css`/código real sobre color de confirmación y color de ABASTECIMIENTO
13. Brecha 8 DIGEMID (sustancias controladas/psicotrópicos)
14. Laboratorios master table, `BoxSlotType → TipoCaja`, `Operador.codigo` cleanup
15. Auditoría profunda de CONFIG, TURNO, COMPROBANTES, CLIENTES, REPORTES, VENTAS
16. Localizar el módulo de los warnings `unit_price`/`tipo_documento` (preexistentes, no urgentes)

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo completo
2. Confirmar con Fernando la prioridad de la próxima ventana — no asumir
3. Leer filesystem antes de diseñar cualquier prompt — verificar ruteo real
4. Aplicar política de cero deuda técnica: componentes reales, no solo archivo raíz
5. Antes de dar por buena una pieza de datos externa, verificar con consultas reales contra el archivo — no confiar solo en su documentación
6. **Antes de escribir este documento al cierre de sesión, verificar `git log --oneline` y `git status --short` reales — no asumir que un commit propuesto se ejecutó si no se vio confirmación explícita en el chat**
7. **Si Codex se detiene por un consumidor ambiguo de una función, auditar ese consumidor directamente antes de reescribir el prompt — puede ser un falso positivo por coincidencia de nombre (ver sesión 08 Jul 2026, `onGuardarProductoYAgregarLinea` vs `onGuardarProducto`)**
