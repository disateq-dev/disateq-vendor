# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** 34a8afc · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** LIMPIO

## ESTADO DE MODULOS
Auditoria Integral (por bloques tecnicos): Bloques 1 (cash/) y 2 (sales/+preventa/) CERRADOS.
Bloques 3-8 PENDIENTES.

Auditoria de Flujo Completo de Ventas (por recorrido operacional, 11 pasos, distinta de la
Auditoria Integral por bloques): COMPLETADA — Fase 1 (recorrido paso a paso). Fase 2
(interrelacion) y Fase 3 (correcciones) PENDIENTES. Documento completo en
docs/auditoria/AUDITORIA_FLUJO_VENTAS_2026-07-24.md — 5 hallazgos criticos, 8 medios,
4 menores. Ver seccion HALLAZGOS CRITICOS abajo para el resumen operativo.

Flujo clientes: D1, D2, D3 arquitectura PENDIENTE. D4 cerrado parcialmente. clienteStore
sigue en localStorage — confirmado en auditoria de flujo completo (H-C2), riesgo real de
perdida de datos de negocio, no solo deuda tecnica cosmetica.

Integraciones DNI/RUC: operativo y verificado (my.apidev.pro).

## HALLAZGOS CRITICOS — AUDITORIA FLUJO COMPLETO (2026-07-24)
Detalle completo en docs/auditoria/AUDITORIA_FLUJO_VENTAS_2026-07-24.md. Resumen:

- H-C1: fallo de concrecion de pedido se traga en silencio — venta puede quedar registrada
  en SQLite con el pedido aun en estado ABIERTO y una fecha de concrecion inventada, pese
  a que el comprobante ya se emitio e imprimio. bridge-pedido.ts (sincronizarConcrecion).
- H-C2: clienteStore 100% en localStorage — riesgo real de perdida de la base de clientes
  frecuentes. domains/clients/cliente.store.ts.
- H-C3: doble motor de resolucion de precio — el precio visible en pantalla (catalogo
  precalculado) puede no coincidir con el precio realmente persistido (resolverValor()).
- H-C4: fallo silencioso al agregar linea deja "producto fantasma" en el ticket visual
  sin persistir en el pedido real. preventa.service.ts (agregarProductoDesdeHOV).
- H-C5: contexto/identidad operacional hardcodeados a "default" en CobroPanel — rompe
  trazabilidad real de que operador/bloque concreto cada venta.

## DEUDA EXPLICITA ACTIVA (revisada y corregida tras auditoria 2026-07-24)
- ANULAR y CONVERTIR en ComprobantesWorkspace.tsx: CONFIRMADO YA RESUELTO — ambos tienen
  PIN de autorizacion (useAutorizacion) y registro de auditoria completo. La entrada previa
  de esta deuda estaba desactualizada, NO planificar sprint para esto.
- REIMPRIMIR: pendiente real, pero solo falta la UI — el backend
  (registrarEventoComprobanteSQLite) ya existe y esta listo para conectar.
- correlativoStore.confirmarEmision() nunca invocado — el numero de comprobante mostrado
  en pantalla antes de cobrar puede no coincidir con el numero real asignado en SQLite al
  emitir (H-M1 en auditoria). Cosmetico pero confunde si se audita a ojo.
- clients/cliente.store.ts y purchases/* en localStorage — ver H-C2, ya no es solo deuda
  tecnica, es riesgo de perdida de datos.
- ConfigWorkspace.tsx: sin pantalla de politica de precios (deuda v1.1).
- README-preventa.md desactualizado (dice que sales usa localStorage; usa SQLite desde
  hace varias faenas) — corregir en limpieza documental.
- Ver DEUDA_HISTORICA en CURRENT_CONTEXT_HISTORICA.md para items resueltos o de menor prioridad.

## ORDEN DE TRABAJO PROXIMA SESION
1. Fase 2 de la Auditoria de Flujo Completo: revisar interrelacion entre H-C1, H-C3, H-C4
   (misma familia: fallos silenciosos en la cadena captura -> pedido -> concrecion).
2. Fase 3: priorizar hallazgos con Fernando y generar prompts atomicos para Codex,
   empezando por H-C1 (integridad de venta concretada) y H-C2 (clientes a SQLite).
3. Sprint migracion Clientes a SQLite (resuelve H-C2 y prerequisito D1/D2).
4. Conectar REIMPRIMIR en ComprobantesWorkspace.tsx (backend ya listo).
5. Continuar Auditoria Integral por bloques tecnicos — Bloque 3 (si no se prioriza la
   auditoria de flujo completo primero).
6. Migracion purchases a SQLite.
7. Pantalla configuracion politica de precios (deuda v1.1).

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -5.
3. Presentar estado y prioridades — esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso — nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico (2-3 lineas), en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
