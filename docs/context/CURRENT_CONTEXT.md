# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 07 Jul 2026
**Commit activo en `main`:** `1c6daaa` — "fix(farmacia): reordenar stepper MEDICAMENTO por orden operacional logico"

## Estado — sin trabajo pendiente de commitear

Todo lo diseñado y ejecutado en la sesión del 07 Jul 2026 quedó commiteado y verificado por filesystem. Cadena completa de la sesión:

```
1c6daaa fix(farmacia): reordenar stepper MEDICAMENTO por orden operacional logico
b4f6b3a feat(catalogo): adjuntar Catalogo Maestro DIGEMID en modo solo lectura
14e51b6 fix(farmacia): retiro/reactivacion simetrica de HOV en baja suave
77f223f feat(farmacia): borrado fisico condicionado para producto_comercial
d161a22 feat(catalog): incorporar Catalogo Maestro Regulatorio DIGEMID (solo lectura)
fa5d6dc feat(catalog): puente HOV Farmacia -> Ventas (Camino A)
```

`git status --short` limpio al cierre de esta sesión.

---

## DEUDA TÉCNICA REGISTRADA

- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — mapea a `--dv-color-new`, pendiente aplicar
- Botón EDITAR usa `#005BE3` hardcodeado en varios workspaces, sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit`: todavía no tomada.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT`/`MODULE_BG` hardcodeados, sin consumir `--dv-mod-*`. Decisión vigente: dejarlo para el final del hilo de color.
- `InventoryWorkspace.tsx` conserva `#2A7CA8` (highlight puntual) — evaluado y descartado como remanente.
- Exclusiones deliberadas de la migración de rojo destructivo (documentadas): `RolesOperacionalesWorkspace.tsx`, `ReportesWorkspace.tsx` (~línea 598), `ComprobantesWorkspace.tsx`.
- **Doctrina de botones (`ARQUITECTURA_UX.md`) desactualizada frente a `index.css`**: "Sólido verde = confirmar" con `#45b356` en el documento, vs. `--dv-color-confirm: #3B6B34` distinto de `--dv-color-new: #45b356` en el token. ABASTECIMIENTO sigue la doctrina vieja, `DetalleProducto.tsx` sigue el token nuevo. No resuelto.
- `ServicioFarmacia`/`crear_servicio_farmacia` (Rust) quedan con su nombre actual — la promoción de Servicio a `domains/catalog/` es solo de la capa TypeScript; renombrar el backend Rust es migración aparte, fuera de alcance hasta que un segundo rubro lo necesite.
- Warnings preexistentes en `cargo check`, no generados por esta sesión: campos `unit_price` y `tipo_documento` nunca leídos (módulo no identificado todavía — pendiente de localizar cuando se audite el módulo correspondiente).

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

### Doctrina de borrado en Farmacia — IRREVOCABLE, confirmada 07 Jul 2026
Nunca borrado duro salvo condición estricta: **sin movimientos NI lotes registrados** (`verificar_historial_producto` verifica ambas tablas, no solo `movimiento` — corrección aplicada esta sesión para cerrar una brecha real donde un lote sin movimiento asociado podía dar falso negativo). Con historial → baja suave (`estado = INACTIVO`, reversible, HOV retirada/reactivable). Sin historial → borrado físico completo (`eliminar_producto_comercial_fisico`, transaccional, en cascada: `valor_operacional` → `nodo_fraccionamiento` → `presentacion_comercial` → `producto_comercial` → `producto_generico` si queda huérfano). Precedente ya existente en `domains/inventory` (mismo patrón, dominio genérico).

### Puente HOV Farmacia → Ventas — completo y simétrico, validado en app real
`HOV.productoId = ProductoComercial.id`, `HOV.nodoFraccionamientoId = NodoFraccionamiento.id`. Las cuatro direcciones cerradas: alta (`proyectarAHov`), baja suave (`retirarHovsDeProducto`), reactivación (`reactivarHovsDeProducto`), borrado físico (`retirarHovsDeProducto` + purga SQL). Validado end-to-end en la app real: registro de producto vía `NuevoProductoStepper`, aparición en búsqueda de VENTAS, venta completa con descuento de stock correcto, borrado físico posterior sin residuos.

### NuevoProductoStepper — orden operacional MEDICAMENTO
Paso 1 = Identificación (nombre comercial, fabricante, titular, país). Paso 2 = Composición y uso clínico (IFA, dosis, forma, categoría, condición de venta, checkboxes). Antes estaba invertido — el nombre aparecía recién en el paso 2, contrario al orden en que un Regente reconoce un producto físico. `terminoBusqueda` precarga `nombreComercial`, no `ifa`. PRODUCTO_GENERAL y SERVICIO ya tenían el orden correcto, sin cambios.

### Catálogo Maestro Regulatorio DIGEMID — adjunto en solo lectura, backend completo
`catalogo_digemid.sqlite` (~13 MB, 18,397 medicamentos, empaquetado como recurso Tauri). Adjuntado por conexión vía `SqlitePoolOptions::after_connect` con `ATTACH DATABASE ?mode=ro`, degradación silenciosa si el archivo no existe (dev: ruta relativa; producción: `resource_dir()`). Comandos `buscar_en_catalogo_maestro(termino)` y `obtener_detalle_catalogo_maestro(cod_prod)` — ambos degradan a resultado vacío si el esquema no está adjunto. **No probado en runtime todavía** — `cargo check` pasa, pero el `ATTACH` real (¿resuelve bien la ruta en `cargo tauri dev`?) no se validó con una consulta real. Es fuente de consulta offline — nunca se vuelca a `ProductoComercial`, solo autocompleta.

### Auditoría ABASTECIMIENTO completa — sesión 02 Jul 2026
Recolor verde→azul (18 archivos), bordes de input corregidos, botones de comando migrados a verde doctrinal, inconsistencia SUNAT resuelta. Commiteado en `d7e09ab`/`cde45b6`/`e809768`.

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Conectar el Catálogo Maestro DIGEMID a `NuevoProductoStepper`** — autocompletar al escribir el nombre comercial (paso 1), usando `buscar_en_catalogo_maestro`/`obtener_detalle_catalogo_maestro`. Esta es también la primera oportunidad real de validar en runtime que el `ATTACH DATABASE` funciona.
2. **Diseñar campo de ubicación física de venta** (anaquel, vitrina, exhibidor, repisa) para el registro de producto — idea de Fernando, sin diseñar todavía. Decisión pendiente: ¿vive en `ProductoComercial` (fijo), en `NodoFraccionamiento`/presentación (por forma de venta), o es un atributo dinámico ligado al `HOV` (disponibilidad real)? Definir antes de tocar el stepper de nuevo.
3. Implementar Servicio como concepto compartido en `domains/catalog/` (decisión ya confirmada, no implementada — `NuevoProductoStepper.guardarServicio()` sigue fabricando un `ProductoComercial` falso en vez de usar `ServicioFarmacia` real)
4. Diseñar flujo de "Pendientes de Revisión" (151) y "No Farmacéuticos" (1,248) del Catálogo Maestro
5. Decidir `--dv-color-edit` (`#005BE3`)
6. Aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx`
7. Refactor `OperationalBar.tsx` a `var(--dv-mod-*)`
8. Resolver contradicción `ARQUITECTURA_UX.md` vs. `index.css` sobre verde de confirmación
9. Brecha 8 DIGEMID (sustancias controladas/psicotrópicos)
10. Laboratorios master table, `BoxSlotType → TipoCaja`, `Operador.codigo` cleanup
11. Auditoría profunda de CONFIG, TURNO, COMPROBANTES, CLIENTES, REPORTES, VENTAS
12. Localizar el módulo de los warnings `unit_price`/`tipo_documento` (preexistentes, no urgentes)

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo completo
2. Confirmar con Fernando la prioridad de la próxima ventana — no asumir
3. Leer filesystem antes de diseñar cualquier prompt — verificar ruteo real
4. Aplicar política de cero deuda técnica: componentes reales, no solo archivo raíz
5. Antes de dar por buena una pieza de datos externa, verificar con consultas reales contra el archivo — no confiar solo en su documentación
6. **Antes de escribir este documento al cierre de sesión, verificar `git log --oneline` y `git status --short` reales — no asumir que un commit propuesto se ejecutó si no se vio confirmación explícita en el chat**
