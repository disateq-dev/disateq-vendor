# BITÁCORA DE DECISIONES — DISATEQ Vendor™

Registro append-only de descubrimientos, decisiones y deuda confirmados por
el Director de Producto. Distinto de CURRENT_CONTEXT.md (estado de trabajo
efímero) y de CONTRATO_ARQUITECTURA/GLOSARIO (doctrina consolidada) — esta
bitácora es el paso intermedio: aquí se acumula hasta que algo se promueve a
doctrina (con confirmación de Fernando) o se resuelve.

**Estados:** CONSOLIDADO · A EVALUAR · PENDIENTE DE IMPLEMENTAR · RESUELTO

**Regla de mantenimiento (desde 2026-06-21):** Esta bitácora contiene
ÚNICAMENTE entradas con estado CONSOLIDADO o RESUELTO **mientras siguen
siendo relevantes para trabajo activo**. En cuanto una entrada se cierra del
todo y ya no requiere consulta rutinaria, se mueve a
`docs/00-governance/BITACORA_HISTORICA.md` (nunca se elimina, solo se deja
de cargar por defecto). Las entradas PENDIENTE DE IMPLEMENTAR y A EVALUAR
permanecen aquí siempre hasta resolverse. Este archivo se reorganizó por
primera vez el 2026-06-21: de 21 entradas acumuladas desde el 13 de junio,
18 ya CONSOLIDADAS/RESUELTAS se archivaron en BITACORA_HISTORICA.md, quedando
aquí solo las 3 genuinamente abiertas.

---

## 2026-06-13 — Seed de catálogo (HOV) es acumulativo entre rubros
**Contexto:** `seedCatalogoFromRubro` (commit 6855097) crea HOVs para el
rubro activo pero no retira las de rubros anteriores. Al cambiar de rubro
en pruebas, VENTAS muestra productos mezclados de múltiples rubros.
**Decisión:** aceptado como dato de prueba por ahora.
**Estado:** PENDIENTE DE IMPLEMENTAR — resolver al diseñar gestión real de
catálogo/rubro en CONFIG (retirar/suspender HOVs del rubro saliente, o
filtrar catálogo proyectado por rubro activo además de contexto).

---

## 2026-06-13 — Discrepancia GLOSARIO §6 vs. storage keys reales de inventory
**Contexto:** GLOSARIO marca `disateq:inventory:items` como "ya correcto",
pero `domains/inventory/persistence.ts` usa `inv_v0_items`/`inv_v0_movimientos`.
**Decisión:** no migrar ahora (fuera de alcance de la corrección de hoy).
**Estado:** PENDIENTE DE IMPLEMENTAR — candidato a entrada en GLOSARIO §8
(Tabla de Conflictos Resueltos) cuando se aborde la migración de storage keys
del dominio inventory.

---

## 2026-06-20 — IngresosMercaderiaWorkspace: flujo de un solo paso, sin recepción parcial

**Contexto:** PurchasesWorkspace (prototipo localStorage) maneja un flujo de
dos tiempos: registrar pedido esperado (estado "registrada") → confirmar
llegada después, posiblemente parcial (estados "recibida_parcial" /
"recibida"). Se evaluó si IngresosMercaderiaWorkspace para farmacia (SQLite)
debía replicar ese mismo mecanismo.

**Decisión:** Flujo simplificado a un solo paso. El operador registra
exactamente lo que tiene físicamente en sus manos en el momento del ingreso.
No existe estado intermedio "pendiente de llegar" en el dominio farmacia.
Cada ingreso es un hecho consumado: se confirma con lote (si aplica) y
movimiento tipo "entrada" en la misma operación.

**Decisión derivada — lote genérico:** cuando el proveedor no provee número
de lote visible, el operador puede continuar con un lote genérico tipo
`SIN-LOTE-{fecha}`. La fecha de vencimiento queda en null (no se fuerza una
fecha estimada) hasta que el operador la actualice después. Criterio: no
bloquear al operador en el mostrador; ajustar tras validar en uso real.

**Decisión derivada — búsqueda de producto en el ingreso:** el buscador
muestra cada presentación comercial como fila de resultado independiente
(no un selector de producto + selector de presentación en dos pasos). Mismo
criterio: empezar simple, ajustar tras validar en uso real antes de sofisticar.

**Estado:** A EVALUAR EN USO REAL — Fernando validó "hay que probarlo para
ver si conviene, pero por ahora así se maneja". Revisar después de operación
real en mostrador si el lote genérico sin fecha y el listado plano de
presentaciones generan fricción o confusión.

---

## 2026-06-23 — Modelo de roles, multi-sucursal y topología operacional

**Contexto:** Durante revisión de la arquitectura multi-rubro / multi-usuario /
multi-sucursal, Fernando precisó el comportamiento operacional esperado de cada
rol en un contexto de múltiples locales. Esto modifica y amplía lo registrado
en GLOSARIO §10 (roles base), que solo contemplaba un local único.

**Decisiones confirmadas por Fernando (Director de Producto):**

1. **ADMINISTRADOR = Gerente General.** El rol ADMIN es el único con acceso
   al universo operativo completo de VENDOR — sin restricción por local,
   sucursal ni módulo. Es el techo de la jerarquía. No existe un rol por
   encima de ADMIN.

2. **GESTOR es por local.** A diferencia del resto de roles, GESTOR está
   ligado operacionalmente a un local específico. Un GESTOR no puede operar
   ni supervisar otro local que no sea el suyo. Es el administrador de su
   local — no del negocio completo.

3. **VEN, SOP y roles adicionales son portables entre sucursales.** Un
   operador con rol VEN (o cualquier rol distinto de GESTOR) puede trabajar
   en diferentes sucursales manteniendo sus capacidades inherentes o asignadas.
   La identidad operacional del operador no cambia al moverse entre locales —
   solo cambia el contexto de local activo en su sesión.

**Implicaciones arquitectónicas identificadas — pendientes de diseño formal:**

- El modelo de `Operador` necesita distinguir entre vínculo a local
  (GESTOR, fijo) y contexto de local activo (VEN/SOP, seleccionable al
  iniciar sesión o al abrir turno).
- El PORTAL / Nexo necesita una jerarquía `empresa → local → terminal`,
  no solo `cliente → terminal` como está esbozado hoy en ARQUITECTURA_SYNC.md.
- Los reportes y la visibilidad de datos deben respetar esta jerarquía:
  ADMIN ve todo · GESTOR ve solo su local · VEN ve solo su bloque.
- La asignación de series de comprobante (ya resuelta por terminal en
  ARQUITECTURA_SYNC §5) es compatible con este modelo — no requiere cambio.
- La pregunta de si un VEN puede "fichar" en más de un local en el mismo
  día (turnos parciales en locales distintos) queda abierta — no definida
  en esta sesión.

**Momento de resolución formal:** después de completar ABASTECIMIENTO y su
integración real con Turno/Caja y Ventas. El documento a producir en esa
instancia es la Arquitectura Multi-Sucursal, que responderá estas preguntas
y actualizará GLOSARIO §10 y ARQUITECTURA_SYNC.md en consecuencia.

**Estado:** PENDIENTE DE IMPLEMENTAR — bases confirmadas, diseño formal diferido.
No bloquea trabajo inmediato (todo el desarrollo actual ocurre en contexto
de local único).

---

## 2026-06-23 — Modelo de campos farmacéuticos: simplificación de UI y campos pendientes

**Contexto:** Análisis comparativo entre el estándar DIGEMID (estatal) y el modelo
operacional de cadenas de boticas privadas peruanas. Contraste aplicado contra
los campos actuales de DISATEQ.

**Campos ocultados de la UI (mantenidos en tipo y backend):**
- `nombreTitular` en `ProductoComercial` — sin valor operacional para el
  operador de una botica independiente. El titular y el fabricante son casi
  siempre la misma entidad en la práctica peruana.
- `paisOrigen` en `ProductoComercial` — no influye en ninguna decisión
  operacional. El operador no toma acciones basadas en el país de origen.

**Campos identificados como relevantes pero pendientes de diseño:**
- `estadoRegistroSanitario` — el estado legal del registro ante DIGEMID
  (Vigente, Suspendido, Cancelado, Vencido) es distinto del estado operacional
  del producto en el sistema (ACTIVO/INACTIVO). Hoy están colapsados. Requiere
  campo nuevo en `ProductoComercial` y migración de schema.
- `clasificacionATC` — código internacional de Anatomía, Terapéutica y
  Química. Más preciso que `categoriaFarmacia`. Diferir hasta integración
  avanzada con reportes DIGEMID.
- `flagGenericoObligatorio` — booleano de compliance con lista de genéricos
  esenciales. Relevante para evitar multas del Estado. Diferir.
- `precioObservatorio` — precio de referencia del Observatorio de Precios
  DIGEMID. Campo informativo para contraste con precio de venta. Diferir
  hasta módulo de precios avanzado.

**Campos correctamente modelados confirmados:** `registroSanitario`,
`ifa` (equivalente DCI), `concentracion`, `formaFarmaceutica`,
`condicionVenta`, `codigoDIGEMID`, `PresentacionComercial.codigoBarras`,
`PresentacionComercial.stockMinimo`, trazabilidad de lote con FEFO.

**Estado:** PENDIENTE DE IMPLEMENTAR — `estadoRegistroSanitario` es el
único campo de alta relevancia para la fase actual. Los demás se difieren
a fases posteriores (facturación electrónica, reportes DIGEMID avanzados).

---

## 2026-07-27 — Instrumentalización de IA en el proceso de construcción · reafirmación de identidad de producto

**Contexto:** Junta de equipo motivada por preocupación de Fernando (Director
de Producto) sobre la velocidad de cambio del desarrollo de software impulsado
por IA agéntica, y el riesgo de que modelos de producto tipo SaaS/ERP/POS
clásico queden desplazados. Se analizó, con evidencia de código real (no
especulación), si el producto DISATEQ Vendor™ debía reestructurarse en clave
"agéntica" para el operador final.

**Análisis realizado:** revisión de `fefo-despacho.service.ts` y
`hov-projector.service.ts` confirmó que la lógica de negocio actual (FEFO,
proyección HOV, resolución de precio) es determinista por diseño y debe
seguirlo siendo — un LLM ahí sería regresión, no mejora (no determinista,
más lento, sin la propiedad de auditoría exacta que exige el negocio
farmacéutico). No se identificó, con evidencia concreta, ningún punto del
producto hoy donde IA agéntica resuelva algo que la arquitectura determinista
actual resuelva mal. Sí se identificó un caso de uso agéntico verificable y
de bajo riesgo: instrumentalizar el propio proceso de desarrollo (ver decisión
2 abajo).

**Decisión 1 — El producto NO se reestructura en clave "agéntico".**
Se descarta la premisa inicial de junta ("SaaS/ERP/POS están condenados,
hay que volver el producto agéntico o la empresa muere"). Esta decisión
reafirma, no modifica, lo ya consolidado en `DOCTRINA.md` §1: DISATEQ Vendor
no busca ser ERP, SaaS ni POS clásico, pero tampoco persigue "agéntico" como
identidad de producto por moda de mercado. El criterio se mantiene: tomar lo
mejor de esos modelos sin parecerse a ninguno, validado contra dolor
operacional real del negocio peruano, nunca contra tendencia de industria sin
evidencia. Enterprise inflation y complejidad especulativa (`DOCTRINA.md` §4)
aplican explícitamente a "IA por moda" tanto como a cualquier otro patrón.

**Decisión 2 — El PROCESO de construcción sí se instrumentaliza y formaliza
con IA, de forma acotada.** Se aprueba explorar la incorporación de Claude
Code como cuarta pieza del equipo (ya prevista como "pendiente de
incorporación"), con un rol inicial deliberadamente estrecho: Auditor de
Cierre de Bloque — verifica que el archivo real en disco coincide con lo que
Codex reportó, corre `tsc`/`cargo check` automáticamente al cierre de cada
bloque, y señala si el diff se excede del alcance exacto del prompt (la
"tendencia conocida a controlar" ya nombrada en `docs/codex.md` §5). No
diseña, no decide arquitectura, no toca documentos de gobierno — mismo
perímetro de autoridad que ya rige para Codex.

**Plan de prueba:** informal, en la próxima faena de desarrollo activo, antes
de formalizar cualquier cambio a `AGENTS.md` o `docs/codex.md`. Fernando
decide, tras la prueba, si el auditor corre automáticamente tras cada bloque
de Codex o si permanece como verificación manual bajo demanda.

**Estado:** CONSOLIDADO — decisión de dirección tomada por Fernando en junta.
La prueba del rol de Claude Code queda PENDIENTE DE IMPLEMENTAR como acción
derivada, no como parte abierta de esta decisión.

---

## 2026-08-02 — Impresión no soporta logo (ni HTML ni térmica)

**Contexto:** Al auditar `printing-architecture.md` contra el código real
(`printTicket.ts`, `thermal.rs`), se confirmó que ninguna función de
impresión (HTML ni ESC/POS) incluye logo o imagen de negocio. Los tickets
son texto puro: encabezado con razón social/RUC, detalle de operación, pie.
No existe comando ESC/POS raster (`GS v 0`) ni `<img>` en el HTML de
impresión.

**Decisión:** ninguna aún — es un hallazgo, no una decisión de producto.
Si se requiere logo a futuro, es una funcionalidad nueva a diseñar
(impacto: overhead en impresión térmica de 58mm por limitación de ancho/
velocidad; en HTML es trivial).

**Estado:** A EVALUAR — Fernando debe confirmar si es una necesidad real
antes de diseñar.

---

## 2026-08-02 — Doble ruta de anulación de comprobante con persistencia divergente

**Contexto:** Al auditar la implementación completa de comprobantes
(`domains/documents/*`, `commands/comprobantes.rs`, `ComprobantesWorkspace.tsx`,
`DocumentosPanel.tsx`) para construir `comprobantes-architecture.md`, se
encontraron dos rutas de anulación con comportamiento distinto:

- `DocumentosPanel.tsx` (panel dentro de CAJA/TURNO) llama
  `anularComprobanteEnSQLite()` → persiste correctamente en la base real.
- `ComprobantesWorkspace.tsx` (módulo COMPROBANTES, la superficie "oficial"
  de gestión de documentos) llama `anularComprobante()` de `usePOS()` →
  `useComprobantes.ts` → `comprobante.store.ts`, un store en memoria cuyo
  `loadStore()` siempre devuelve `createEmptyStore()` — nunca se hidrata
  desde SQLite. El botón ANULAR de COMPROBANTES probablemente no persiste
  el cambio en la base de datos real.

Hallazgo adicional relacionado: `comprobante.store.ts` y
`correlativo.store.ts` son ambos stores en memoria sin conexión a SQLite;
`correlativoStore.hidratarDesdeDb()` existe pero no tiene ningún caller —
sugiere una migración a SQLite que quedó a medias. `DocumentosPanel.tsx`
además filtra por tipos `'BOLETA_VENTA'` / `'FACTURA_ELECTRONICA'`, que no
existen en `TipoComprobante` (los reales son `'BOLETA'` / `'FACTURA'`) — el
filtro de tipo en ese panel nunca coincide con datos reales.

**Decisión:** ninguna aún — requiere verificación en runtime (anular un
comprobante de prueba desde COMPROBANTES y confirmar en base de datos si
el estado cambia) antes de decidir si se corrige.

**Estado:** PENDIENTE DE IMPLEMENTAR — severidad alta, verificar antes de
confiar en el botón ANULAR de COMPROBANTES en operación real.
