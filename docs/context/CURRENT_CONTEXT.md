# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** 416859f · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** limpio

## ESTADO DE MODULOS
Auditoria de Flujo Completo de Ventas, Fase 3 (correcciones) EN CURSO. H-C16 y H-C17
CERRADOS hoy (2026-07-25), ambos formalizados en AUDITORIA_FLUJO_VENTAS_2026-07-24.md con
severidad verificada contra codigo real. H-C16: lineaId visual y LineaPedido.id real eran
UUIDs independientes sin correlacion -- unificados; incrementarLinea/decrementarLinea ahora
llaman modificarCantidad(). H-C17: no existia funcion de dominio para quitar una linea
(EstadoLineaPedido='SUSPENDIDA' estaba definido pero sin uso) -- se creo suspenderLinea() y
se conecto quitarLinea(). Ambos con guard defensivo (fallo de dominio no toca store visual)
y operadorId real (sin patron `?? "default"`) en sus dos llamadores (PreVentaGrid.tsx clic,
SalesWorkspace.tsx teclado).

## COMMITS DE HOY (2026-07-25), en orden (ver git log para historial completo)
ca790b8 doc cierre H-C16 · 678d0bd fix H-C16 · 0f379b4 fix H-C17 · 416859f doc cierre H-C17

## PENDIENTE — ORDEN PROXIMA SESION
0. Documentar en detalle practico el envio electronico de comprobantes a SUNAT. Diseno
   conceptual ya esbozado en sesion 2026-07-27 (JSON interno VENDOR->OSE, cola separada
   con plazo legal, boleta por resumen diario vs. factura individual e inmediata) -- pero
   sin bajar aun a decisiones operativas concretas: que OSE/PSE se usara, gestion del CDT,
   y confirmar plazos vigentes contra la resolucion SUNAT actual al momento de implementar.
   Fernando senalo expresamente que el tema "no esta claro" y lo pidio como primer punto.
1. Auditoria UX del listado de busqueda -- Fernando tiene hallazgos sin detallar, pendiente
   de que los comparta al abrir la sesion.
2. Numerar y disenar hallazgo colateral de `limpiar()`: no invoca abandonarPedido(), deja
   Pedido en estado ABIERTO huerfano en SQLite si se limpia el ticket sin concretar venta.
3. Numerar y disenar hallazgo colateral de `splitLinea()`: crea LineaPreVenta con UUID
   propio sin operacion equivalente en el pedido real (misma familia que H-C16/H-C17).
   Fernando confirmo que la funcionalidad de nota-por-linea/tique de despacho debe ser
   configurable por rubro, no universal -- incorporar ese requisito al diseno.
4. Reevaluar H-C1 (fecha de concrecion inventada) con H-C10, H-C3, H-C6, H-C16, H-C17 ya
   resueltos -- superficie real puede haberse reducido.
5. `agregarProducto` (preventa.service.ts, ruta legacy sin HOV): confirmado sin llamadores
   activos en el arbol. Candidato a limpieza cosmetica, sin numerar.

## DEUDA CONOCIDA (ver PARCHES_Y_SOLUCIONES_PARCIALES.md para detalle completo)
- pedido_venta vs venta/linea_venta: dos rutas de persistencia paralelas sin reconciliacion.
- HOVs creadas antes del fix H-C13 mantienen costoBase mal prorrateado (no retroactivo).
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
