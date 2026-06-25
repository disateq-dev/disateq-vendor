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
