# CURRENT_CONTEXT — DISATEQ Vendor™
**Commit activo:** d46ca2d · **Rama:** main · **Migracion SQLite:** v29 · **Working tree:** LIMPIO

## ESTADO DE MODULOS
Auditoria Integral: Bloques 1 (cash/) y 2 (sales/+preventa/) CERRADOS. Bloques 3-8 PENDIENTES.
Flujo nuclear de ventas: hallazgos criticos H2, H5, H10 CERRADOS. Detalle en
docs/context/CURRENT_CONTEXT_HISTORICA.md. Pendientes funcionales/UX: H4, H6, H7, H8, H9,
H11, H12 (ver HISTORICA para descripcion).
Flujo clientes: D1, D2, D3 arquitectura PENDIENTE. D4 cerrado parcialmente. clienteStore
sigue en localStorage — prerequisito para resolver D1/D2.
Integraciones DNI/RUC: operativo y verificado (my.apidev.pro).

## DEUDA EXPLICITA ACTIVA
- correlativoStore.confirmarEmision() nunca invocado — badge de previsualizacion en
  CobroPanel puede desincronizarse hasta reinicio. Menor, cosmetico.
- clients/cliente.store.ts y purchases/* en localStorage — pendiente migracion SQLite.
- DocumentosPanel.tsx: ANULAR sin PIN GESTOR, REIMPRIMIR no imprime, CONVERTIR sin comando.
- ConfigWorkspace.tsx: sin pantalla de politica de precios (deuda v1.1).
- Ver DEUDA_HISTORICA en CURRENT_CONTEXT_HISTORICA.md para items resueltos o de menor prioridad.

## ORDEN DE TRABAJO PROXIMA SESION
1. Continuar Auditoria Integral — Bloque 3
2. Sprint migracion Clientes a SQLite (D3 → prerequisito D1/D2)
3. Sprint DOCUMENTOS: CONVERTIR, PIN GESTOR, impresion real
4. Migracion purchases a SQLite
5. Pantalla configuracion politica de precios (deuda v1.1)

## PROTOCOLO PROXIMA SESION
1. Leer CLAUDE.md completo, luego este archivo completo (obligatorio, sin excepcion).
2. git log --oneline -5.
3. Presentar estado y prioridades — esperar confirmacion explicita de Fernando.
4. Ejecutar paso a paso — nunca avanzar sin confirmacion.
5. Tras cada decision tecnica: parrafo final en lenguaje no tecnico (2-3 lineas), en *cursiva*.
6. Ante duda arquitectonica: consultar docs/DOCTRINA.md, docs/ARQUITECTURA_UX.md o
   docs/00-governance/GLOSARIO.md antes de proponer solucion.
