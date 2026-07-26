# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** 076a59e · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** con doc pendiente de commit

## ESTADO DE MODULOS
Auditoria de Flujo Completo de Ventas, Fase 3 (correcciones) EN CURSO. Bloque 1 (H-C5/H-C7/
H-C9), Bloque 2 (H-C3) y Bloque 3 (H-C6, con porcion de H-C4) CERRADOS. H-C6: agregarLinea()
no tenia via para recibir un precio manual del operador -- se perdia en S/0.00 (HOV sin
precio) o se ignoraba silenciosamente (ajuste manual sobre precio de catalogo existente).
Corregido con AgregarLineaInput.valorManual, propagado desde agregarProductoDesdeHOV segun
tipoValor === 'LIBRE'. De paso se cerro la porcion de H-C4 en ese mismo punto de entrada
(catch silencioso reemplazado; ticket visual ya no se pinta si agregarLinea falla o no hay
pedido activo). AUDITORIA_FLUJO_VENTAS_2026-07-24.md actualizado hoy: H-C3, H-C6, H-C11
formalizados con su cierre; H-C4 marcado cerrado parcialmente; H-C16 (nuevo) insertado.

## COMMITS DE HOY (2026-07-25), en orden
8007e01 H-C10 cierre documental · 386635d H-C12 · f8f21f4 H-C13 · 7196000 H-C14 ·
65f04bc doc parches · d84a6f9 Bloque 1a (CobroPanel) · a65e01a Bloque 1b/c/d (constante
catalogo) · 76b3c0e Bloque 2 (H-C3, contexto real en catalogo visual) · 076a59e Bloque 3
(H-C6 precio manual + porcion H-C4)

## PENDIENTE — ORDEN PROXIMA SESION
1. H-C16 (nuevo, critico): incrementarLinea/decrementarLinea en preventa.service.ts solo
   tocan el store visual (usePreVentaStore.actualizarCantidad) -- nunca llaman
   pedido.service.ts::modificarCantidad(). El ticket muestra una cantidad que el pedido
   operacional real nunca recibe. Mismo patron que H-C6, ahora en cantidad. Flujo de uso
   muy frecuente (+/-/flechas), riesgo alto. Diseno pendiente.
2. Reevaluar H-C1 (fecha de concrecion inventada en sincronizarConcrecion) con H-C10, H-C3
   y H-C6 ya resueltos -- superficie real puede haberse reducido.
3. H-C4: verificar si queda alguna otra ruta con el mismo patron de catch silencioso mas
   alla de agregarProductoDesdeHOV (ya corregido) e incrementarLinea/decrementarLinea (ver
   H-C16) antes de dar el hallazgo por cerrado del todo.
4. Auditoria de UX del listado de busqueda -- Fernando tiene hallazgos adicionales sin
   detallar.
5. Commitear docs/auditoria/AUDITORIA_FLUJO_VENTAS_2026-07-24.md (modificado hoy, aun sin
   commit) junto con este archivo.

## DEUDA CONOCIDA (ver PARCHES_Y_SOLUCIONES_PARCIALES.md para detalle completo)
- pedido_venta vs venta/linea_venta: dos rutas de persistencia paralelas sin reconciliacion.
- HOVs creadas antes del fix H-C13 mantienen costoBase mal prorrateado (no retroactivo,
  decision explicita de Fernando).
- _persistirEnSQLite sigue fire-and-forget (H-C14 solo agrego logging, no reintento).
- PREFERENCIAL en el catalogo visual: no resoluble hasta identificacion de cliente (deuda
  arquitectonica confirmada, no bug).

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -10.
3. Presentar estado y prioridades -- esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso -- nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico, en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
