# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** a65e01a · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** LIMPIO

## ESTADO DE MODULOS
Auditoria de Flujo Completo de Ventas, Fase 3 (correcciones) EN CURSO. H-C10 cerrado (falso
positivo de diagnostico — la venta si persistia, en tabla venta/linea_venta, no pedido_venta).
H-C14, H-C12, H-C13 corregidos y verificados (H-C12/H-C13 con evidencia visual real en la app).
Bloque 1 (H-C5/H-C7/H-C9) CERRADO COMPLETO: CobroPanel.tsx usa operador/caja reales, doble
invocacion unificada; contextoOperacionalId del catalogo centralizado en constante unica
CONTEXTO_CATALOGO_NEGOCIO (domains/catalog/catalogo.types.ts), conectada en
startup-integrity.service.ts y bridge-catalogo.ts. Documento
docs/auditoria/PARCHES_Y_SOLUCIONES_PARCIALES.md creado — registra que patrones eran parche
parcial vs. correccion de raiz.
Documento base: docs/auditoria/AUDITORIA_FLUJO_VENTAS_2026-07-24.md (incluye hasta H-C10).

## COMMITS DE HOY (2026-07-25), en orden
8007e01 H-C10 cierre documental · 386635d H-C12 · f8f21f4 H-C13 · 7196000 H-C14 ·
65f04bc doc parches · d84a6f9 Bloque 1a (CobroPanel) · a65e01a Bloque 1b/c/d (constante catalogo)

## PENDIENTE — ORDEN PROXIMA SESION
1. Bloque 2 (H-C3): doble motor de resolucion de precio — pedido operacional (resolverValor
   real) vs. precio precalculado del catalogo visual (bridge-catalogo.ts) pueden divergir.
2. Bloque 3 (H-C6): precio manual se pierde en S/0.00 al pasar por agregarLinea sin campo
   valorManual.
3. Reevaluar H-C1 (fecha de concrecion inventada en sincronizarConcrecion) con H-C10 ya
   resuelto — superficie real puede haberse reducido.
4. Formalizar H-C6 a H-C9 en AUDITORIA_FLUJO_VENTAS_2026-07-24.md (aun solo en historico).
5. Auditoria de UX del listado de busqueda — Fernando tiene hallazgos adicionales sin detallar.

## DEUDA CONOCIDA (ver PARCHES_Y_SOLUCIONES_PARCIALES.md para detalle completo)
- pedido_venta vs venta/linea_venta: dos rutas de persistencia paralelas sin reconciliacion.
- HOVs creadas antes del fix H-C13 mantienen costoBase mal prorrateado (no retroactivo,
  decision explicita de Fernando).
- _persistirEnSQLite sigue fire-and-forget (H-C14 solo agrego logging, no reintento).

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -8.
3. Presentar estado y prioridades — esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso — nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico, en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
