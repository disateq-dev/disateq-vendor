# Auditoría del Flujo Completo de Ventas — DISATEQ Vendor™

**Fecha:** 2026-07-24
**Commit base:** bd56cff (rama main)
**Alcance:** recorrido operacional completo, desde apertura de turno hasta cierre de caja, auditado contra el código real en disco (no contra documentación).
**Metodología:** Fase 1 (recorrido paso a paso) completada. Fase 2 (barrido de interrelación) y Fase 3 (correcciones) pendientes.

---

## Mapa del flujo auditado

1. Apertura de turno / caja
   1a. Movimientos de caja (ingresos/egresos, fondo de cambio)
2. Búsqueda y captura de producto
3. Armado de preventa / pedido
4. Gestión del pedido activo (máquina de estados)
5. Cliente (DNI/RUC/CE/Pasaporte)
6. Cobro
7. Comprobante (emisión, correlativo)
8. Post-venta inmediata (anular, reimprimir, convertir)
9. Sucesos del turno
10. Cierre de turno / arqueo

---

## 🔴 Hallazgos críticos

### H-C1 — Fallo de concreción de venta se traga en silencio (Paso 4/6)
**Archivos:** `domains/sales/bridge-pedido.ts` (`sincronizarConcrecion`), `domains/sales/venta.service.ts`

Si `confirmarPedido()` lanza una excepción (p. ej. porque el pedido no tiene líneas activas — ver H-C3), el `catch` la ignora y el flujo continúa. `registrarVentaEnSQLite()` no verifica el estado del pedido antes de persistir, y usa `input.pedido.momentoConcrecion ?? new Date().toISOString()` — si `momentoConcrecion` es `null`, el sistema **inventa** una fecha de concreción.

**Consecuencia real:** el comprobante ya se emitió e imprimió (el cliente se retira con su boleta), pero el pedido subyacente puede quedar en estado `ABIERTO` en el store de pedidos, con un timestamp de concreción falso escrito en SQLite. Ese pedido "fantasma abierto" podría reaparecer como pedido activo en la siguiente venta del mismo mostrador y mezclar líneas.

**Prioridad:** máxima — toca directamente la confiabilidad de los registros de venta.

---

### H-C2 — Base de clientes 100% en localStorage (Paso 5)
**Archivo:** `domains/clients/cliente.store.ts`

Confirmación en código de la deuda ya documentada (D3). Todo el store de clientes (`disateq:clients:clientes`) vive en `localStorage`, sin ningún camino hacia SQLite. Cada venta con boleta/factura que registra o actualiza un cliente escribe ahí.

**Consecuencia real:** pérdida total de la base de clientes frecuentes ante limpieza de caché, reinstalación, o corrupción de perfil del sistema operativo. Es dato de negocio permanente, no estado de UI efímero.

**Prioridad:** máxima — ya estaba en el roadmap (D3), esto confirma alcance y gravedad exactos.

---

### H-C3 — Doble motor de resolución de precio (Paso 2/3)
**Archivos:** `domains/sales/pedido.service.ts` (`agregarLinea` → `resolverValor()`), `modules/sales/SalesWorkspace.tsx`, `modules/sales/PresentacionSheet.tsx`

El precio/tipo de valor que se persiste en el pedido operacional (SQLite) se calcula con el motor real `resolverValor()`. El precio/tipo de valor que ve el operador en el ticket visual viene **precalculado** desde el catálogo (`bridge-catalogo.ts`), sin volver a pasar por ese motor.

**Consecuencia real:** el número que el operador ve en pantalla puede no coincidir con el que efectivamente se guarda si el motor operacional aplica una regla (mayorista por cantidad, margen mínimo) que el catálogo pre-computado no conoce. No se detecta visualmente — solo auditando el pedido concretado contra lo cobrado.

**Prioridad:** alta.

**Cerrado — commit `76b3c0e` (2026-07-25).** `agruparPorProducto()` (`bridge-catalogo.ts`) recibe ahora `contextoOperacionalId` real y lo propaga a `resolverValor()`, en vez de la constante fija `CONTEXTO_CATALOGO_NEGOCIO`. Corregidos los 3 llamantes reales en `SalesWorkspace.tsx` (modo dense, modo visual, `addProductToTicket`). `cantidad: 1` fijo e `identidadOperacionalId` ficticio en el tile se mantienen deliberadamente — confirmado correcto, no bug (MAYORISTA se resuelve bien en el motor real al agregar línea; PREFERENCIAL no puede resolverse en el tile porque la identidad del cliente aún no existe en ese punto del flujo).

---

### H-C4 — Fallo silencioso al agregar línea deja "producto fantasma" en el ticket (Paso 2)
**Archivo:** `domains/preventa/services/preventa.service.ts` (`agregarProductoDesdeHOV`)

```ts
try { agregarLinea({...}) } catch { /* fallo silencioso · el ticket visual no se ve afectado */ }
usePreVentaStore.getState().agregarLinea(traducirALineaPreVenta(input));
```

Si `agregarLinea()` falla, la línea se agrega igual al ticket visual. El pedido operacional en SQLite nunca la recibe.

**Consecuencia real:** si eso llega a cobro, hay una línea cobrada visualmente pero ausente del pedido persistido.

**Prioridad:** alta — comentario en código revela que fue decisión consciente priorizando UX sobre integridad de dato.

**Cerrado parcialmente — commit `076a59e` (2026-07-25).** El punto de entrada `agregarProductoDesdeHOV` ya no pinta el ticket visual si `agregarLinea()` falla o si no hay pedido activo (`catch { return }` reemplaza el catch silencioso). **Alcance reducido, no cerrado del todo:** el mismo patrón de divergencia ticket-visual-vs-pedido-real reaparece en un punto distinto de la cadena — ver H-C16.

---

### H-C6 — Precio manual se pierde en S/0.00 o se ignora al pasar por `agregarLinea` (Paso 2/3)
**Archivos:** `domains/sales/pedido.types.ts` (`AgregarLineaInput`), `domains/sales/pedido.service.ts` (`agregarLinea`), `domains/preventa/services/preventa.service.ts` (`agregarProductoDesdeHOV`)

`agregarLinea()` siempre recalculaba el precio vía `resolverValor()`, sin ninguna vía para recibir un valor manual ya decidido por el operador. Dos manifestaciones de la misma causa raíz:

- **Caso A** — HOV sin `ValorOperacional` configurado (`requiereValorManual: true`): el operador ingresa un precio en `PresentacionSheet`, pero `resolverValor()` devuelve `tipo: 'LIBRE'` sin match → `valorAplicado: null ?? 0`. La venta se registraba en SQLite con **S/ 0.00**, aunque el ticket visual mostraba el precio correcto.
- **Caso B** — ajuste manual sobre un precio NORMAL/PREFERENCIAL/MAYORISTA existente (capacidad `editar_precio_venta`): el operador sobrescribe el precio, `PresentacionSheet` lo envía correctamente (tras el fix de H-C11) como `tipoValor: "LIBRE"`, pero `agregarLinea()` no recibía ese valor y volvía a resolver desde catálogo — grabando el precio **original**, no el ajustado.

**Consecuencia real:** discrepancia entre lo que el ticket muestra y lo que efectivamente se graba en la venta concretada — riesgo directo de integridad de caja, no detectable visualmente en el momento de la venta.

**Prioridad:** alta.

**Cerrado — commit `076a59e` (2026-07-25).** `AgregarLineaInput` incorpora `valorManual: number | null`. `agregarLinea()` bifurca: si `valorManual` viene con valor, lo usa directo (`tipoValor: 'LIBRE'`, `esValorManual: true`) sin invocar `resolverValor()`; si no, comportamiento original intacto. `agregarProductoDesdeHOV` propaga `valorManual: input.tipoValor === 'LIBRE' ? input.valorUnitario : null`, cubriendo ambos casos A y B con la misma condición.

---

### H-C16 — Ajuste de cantidad en el ticket (+/-) no se propaga al pedido operacional real (Paso 3)
**Archivo:** `domains/preventa/services/preventa.service.ts` (`incrementarLinea`, `decrementarLinea`)

```ts
incrementarLinea(lineaId: string) {
  const state = usePreVentaStore.getState();
  const line = state.linesById[lineaId];
  if (!line) return;
  state.actualizarCantidad(lineaId, line.cantidad + 1);   // solo store visual
},
```

Ninguna de las dos funciones invoca `pedido.service.ts::modificarCantidad()` — solo actualizan `usePreVentaStore` (el ticket visual en memoria). Cuando el operador ajusta cantidad con `+`/`-`/flechas (atajos de teclado en `SalesWorkspace.tsx`), el ticket cambia pero `LineaPedido.cantidad` en el pedido operacional real permanece con el valor original.

**Consecuencia real:** misma familia que H-C6, ahora en cantidad en vez de precio — `registrarVentaEnSQLite()` lee `Pedido.lineas` (cantidad original, no ajustada) al concretar. La venta puede grabarse con menos o más unidades de las que el ticket mostró y el cliente pagó. Flujo de uso muy frecuente (ajustar cantidad con teclado es más común que editar precio manual), por lo que el riesgo de ocurrencia es alto.

**Descubierto durante la revisión de cierre de H-C4 (2026-07-25)** — no estaba en el barrido original de Fase 1.

**Prioridad:** alta.

**Cerrado — commit `678d0bd` (2026-07-25).** Auditoría de código previa al diseño reveló que el defecto era más profundo que la ausencia de la llamada: `LineaPreVenta.lineaId` (store visual) y `LineaPedido.id` (pedido real) se generaban como dos UUIDs independientes sin correlación — `traducirALineaPreVenta()` en `bridge-pedido.ts` generaba su propio `lineaId` en vez de recibir el `id` real creado por `agregarLinea()`. Se unifico la identidad: `traducirALineaPreVenta` ahora recibe el `id` real como parametro, y `agregarProductoDesdeHOV` lo extrae de la ultima linea del `Pedido` devuelto (array append-only, sin depender de timestamps). Con la identidad unificada, `incrementarLinea`/`decrementarLinea` pasaron a llamar `modificarCantidad()`, con guard defensivo (si falla o no hay pedido activo, el store visual no se toca — mismo patron que H-C6/H-C4). Cambio abarco 4 archivos: `bridge-pedido.ts`, `preventa.service.ts`, `PreVentaGrid.tsx` (clic con mouse) y `SalesWorkspace.tsx` (atajos de teclado `+`/`-`/flechas — llamador adicional detectado por `tsc`, no incluido en el barrido inicial de la sesion).

**Hallazgo colateral derivado, no corregido en este cierre:** `splitLinea()` (usePreVentaStore) crea una `LineaPreVenta` nueva con `crypto.randomUUID()` propio al disgregar una linea con nota, sin operacion equivalente en el pedido real — misma familia de identidad huerfana, ambito distinto (split, no cantidad). Fernando ademas indico que la funcionalidad de nota-por-linea debe ser configurable por rubro, no universal. Pendiente de numeracion y diseno independiente.

---

### H-C17 — `quitarLinea` no propaga la eliminación al pedido operacional real (Paso 3)
**Archivos:** `domains/sales/pedido.types.ts`, `domains/sales/pedido.service.ts`, `domains/preventa/services/preventa.service.ts` (`quitarLinea`)

```ts
quitarLinea(lineaId: string) {
  usePreVentaStore.getState().quitarLinea(lineaId);   // solo store visual
},
```

A diferencia de H-C6 y H-C16, aquí no había ni siquiera un intento fallido de conectar al dominio: `pedido.service.ts` no tenía ninguna función para quitar o suspender una línea. El tipo `EstadoLineaPedido` ya incluía `'SUSPENDIDA'` y `TipoEventoPedido` ya incluía `'LINEA_SUSPENDIDA'`, pero sin ninguna implementación que los usara — mecanismo previsto en el modelo de datos, nunca construido.

**Consecuencia real (severidad revisada tras verificar `venta.service.ts` y `pedido.operations.ts`):** el comprobante fiscal que el cliente recibe se arma en `CobroPanel.tsx` desde el store visual, que sí refleja la eliminación correctamente — **no hay cobro incorrecto al cliente**. El riesgo real es de integridad de datos: `LineaPedido` permanece con `estado: 'ACTIVA'` en el `Pedido` guardado en SQLite pese a que el operador la quitó del ticket. `registrarVentaEnSQLite()` y `pedidoOperations.concretarPedido()` ya filtran por `estado === 'ACTIVA'`, por lo que el mecanismo de estado era la pieza correcta y suficiente — solo faltaba la función que lo aplicara. El riesgo latente es para cualquier lectura futura de `pedido.lineas` que no pase por esos dos filtros (reportes, auditoría, sincronización multi-POS).

**Descubierto durante el barrido de rutas residuales del patrón catch-silencioso (H-C4), posterior al cierre de H-C16 (2026-07-25).**

**Prioridad:** alta — integridad de dato, no cobro.

**Cerrado — commit `0f379b4` (2026-07-25).** Se agregó `SuspenderLineaInput` (`pedido.types.ts`) y la función `suspenderLinea()` en `pedido.service.ts`, siguiendo el mismo molde que `agregarLinea`/`modificarCantidad` (valida pedido `ABIERTO` y línea `ACTIVA`, marca `estado: 'SUSPENDIDA'`, registra evento `LINEA_SUSPENDIDA`, no elimina del arreglo — conserva trazabilidad). `preVentaService.quitarLinea` ahora la invoca con guard defensivo (si falla o no hay pedido activo, el store visual no se toca). Conectados los dos llamadores reales: `PreVentaGrid.tsx` (ícono de basura) y `SalesWorkspace.tsx` (tecla `Supr`), ambos con `operadorId` real, sin recurrir al patrón `?? "default"`.

**Verificación previa al diseño:** se confirmó con evidencia de código (no supuesto) que `agregarProducto` (ruta legacy sin HOV) no tiene ningún llamador activo en el árbol actual — código muerto, sin numerar como hallazgo, candidato a limpieza cosmética futura.

**Hallazgo colateral derivado, no corregido en este cierre:** `preVentaService.limpiar()` descarta `_pedidoActivoId` sin invocar `abandonarPedido()` — si el operador limpia el ticket sin haber concretado venta, el `Pedido` real queda en estado `ABIERTO` en SQLite, sin motivo de abandono registrado. No genera cobro incorrecto (menor severidad que H-C17), pero sí pedidos huérfanos. Pendiente de numeración y diseño independiente.

---

### H-C5 — Contexto operacional hardcodeado a "default" en el cobro real (Paso 6)
**Archivo:** `modules/preventa/CobroPanel.tsx` (`_ejecutarSideEffects`, `emitirYRegistrarComprobante`)

```ts
preVentaService.obtenerPedidoActivoOCrear("default", "default", cashSession.cashBox?.code ?? "default")
```

`contextoOperacionalId` e `identidadOperacionalId` quedan siempre en el string literal `"default"`, nunca con el bloque/caja real de la sesión activa.

**Consecuencia real:** rompe trazabilidad real de "qué operador/bloque concretó qué pedido" — el dato queda genérico para toda venta que pase por cobro.

**Prioridad:** alta.

---

> **Nota de proceso:** H-C7 a H-C10 fueron generados durante la Fase 3 (correcciones), posterior a la redacción original de este documento (2026-07-24), y quedaron registrados únicamente en `CURRENT_CONTEXT.md` en su momento. Pendiente trasladarlos aquí para no perder su detalle al purgarse el contexto. H-C3 y H-C6 ya fueron trasladados e integrados arriba, con su estado de cierre. H-C11 se registra abajo como el primer hallazgo de esta serie posterior documentado directamente en el archivo permanente.

---

### H-C11 — Sin feedback visual de selección + AGREGAR ignora precio ajustado en formas con valor asignado (Paso 3)
**Archivo:** `modules/sales/PresentacionSheet.tsx` (`confirmarForma`, `confirmarActiva`, render de tarjetas de forma de venta)

Dos defectos independientes que se combinan en el modal de selección de forma de venta:

**(a) Sin feedback visual de selección:** el `<button>` de cada tarjeta (CAJA X 10, CAPSULA, etc.) usa clases estáticas — no condicionadas a si esa tarjeta es la `formaActiva` actual. Al hacer clic, el estado interno sí cambia (`setFormaActiva`), pero nada en el render lo refleja (sin borde, check ni resaltado). El operador no puede saber cuál forma quedó seleccionada, lo que induce clics repetidos sobre distintas tarjetas y deja el campo "AJUSTAR PRECIO" precargado con el valor de una forma distinta a la que el operador cree haber elegido.

**(b) `confirmarActiva()` ignora el precio ajustado cuando la forma ya tiene `valorAplicado` no nulo:** la condición evalúa `formaActiva.valorAplicado !== null` antes que `puedeAjustarPrecioAsignado`, por lo que siempre confirma con el precio original de catálogo — el valor escrito en el input "AJUSTAR PRECIO" nunca se usa en este camino. El flujo de ajuste manual sobre una forma con precio ya asignado (tipos NORMAL/PREFERENCIAL/MAYORISTA, con `puedeEditarPrecio=true`) está roto en la práctica.

**Consecuencia real:** el operador cree estar agregando un producto a un precio ajustado y en su lugar (si `onConfirmar` llega a ejecutarse) se agrega al precio de catálogo sin ajuste — o, combinado con (a), puede terminar confirmando la forma/precio equivocados sin darse cuenta hasta revisar el ticket.

**Prioridad:** alta — afecta directamente la captura de precio en el punto de venta, con riesgo de pérdida de margen o cobro incorrecto al cliente.

**Confirmado con evidencia real:** reproducido por Fernando en sesión, `AMOXICILINA 500MG PRUEBA` — clic en CAJA X 10 (S/5.00) no mostró cambio visual; campo AJUSTAR PRECIO apareció con `0.50` (valor de CAPSULA, no de la forma clicada); AGREGAR se habilitó pero no produjo cambio visible en el ticket.

**Cerrado — commit `f8f21f4` (sesión previa a 2026-07-25).** Verificado con evidencia visual real en la app.

---

### H-C10 — Falso positivo de diagnóstico: verificación apuntó a tabla equivocada del flujo de pedido (Paso 4/6)
**Archivos:** `domains/sales/venta.service.ts`, `src-tauri/src/commands/ventas.rs`, `domains/sales/pedido.store.ts`, `src-tauri/src/commands/pedidos_venta.rs`

Hallazgo original (sesión previa) diagnosticó que `guardar_pedido_venta` fallaba en silencio por invocarse sin el wrapper `input` requerido por Tauri 2 para deserializar structs. Fix aplicado en `4acce46` sobre `pedidos_venta.rs`/`pedido.store.ts`, agregando el wrapper correctamente.

**Verificación en vivo (2026-07-25) reveló que el diagnóstico apuntó al comando equivocado.** El sistema tiene dos rutas de persistencia independientes y ambas legítimas:

- `pedido_venta` (tabla) — espejo del pedido en curso, escrito en **cada** cambio de estado vía `pedidoStore.guardarPedido()` → `guardar_pedido_venta`. Propósito: recuperación de carrito ante cierre inesperado de la app (`cargarPedidosActivosDesdeSQLite()` al arranque).
- `venta` + `linea_venta` (tablas) — registro fiscal/comercial definitivo, escrito **solo** al concretar cobro vía `registrarVentaEnSQLite()` → `registrar_venta`. Este comando recibe argumentos nombrados (no un struct único), por lo que nunca requirió wrapper `input` — el bug original nunca existió en esta ruta.

La consulta de verificación de la sesión anterior (`SELECT COUNT(*) FROM pedido_venta`) apuntaba a la tabla de borrador, no a la de venta concretada. Verificación correcta con `SELECT COUNT(*) FROM venta` / `linea_venta` confirmó **17 y 25 filas respectivamente** — la persistencia de ventas concretadas funciona y siempre funcionó correctamente.

**Conclusión:** H-C10 se cierra sin corrección de código — el fix de `4acce46` era válido y necesario para la ruta de borrador (`pedido_venta`), simplemente no era la causa del problema originalmente sospechado en la ruta de venta concretada, que nunca estuvo rota.

**Hallazgo colateral derivado de esta verificación:** ver H-C14.

**Prioridad:** cerrada — sin acción de código pendiente.

---

### H-C18 — Monto recibido y vuelto entregado no se persisten en ningún lugar (Paso 6)
**Archivos:** `modules/preventa/CobroPanel.tsx`, `domains/documents/comprobante-sqlite.service.ts`, `src-tauri/src/commands/sesion_caja.rs`, `src-tauri/src/commands/comprobantes.rs` (tabla `venta`)

En pago en efectivo, `CobroPanel.tsx` calcula `receivedNum` (monto recibido) y `change` (vuelto) como estado de React en memoria. Ambos valores se usan únicamente para:
- Mostrarse en pantalla mientras el panel está abierto.
- Imprimirse en el ticket físico (`construirReceiptData()` los recibe como parámetros del recibo).

Ninguno de los dos viaja hacia `registrarComprobanteEnSQLite()` ni hacia `registrarMovimientoCajaEnSQLite()`. Se confirmó contra el backend Rust que la tabla `venta` solo persiste `total`, `metodo_pago` y `tipo_comprobante`; la tabla `movimiento_caja` no tiene ningún movimiento asociado al cobro en efectivo de una venta (solo a ingresos/egresos de fondo). El fondo de apertura (`sesion_caja.apertura`) sí se persiste y es consultable — el defecto es específico de recibido/vuelto por venta.

**Consecuencia real:** una vez cerrado el panel de cobro, no queda ningún registro en base de datos de con cuánto efectivo pagó el cliente ni cuánto vuelto se le entregó en una venta puntual. La única evidencia que sobrevive es el ticket de papel, si se imprimió — no hay forma de auditar o reconstruir esa cifra desde el sistema. El arqueo de caja (fondo + total vendido) sigue siendo reconstruible porque `venta.total` sí persiste, pero cualquier reporte o reclamo que necesite el detalle de "recibido vs. vuelto" de una venta específica no tiene fuente de datos.

**Detectado por Fernando en sesión (2026-07-27)**, verificado contra código real antes de registrar.

**Prioridad:** alta — integridad de dato de caja, no cobro incorrecto al cliente (el vuelto en pantalla y en el ticket impreso sí es correcto en el momento; el problema es que no sobrevive al cierre del panel).

**Cerrado — commit `1e1131d` (2026-07-27).** Migración v30 agrega `monto_recibido REAL` y `vuelto REAL` a la tabla `comprobante` (guard por `pragma_table_info`, mismo molde que v29). `registrar_comprobante` (Rust) recibe y persiste ambos campos; `obtener_comprobante_detalle` los expone en el JSON de respuesta. `registrarComprobanteEnSQLite` (TS) propaga los dos parámetros nuevos hacia el `invoke`. En `CobroPanel.tsx`, `_ejecutarSideEffects` calcula ambos valores por clausura justo antes del registro: EFECTIVO usa `receivedNum`/`change` reales (clamped a `Math.max(0, …)`); MIXTO usa el componente efectivo del breakdown como recibido y `0` como vuelto (no hay sobrante posible en un pago mixto por definición); YAPE/TARJETA quedan en `null`/`null`. Se detectó y corrigió en el mismo cierre una segunda llamada a `registrarComprobanteEnSQLite` en `ComprobantesWorkspace.tsx` (`handleConvertir`, flujo CONVERTIR A FORMAL) que `tsc` señaló como faltante de los nuevos argumentos — ese flujo no es un cobro nuevo, por lo que se le pasa `null, null` explícito, igual que Yape/Tarjeta. Verificado con `tsc` y `cargo check` limpios antes de commitear.

**Verificación en runtime (2026-07-27):** ejecutada la migración v30 al reiniciar la app (`schema_migrations` confirmado en versión 30, columnas `monto_recibido`/`vuelto` presentes en `comprobante`). Venta de prueba real en efectivo (correlativo T001-00000015) confirmó persistencia de ambos campos. Esta misma verificación cruzada reveló un segundo defecto, no relacionado con H-C18 en sí — ver H-C19.

---

### H-C19 — Doble cálculo de IGV: el total persistido en el comprobante no coincide con el total mostrado y cobrado en pantalla (Paso 6/7)
**Archivo:** `domains/documents/comprobante.service.ts` (`crearComprobante`, funciones internas `calcularSubtotal`/`calcularIGV`)

`CobroPanel.tsx` calcula correctamente el total a cobrar con el IGV **incluido** en el precio de venta al público (`netTotal`), y lo desglosa hacia adentro para mostrarlo en pantalla: `baseImponible = netTotal / (1 + tasaIGV)`, `igv = netTotal - baseImponible` (de modo que `baseImponible + igv = netTotal`, sin alterar el total). Ese `netTotal` correcto se envía como `input.total` a `emitirComprobante()` (`bridge-comprobante.ts`), pero esta función solo lo usa para *validar* el comprobante contra `validarComprobante()` — nunca lo asigna al comprobante final.

`crearComprobante()` (`comprobante.service.ts`) ignora por completo el total recibido y **recalcula desde cero** a partir de las líneas, tratando `linea.valorUnitario` como si fuera un precio **sin IGV**, sumándole 18% encima:

```ts
function calcularSubtotal(lineas) { return lineas.reduce((t, l) => t + l.valorUnitario * l.cantidad, 0) }
function calcularIGV(lineas) { return lineas.reduce((t, l) => l.tipoAfectacionIGV !== 'GRAVADO' ? t : t + (l.valorUnitario * l.cantidad * l.tasaIGV), 0) }
// ...
const total = subtotal + igv + isc   // suma el IGV ENCIMA del precio que ya lo incluía
```

**Consecuencia real:** el comprobante persistido en SQLite —el dato oficial, el que se imprime, el que exporta reportes, el que lee el módulo COMPROBANTES— queda con un total 18% mayor al que el operador vio y confirmó en pantalla, en toda venta con afectación Gravado. Confirmado con datos reales de prueba: carrito de S/10.00 (4× PARACETAMOL 500MG PRUEBA a S/2.50), pantalla de cobro mostró correctamente "TOTAL A COBRAR: S/10.00" con desglose Base S/8.47 + IGV S/1.53, pero el comprobante persistido (T001-00000015) quedó con Base S/10.00 + IGV S/1.80 = **Total S/11.80**.

**Verificación de alcance (2026-07-27):** se confirmó con consulta directa contra los 20 comprobantes emitidos en el entorno de pruebas (correlativos T001-1 al T001-17, B001-1, F001-1, C001-1, fechas 2026-07-24 a 2026-07-27) que **el 100% presenta el mismo patrón** `subtotal × (1 + tasaIGV) = total`, es decir, el defecto existe desde el primer comprobante emitido — no es una regresión de esta sesión, es el comportamiento del sistema desde el origen, recién detectado al cruzar el nuevo dato de `monto_recibido`/`vuelto` (H-C18) contra el `total` ya existente.

**El arqueo de sesión en memoria (`sessionStats`, `useSessionStats.ts`) NO está afectado** — `recordSale(netTotal, ...)` recibe el `netTotal` correcto directamente desde `CobroPanel.tsx`, no el `comprobante.total` recalculado. Confirmado por lectura de código: `recordSale` se invoca con `netTotal` como primer argumento tanto en `confirmEmit` como en `handleImprimir`. El arqueo visible durante el turno (cuánto efectivo, Yape, tarjeta) es correcto.

**Grieta colateral detectada:** `revertirVenta(c: Comprobante)` (invocado al anular un comprobante) resta `c.total` —el inflado, no el correcto— de `sessionStats.total`. Al día de este registro no se ha confirmado el efecto en producción porque no se ha anulado ningún comprobante de prueba, pero la lectura de código indica que anular un comprobante afectado por este bug descuadraría el arqueo de sesión en sentido contrario (restaría de más). Este efecto colateral se resuelve automáticamente en cuanto se aplique el fix de H-C19, ya que todo comprobante nuevo tendrá `total` correcto.

**`convertirAFormal()` no recalcula** — copia `subtotal`/`igv`/`total` directamente del comprobante origen sin volver a pasar por `calcularSubtotal`/`calcularIGV`, por lo que hereda automáticamente el total ya correcto una vez aplicado el fix, sin requerir cambios en esa función.

**Datos de prueba, no producción:** los 20 comprobantes con total inflado corresponden al entorno de pruebas de Fernando, no a operación real — decisión explícita de no aplicar corrección retroactiva sobre esos registros; quedan como evidencia de que el defecto fue capturado en fase de pruebas antes de producción.

**Detectado por Fernando en sesión (2026-07-27)**, durante la verificación en runtime de H-C18, verificado contra código real (`comprobante.service.ts`, `bridge-comprobante.ts`, `comprobante.validator.ts`, `useSessionStats.ts`) antes de registrar.

**Prioridad:** máxima — a diferencia de H-C18 (dato de trazabilidad ausente), este defecto altera el **monto fiscal real del comprobante emitido**, el documento oficial que ve el cliente y que sustenta la venta ante SUNAT en los tipos formales (Boleta, Factura).

**Cerrado — commit `156d5df` (2026-07-27).** `crearComprobante` amplía su firma para recibir `subtotalCalculado` e `igvCalculado` (además del ya existente `totalCalculado`), y los usa directamente en vez de derivarlos de las líneas. `emitirComprobante` (`bridge-comprobante.ts`) propaga `input.subtotal`/`input.igv` en la llamada. Las funciones `calcularSubtotal`/`calcularIGV` quedaron sin ningún llamador tras el cambio (confirmado por `tsc` con error `TS6133`) y se eliminaron del archivo; `calcularISC` permanece intacta y en uso. `convertirAFormal` no requirió cambios — ya copiaba `subtotal`/`igv`/`total` del comprobante origen sin recalcular. Verificado con `tsc` y `cargo check` limpios antes de commitear.

**Verificación en runtime (2026-07-27):** venta de prueba real en efectivo, afectación Gravado (4× PARACETAMOL 500MG PRUEBA, S/2.50 c/u, recibido S/20.00). Comprobante persistido (T001-00000018) confirmó `subtotal = 8.47`, `igv = 1.53`, `total = 10.00` — coincide exactamente con lo mostrado y confirmado en pantalla. `monto_recibido = 20`, `vuelto = 10` — coherente con `total` por primera vez desde que se cruzaron ambos datos. H-C19 queda cerrado en los tres frentes: código, documentación y verificación real en base de datos.

---

## 🟡 Hallazgos medios

| # | Hallazgo | Ubicación |
|---|---|---|
| H-M1 | Correlativo mostrado en pantalla (`correlativoStore`, memoria) puede divergir del correlativo real asignado en SQLite al emitir. `confirmarEmision()` nunca se invoca. | `CobroPanel.tsx`, `correlativo.store.ts` |
| H-M2 | Botón COBRAR en el ticket no verifica `cashSession.isOpen` directamente (mitigado: los botones de confirmación dentro del panel de cobro sí lo bloquean). | `domains/preventa/components/PreVentaGrid.tsx` |
| H-M3 | `codigoBarras` aún no se pasa desde `SalesWorkspace` pese al fix ya commiteado en `bridge-pedido.ts` (commit `d46ca2d`). | `modules/sales/SalesWorkspace.tsx` |
| H-M4 | Manejo de error genérico en confirmación de cobro — mismo mensaje para cualquier causa de fallo, sin registro en `error_log`. | `CobroPanel.tsx` (`confirmEmit`, `handleImprimir`) |
| H-M5 | Fire-and-forget sin manejo de error en botón "Devolver" de préstamos pendientes de fondo de cambio. | `modules/cash/CashWorkspace.tsx` |
| H-M6 | Sin control de documento duplicado al crear cliente — dos registros con el mismo DNI/RUC pueden convivir sin fusión ni alerta. | `modules/sales/ClienteBuscador.tsx` |
| H-M7 | Fallback silencioso a correlativo `1` si no se provee explícitamente (no ocurre hoy porque el caller siempre lo provee, pero el tipo permite el caso). | `domains/documents/bridge-comprobante.ts` |
| H-M8 | REIMPRIMIR: el backend ya existe (`registrarEventoComprobanteSQLite`) pero no hay botón en la UI que lo dispare. | `modules/comprobantes/ComprobantesWorkspace.tsx` |

---

## 🟢 Hallazgos menores / cosméticos

| # | Hallazgo | Ubicación |
|---|---|---|
| H-m1 | `README-preventa.md` desactualizado — describe `sales` persistiendo en localStorage; en realidad usa SQLite desde hace varias faenas. | `domains/preventa/README-preventa.md` |
| H-m2 | Mezcla de localStorage para estado efímero de UI (progreso del wizard de cierre de caja) — probablemente intencional, a confirmar con Fernando si debe unificarse. | `modules/cash/CashWorkspace.tsx` |
| H-m3 | Riesgo de carrera: `selectedCode` cae a fallback `"100"` si `cashBoxes` no cargó aún al montar. | `modules/cash/CashWorkspace.tsx` |
| H-m4 | Referencias muertas a clave de localStorage `disateq.pos.turnEvents` en botones de reset — ambas dentro de herramientas visibles solo en modo DEV o de bajo impacto (solo borran, no leen). | `modules/config/ConfigWorkspace.tsx`, `modules/inventory/InventoryWorkspace.tsx` |

---

## ✅ Deuda documentada que resultó ya estar resuelta

Al auditar contra el código real (no contra `CURRENT_CONTEXT.md`), se confirmó que parte de la deuda registrada ya no aplica:

- **ANULAR comprobante**: sí exige PIN de autorización (`useAutorizacion` / `solicitarAutorizacion`) y registra auditoría completa vía `auditoriaService`.
- **CONVERTIR a BOLETA/FACTURA**: comando completo, con autorización, correlativo real, y marcado del comprobante original como `REFERENCIADO`.
- **REIMPRIMIR**: parcialmente pendiente — el backend está listo, falta la UI (ver H-M8).
- **Sucesos del turno**: sí tienen vista real integrada en `CashWorkspace.tsx` (`currentSessionEvents`), correctamente persistidos en SQLite vía `registrarEventoTurnoEnSQLite`.

**Recomendación de proceso:** actualizar `CURRENT_CONTEXT.md` para reflejar este estado real antes de planificar el "Sprint DOCUMENTOS", evitando re-trabajo sobre código ya funcional.

---

## Máquina de estados del pedido (referencia, confirmada correcta)

`pedido.service.ts` implementa correctamente:

```
ABIERTO → CONFIRMADO → EN_COBRO → CONCRETADO
   ↓            ↓            ↓
   └────────ABANDONADO───────┘   (no permitido desde CONCRETADO)
```

Todas las transiciones tienen sus invariantes (no agregar línea a pedido no-ABIERTO, no confirmar sin líneas activas, no abandonar un CONCRETADO). El problema no está en el diseño de la máquina sino en que su fallo no se propaga (ver H-C1).

---

## Próximos pasos sugeridos

1. **Fase 2 — Barrido de interrelación:** confirmar cómo se conectan estos hallazgos entre sí (p. ej. H-C3 + H-C4 + H-C1 son la misma familia de "fallos silenciosos en la cadena de captura→pedido→concreción").
2. **Fase 3 — Correcciones:** priorizar con Fernando, generar prompts atómicos para Codex por hallazgo o por grupo relacionado.
3. Actualizar `README-preventa.md` (H-m1) y `CURRENT_CONTEXT.md` (deuda ya resuelta) como parte de la limpieza documental.
4. H-C16 y H-C17 cerrados (2026-07-25). Pendiente: numerar y diseñar los dos hallazgos colaterales derivados (split de línea sin conexión al dominio + configurabilidad por rubro de notas; `limpiar()` sin abandono formal del pedido).
5. H-C18 cerrado (2026-07-27, commit `1e1131d`), con verificación en runtime completada.
6. H-C19 cerrado (2026-07-27, commit `156d5df`), con verificación en runtime completada (correlativo T001-00000018 — `total` y `vuelto` coherentes con lo mostrado en pantalla).
