# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** 0d68323 · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** LIMPIO (tras commit de este cierre)

## ESTADO DE MODULOS
Auditoria de Flujo Completo de Ventas: Fase 1 y Fase 2 COMPLETADAS. Fase 3 (correcciones)
EN CURSO — Bloque 0 (H-C10) resuelto en codigo, PENDIENTE VERIFICACION EN VIVO (venta de
prueba real + SELECT COUNT). H-C11 resuelto y commiteado (5e11606, e9a901c, 0d68323).
Bloques 1-3 (H-C7/H-C5/H-C9/H-C3/H-C6) diseñados en sesion previa, pendientes de ejecucion.
Documento base: docs/auditoria/AUDITORIA_FLUJO_VENTAS_2026-07-24.md (incluye H-C11).

Flujo clientes: D1, D2, D3 arquitectura PENDIENTE. clienteStore en localStorage (H-C2).

## HALLAZGOS RESUELTOS HOY (2026-07-25)
- **H-C11 (commits 5e11606, e9a901c, 0d68323):** PresentacionSheet.tsx sin feedback visual
  de seleccion + confirmarActiva() ignoraba precio manual ajustado. Corregido.
- **Turno/caja heredado entre operadores:** cashSession global sin particionar por
  operador — un nuevo login heredaba el turno abierto de otro operador sin restriccion.
  Corregido: App.tsx exige cashSession.operatorId === activeOperator.id para entrar
  directo a VENTAS; OperationalBar.tsx bloquea navegacion manual a VENTAS si la caja
  abierta es de otro operador (cajaEsDeOtroOperador). Decision de negocio confirmada:
  MAESTRO/SOPORTE deben poder abrir turno propio igual que cualquier operador.
- **Agrupacion de resultados de busqueda (commit e9a901c):** listado en modo dense y
  visual mostraba una fila/tarjeta por cada forma de venta (HOV individual) en vez de una
  por producto. Corregido con addGroupToTicket() + agruparPorProducto() en ambos bloques.
  NOTA: aun por revisar en auditoria de UX (Fernando encontro detalles adicionales, no
  registrados en detalle, pendientes para esa auditoria especifica).

## HALLAZGOS NUEVOS SIN CORRECCION — CANDIDATOS H-C12/H-C13
- **H-C12 (candidato):** startup-integrity.service.ts (verificarIntegridadCacheFarmacia)
  solo sincroniza valores tipo VENTA_NORMAL al reconstruir HOVs — ignora VENTA_MAYOREO y
  otros tipos. Confirmado con datos reales: nodo Caja x 500 (VENTA_MAYOREO) nunca sincroniza
  precio, queda "SIN PRECIO" en UI pese a tener valor_operacional correcto en SQLite.
- **H-C13 (candidato):** proyectarAHov() (hov-projector.service.ts) no prorratea costoBase
  segun factorConversion en nodos tipo FRACCION — hereda el costoCompra completo de la
  presentacion padre. Confirmado con datos reales: fraccion "Tableta unidad" (precio venta
  S/0.30) hereda costoBase del blister completo (S/1.20), y resolverValor() la rechaza por
  "valor menor al costo base", quedando "SIN PRECIO" en UI pese a que el valor SI se
  sincronizo correctamente (confirmado con log [DIAGNOSTICO-VALORES]).
  Ambos sin diseño de correccion aun — pendiente para proxima sesion.

## DATOS DE PRUEBA (sesion 2026-07-25)
Catalogo de prueba real vive bajo prefijo pc-prueba-* (NO coincide con
seed_farmacia_prueba.sql del repo, que nunca corrio contra esta base — ese seed referencia
pc-001/pc-003 inexistentes en la BD real). Agregado hoy via
seed_presentaciones_adicionales.sql (en raiz del repo, no commiteado — es dato, no codigo):
- AMOXICILINA 500MG PRUEBA (pc-prueba-001): +BLISTER x 10 capsulas (S/18.00).
- PARACETAMOL 500MG PRUEBA (pc-prueba-002, nuevo): BLISTER x 10 (S/2.50) + TABLETA UNIDAD
  fraccion (S/0.30, afectada por H-C13) + CAJA x 500 mayorista (S/75.00, afectada por H-C12).

## ORDEN DE TRABAJO PROXIMA SESION
1. Verificar H-C10 en vivo: venta de prueba real + SELECT COUNT(*) FROM pedido_venta.
2. Diseñar y corregir H-C12 (sincronizacion de valores no-NORMAL en startup-integrity).
3. Diseñar y corregir H-C13 (prorrateo de costoBase en fracciones).
4. Prompt Bloque 1 (H-C7 ampliado + H-C5/H-C9 en CobroPanel.tsx) — diseño ya cerrado.
5. Prompt Bloque 2 (H-C3) y Bloque 3 (H-C6), secuenciales, con verificacion entre cada uno.
6. Reevaluar H-C1 con H-C10 ya verificado.
7. Auditoria de UX pendiente (Fernando tiene detalles adicionales del listado de busqueda
   y otros puntos operativos encontrados en pruebas propias, no detallados aun).

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -8.
3. Presentar estado y prioridades — esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso — nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico, en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
