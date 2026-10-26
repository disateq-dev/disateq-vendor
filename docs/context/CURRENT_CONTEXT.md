# CURRENT_CONTEXT — DISATEQ Vendor™

**Aviso de standard (26-10-2026), tablero**: `E-115` — todo lo pendiente del ecosistema vive en el «Tablero» de `disateq-standard/CURRENT_CONTEXT.md`; una tarea en curso a la vez; lo que aparezca se anota allí sin interrumpir. Qué debe hacer este producto: nada por ahora. Lo retira la sesión de este producto que lo absorba.

**Aviso de standard (23-10-2026), higiene de código**: `E-113` (22-10) y `disateq-standard/CONSTRUCCION.md` §4.2 precisado — todo código nuevo o tocado, pruebas incluidas, cumple 150 líneas de código por archivo sin contar blancos ni comentarios (fuera: configuración del marco, migraciones, archivos generados y datos de prueba) o deja la justificación escrita en la revisión; lo existente que no cumple es brecha declarada (§16.1) para la ficha de cumplimiento (`D-003`); el control del Auditor QA arranca con CPE API, Consultas y Consola, no con este producto — qué debe hacer este producto: aplicarlo en todo lo que toque al retomarse; el puntero a estas reglas para el Ingeniero (su `AGENTS.md`, que remite a `docs/codex.md`) lo agrega standard con la capa 7 de `E-113` (pendiente). Lo retira la sesión de este producto que lo absorba.

**Aviso de standard (19-10-2026), memoria y cierre verificado**: `E-110` — la próxima sesión de este producto poda la memoria de su Project y deja solo preferencias, horarios, entorno y equipo (el estado vive en disco, no en la memoria); desde ahora, al cerrar cada ventana se corren el check, los HEADs y el `git status` y se contrasta la memoria con lo cerrado (`ROLES.md` R-10 y R-20). Lo retira la sesión que haga la poda.

**Aviso de standard (13-10-2026)**: las instrucciones del Project «disateq-vendor» se reemplazaron por el puntero de arranque de `E-102` (`disateq-standard/docs/ARQUITECTO.md`) — `E-102` — al retomar Vendor, revisar `docs/00-governance/INSTRUCCIONES-PROJECT-ANTERIOR.md`, llevar sus reglas de dominio a la documentación del producto y armonizar el `CLAUDE.md` de este repositorio con `ARQUITECTO.md`. Lo retira la sesión que lo absorba.

**Commit activo:** 1fec6c5 · **Rama:** main · **Migracion SQLite:** v30 · **Working tree:** limpio (verificar tras commit de este archivo)

## ⚠️ NOTA DE PROCESO — LEER PRIMERO
Este archivo fue reescrito completo el 2026-08-23 tras detectar en auditoria que la version
anterior habia quedado congelada en el estado de H-C16/H-C17 (2026-07-25), con solo un parche
incremental de 6 lineas encima -- pese a que H-C18, H-C19 y H-C20 ya estaban cerrados en
`AUDITORIA_FLUJO_VENTAS_2026-07-24.md` con fecha 2026-07-27. Causa raiz: el archivo no se
reescribio completo al cierre de esa sesion, violando la regla del proyecto. Esta reescritura
se hizo cruzando el documento de auditoria (fuente de verdad de hallazgos) contra el historial
de commits. Si en una proxima sesion este archivo vuelve a divergir de la auditoria, tratarlo
como hallazgo de proceso, no solo corregirlo en silencio.

## ESTADO DE MODULOS
Auditoria de Flujo Completo de Ventas, Fase 3 (correcciones) EN CURSO. Hallazgos criticos
cerrados en los tres frentes (codigo + documentacion) hasta H-C20 inclusive. H-C1, H-C2 y H-C5
permanecen abiertos (ver AUDITORIA_FLUJO_VENTAS_2026-07-24.md para detalle completo de cada
hallazgo). H-C20 tiene su verificacion en runtime PENDIENTE — fue el punto de entrada de esta
sesion y quedo interrumpida antes de obtener resultado de la consulta SQLite.

**Hallazgos cerrados (codigo + doc; runtime segun se detalla):**
- H-C3 — doble motor de resolucion de precio — commit `76b3c0e`
- H-C4 — fallo silencioso al agregar linea (cierre parcial, alcance reducido por H-C16) — commit `076a59e`
- H-C6 — precio manual se perdia en S/0.00 — commit `076a59e`
- H-C10 — falso positivo de diagnostico (tabla equivocada) — cerrado sin cambio de codigo
- H-C11 — sin feedback visual de seleccion + precio ajustado ignorado — commit `f8f21f4`
- H-C16 — ajuste de cantidad (+/-) no se propagaba al pedido real — commit `678d0bd`
- H-C17 — quitarLinea no propagaba eliminacion al pedido real — commit `0f379b4`
- H-C18 — monto_recibido/vuelto no se persistian — commit `1e1131d` — runtime verificado (T001-00000015)
- H-C19 — doble calculo de IGV (total inflado 18%) — commit `156d5df` — runtime verificado (T001-00000018)
- H-C20 — limpiar() no invocaba abandonarPedido(), pedidos huerfanos ABIERTO — commit `651bd26` — **runtime PENDIENTE**

**Hallazgos abiertos, sin cerrar:**
- H-C1 — fallo de concrecion se traga en silencio, fecha de concrecion inventada (prioridad maxima)
- H-C2 — base de clientes 100% en localStorage, sin camino a SQLite (prioridad maxima)
- H-C5 — contexto operacional hardcodeado a "default" en CobroPanel.tsx (prioridad alta)

**Hallazgos colaterales derivados, sin numerar aun:**
- `splitLinea()` (usePreVentaStore) crea LineaPreVenta con UUID propio sin operacion equivalente
  en el pedido real — misma familia de identidad huerfana que H-C16, ambito distinto. Fernando
  confirmo que nota-por-linea/tique de despacho debe ser configurable por rubro, no universal —
  incorporar ese requisito al diseño cuando se numere.

**Hallazgos medios (H-M1 a H-M8) y menores (H-m1 a H-m4):** sin tocar esta sesion, ver
auditoria para detalle completo.

## COMMITS DE HOY (2026-08-23), en orden
1ab9e6f docs(comprobantes): arquitectura de impresion + doc comprobantes (nuevo)
6add783 docs(governance): bitacora de decisiones + estandares tecnicos
1fec6c5 docs(context): CURRENT_CONTEXT.md (parche incremental — SUPERSEDIDO por esta reescritura completa)

**Nota:** no hubo commits de codigo esta sesion. El trabajo fue: arranque de la app (diagnostico
de puerto 5173 ocupado por proceso colgado de sesion anterior — sin cambio de configuracion,
Fernando decidio dejarlo como esta), limpieza de un `pnpm-lock.yaml` generado por accidente
(no comiteado, eliminado del working directory), los 3 commits documentales de arriba, y el
inicio de la verificacion runtime de H-C20 (interrumpido antes de ejecutar la consulta SQLite).

## PENDIENTE — ORDEN PROXIMA SESION
0. **Completar verificacion runtime de H-C20** — es el punto de entrada, quedo a la mitad:
   abrir pedido con producto → LIMPIAR ticket sin cobrar → confirmar en SQLite que el `Pedido`
   queda en estado `ABANDONADO` (no huerfano en `ABIERTO`). Consulta sugerida (confirmar nombre
   real de tabla/columnas contra el esquema si falla):
   `SELECT id, estado, fecha_creacion, fecha_actualizacion FROM pedido_venta ORDER BY fecha_creacion DESC LIMIT 5;`
1. Numerar y diseñar hallazgo colateral de `splitLinea()` (identidad huerfana al disgregar
   linea con nota) + requisito de configurabilidad por rubro.
2. Reevaluar H-C1 (fecha de concrecion inventada) — superficie real puede haberse reducido
   con H-C3/H-C6/H-C16/H-C17/H-C18/H-C19/H-C20 ya resueltos.
3. `agregarProducto` (preventa.service.ts, ruta legacy sin HOV): confirmado sin llamadores
   activos. Candidato a limpieza cosmetica, sin numerar.
4. Auditoria UX del listado de busqueda — Fernando tiene hallazgos sin detallar, pendiente de
   que los comparta al abrir sesion (arrastrado de sesiones anteriores, no confirmado si sigue
   vigente — preguntar a Fernando).
5. Documentar envio electronico de comprobantes a SUNAT — diseño conceptual esbozado en sesion
   previa (JSON interno VENDOR->OSE, cola separada con plazo legal, boleta por resumen diario
   vs. factura individual e inmediata), sin bajar a decisiones operativas concretas (que OSE/PSE,
   gestion del CDT, plazos vigentes). Fernando senalo que "no esta claro" — arrastrado de
   sesiones anteriores, confirmar con Fernando si sigue siendo prioridad antes de retomarlo.
6. H-C2 (clientes en localStorage) y H-C5 (contexto hardcodeado "default") siguen abiertos,
   sin fecha asignada — evaluar con Fernando si entran en el orden de esta lista.

## DEUDA CONOCIDA (ver PARCHES_Y_SOLUCIONES_PARCIALES.md para detalle completo)
- pedido_venta vs venta/linea_venta: dos rutas de persistencia paralelas sin reconciliacion
  (confirmado por H-C10 que ambas son legitimas y correctas, no un bug — pero siguen siendo
  dos rutas paralelas que un lector futuro debe conocer).
- HOVs creadas antes del fix H-C13 mantienen costoBase mal prorrateado (no retroactivo).
- _persistirEnSQLite sigue fire-and-forget (H-C14 solo agrego logging, no reintento).
- PREFERENCIAL en el catalogo visual: no resoluble hasta identificacion de cliente (deuda
  arquitectonica confirmada, no bug).
- 20 comprobantes de prueba (T001-1 a T001-17, B001-1, F001-1, C001-1) quedan con total inflado
  por el bug de H-C19 — decision deliberada de NO corregir retroactivamente (datos de prueba,
  no produccion). Si se detecta un comprobante real de produccion con este patron, es hallazgo
  nuevo, no este mismo.
- `pnpm-lock.yaml` puede volver a generarse por accidente si alguien corre `pnpm install` en
  vez de `npm install` — el proyecto usa npm (`package-lock.json`). Vigilar en `git status`.

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -10 y git status --short — confirmar que coincide con lo aqui descrito.
3. Presentar estado y prioridades — esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso — nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico, en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
7. Al cerrar sesion: reescribir este archivo COMPLETO (no editar incrementalmente) — ver nota
   de proceso al inicio de este archivo sobre por que esta regla existe.
