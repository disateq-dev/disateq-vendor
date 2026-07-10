# CURRENT_CONTEXT — DISATEQ VENDOR™
**Última actualización:** 09 Jul 2026 (sesión tarde/noche)
**Commit activo en `main`:** `621a448` — "feat(farmacia): formas de venta para PRODUCTO_GENERAL y separacion fraccionDIGEMID/factorConversionBase"

## Estado — sin trabajo pendiente de commitear

`git status --short` verificado limpio en chat tras el último commit. Cadena completa de la sesión del 09 Jul 2026, más reciente primero:

```
621a448 feat(farmacia): formas de venta para PRODUCTO_GENERAL y separacion fraccionDIGEMID/factorConversionBase
a79b1cf fix(farmacia): puentear precios de PreciosTab hacia el catalogo de Ventas
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

Todos los commits de esta sesión (`a79b1cf`, `621a448`) fueron verificados con `git show --stat -1` y `git status --short` reales en el chat, no asumidos.

**Dato de aseo pendiente:** el producto de prueba `ZZ-PRUEBA PAÑAL` (usado para validar el commit `621a448`) sigue en la base de datos real — nunca se borró tras la última corrección. Sin lotes ni movimientos, calificaría para borrado físico completo por el mismo flujo ya usado con `ZZ-PRUEBA ARBOL` en esta misma sesión (Ctrl+Supr en la ficha → sin historial → "ELIMINAR DEFINITIVAMENTE"). Pendiente para el inicio de la próxima sesión si Fernando no lo hizo ya.

---

## DOS HALLAZGOS CRÍTICOS DE ESTA SESIÓN — mismo patrón: escritura y lectura desconectadas

Esta sesión arrancó como una ronda de validación runtime de pendientes ya "resueltos" en el código, y en dos de cuatro casos la validación destapó que el código escribía en un lugar que nadie leía. Ambos hallazgos comparten estructura: una capa persiste un dato correctamente, pero el consumidor real busca ese dato en otro lugar, y nada los conecta. Ningún error de compilación ni de `cargo check` los detectó — solo se vieron al ejecutar el flujo completo de punta a punta en la app real.

### Hallazgo 1 — Precios de Farmacia nunca llegaban a Ventas

`PreciosTab` (`DetalleProducto.tsx`) guardaba precios vía `crearValorOperacional`/`modificarValorOperacional` en la tabla SQLite `valor_operacional` (tipos `VENTA_NORMAL/VENTA_MAYOREO/VENTA_FRECUENTE/VENTA_PROMOCION`, indexado por `nodo_id`). El módulo VENTAS arma su catálogo buscable vía `construirCatalogo()` → `resolverValor()`, que lee exclusivamente de `domains/catalog/valor-operacional.store.ts`, persistido en `localStorage` (tipos `NORMAL/OFERTA/PREFERENCIAL/MAYORISTA/LIBRE`, indexado por `hovId`). **Ningún camino conectaba ambos** — cualquier precio configurado en Farmacia era invisible en el punto de venta, silenciosamente, sin ningún error.

**Resuelto:** nueva función `sincronizarValorOperacionalFarmacia()` en `hov-projector.service.ts`, invocada desde `PreciosTab.onGuardarNuevo`/`onGuardarEdicion`. Traduce y sincroniza `VENTA_NORMAL→NORMAL`, `VENTA_MAYOREO→MAYORISTA`, `VENTA_PROMOCION→OFERTA`. `VENTA_FRECUENTE` queda **explícitamente excluido** (no puenteado) porque `PREFERENCIAL` en el catálogo requiere `identidadOperacionalId` de un cliente específico, y Farmacia no captura eso — puentearlo igual habría aplicado el precio de "cliente frecuente" a cualquier comprador. Advertencia visible en la UI de `PreciosTab` para ese tipo. Commit `a79b1cf`. **Validado en runtime**: precio creado en `PreciosTab` se refleja correctamente en la búsqueda de VENTAS.

**Deuda colateral registrada, no resuelta:** el flujo de borrado físico de producto (`retirarHovsDeProducto` + `eliminar_producto_comercial_fisico`) limpia SQLite correctamente en cascada, pero no limpia las entradas del store de catálogo en `localStorage` — quedan huérfanas apuntando a HOVs `RETIRADA` de productos que ya no existen. No rompe nada visible hoy (`construirCatalogo` solo lee HOVs `ACTIVA`), pero es basura acumulativa. No se tocó por no estar en la ruta directa de lo trabajado.

### Hallazgo 2 — `factorConversionBase` (operacional) conflacionado con `fraccionDIGEMID` (regulatorio)

`GLOSARIO.md` §11 y el esquema SQL (`presentacion_comercial`) ya definían `fraccionDIGEMID` (dato regulatorio, exclusivo del reporte oficial DIGEMID) y `factorConversionBase` (dato operacional genérico, gobierna el árbol de fraccionamiento) como campos **independientes**. El Stepper los conflacionaba: un solo input etiquetado "Factor de conversión" alimentaba únicamente `fraccionDIGEMID`, y `guardarMedicamento()` derivaba `factorConversionBase` de ese mismo valor. Funcionaba por coincidencia en MEDICAMENTO. Para PRODUCTO_GENERAL, ninguno de los dos se pedía — `factorConversionBase` quedaba hardcodeado en `1`, sin importar el empaque real (ej. un paquete de 100 pañales quedaba registrado con 1 sola unidad base), lo que habría corrompido el descuento de inventario desde la primera venta de una unidad fraccionada.

**Detectado por pregunta directa de Fernando** cuestionando por qué el fraccionamiento dependería de un campo con nombre DIGEMID — la pregunta fue correcta y llevó directo a la causa raíz.

**Resuelto:** ambos campos ahora se capturan por separado en `PasoPresentacion` (MEDICAMENTO) y en `PasoProductoGeneralDos` (PRODUCTO_GENERAL, que ahora sí pide "Unidades totales en este paquete"). `fraccionDIGEMID` se mantiene en `1` fijo para PRODUCTO_GENERAL (no aplica, correcto). Commit `621a448`. **Validado en runtime:** paquete de 100 unidades con pack 2x1 y unidad suelta, `unidadesBase` correctas en los tres niveles (100/2/1).

---

## OTROS RESULTADOS DE ESTA SESIÓN

- **Árbol flexible de nodos en creación — validado en runtime, primera vez.** Un nodo puede depender de otro nodo recién creado en el mismo formulario del Stepper (no solo de la presentación raíz), confirmado con consulta SQL directa contra `nodo_fraccionamiento.nodo_padre_id` — la cadena de IDs resolvió correctamente a dos niveles de profundidad. Cierra la brecha dejada abierta por el commit `56693b9` de la sesión anterior.
- **PRODUCTO_GENERAL ganó paso 3 de "Formas de venta".** Antes el Stepper de PRODUCTO_GENERAL tenía 2 pasos y nunca exponía fraccionamiento — no había forma de registrar un caso como "paquete de pañales → pack 2x1 → unidad suelta" pese a que el backend (`NodoFraccionamiento`) siempre lo soportó sin restricción de tipo de recurso (decisión ya registrada en `GLOSARIO.md` §11 desde la sesión anterior). Se agregó reutilizando `PasoFormasVenta` (ya agnóstico de tipo de recurso, solo se le generalizó la prop `presentacion` → `descripcionRaiz`), con reseteo de `nodosExtra`/`ubicacionFisica` al cambiar de tipo de recurso para evitar arrastre de estado entre flujos. Commit `621a448` (mismo commit que el Hallazgo 2, cambios relacionados en el mismo archivo).
- **Auditoría de `eliminar_producto_comercial_fisico` (Rust) confirmada correcta.** Bloquea correctamente por `TIENE_HISTORIAL` si hay `movimiento` o `lote`, y si no los hay, borra en cascada transaccional `valor_operacional → nodo_fraccionamiento → presentacion_comercial → producto_comercial`, limpiando `producto_generico` si queda huérfano. Usado dos veces en esta sesión para limpiar datos de prueba (`ZZ-PRUEBA ARBOL`, confirmado borrado; `ZZ-PRUEBA PAÑAL`, pendiente).

---

## CONVERSACIÓN ABIERTA, NO RESUELTA — Auditoría Sistémica de Integridad de Flujos de Datos

Fernando planteó, tras el Hallazgo 1, que el patrón "una capa escribe donde otra no lee" no debería seguir descubriéndose módulo por módulo en producción. Se acordó terminología precisa: no es "load testing" (no aplica a una app de escritorio de un solo operador), es una **auditoría sistémica de integridad de flujos de datos** — mapa completo de almacenes (SQLite/Rust, `localStorage` por dominio, estado en memoria Zustand), y verificación de que cada par escritura↔lectura tenga un camino real conectado, más auditoría de patrones N+1 en queries SQLite (ya se detectó uno candidato: `buscarPresentacionesParaIngreso` en `farmacia.service.ts` hace una query por producto en `Promise.all` en vez de un JOIN) y de qué `localStorage` stores son caché vs. fuente de verdad.

**No se definió alcance ni se ejecutó nada todavía.** Quedó pausada para priorizar el parche P0 del Hallazgo 1, y no se retomó después. Debe confirmarse con Fernando al inicio de la próxima sesión si se aborda como iniciativa propia o se sigue con la cola de validación funcional pendiente.

---

## DEUDA TÉCNICA RESUELTA EN SESIONES ANTERIORES (histórico, sin cambios)

- **`useIngresosMercaderia.ts` no proyectaba a HOV — RESUELTO.** Firma de `onGuardarProductoYAgregarLinea` corregida de 4 a 6 parámetros, proyección a HOV agregada. Commit `a763b20`.
- **Módulo COMPRAS legado eliminado.** `PurchasesWorkspace.tsx` borrado; `domains/purchases/store` se mantiene por lectura de `InventoryWorkspace.tsx` sin escritura activa. Commit `9c877dc`.
- **Presentaciones y nodos de fraccionamiento eran de solo lectura — RESUELTO Y VALIDADO.** 4 comandos Rust nuevos con bloqueo transaccional por historial, motivo obligatorio, auditoría en `correccion_catalogo`. Commits `0fb24ea`/`9224531`.
- **`TipoFormaVenta.INTERMEDIA` agregado.** Commit `0fb24ea`/`56693b9`.
- **Árbol de formas de venta flexible implementado.** Commit `56693b9` (validación en creación completada esta sesión, ver arriba).
- **`tipoRecurso` persistido en `ProductoComercial`.** Migración `v11`. Commit `608c7f8`.
- **Hueco de HOV multi-recurso corregido.** Commit `f5aae7b`.
- **Bug `value`→`valor` en `DetalleProducto.tsx` corregido.** Commit `56693b9`.

---

## DEUDA TÉCNICA REGISTRADA (acumulada, sin resolver)

- **9 errores preexistentes de TypeScript** (confirmados de nuevo, sin cambios, en cada `npx tsc -p tsconfig.app.json --noEmit` de esta sesión):
  - `OperationalBar.tsx` (×2) — variables sin usar (`opciones`, `idx`). Cosmético.
  - `SelectorPrincipiosActivos.tsx` — reconstruye `PrincipioActivo` incompleto al cargar principios ya vinculados (faltan `descripcionUso`, `grupoTerapeutico`, `condicionVentaIfa`, `esCombinacion`).
  - `PrincipiosActivosWorkspace.tsx` (×2) — `onGuardar` retorna `void` en vez de `Promise<void>`. Cosmético.
  - `CobroPanel.tsx` (×2) — variable sin usar (`i`) + `onClick={confirmEmit}` pasa `MouseEvent` como si fuera `confirmacion`. Funciona por casualidad, frágil ante refactor.
  - `ClienteBuscador.tsx`, `SalesWorkspace.tsx` — variables sin usar. Cosmético.
- **Entradas huérfanas en `localStorage` del catálogo tras borrado físico de producto** (nuevo, ver Hallazgo 1) — `retirarHovsDeProducto` no limpia el store de precios de catálogo.
- **Patrón N+1 candidato en `buscarPresentacionesParaIngreso`** (`farmacia.service.ts`) — una query por producto en `Promise.all` en vez de JOIN. Detectado durante la conversación de auditoría sistémica, no confirmado con medición real ni resuelto.
- Badge "Llegan N" en `InventoryWorkspace.tsx` sin fuente de datos desde que se borró COMPRAS.
- `CatalogoFarmaciaWorkspace.tsx` → "Agregar forma de venta" en `PresentacionesTab` sigue siendo `window.alert('Nueva forma de venta pendiente')`.
- **`GLOSARIO.md` §11 sigue sin actualizar** — ahora con dos pendientes adicionales de esta sesión: la distinción `fraccionDIGEMID` (regulatorio, solo MEDICAMENTO) vs. `factorConversionBase` (operacional, todo tipo de recurso) debería registrarse ahí también. Sigue requiriendo aprobación explícita de Fernando antes de editar el documento.
- Warnings preexistentes en `cargo check`: `unit_price`/`tipo_documento` nunca leídos en `thermal.rs`.
- `Ctrl+Espacio` inicia `navIdx` en 0 — aceptado por Fernando.
- `ComboboxFiltrado.tsx`: ícono `Check` con `text-[#45b356]` hardcodeado, pendiente aplicar `--dv-color-new`.
- Botón EDITAR usa `#005BE3` hardcodeado sin token `--dv-*` equivalente.
- `OperationalBar.tsx` mantiene `MODULE_ACCENT`/`MODULE_BG` hardcodeados.
- `InventoryWorkspace.tsx` conserva `#2A7CA8` — evaluado y descartado como remanente.
- Exclusiones deliberadas de migración de rojo destructivo: `RolesOperacionalesWorkspace.tsx`, `ReportesWorkspace.tsx` (~línea 598), `ComprobantesWorkspace.tsx`.
- Contradicción `ARQUITECTURA_UX.md` vs. `index.css`/código real sobre color de confirmación y color de ABASTECIMIENTO — no resuelta.
- `ServicioFarmacia`/`crear_servicio_farmacia` (Rust) sin renombrar — fuera de alcance hasta segundo rubro.
- **`VENTA_FRECUENTE` sin puente a Ventas** (ver Hallazgo 1) — pendiente de integración con dominio de Clientes para poder identificar al cliente en el momento de la venta.

---

## DECISIONES DE DISEÑO ACTIVAS

### Puente de precios Farmacia → Catálogo — decidido e implementado 09 Jul 2026 (sesión tarde)
`sincronizarValorOperacionalFarmacia()` en `hov-projector.service.ts` traduce `VENTA_NORMAL/VENTA_MAYOREO/VENTA_PROMOCION` hacia `NORMAL/MAYORISTA/OFERTA` en el store de catálogo tras cada creación/edición en `PreciosTab`. `VENTA_FRECUENTE` deliberadamente no puenteado — ver Hallazgo 1.

### Separación `fraccionDIGEMID` / `factorConversionBase` — decidido e implementado 09 Jul 2026 (sesión tarde)
Campos independientes en la UI de creación para ambos tipos de recurso que los usan. `fraccionDIGEMID`: exclusivo de MEDICAMENTO, alimenta solo el reporte regulatorio. `factorConversionBase`: universal, gobierna el árbol de fraccionamiento real. Ver Hallazgo 2.

### Formas de venta para PRODUCTO_GENERAL — decidido e implementado 09 Jul 2026 (sesión tarde)
`PasoFormasVenta` (paso 3 del Stepper para este tipo de recurso) reutilizado tal cual de MEDICAMENTO, sin restricción — casos reales como pañales (paquete → pack → unidad suelta) ya soportados de punta a punta.

### Rediseño de taxonomía de formas de venta — decidido e implementado 09 Jul 2026 (sesión anterior)
Repaso operacional completo (`GLOSARIO.md` §11 pendiente de actualizar con esto, ahora con dos puntos adicionales de la sesión de hoy):
- **Arquetipos de empaque por forma farmacéutica**, no un único modelo para todo: sólidos discretos fraccionables (tableta, cápsula, óvulo, supositorio, parche → caja→blister/tira/sobre→unidad), líquidos/semisólidos a granel (jarabe, crema, solución → caja→envase, normalmente sin fracción), inyectables unitarios (ampolla/vial → la ampolla ya es la unidad mínima), envase único no fraccionable (spray, inhalador → sin nivel más abajo).
- `TipoFormaVenta.INTERMEDIA` es genérico a propósito (no "BLISTER" específico) — el texto libre `nombreFormaVenta` captura la etiqueta real ("Blister x10", "Tira x4", etc.).
- Disponible para cualquier `TipoRecursoOperacional`, no solo MEDICAMENTO — confirmado en la práctica esta sesión con PRODUCTO_GENERAL.
- Siempre manual, nunca sugerido automáticamente por forma farmacéutica.
- **PACK = estrictamente N unidades del mismo producto.** Combo multi-producto queda expresamente fuera de `NodoFraccionamiento`, concepto futuro separado.
- **PROMOCION coexiste como dos mecanismos distintos, ambos legítimos, sin fusionar:** `TipoFormaVenta.PROMOCION` (nodo estructural) vs. `ValorOperacional.VENTA_PROMOCION` (precio temporal con vigencia).
- Árbol de nodos genuinamente flexible — validado en creación esta sesión, no solo en edición.

### `tipoRecurso` como propiedad persistente del producto — decidido e implementado 09 Jul 2026 (sesión anterior)
Persiste en `producto_comercial.tipo_recurso`, default `'MEDICAMENTO'`.

### Política "cero deuda técnica"
Al intervenir un módulo, no debe quedar deuda técnica ni residuos sin resolver dentro del alcance tocado. Un hallazgo colateral se resuelve en la misma sesión si está directamente en la ruta de lo que se está tocando. **Extendida hoy:** cuando un hallazgo colateral es demasiado profundo para resolver de paso (ej. la limpieza de `localStorage` huérfano tras borrado físico), se registra explícitamente como deuda nombrada en vez de dejarlo implícito — no alcanza con "no se tocó", debe quedar escrito por qué y qué falta.

### Doctrina de separación cromática módulo vs. comando
El color de identidad de módulo nunca coincide con el color de un botón de comando. Todo color de módulo: denso (accent) + atenuado (bg).

### Tipografía
`docs/design-system/typography.md`. Inter Tight Variable, vía `--font-sans`.

### Sistema de tokens `--dv-*`
`apps/vendor-desktop/src/index.css`, 38+ tokens. Paleta vigente: TURNO `#C59B6D`, VENTAS `#128C7E`, ABASTECIMIENTO `#1E88C7` (bg `#E3F1FA`, border `#A0CFE8`), CLIENTES `#1E7E4F`, REPORTES `#5C5FA8`, COMPROBANTES `#7B4F6E`, CONFIG `#4A5265`.

### Doctrina multi-rubro (`GLOSARIO.md` §2-3)
`farmacia/` es dominio específico de rubro, no genérico de abastecimiento.

### `CONTRATO_ARQUITECTURA.md` no existe
Nunca se creó, es residuo de plantilla. Documentos rectores reales: `ARQUITECTURA_UX.md` y `GLOSARIO.md`.

### Doctrina de borrado en Farmacia — IRREVOCABLE
Nunca borrado duro salvo condición estricta: **sin movimientos NI lotes registrados**. Con historial → baja suave, reversible. Sin historial → borrado físico completo, transaccional en cascada. Backend Rust (`eliminar_producto_comercial_fisico`) re-auditado y confirmado correcto esta sesión, usado en runtime dos veces para limpieza de datos de prueba.

### Puente HOV Farmacia → Ventas — completo para HOV/existencia, incompleto para precios de VENTA_FRECUENTE
`HOV.productoId = ProductoComercial.id`, `HOV.nodoFraccionamientoId = NodoFraccionamiento.id`. Alta, baja suave, reactivación, borrado físico — todo validado. El puente de **precios** (no de existencia de HOV) tenía la brecha del Hallazgo 1, ahora cerrada salvo `VENTA_FRECUENTE`.

### NuevoProductoStepper — orden operacional
MEDICAMENTO: 4 pasos (Comercial → Composición → Regulatorio → Presentación+Formas de venta). PRODUCTO_GENERAL: 3 pasos, ahora con Formas de venta (nuevo hoy). SERVICIO: 1 paso.

### Catálogo Maestro Regulatorio DIGEMID — conectado, validado en runtime
`catalogo_digemid.sqlite` (~13 MB, 18,397 medicamentos), `ATTACH DATABASE` solo lectura. Conectado al Paso 1 del Stepper MEDICAMENTO.

### Ubicación física de venta
Vive en `HOV.ubicacionFisica`, texto libre, autocompletado por frecuencia de uso del establecimiento.

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Decidir el alcance de la Auditoría Sistémica de Integridad de Flujos de Datos** (conversación abierta, ver sección dedicada arriba) — o retomar la cola de validación funcional pendiente.
2. **Borrar `ZZ-PRUEBA PAÑAL`** de la base de datos real si no se hizo al cierre de esta sesión.
3. Revisión funcional del registro de SERVICIO (Stepper, 1 paso) — nunca probado. Único tipo de recurso que queda sin validar en runtime.
4. Resolver limpieza de `localStorage` huérfano en borrado físico de producto (ver Deuda Técnica Registrada).
5. Investigar y confirmar/descartar el patrón N+1 en `buscarPresentacionesParaIngreso`.
6. Actualizar `GLOSARIO.md` §11 con la taxonomía de formas de venta y la separación `fraccionDIGEMID`/`factorConversionBase` — requiere aprobación explícita de Fernando antes de tocar el documento.
7. Implementar "Agregar forma de venta" en `PresentacionesTab` (hoy `window.alert`).
8. Decidir destino del badge "Llegan N" en `InventoryWorkspace.tsx`.
9. Resolver los 9 errores preexistentes de TypeScript — empezar por `CobroPanel.tsx`.
10. Diseñar el puente de `VENTA_FRECUENTE` cuando el dominio de Clientes esté listo para identificar al comprador en el momento de la venta.
11. Implementar Servicio como concepto compartido en `domains/catalog/`.
12. Diseñar flujo de "Pendientes de Revisión" (151) y "No Farmacéuticos" (1,248) del Catálogo Maestro.
13. Decidir `--dv-color-edit`, aplicar `--dv-color-new` al ícono `Check` de `ComboboxFiltrado.tsx`, refactor `OperationalBar.tsx` a `var(--dv-mod-*)`.
14. Resolver contradicción `ARQUITECTURA_UX.md` vs. código real sobre color de confirmación y ABASTECIMIENTO.
15. Brecha 8 DIGEMID, laboratorios master table, `BoxSlotType → TipoCaja`, `Operador.codigo` cleanup.
16. Auditoría profunda de CONFIG, TURNO, COMPROBANTES, CLIENTES, REPORTES, VENTAS.
17. Decidir destino de `unit_price`/`tipo_documento` en `thermal.rs`.

---

## REGLA DE INICIO DE PRÓXIMA SESIÓN

1. Leer este archivo completo.
2. Confirmar con Fernando la prioridad de la próxima ventana — no asumir. En particular, decidir explícitamente entre la Auditoría Sistémica y la cola de validación funcional restante (solo queda SERVICIO).
3. Leer filesystem antes de diseñar cualquier prompt — verificar ruteo real.
4. Aplicar política de cero deuda técnica: componentes reales, no solo archivo raíz — y resolver hallazgos colaterales en la misma sesión si están en la ruta de lo tocado. Si el hallazgo es demasiado profundo para resolver de paso, registrarlo explícitamente con detalle, no dejarlo implícito.
5. Antes de dar por buena una pieza de datos externa o un componente "ya resuelto", verificar con consultas reales o con ejecución real en la app — no confiar solo en que el código compile o en el reporte de una sesión anterior. Esta sesión confirmó dos veces que código sintácticamente correcto y sin errores de TypeScript puede estar completamente desconectado en runtime.
6. Antes de escribir este documento al cierre de sesión, verificar `git log --oneline` y `git status --short` reales — no asumir que un commit propuesto se ejecutó si no se vio confirmación explícita en el chat.
7. Si Codex se detiene por un consumidor ambiguo de una función, auditar ese consumidor directamente antes de reescribir el prompt.
8. **Usar siempre `npx tsc -p tsconfig.app.json --noEmit` para verificación de TypeScript — nunca `npx tsc --noEmit` sin la bandera `-p`.**
9. **Nueva regla de esta sesión: cuando una funcionalidad tiene una escritura (guardar/crear) y una lectura (buscar/mostrar) en módulos o dominios distintos, verificar explícitamente que ambos apunten al mismo almacén de datos antes de dar la funcionalidad por completa — no asumir que "compila y no da error" significa "está conectado". Este fue el patrón exacto de los dos hallazgos críticos de hoy.**
