# BITÁCORA DE DECISIONES — DISATEQ Vendor™

Registro append-only de descubrimientos, decisiones y deuda confirmados por
el Director de Producto. Nunca se purga. Distinto de CURRENT_CONTEXT.md
(estado de trabajo efímero) y de CONTRATO_ARQUITECTURA/GLOSARIO (doctrina
consolidada) — esta bitácora es el paso intermedio: aquí se acumula hasta
que algo se promueve a doctrina (con confirmación de Fernando) o se resuelve.

Estados: CONSOLIDADO · A EVALUAR · PENDIENTE DE IMPLEMENTAR · RESUELTO

---

## 2026-06-13 — Disponibilidad siempre derivada del log de movimientos
**Contexto:** `bridge-catalogo.ts` leía un campo `disponible` inexistente en
`ItemOperacional`, además de una clave de storage incorrecta.
**Decisión:** la disponibilidad NUNCA se lee de un campo estático — siempre
se deriva de `movimientos` vía `deriveDisponibilidad()`.
**Estado:** CONSOLIDADO — refuerza Descubrimiento 1 de CONTRATO_ARQUITECTURA
(Disponibilidad Operacional). No requiere cambio doctrinal, solo registro.

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

## 2026-06-13 — Procedimientos de sesión (lectura de mapa + cierre de módulo)
**Contexto:** sesión de VENTAS requirió lectura en cascada de ~10 archivos
de forma reactiva.
**Decisión:** ver adición a CLAUDE.md (confirmada por el Director).
**Estado:** CONSOLIDADO.

---

## 2026-06-18 — Datos regulatorios externos como campos de referencia, no claves de dominio

**Contexto:** Al diseñar el modelo de datos de ABASTECIMIENTO para el dominio
farmacia, surgió el dilema de si vincular registros DIGEMID (Cod_Prod,
Num_RegSan) como claves duras o como datos informativos. DIGEMID exige reporte
periódico de precios en formato Excel, lo que hace el vínculo operacionalmente
necesario desde el inicio. Pero almacenar Cod_Prod como clave foránea crea
acoplamiento frágil: si DIGEMID cambia su codificación, la lógica interna se
rompe en cascada.

**Decisión:** Los datos regulatorios externos (DIGEMID, SUNAT, y cualquier
organismo futuro) se almacenan como **campos de referencia informativos**,
nunca como claves de dominio. El sistema los porta, los muestra y los exporta,
pero no ejecuta lógica de negocio sobre ellos. El operador puede actualizarlos
sin consecuencias estructurales.

Campos afectados en `ProductoComercial`:
- `registroSanitario` → string libre, requerido para reporte DIGEMID
- `codigoDIGEMID` → string opcional, referencia informativa
- `condicionVenta` → enum propio del sistema (CON_RECETA | SIN_RECETA | CONTROLADO)

**Regla doctrinal derivada:** Esta misma regla aplica a cualquier integración
regulatoria futura: serie/correlativo SUNAT, código RENIEC, código SUNAT de
producto, etc.

**Estado:** CONSOLIDADO — decisión irreversible de arquitectura.

---

## 2026-06-18 — Farmacia como rubro piloto para modelo multi-rubro

**Contexto:** El sistema necesita soportar múltiples rubros (Farmacia, Fast Food,
Zapatería, Óptica) con modelos de producto diferentes. La pregunta pendiente era
si usar campos opcionales por rubro vs. schema separado por rubro.

**Decisión:** Farmacia como rubro piloto. Por ser el más complejo
(fraccionamiento de 3 niveles, regulación DIGEMID, cadena de frío, condición de
venta), su modelo fuerza la arquitectura más extensible. Lo que aguanta farmacia,
aguanta todos los demás rubros. El modelo resultante definirá el patrón
multi-rubro canónico.

**Estado:** CONSOLIDADO.

---

## 2026-06-18 — Separación ProductoGenerico / ProductoComercial en dominio farmacia

**Contexto:** El catálogo DIGEMID revela que el mismo principio activo (IFA)
tiene múltiples nombres comerciales, fabricantes y registros sanitarios. El modelo
anterior de ItemOperacional no tenía esta distinción.

**Decisión:** Dos entidades separadas:
- `ProductoGenerico` → IFA + concentración + forma farmacéutica. Núcleo inmutable.
  Sin precio, sin fabricante, sin presentación comercial.
- `ProductoComercial` → nombre de marca + fabricante + titular + registro sanitario
  + condición de venta. Referencia a un ProductoGenerico. N comerciales por genérico.

**Estado:** CONSOLIDADO — base del modelo de datos de ABASTECIMIENTO farmacia.

---

## 2026-06-18 — Lote nace en la compra, FEFO automático, invisible al operador de caja

**Contexto:** Se evaluó si el lote debía registrarse al momento de la compra
(entrada) o de la venta (salida). En contexto real de mostrador, exigir al
operador de caja que elija lote generaría caos — el cliente espera en fila y
el operador solo conoce el medicamento, no el lote.

**Decisión:** El lote se registra exclusivamente en el momento de la compra
(entrada al inventario). El sistema aplica FEFO (First Expired, First Out)
automáticamente al momento de la venta: ordena lotes vigentes por
fecha_vencimiento ASC y descuenta del más próximo a vencer primero, sin que
el operador de caja lo seleccione ni lo vea. La única excepción es un retiro
de mercado, donde el sistema bloquea el lote automáticamente y solo muestra
"producto bloqueado, contactar supervisor" sin exponer el número de lote.

**Regla doctrinal derivada:** El lote es un dato de abastecimiento, no de venta.

**Estado:** CONSOLIDADO.

---

## 2026-06-18 — ServicioFarmacia como universo paralelo sin efectos en inventario

**Contexto:** Farmacia vende servicios (inyectables, control de glucosa,
presión, nebulización) además de productos. Se evaluó si el servicio debía
descontar automáticamente el insumo consumido (ej. ampolla en una inyectable).

**Decisión:** ServicioFarmacia es un ítem de venta puro, sin requiereInsumo
ni insumoId. Si el servicio consume un producto del inventario, ese producto
se vende como ProductoComercial por separado — el sistema nunca asume el
vínculo automáticamente. Cobro y ejecución del servicio son dos hechos
operacionales distintos: EjecucionServicio registra cuándo se prestó el
servicio (timestamp, operador, turno), independientemente de si generó un
Pedido (pedido_id es opcional, null = cortesía/sin cobro). Esto habilita
analítica: servicio top, horario pico, productividad por operador.

**Estado:** CONSOLIDADO.

---

## 2026-06-18 — movimiento.item_id apunta a presentacion_comercial (migración limpia)

**Contexto:** El MovimientoOperacional anterior (localStorage) usaba itemId
apuntando a ItemOperacional. Al migrar a SQLite, se planteó si mantener
compatibilidad retroactiva o hacer migración limpia.

**Decisión:** Migración limpia. En SQLite, `movimiento.item_id` referencia
`presentacion_comercial.id`. No se mantiene compatibilidad con el modelo de
localStorage. Los datos de prueba existentes se descartan. Alpha arranca con
base de datos limpia.

**Estado:** CONSOLIDADO.

---

## 2026-06-18 — Vista SQL reporte_digemid_privado con validación interna

**Contexto:** El manual OPPF (DIGEMID) establece que para Farmacia/Botica
sector privado el reporte exige: CodEstab | CodProd | Precio Empaque | Precio
Unitario, y que DIGEMID valida Precio Unitario = Precio Empaque / Fracción
(tolerancia ~S/0.01). Si no coincide, el lote queda observado por DIGEMID.

**Decisión:** La vista `reporte_digemid_privado` incluye columna
`validacion_digemid` (OK / INCONSISTENTE) calculada internamente sobre
ROUND(precio_empaque / fraccion, 2). El sistema alerta al operador antes de
exportar el CSV si hay registros inconsistentes; nunca se exporta un reporte
con inconsistencias sin advertencia explícita.

**Estado:** CONSOLIDADO.

---

## 2026-06-18 — Modelo de distribución: plataforma única con Feature Packaging por Rubro

**Contexto:** Se evaluó separar DISATEQ Vendor en aplicaciones independientes
por rubro (Farmacia, Retail, Fast Food) dada la complejidad diferencial de
cada dominio. Se descartó la separación completa por el costo de duplicar el
core (LOGIN, TURNO, COBRO, COMPROBANTES, PEDIDO) en múltiples bases de código.

**Decisión:** Una sola plataforma con Feature Packaging por Rubro.
- El CORE es compartido e invariante entre rubros.
- Cada rubro es un paquete de dominio independiente que se activa/desactiva.
- No hay necesidad de incluir todos los rubros. El cliente instala el core
  más el paquete del rubro que necesita.
- La separación es de dominio de datos y código, no de aplicación.
- Cuando el negocio lo requiera, cada paquete puede empaquetarse como app
  independiente sin refactoring mayor.

**Estructura de dominios resultante:**
```
domains/core/      → pedido, cobro, comprobante, turno, caja, operador
domains/farmacia/  → producto_generico, lote, FEFO, DIGEMID, servicios
domains/retail/    → futuro: zapatería, óptica (tallas, colores, gradación)
domains/food/      → futuro: fast food (insumos, producción, combos)
```

**Estado:** CONSOLIDADO — decisión arquitectónica irreversible.

---

## 2026-06-19 — Doctrina de calidad de código: SOLID, normalización y buenas prácticas como estándar irrevocable

**Contexto:** Con la incorporación de SQLite como capa de persistencia real y
el inicio del desarrollo del dominio farmacia en UIX, se establece que toda
implementación de código — Rust, TypeScript, React — debe seguir principios
de calidad de software de forma sistemática y no opcional.

**Decisión:** Las siguientes prácticas son doctrina irrevocable a partir de
esta sesión. Aplican a todo código generado por Codex y auditado por Claude:

### SOLID aplicado al stack DISATEQ
**S — Responsabilidad única.** Cada componente React tiene una sola razón
para cambiar. No mezclar lógica de datos, lógica de negocio y presentación.
Hooks encapsulan lógica reutilizable. Servicios encapsulan llamadas a Tauri.
Stores Zustand encapsulan estado global. Comandos Rust hacen una sola operación.

**O — Abierto/cerrado.** Tipos TypeScript se extienden con intersección o
herencia, no se modifican los existentes. Schemas SQLite usan ALTER TABLE
para agregar columnas, nunca DROP + recrear. Stores Zustand se extienden con
slices, no se reescriben.

**L — Sustitución de Liskov.** Tipos derivados deben poder usarse donde se
espera el tipo base sin romper comportamiento.

**I — Segregación de interfaces.** No se crean interfaces monolíticas. Un
componente recibe solo los props que necesita. Un hook expone solo las
funciones que su consumidor necesita. Un comando Rust recibe solo los
parámetros que necesita.

**D — Inversión de dependencias.** Componentes React dependen de
abstracciones (hooks, servicios) no de implementaciones concretas
(localStorage, invoke directo). El día que SQLite reemplace localStorage,
solo cambia el servicio, no el componente.

### Normalización de datos
Toda entidad tiene un ID único generado en el sistema (UUID v4). No se usan
claves naturales (nombre, RUC, código) como claves primarias. Las relaciones
entre entidades se expresan mediante IDs de referencia. Los datos regulatorios
externos (DIGEMID, SUNAT) son campos informativos, nunca claves de dominio.
No se duplica información: si un dato existe en una tabla, se referencia, no
se copia. La desnormalización solo se acepta en vistas y proyecciones de solo
lectura.

### Convenciones de código
**TypeScript:** tipos explícitos siempre, nunca `any`, interfaces para
contratos de datos, types para unions/aliases, funciones puras donde sea
posible, manejo explícito de errores (nunca catch vacío), español para
dominio de negocio / inglés para infraestructura.

**React:** componentes funcionales únicamente, un componente por archivo,
máximo ~150 líneas (si supera, se divide), props tipadas con interface
explícita, useCallback/useMemo solo con evidencia de problema de rendimiento,
useState para UI efímera / store Zustand para estado operacional.

**Rust:** cada comando en su propio archivo de módulo, errores siempre como
Result<T, String> (nunca panic en producción), queries SQL con parámetros
bind (nunca interpolación de strings), funciones helper privadas para
operaciones repetidas (timestamp, pool access).

### Alineación con la filosofía DISATEQ
Responsabilidad única → el operador no ve bugs por efectos cruzados.
Normalización → reportes DIGEMID correctos porque no hay datos duplicados.
Inversión de dependencias → migrar localStorage→SQLite no rompe la UIX.
Interfaces segregadas → Codex implementa un comando sin conocer el sistema
completo.

**Estado:** CONSOLIDADO — doctrina irrevocable. Todo prompt enviado a Codex
incluye referencia explícita a estas reglas. Claude audita cumplimiento
(filesystem + lectura de código) en cada revisión antes de aprobar commit.

---

## 2026-06-19 — Consulta de proveedores: SQLite primero, SUNAT segundo

**Contexto:** El módulo de PROVEEDORES necesita agilizar el ingreso de datos
de proveedores farmacéuticos. Los proveedores siempre tienen RUC porque emiten
facturas. SUNAT es la fuente correcta (no RENIEC) para razón social, dirección
fiscal y estado del contribuyente.

**Decisión 1 — Fuente de consulta externa:** SUNAT vía API de tercero
(apiperu.dev / api.apis.net.pe para Alpha). El comando Rust hace el fetch
desde el backend Tauri, sin restricción CORS. Si la API falla, el operador
completa los campos manualmente.

**Decisión 2 — URL configurable:** La URL base de la API de consulta RUC vive
en `config_establecimiento.api_ruc_url`, nunca hardcodeada en el comando
Rust. Permite cambiar de proveedor de API sin modificar código. Principio de
inversión de dependencias aplicado a integraciones externas. Fallback seguro:
`https://api.apis.net.pe/v1/ruc`.

**Decisión 3 — Flujo de búsqueda:** SQLite primero, SUNAT segundo. Mismo
patrón que COBRO con RENIEC/SUNAT:
1. Operador escribe nombre o RUC en buscador
2. Sistema busca en tabla `proveedor` de SQLite (tiempo real, debounce 300ms)
3. Si encuentra: muestra resultados locales para seleccionar
4. Si no encuentra: ofrece "Consultar SUNAT por RUC" y "Registrar manualmente"
5. Operador ingresa RUC → comando Rust consulta API → datos precargados
6. Operador confirma y guarda en SQLite

**Estado:** CONSOLIDADO. Implementado en commit b593de9 (consultar_ruc en
integraciones.rs, ProveedoresWorkspace.tsx con 4 modos: busqueda/detalle/sunat/manual).

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
criterio: empezar simple, ajustar según uso real antes de sofisticar.

**Estado:** A EVALUAR EN USO REAL — Fernando validó "hay que probarlo para
ver si conviene, pero por ahora así se maneja". Revisar después de operación
real en mostrador si el lote genérico sin fecha y el listado plano de
presentaciones generan fricción o confusión.

---

## 2026-06-20 — Bug sistémico camelCase/snake_case: convención nativa de Tauri (Opción B) sobre rename_all (Opción A)

**Contexto:** Primera prueba manual real de escritura a SQLite (crear un
proveedor desde ProveedoresWorkspace) reveló el error `invalid args
'razonSocial' for command 'crear_proveedor': command crear_proveedor missing
required key razonSocial`. Investigación confirmó que el problema es
sistémico, no aislado: Tauri 2.x espera por defecto que los argumentos del
lado JavaScript/TypeScript lleguen en camelCase, mapeándolos automáticamente
a los parámetros Rust en snake_case. El código de este proyecto hace lo
opuesto en los 31 comandos del dominio farmacia: `farmacia.service.ts` envía
snake_case explícito (`razon_social`, `producto_generico_id`, etc.) y los
comandos Rust en `commands/*.rs` declaran parámetros en snake_case sin el
atributo `rename_all`. Confirmado contra documentación oficial de Tauri
(https://v2.tauri.app/develop/calling-rust/): el comportamiento camelCase es
el default; snake_case requiere `#[tauri::command(rename_all = "snake_case")]`
explícito en cada comando.

**Opciones evaluadas:**
- **Opción A:** Agregar `rename_all = "snake_case"` a los 31 comandos Rust
  del dominio farmacia. Menor superficie de cambio inmediato, preserva
  farmacia.service.ts intacto. Riesgo a futuro: es una desviación deliberada
  de la convención por defecto del framework que debe sostenerse
  manualmente — cualquier comando nuevo que se cree sin recordar el
  atributo vuelve a fallar exactamente igual, sin aviso en compilación,
  solo en runtime.
- **Opción B:** Convertir farmacia.service.ts completo a enviar camelCase
  (convención nativa documentada de Tauri), sin tocar ningún comando Rust.
  Mayor superficie de cambio inmediato (~23 funciones de invoke), pero
  alinea el proyecto con el comportamiento por defecto del framework — no
  depende de que nadie recuerde una regla adicional. Cualquier comando
  Tauri nuevo, futuro, funciona sin configuración especial.

**Decisión:** Opción B. Criterio explícito del Director de Producto: "una
determinación estable y segura, sin tener que a futuro correr riesgos de
una solución temporal... queremos un producto robusto y fiable." Bajo ese
criterio, depender de la convención por defecto, documentada y estándar del
framework es la base más sólida — no una excepción que vive solo en la
memoria del equipo o en esta bitácora.

**Regla doctrinal derivada:** Todo comando Tauri nuevo en este proyecto, de
aquí en adelante, recibe sus argumentos en camelCase desde TypeScript sin
necesidad de ningún atributo especial en Rust. Esta es ahora la convención
única del proyecto — no se reintroduce snake_case en el límite invoke()
salvo decisión arquitectónica explícita y documentada en esta bitácora.

**Estado:** RESUELTO — commit 966b936. Las 23 funciones de
`farmacia.service.ts` corregidas a camelCase en argumentos. Auditado línea
por línea contra la lista de 23 conversiones, incluyendo el caso sutil
`codigoDigemid` (no `codigoDIGEMID`) y `fraccionDigemid`. Verificado en uso
real: proveedor "LABORATORIOS PORTUGAL S.R.L." guardado y encontrado
correctamente en búsqueda posterior.

---

## 2026-06-20 — Bug sistémico: falta de traducción snake_case→camelCase en respuestas de lectura del dominio farmacia

**Contexto:** Tras resolver el bug de casing en argumentos (entrada) y el bug
de búsqueda por IFA, una prueba manual de búsqueda ("Paracetamol" debía
encontrar "Panadol") reveló que el resultado mostraba solo "1000 MG" sin el
nombre comercial, y seguía mostrando "SIN CATEGORIA" pese a que el backend ya
enviaba `categoria_farmacia` correctamente. Investigación confirmó un bug
sistémico distinto y más amplio: 7 funciones de lectura en
`farmacia.service.ts` (`obtenerProductosGenericos`, `obtenerProductosComerciales`,
`obtenerPresentaciones`, `obtenerNodosFraccionamiento`, `resolverLoteFefo`,
`obtenerLotesVigentes`, `obtenerServiciosFarmacia`) invocan comandos Rust que
construyen su respuesta manualmente con `serde_json::json!()` en snake_case
(`nombre_comercial`, `categoria_farmacia`, etc.), pero el `invoke<T>()` del
lado TypeScript solo aplica un type assertion al tipo de retorno camelCase
(ej. `ProductoComercial[]`) sin ninguna función que transforme los datos en
runtime. El objeto JavaScript real conserva las claves en snake_case;
TypeScript "confía" en la forma declarada sin verificarla. Por eso
`producto.nombreComercial` siempre fue `undefined` desde que se construyó
este código — el bug existía desde el origen, pero nunca se detectó porque
casi ningún componente renderiza directamente una respuesta cruda de estas
funciones (la mayoría de pantallas usan datos del formulario local que el
operador acaba de escribir). El primer punto que sí renderiza una respuesta
cruda es la lista de resultados del buscador de Catálogo — el primer lugar
donde se probó visualmente con datos reales de SQLite.

**Funciones NO afectadas (patrón correcto, ya usado como modelo):**
`buscarProveedores()` y `consultarRuc()`, que sí tienen interfaz de respuesta
(`ProveedorRespuesta`, `DatosRucRespuesta`) y función traductora
(`traducirProveedor`).

**Análisis de causa raíz:** No es que Codex haya tomado referencia incorrecta
de código de pruebas. La causa real es inconsistencia entre los prompts que
diseñó Claude: en el prompt de Proveedores, por necesidad puntual de
transformar datos de una API externa (`consultarRuc`), se pidió explícitamente
interfaz + función de traducción — y ese patrón correcto se extendió también a
`buscarProveedores` por estar en el mismo archivo/prompt. En los prompts de
Productos, Presentaciones, Lotes y Servicios, esa instrucción nunca se incluyó
— se especificó únicamente el tipo de retorno TypeScript, asumiendo
implícitamente (de forma incorrecta) que el tipado forzaría la transformación
en runtime. Es el mismo tipo de fallo de fondo que el bug de casing en
argumentos: una convención correcta aplicada solo en un prompt puntual, en vez
de establecerse como regla doctrinal permanente para todo el dominio.

**Decisión:** Se descarta la opción de pedirle a Codex que "revise
coherencia con el resto del proyecto" como instrucción genérica de control de
calidad — depende de inferencia no determinística y ya causó dos bugs
sistémicos esta sesión. En su lugar, la regla se fija como doctrina escrita y
permanente, aplicada por Claude al diseñar cada prompt futuro, no delegada al
criterio de Codex en cada sesión.

**Regla doctrinal derivada — IRREVOCABLE:** Toda función de lectura en
`farmacia.service.ts` (o en cualquier service futuro de cualquier dominio)
que invoque un comando Rust cuya respuesta se construye manualmente con
`serde_json::json!()` en snake_case DEBE tener: (1) una interfaz
`NombreRespuesta` que describa la forma snake_case real devuelta por Rust, y
(2) una función `traducirNombre()` que transforme esa respuesta a la
interfaz de dominio en camelCase. Ninguna función de lectura puede hacer
`invoke<TipoDominio>()` directo confiando únicamente en el type assertion de
TypeScript. Mismo patrón ya validado: `traducirProveedor` +
`ProveedorRespuesta`. Todo prompt futuro que cree un comando Rust de lectura
nuevo debe incluir esta instrucción explícitamente — no se asume, no se
delega a que Codex la infiera.

**Estado:** RESUELTO — commit b888909. Las 7 funciones afectadas
(`obtenerProductosGenericos`, `obtenerProductosComerciales`,
`obtenerPresentaciones`, `obtenerNodosFraccionamiento`, `resolverLoteFefo`,
`obtenerLotesVigentes`, `obtenerServiciosFarmacia`) ahora usan interfaz de
respuesta + función traductora, mismo patrón que `traducirProveedor`.
Auditado línea por línea: las 7 interfaces, las 7 traductoras, y los 5
puntos de union type estricto (`formaFarmaceutica`, `categoriaFarmacia`,
`condicionVenta`, `tipoFormaVenta`, `estado` de Lote) con su correspondiente
type assertion. Pendiente verificación visual final en pantalla.

**ADENDA 2026-06-20 (post-commit 6ada611):** Al auditar `farmacia.service.ts`
completo por otro motivo, se detectó que `obtenerProveedores()` tiene el
mismo bug y quedó fuera del barrido original de 7 funciones — no estaba en
la lista de afectadas ni en la de "ya correctas". Hace
`invoke<Proveedor[]>('obtener_proveedores', ...)` directo, sin
`ProveedorRespuesta` ni `traducirProveedor`. Verificado que hoy es código
muerto: ni `useProveedores.ts` ni `useIngresosMercaderia.ts` la invocan,
ambos usan `buscarProveedores()` (que sí está correcta). Registrado en
`CURRENT_CONTEXT.md` → DEUDA TÉCNICA, severidad Media, con instrucción de
corregir antes de conectarla a cualquier pantalla futura. También se
detectó y corrigió la discrepancia donde este commit (b888909) nunca se
había agregado a la lista de commits de `CURRENT_CONTEXT.md` — quedaba
documentado aquí pero invisible en el contexto vivo.

---

## 2026-06-20 — Auditoría doctrinal ABASTECIMIENTO FARMACIA vs. CONTRATO_ARQUITECTURA: creación standalone de Producto/Proveedor se mantiene como vía adicional, no se elimina
**Contexto:** Auditoría formal de `CatalogoFarmaciaWorkspace`, `NuevoProductoStepper`,
`ProveedoresWorkspace` e `IngresosMercaderiaWorkspace` contra las secciones 2 y 10
del contrato (Anti ERPización, Anti CRUD-Centrismo, Anti Catálogo-Centrismo).
Hallazgo principal (severidad ALTA): un `ProductoGenerico`/`ProductoComercial`
puede nacer desde el Catálogo de forma aislada, sin estar atado a ningún evento
operacional — patrón "Catálogo como núcleo", explícitamente descartado en el
contrato (Sección 7). Hallazgo secundario (severidad MEDIA): mismo patrón en
`ProveedoresWorkspace`. Aclaración doctrinal hecha durante la discusión: el
contrato no rechaza CRUD como mecanismo técnico de persistencia (inevitable en
cualquier sistema con SQLite) — rechaza que el paradigma Crear/Editar/Listar
se filtre tal cual al lenguaje y la experiencia visible del operador, en vez de
traducirse a contexto y evento.
**Decisión:** Alcance de corrección = Lectura A (solo capa de experiencia y
flujo; schema SQLite, 31 comandos Tauri, tipos TypeScript y SUNAT quedan
intactos). Se construye una vía ADICIONAL de creación de Producto/Proveedor
embebida dentro de `IngresosMercaderiaWorkspace` (contextual, disparada por
un evento de recepción), que CONVIVE con la vía standalone existente desde
Catálogo/Proveedores — esta última NO se elimina de la navegación ni pierde
su botón "+ Nuevo". Razón explícita de Fernando: necesidad operacional real
de poder cargar el catálogo inicial de un negocio antes de que exista un solo
Ingreso registrado; exigir creación atada a evento en el 100% de los casos
bloquearía ese caso de uso real.
**Consecuencia doctrinal:** El hallazgo de severidad ALTA del audit 2026-06-20
queda PARCIALMENTE MITIGADO, no cerrado. Es una decisión consciente y
documentada del Director de Producto, no un descuido — registrada aquí para
que una auditoría futura no la reabra como hallazgo nuevo sin contexto.
**Orden de ejecución:** Catálogo primero (fase atómica 1) — `BuscadorProductoIngreso`
gana, ante búsqueda sin resultados, opción inline "Este producto no existe —
regístralo ahora" que abre el `NuevoProductoStepper` existente sin tocar su
lógica interna, con encabezado contextual y retorno automático al Ingreso en
curso con la línea ya agregada. Proveedores (mismo patrón, reutilizando
`ConsultaSunatProveedor` y `FormularioProveedor`) queda como fase atómica 2,
separada para mantener cada commit auditable de forma aislada.
**Estado:** RESUELTO — fase 1 (Catálogo→Ingresos, producto) en commit `6ada611`,
fase 2 (Proveedores→Ingresos) en commit `838c960`. Ambas auditadas en código real
(timestamps + lectura línea por línea) antes de aprobar commit. Pendiente únicamente
verificación visual en pantalla de ambos flujos (ver CURRENT_CONTEXT.md, próxima
ventana de trabajo, ítem 3).

---

## 2026-06-21 — Catálogo: layout de split en dos paneles, no sheet superpuesta

**Contexto:** Durante la prueba manual del producto de prueba (Paracetamol/
Panadol), Fernando propuso dividir `CatalogoFarmaciaWorkspace` en dos paneles
visuales distintos en vez del esquema de modo único donde búsqueda y creación
comparten la misma área cambiando de contenido. Quedó pendiente aclarar si
se refería a una sheet deslizante/superpuesta o a un layout de split con
ambos paneles visibles simultáneamente — la segunda opción había sido
descartada al inicio del diseño de Catálogo por riesgo de contaminación
visual con miles de productos.

**Decisión:** Layout de split, panel izquierdo 35% (búsqueda↔detalle) /
derecho 65% (vacío↔creación), ambos visibles siempre. Razón explícita de
Fernando: "le da al operador un contexto real de todo el proceso" — prioridad
sobre el riesgo de saturación visual considerado al inicio.

**Estado:** RESUELTO — commit `82336ad`.

---

## 2026-06-21 — Arquitectura SheetWork documentada nunca se implementó en ningún módulo; extraída ahora como componente real

**Contexto:** Al revisar ABASTECIMIENTO FARMACIA contra la jerarquía documentada
en `03-arquitectura/arquitectura.md` y `design-system/operational-visual-architecture.md`
(`Topbar → ContextBar → SubContextBar → Workspace → SheetWorks → Footbar`,
donde SheetWorks compone `SheetHeader`/`SheetBody`(Sections→Blocks)/`SheetFooter`),
Fernando notó que ABASTECIMIENTO no la sigue. Verificación exhaustiva en código
real (`directory_tree` completo de `apps/vendor-desktop/src`) confirmó que
`SheetWork`, `SubContextBar` y `Footbar` como entidad unificada **no existen como
archivos en ningún lugar del proyecto** — ni en ABASTECIMIENTO ni en ningún otro
de los nueve módulos existentes (`CashWorkspace`, `SalesWorkspace`,
`PreVentaWorkspace`, `ComprobantesWorkspace`, `ConfigWorkspace`,
`InventoryWorkspace`, `PurchasesWorkspace` incluidos — TURNO/CAJA y VENTAS, ya
maduros y auditados, también siguen el patrón plano `XWorkspace.tsx` sin capa
SheetWork). `Topbar` y `ContextBar` sí son reales. La jerarquía completa fue
diseñada conceptualmente en algún punto temprano del proyecto y nunca se
contrastó contra lo que cada sesión fue construyendo — ninguna sesión la
desobedeció a propósito; cada una siguió la doctrina de "repo real manda"
(`00-governance/reglas.md`, `CLAUDE.md`) mirando el código existente, que ya no
la reflejaba.

Fernando aclaró el motivo real detrás de `SheetWork`: necesidad de que dos o
más "sheets" convivan dentro de un mismo Workspace sin pisarse, incluyendo
sheets con hijos que se reemplazan sobre su misma ubicación. Verificado en
código real que esa necesidad **ya está resuelta en producción, dos veces, en
VENTAS** — sin haberse extraído nunca como pieza reutilizable: (1)
`PreVentaWorkspace.tsx` swapea `PreVentaGrid`/`CobroPanel` en el mismo lugar
según `cobroOpen`; (2) dentro de `CobroPanel.tsx`, `cobroView` swapea
main/cliente y `confirmSheet` swapea hacia la pantalla de confirmación —
anidamiento de sheets sobre la misma ubicación. El código de `CobroPanel.tsx`
incluso contiene comentarios literales `{/* SheetHeader */}` y referencias a
"SheetTopbar" — el concepto estaba presente en la mente de quien lo escribió,
solo nunca se formalizó como componente.

**Decisión:** Opción A — cerrar formalmente la brecha documentando la realidad,
no reabrir un proyecto de retrofit sobre código que ya funciona. Se extrae
`SheetWork`/`SheetHeader`/`SheetBody`/`SheetFooter` como componentes reales y
reutilizables en `apps/vendor-desktop/src/components/sheet/` (fuera de
`modules/`, para que cualquier módulo lo importe sin depender de VENTAS),
usando como referencia exacta el chrome ya probado de `CobroPanel.tsx`.
`SheetWork` solo estandariza el *chrome* visual (contenedor, header, body
scrolleable, footer) — no gestiona el estado de swapeo, que sigue siendo
responsabilidad de cada módulo, exactamente como ya funciona hoy. Prop
`accent` (hex) reemplaza el verde `#45b356` hardcodeado para que el componente
sirva igual a FARMACIA (`#639922`) que a VENTAS.

Como validación de que el componente reproduce el chrome real sin romper nada,
se migró la vista "main" de `CobroPanel.tsx` para usarlo (sin tocar la vista de
confirmación, la vista cliente, ni `PreVentaWorkspace.tsx`).

**Razón doctrinal derivada:** Consistente con `philosophy/EVOLUTION_AND_CONSOLIDATION.md`
("la sofisticación debe emerger de necesidad real, no de arquitectura
especulativa") y con `00-governance/reglas.md`/`CLAUDE.md` ("repo real manda").
Nueve módulos consistentes en el patrón plano es evidencia fuerte de que ese
patrón es el que el equipo —humano e IA, sesión tras sesión— construye
naturalmente; la capa SheetWork documentada nunca demostró ser necesaria hasta
que se identificó el caso real de swap-en-mismo-lugar, que ya estaba resuelto
ad hoc en VENTAS.

**Auditoría:** timestamps verificados (`CobroPanel.tsx` modificado en la
fecha del commit, `PreVentaWorkspace.tsx` sin tocar), lectura línea por línea
de los 4 componentes nuevos contra el chrome original, cálculo manual exacto
del tinte de header (`tint(#45b356)` = `rgb(242,247,243)` = `#F2F7F3`, el
valor hardcodeado original), verificación visual en la ventana nativa de Tauri
confirmada por Fernando como idéntica al original.

**Deuda registrada (no bloqueante):** la fórmula `tint()` en `SheetHeader.tsx`
está calibrada por reconstrucción inversa contra el único punto de datos
conocido (`#45b356`→`#F2F7F3`); para `#639922` (farmacia) produce un resultado
razonable pero no validado visualmente. El slot `right` de `SheetHeader` no
tiene espaciador hacia el borde derecho (no usado aún, sin impacto actual).

**Pendiente — decisión de Fernando:** si se adopta `SheetWork` en
ABASTECIMIENTO FARMACIA (el motivo original de esta auditoría) o se deja
disponible solo para módulos nuevos hacia adelante. La consolidación de
documentación (`DOCTRINA.md` + `ARQUITECTURA_UX.md`, ver auditoría doctrinal
2026-06-20 más arriba) sigue pausada — debe retomarse describiendo el patrón
`SheetWork` real, no la jerarquía conceptual original.

**Estado:** RESUELTO — commit `6a19279`. Componente disponible en
`apps/vendor-desktop/src/components/sheet/`. `CobroPanel.tsx` migrado como
primer caso de uso real.

---

## 2026-06-21 — Evaluación de marcos de buenas prácticas y estándares; ESTANDARES_TECNICOS.md creado

**Contexto:** Fernando señaló que no había nada documentado sobre
prácticas/estándares más allá de fragmentos dispersos en CURRENT_CONTEXT.md
(sección DOCTRINA DE CALIDAD) y docs/codex.md. Propuso una lista de doce
marcos de industria para evaluar: SOLID, Clean Code, DRY, KISS, YAGNI /
Normalización, Indexación, Mínimo Privilegio / OWASP Top 10, Security by
Design, Cifrado / The Twelve-Factor App, CI/CD, SemVer.

**Decisión:** Evaluación caso por caso, no adopción ciega del paquete
completo — varios marcos (OWASP Top 10 completo, Twelve-Factor App completo)
asumen un contexto (aplicación web con superficie de ataque de red, servicio
cloud horizontalmente escalable) que DISATEQ Vendor (cliente Tauri
offline-first, SQLite embebido) no tiene hoy, aunque sí lo tendrá parcialmente
cuando se construya el backend Nexo de ARQUITECTURA_SYNC.md. Adoptar marcos
completos fuera de contexto sería la misma sobre-ingeniería que la filosofía
anti-ERP del proyecto rechaza.

**Resultado de la evaluación:**
- Adoptados completos: SOLID, Clean Code, DRY (incluyendo documentación),
  KISS, YAGNI, Normalización, Indexación, Security by Design.
- Reinterpretado: Mínimo Privilegio → sistema de capacidades operacionales
  (VEN/GES/SOP/ADMIN), no permisos de BD tradicionales.
- Adopción parcial: OWASP Top 10 — solo Inyección y Exposición de Datos
  Sensibles aplican ahora; el resto reservado para Nexo.
- No adoptado ahora, reservado para Nexo: The Twelve-Factor App completo.
- Pendiente con trigger explícito: Cifrado en reposo del SQLite local —
  decisión explícita de Fernando de no exigirlo ahora, pero alertar antes de
  cualquier release a producción con datos reales de cliente o si se
  almacenan datos personales sensibles más allá de RUC/razón social.
- Adoptado desde hoy: CI ligero (type-check + cargo check automatizados en
  cada push; CD y tests de negocio diferidos a después de Alpha) y SemVer
  formal empezando en `0.1.0`.

**Acción inmediata — SemVer aplicado:** `package.json` de
`apps/vendor-desktop` corregido de `0.0.0` a `0.1.0`. `src-tauri/Cargo.toml`
y `src-tauri/tauri.conf.json` ya estaban en `0.1.0` por defecto del scaffold
de Tauri — los tres quedan sincronizados.

**Mecanismo para que se aplique de verdad (no solo se documente):** A
diferencia de la doctrina filosófica que quedó enterrada sin referenciarse
desde ningún punto de arranque de sesión, se agrega referencia explícita en
`CLAUDE.md` §4 y en `docs/codex.md` §2, para que tanto Claude como Codex
consulten `ESTANDARES_TECNICOS.md` como parte del protocolo normal. También
se eliminó la sub-sección `### SOLID` de CURRENT_CONTEXT.md (duplicada con
el nuevo documento) — aplicación inmediata de la regla DRY-en-documentación
recén adoptada en este mismo cambio.

**Estado:** CONSOLIDADO — commit *(pendiente)*. Documento nuevo:
`docs/00-governance/ESTANDARES_TECNICOS.md`.
