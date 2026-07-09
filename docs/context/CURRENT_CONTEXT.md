# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 09 Jul 2026
**Commit activo en `main`:** `608c7f8` — "feat(farmacia): persistir tipoRecurso en ProductoComercial"

## Estado — sin trabajo pendiente de commitear

`git status --short` verificado limpio en chat tras el último commit. Cadena completa de la sesión del 09 Jul 2026, más reciente primero:

```
608c7f8 feat(farmacia): persistir tipoRecurso en ProductoComercial
9224531 feat(farmacia): correccion de presentaciones y nodos de fraccionamiento en PresentacionesTab
56693b9 feat(farmacia): arbol flexible de formas de venta y nivel INTERMEDIA en el Stepper
f5aae7b fix(catalog): resolver hueco de HOV multi-recurso en deteccion de duplicados
0fb24ea feat(farmacia): backend de correccion para presentaciones y nodos de fraccionamiento
9c877dc chore(purchases): eliminar PurchasesWorkspace huerfano (modulo COMPRAS legado)
a763b20 fix(farmacia): alinear firma de creacion de producto en Ingresos con NuevoProductoStepper
ccd1838 docs(context): cierre de sesion 08 Jul 2026 - DIGEMID validado, ubicacion fisica implementada
8ff0f31 feat(farmacia): ubicacion fisica de venta en HOV, crear desde stepper y corregir desde ficha
86eca61 feat(farmacia): conectar Catalogo Maestro DIGEMID al Paso 1 del Stepper de registro MEDICAMENTO
```

**Nota de proceso de esta sesión:** el prompt de persistencia de `tipoRecurso` quedó sin commitear varios turnos porque la sesión se desvió a investigar un hallazgo mayor (ver más abajo) y nunca se volvió a cerrar explícitamente hasta el final. Se detectó recién al verificar `git status --short` antes de escribir este documento — confirma que la regla de "nunca asumir un commit sin verlo confirmado en el chat" sigue siendo necesaria.

---

## HALLAZGO CRÍTICO DE LA SESIÓN — `npx tsc --noEmit` no verificaba nada real

**El más importante de todo lo encontrado hoy.** `tsconfig.json` (raíz) es un archivo de *project references* con `"files": []` y sin `include` propio. El código real de la app vive bajo `tsconfig.app.json` (`"include": ["src"]`). Ejecutar `npx tsc --noEmit` (sin `-p`) desde la carpeta del proyecto usa el `tsconfig.json` raíz, que sin la bandera `--build` **no desciende a los proyectos referenciados** — compila cero archivos y siempre reporta éxito, sin importar el estado real del código.

**Impacto:** todo `npx tsc --noEmit` reportado como "limpio" en sesiones anteriores a hoy (incluida toda la sesión del 08 Jul 2026) probablemente no verificó nada. `cargo check` no está afectado — es una herramienta separada, siempre fue confiable.

**Comando correcto, ya en uso desde esta sesión en adelante:**
```
npx tsc -p tsconfig.app.json --noEmit
```

Al correrlo por primera vez de verdad, aparecieron 18 errores reales — 3 causados por el propio trabajo de esta sesión (ya corregidos) y 15 preexistentes de sesiones anteriores, nunca detectados hasta hoy. De esos 15, se resolvieron 6 en esta misma sesión (ver Deuda Técnica Resuelta). Quedan 9 preexistentes sin tocar — ver Deuda Técnica Registrada.

---

## DEUDA TÉCNICA RESUELTA HOY (09 Jul 2026)

- **`useIngresosMercaderia.ts` no proyectaba a HOV — RESUELTO.** Además del hallazgo original, se encontró que `onGuardarProductoYAgregarLinea` tenía una firma de 4 parámetros mientras `NuevoProductoStepper` siempre invoca 6 (`tipoRecurso`, `generico`, `comercial`, `presentacion`, `nodosExtra`, `ubicacionFisica`) — esto desplazaba los argumentos posicionalmente y corrompía los datos antes de llegar a `crearProductoCompleto`. Firma corregida y proyección a HOV agregada, mismo patrón que `useCatalogoFarmacia`. Commit `a763b20`.
- **Módulo COMPRAS legado eliminado.** `PurchasesWorkspace.tsx` (huérfano, no importado desde ningún lado) borrado. `domains/purchases/store` se mantiene intacto porque `InventoryWorkspace.tsx` (inventario genérico, rubros no-farmacia) sí lo consume para lectura — aunque hoy no exista ningún punto de escritura activo en la app (ver deuda nueva abajo). Commit `9c877dc`.
- **Presentaciones y nodos de fraccionamiento eran de solo lectura — RESUELTO Y VALIDADO EN RUNTIME.** Backend: 4 comandos Rust nuevos (`modificar_presentacion`, `modificar_nodo`, `verificar_historial_presentacion`, `verificar_historial_nodo`), con bloqueo transaccional de campos estructurales (`fraccionDIGEMID`, `unidadConteo`, `factorConversionBase` en presentación; `tipoFormaVenta`, `unidadesBase` en nodo) cuando la entidad ya tiene lotes o movimientos, motivo obligatorio en ese caso, auditoría campo por campo en `correccion_catalogo`. UI de corrección completa en `PresentacionesTab`. Commits `0fb24ea` (backend) y `9224531` (UI). **Validado en runtime real:** bloqueo por historial visible (Amoxil), presentación sin historial editable libremente (Amoxaren), nodo raíz sin selector de tipo y con "Unidades base" bloqueado con mensaje propio, guardado real con motivo confirmado persistiendo tras recarga de vista.
- **`TipoFormaVenta.INTERMEDIA` agregado** — nivel de empaque intermedio (blister, tira, sobre, envase) entre presentación mayor y unidad mínima, disponible para cualquier tipo de recurso, siempre opcional y manual (sin sugerencia automática por forma farmacéutica — decisión explícita, mismo criterio que ya rige `estadoRegistroSanitario`: evitar mapeos automáticos que puedan fallar en el caso equivocado). Visible y funcional en runtime (selector de tipo de nodo). Commit `0fb24ea`/`56693b9`.
- **Árbol de formas de venta flexible** — un nodo extra ahora puede depender de otro nodo extra recién agregado, no solo de la presentación raíz (`nodoPadreLocalId`, resuelto vía creación secuencial con mapa `idTemporal → id real` en `useCatalogoFarmacia` y `useIngresosMercaderia`, reemplazando el `Promise.all` en paralelo de antes). Selector "Depende de" en el Stepper restringido a nodos anteriores en la lista, sin ciclos ni referencias hacia adelante. Commit `56693b9`. **No validado en runtime todavía** — solo se probó edición de nodos existentes, no la creación de un nodo dependiente de otro vía el nuevo selector del Stepper.
- **`tipoRecurso` persistido en `ProductoComercial`** — antes solo existía de forma transitoria durante la creación. Migración `v11` (`tipo_recurso TEXT NOT NULL DEFAULT 'MEDICAMENTO'`, idempotente), Rust y puente TypeScript actualizados. Necesario para poder reproyectar la HOV de un nodo que se reactiva después de creado. Commit `608c7f8`.
- **Hueco de HOV multi-recurso corregido.** `existeHOVActiva` y la migración legacy de `category` asumían que `productoId` siempre existía, pero HOV soporta tres tipos de recurso (`productoId`/`servicioId`/`productoGeneralId`, los tres opcionales) — para SERVICIO o PRODUCTO_GENERAL la comparación `undefined === undefined` podía detectar falsos duplicados entre recursos distintos. Commit `f5aae7b`.
- **Bug `value`→`valor` en `DetalleProducto.tsx` corregido.** Cuatro usos de `<ComboboxFiltrado>` en el modo "corrigiendo" de producto (condición de venta, refrigeración, vencimiento, estado de registro sanitario) pasaban `value` cuando el componente solo reconoce `valor` — estos cuatro selectores nunca mostraban ni guardaban correctamente el valor seleccionado. Commit `56693b9`.

---

## DEUDA TÉCNICA REGISTRADA (nueva o pendiente)

- **9 errores preexistentes de TypeScript, recién descubiertos por el hallazgo de `tsconfig`, sin tocar todavía:**
  - `OperationalBar.tsx` (×2) — variables declaradas sin usar (`opciones`, `idx`). Cosmético, cero riesgo.
  - `SelectorPrincipiosActivos.tsx` — al cargar principios activos ya vinculados a un producto, reconstruye un `PrincipioActivo` incompleto (faltan `descripcionUso`, `grupoTerapeutico`, `condicionVentaIfa`, `esCombinacion`; hardcodea `esEsencialMinsa`/`esPsicotropico` en `false`). Los badges ESENCIAL/CONTROLADO no se muestran bien para principios ya guardados, solo para los recién buscados en la sesión activa.
  - `PrincipiosActivosWorkspace.tsx` (×2) — `onGuardar={(datos) => void estado.onGuardarXxx(...)}` retorna `void` en vez de `Promise<void>`. Cosmético de tipos, el guardado real sigue funcionando.
  - `CobroPanel.tsx` (×2) — variable sin usar (`i`) + `onClick={confirmEmit}` pasa el `MouseEvent` como si fuera el parámetro `confirmacion`. Funciona por casualidad (`confirmacion?.accion ?? 'guardar'` cae siempre en el default correcto), pero es frágil ante un refactor futuro. Está en el módulo de cobro activo — vale la pena resolverlo con cuidado, no de pasada.
  - `ClienteBuscador.tsx`, `SalesWorkspace.tsx` — variables/funciones sin usar. Cosmético.
- **Badge "Llegan N" / "Ingreso reciente" en `InventoryWorkspace.tsx` (rubros no-farmacia) sin fuente de datos.** Lee `domains/purchases/store`, pero desde que se borró `PurchasesWorkspace.tsx` no queda ningún punto de escritura activo en toda la app — el badge está condenado a mostrar siempre cero, silenciosamente. Decidir: diseñar un flujo de "compras" genérico real, o quitar el badge.
- **`CatalogoFarmaciaWorkspace.tsx` → "Agregar forma de venta" en `PresentacionesTab` sigue siendo `window.alert('Nueva forma de venta pendiente')`**, sin implementar. Declarado desde antes, confirmado en runtime hoy, no resuelto.
- **`GLOSARIO.md` §11 sigue sin actualizar.** El documento declara deliberadamente que `NodoFraccionamiento`/`TipoFormaVenta`/`unidadesBase` quedan fuera "pendiente de rediseño profundo" — ese rediseño (taxonomía BLISTER/INTERMEDIA, árbol flexible, doctrina PACK-mismo-producto vs. combo-multi-producto fuera de alcance, distinción PROMOCION-nodo vs. VENTA_PROMOCION-precio) se decidió y se implementó hoy, pero el documento de gobernanza no se tocó — requiere aprobación explícita de Fernando antes de editarlo, no se hizo por iniciativa propia.
- Warnings preexistentes en `cargo check`, no generados por ninguna sesión reciente: campos `unit_price` y `tipo_documento` nunca leídos — **ya localizados:** `src-tauri/src/thermal.rs` (`PrintLine`/`PrintCustomer`), confirmado en cada `cargo check` de esta sesión. Pendiente de decidir si se usan o se eliminan.
- `Ctrl+Espacio` inicia `navIdx` en 0 en lugar de en el módulo activo — comportamiento aceptado por Fernando.
- `ComboboxFiltrado.tsx`: ícono `Check` conserva `text-[#45b356]` hardcodeado — mapea a `--dv-color-new`, pendiente aplicar.
- Botón EDITAR usa `#005BE3` hardcodeado en varios workspaces, sin token equivalente en el sistema `--dv-*`. Decisión de crear `--dv-color-edit`: todavía no tomada.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT`/`MODULE_BG` hardcodeados, sin consumir `--dv-mod-*`. Decisión vigente: dejarlo para el final del hilo de color.
- `InventoryWorkspace.tsx` conserva `#2A7CA8` (highlight puntual) — evaluado y descartado como remanente.
- Exclusiones deliberadas de la migración de rojo destructivo (documentadas): `RolesOperacionalesWorkspace.tsx`, `ReportesWorkspace.tsx` (~línea 598), `ComprobantesWorkspace.tsx`.
- **Doctrina de botones (`ARQUITECTURA_UX.md`) desactualizada frente a `index.css`**: "Sólido verde = confirmar" con `#45b356` en el documento, vs. `--dv-color-confirm: #3B6B34` distinto de `--dv-color-new: #45b356` en el token. El color real en código de ABASTECIMIENTO/Farmacia es `#1E88C7`, no `#3B6B34` como afirma `ARQUITECTURA_UX.md` §8. No resuelto.
- `ServicioFarmacia`/`crear_servicio_farmacia` (Rust) quedan con su nombre actual — la promoción de Servicio a `domains/catalog/` es solo de la capa TypeScript; renombrar el backend Rust es migración aparte, fuera de alcance hasta que un segundo rubro lo necesite.

---

## DECISIONES DE DISEÑO ACTIVAS

### Rediseño de taxonomía de formas de venta — decidido e implementado 09 Jul 2026
Repaso operacional completo (`GLOSARIO.md` §11 pendiente de actualizar con esto):
- **Arquetipos de empaque por forma farmacéutica**, no un único modelo para todo: sólidos discretos fraccionables (tableta, cápsula, óvulo, supositorio, parche → caja→blister/tira/sobre→unidad), líquidos/semisólidos a granel (jarabe, crema, solución → caja→envase, normalmente sin fracción), inyectables unitarios (ampolla/vial → la ampolla ya es la unidad mínima), envase único no fraccionable (spray, inhalador → sin nivel más abajo).
- `TipoFormaVenta.INTERMEDIA` es genérico a propósito (no "BLISTER" específico) — el texto libre `nombreFormaVenta` captura la etiqueta real ("Blister x10", "Tira x4", etc.).
- Disponible para cualquier `TipoRecursoOperacional`, no solo MEDICAMENTO — sin restricción, porque restringir no compra seguridad y PRODUCTO_GENERAL puede necesitarlo (pañales, cosméticos).
- Siempre manual, nunca sugerido automáticamente por forma farmacéutica — mismo criterio que ya rige `estadoRegistroSanitario`: una sugerencia que falla en el caso equivocado genera más fricción que confianza.
- **PACK = estrictamente N unidades del mismo producto.** Un combo multi-producto (ej. Paracetamol + Jarabe) queda expresamente fuera de `NodoFraccionamiento` — es de un solo producto por diseño. Combo multi-producto es concepto futuro separado, no diseñado todavía.
- **PROMOCION coexiste como dos mecanismos distintos, ambos legítimos, sin fusionar:** `TipoFormaVenta.PROMOCION` (nodo estructural nuevo, cuando la promoción cambia la forma física de venta) vs. `ValorOperacional.VENTA_PROMOCION` (precio temporal con vigencia sobre un nodo ya existente, cuando solo cambia el precio). Pendiente de documentar esta distinción explícitamente en `GLOSARIO.md` cuando se actualice §11.
- Árbol de nodos genuinamente flexible: `NodoFraccionamiento.nodoPadreId` siempre soportó profundidad arbitraria a nivel de esquema — la limitación era solo de UI/flujo de captura, ya resuelta.

### `tipoRecurso` como propiedad persistente del producto — decidido e implementado 09 Jul 2026
Antes transitorio (solo vivía durante la creación). Ahora persiste en `producto_comercial.tipo_recurso`, default `'MEDICAMENTO'` para filas existentes (único tipo probado hasta ahora en datos reales). Necesario para reproyección de HOV en correcciones posteriores a la creación.

### Política "cero deuda técnica"
Al intervenir un módulo, no debe quedar deuda técnica ni residuos sin resolver dentro del alcance tocado. No se cierra una auditoría con hallazgos sueltos. **Extendida hoy:** un hallazgo colateral (ej. el bug `value`/`valor`, el módulo COMPRAS huérfano, el hueco de HOV multi-recurso) se resuelve en la misma sesión si está directamente en la ruta de lo que se está tocando, aunque no haya sido pedido originalmente — no se deja para "otra sesión" solo porque no estaba en el plan inicial.

### Doctrina de separación cromática módulo vs. comando
El color de identidad de módulo nunca coincide con el color de un botón de comando. Todo color de módulo: denso (accent) + atenuado (bg).

### Tipografía
`docs/design-system/typography.md`. Inter Tight Variable, vía `--font-sans`.

### Sistema de tokens `--dv-*`
`apps/vendor-desktop/src/index.css`, 38+ tokens. Paleta vigente: TURNO `#C59B6D`, VENTAS `#128C7E`, ABASTECIMIENTO `#1E88C7` (bg `#E3F1FA`, border `#A0CFE8`), CLIENTES `#1E7E4F`, REPORTES `#5C5FA8`, COMPROBANTES `#7B4F6E`, CONFIG `#4A5265`.

### Doctrina multi-rubro (`GLOSARIO.md` §2-3)
`farmacia/` es dominio específico de rubro, no genérico de abastecimiento. Resto de rubros usa `InventoryWorkspace.tsx` genérico hasta tener dominio propio. **Nota nueva:** ese genérico hoy tiene una lectura (`domains/purchases`) sin ninguna escritura activa — ver deuda técnica.

### `CONTRATO_ARQUITECTURA.md` no existe
Nunca se creó, es residuo de plantilla. Documentos rectores reales: `ARQUITECTURA_UX.md` y `GLOSARIO.md`.

### Doctrina de borrado en Farmacia — IRREVOCABLE
Nunca borrado duro salvo condición estricta: **sin movimientos NI lotes registrados**. Con historial → baja suave, reversible. Sin historial → borrado físico completo, transaccional en cascada. **Extendida hoy** al mismo criterio aplicado a corrección (no borrado) de presentaciones y nodos: campos estructurales bloqueados con historial, libres sin él.

### Puente HOV Farmacia → Ventas — completo, simétrico, ahora también desde Ingresos y reproyectable tras corrección
`HOV.productoId = ProductoComercial.id`, `HOV.nodoFraccionamientoId = NodoFraccionamiento.id`. Alta (`proyectarAHov`), baja suave (`retirarHovsDeProducto`/`retirarHovDeNodo`), reactivación (`reactivarHovsDeProducto`), borrado físico. Validado end-to-end en la app real desde el Catálogo. **Ya no tiene la brecha de Ingresos** (resuelta hoy). Multi-recurso (`productoId`/`servicioId`/`productoGeneralId`) con detección de duplicados corregida.

### NuevoProductoStepper — orden operacional MEDICAMENTO
Paso 1 = Identificación. Paso 2 = Composición y uso clínico. PRODUCTO_GENERAL y SERVICIO ya tenían el orden correcto.

### Catálogo Maestro Regulatorio DIGEMID — conectado, validado en runtime
`catalogo_digemid.sqlite` (~13 MB, 18,397 medicamentos), `ATTACH DATABASE` solo lectura. Conectado al Paso 1 del Stepper MEDICAMENTO. `estadoRegistroSanitario` deliberadamente nunca se autocompleta.

### Ubicación física de venta
Vive en `HOV.ubicacionFisica`, texto libre, sin enum de sistema, autocompletado por frecuencia de uso del propio establecimiento.

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Actualizar `GLOSARIO.md` §11** con la taxonomía de formas de venta decidida hoy (INTERMEDIA genérico, árbol flexible, PACK-mismo-producto vs. combo-multi-producto fuera de alcance, distinción PROMOCION-nodo vs. VENTA_PROMOCION-precio) — requiere aprobación explícita de Fernando antes de tocar el documento.
2. **Validar en runtime la creación de un nodo dependiente de otro** vía el nuevo selector "Depende de" del Stepper (árbol flexible nunca probado en creación, solo en edición).
3. Revisión funcional de PRECIOS (`PreciosTab`) — nunca probada con datos reales.
4. Revisión funcional del registro de PRODUCTO_GENERAL (Stepper, 2 pasos) — nunca probado.
5. Revisión funcional del registro de SERVICIO (Stepper, 1 paso) — nunca probado.
6. Implementar "Agregar forma de venta" en `PresentacionesTab` (hoy `window.alert`).
7. Decidir destino del badge "Llegan N" en `InventoryWorkspace.tsx` (sin fuente de datos desde que se borró COMPRAS) — diseñar flujo de compras genérico real, o quitar el badge.
8. Resolver los 9 errores preexistentes de TypeScript recién descubiertos (ver Deuda Técnica Registrada) — empezar por `CobroPanel.tsx` por estar en el módulo de cobro activo.
9. Implementar Servicio como concepto compartido en `domains/catalog/` (decisión confirmada, no implementada).
10. Diseñar flujo de "Pendientes de Revisión" (151) y "No Farmacéuticos" (1,248) del Catálogo Maestro.
11. Decidir `--dv-color-edit` (`#005BE3`), aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx`, refactor `OperationalBar.tsx` a `var(--dv-mod-*)`.
12. Resolver contradicción `ARQUITECTURA_UX.md` vs. `index.css`/código real sobre color de confirmación y color de ABASTECIMIENTO.
13. Brecha 8 DIGEMID (sustancias controladas/psicotrópicos), laboratorios master table, `BoxSlotType → TipoCaja`, `Operador.codigo` cleanup.
14. Auditoría profunda de CONFIG, TURNO, COMPROBANTES, CLIENTES, REPORTES, VENTAS.
15. Decidir qué hacer con `unit_price`/`tipo_documento` en `src-tauri/src/thermal.rs` (ya localizados, campos nunca leídos).

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo completo.
2. Confirmar con Fernando la prioridad de la próxima ventana — no asumir.
3. Leer filesystem antes de diseñar cualquier prompt — verificar ruteo real.
4. Aplicar política de cero deuda técnica: componentes reales, no solo archivo raíz — y resolver hallazgos colaterales en la misma sesión si están en la ruta de lo tocado, no diferirlos automáticamente.
5. Antes de dar por buena una pieza de datos externa, verificar con consultas reales contra el archivo — no confiar solo en su documentación.
6. **Antes de escribir este documento al cierre de sesión, verificar `git log --oneline` y `git status --short` reales — no asumir que un commit propuesto se ejecutó si no se vio confirmación explícita en el chat.** (Confirmado necesario de nuevo hoy: un prompt completo quedó sin commitear varios turnos por una desviación de la sesión.)
7. Si Codex se detiene por un consumidor ambiguo de una función, auditar ese consumidor directamente antes de reescribir el prompt.
8. **Usar siempre `npx tsc -p tsconfig.app.json --noEmit` para verificación de TypeScript — nunca `npx tsc --noEmit` sin la bandera `-p`.** El `tsconfig.json` raíz es un archivo de project references con `"files": []` que no verifica nada por defecto sin ella. Cualquier verificación de TypeScript hecha sin esta bandera, en cualquier sesión, debe considerarse no confiable.
