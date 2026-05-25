# DISATEQ VENDOR™ — INVENTORY OPERATIONAL EVOLUTION

## Estado

Documento evolutivo en construcción.

Fase actual:

```text
CAPAS OPERACIONALES EVOLUTIVAS
DEL DOMINIO INVENTARIOS
```

Objetivo:

Consolidar cómo INVENTARIOS puede crecer progresivamente SIN romper continuidad operacional, simplicidad runtime, edge-first, causalidad, reconciliación ni arquitectura base.

Complementa:

`inventory-architecture-foundations.md`

---

# 1. PRINCIPIO RAÍZ

## CRECIMIENTO POR CAPAS, NO POR REESCRITURAS

INVENTARIOS debe crecer por:

* capacidades operacionales concretas
* capas evolutivas independientes
* complejidad opcional activable

NO por:

* reescrituras destructivas que rompen continuidad operacional
* verticales rígidos que acoplan capas innecesariamente
* forks arquitectónicos que divergen del núcleo

La adición de complejidad solo es válida cuando resuelve un problema operacional real ya presente.

La capa anterior debe seguir funcionando íntegramente cuando se activa la siguiente.

---

## INVARIANTE RAÍZ DE EVOLUCIÓN

```text
Ninguna capa nueva puede romper
la operación de la capa anterior.
```

Este invariante es no negociable.

Si una nueva capa requiere romper la anterior, la dirección arquitectónica es incorrecta.

---

# 2. CAPAS EVOLUTIVAS

## ESTRUCTURA DE CADA CAPA

Cada capa responde:

* **Problema operacional:** qué situación real del negocio resuelve
* **Complejidad introducida:** qué nuevos conceptos o mecanismos agrega
* **Dependencias:** qué capas anteriores requiere
* **Capacidades habilitadas:** qué operaciones se vuelven posibles
* **Restricción de no-ruptura:** qué NO debe afectar de la capa anterior

---

## CAPA 0 — DISPONIBILIDAD SIMPLE

### Problema operacional

El negocio necesita saber qué tiene disponible para vender o usar ahora mismo, en el runtime activo actual.

### Complejidad introducida

* Concepto de disponibilidad operacional como cantidad contextual
* Evento de movimiento (entrada / salida / ajuste)
* Identidad mínima de ítem operacional

### Dependencias

Ninguna capa anterior.

Esta es la capa base.

### Capacidades habilitadas

* Consulta de disponibilidad actual por ítem
* Registro de movimientos de entrada y salida
* Reducción de disponibilidad en venta o consumo
* Incremento de disponibilidad en recepción

### Restricción de no-ruptura

Esta capa no puede ser rota por ninguna capa superior.

Si el runtime pierde todo contexto superior, CAPA 0 debe operar de forma autónoma.

---

## CAPA 1 — CONTEXTO OPERACIONAL

### Problema operacional

El negocio necesita que la disponibilidad tenga contexto: no es igual disponibilidad en bodega que en mostrador, no es igual disponibilidad confirmada que en tránsito, no es igual ítem genérico que variante específica.

### Complejidad introducida

* Contexto de ubicación o punto operacional
* Estado de disponibilidad (confirmada / en tránsito / reservada / bloqueada)
* Variantes o atributos contextuales del ítem
* Disponibilidad contextual por combinación ítem + ubicación + estado

### Dependencias

CAPA 0 — disponibilidad simple.

### Capacidades habilitadas

* Disponibilidad diferenciada por ubicación operacional
* Reserva de disponibilidad antes de materializar la operación
* Distinción entre existencia y disponibilidad operacional real
* Atributos contextuales del ítem que afectan disponibilidad

### Restricción de no-ruptura

CAPA 0 debe seguir operando sin contexto si la capa contextual no está disponible.

La consulta de disponibilidad simple no puede depender de la contextualización para funcionar.

---

## CAPA 2 — PRESIÓN OPERACIONAL

### Problema operacional

El negocio opera bajo condiciones que generan presión sobre la disponibilidad: escasez, confianza degradada, sincronización pendiente, expiración próxima, compromisos acumulados.

El sistema debe responder a estas condiciones sin bloquear la operación.

### Complejidad introducida

* Nivel de confianza operacional como atributo de la disponibilidad
* Señales de presión: escasez, expiración, divergencia, sincronización degradada
* Modo operacional degradado con visibilidad contextual
* Arbitraje de disponibilidad bajo presión

### Dependencias

CAPA 1 — contexto operacional.

### Capacidades habilitadas

* Operación en modo degradado con visibilidad explícita al operador
* Señalización de presión antes de que se convierta en bloqueo
* Arbitraje contextual cuando la disponibilidad es escasa
* Trazabilidad del nivel de confianza en el momento de cada operación

### Restricción de no-ruptura

Las capas 0 y 1 deben operar aunque no exista información de presión.

La ausencia de señales de presión no equivale a confianza absoluta implícita.

---

## CAPA 3 — EDGE DISTRIBUIDO

### Problema operacional

El negocio opera con múltiples runtimes que pueden divergir: sincronización parcial, operación offline, múltiples puntos operacionales con disponibilidad propia.

La operación no puede detenerse cuando la sincronización falla.

### Complejidad introducida

* Identidad de runtime operacional
* Divergencia entre runtimes como condición normal, no como error
* Reconciliación progresiva como mecanismo principal de convergencia
* Causalidad entre eventos de diferentes runtimes

### Dependencias

CAPA 2 — presión operacional.

La presión operacional es el antecedente conceptual de la divergencia distribuida.

### Capacidades habilitadas

* Operación autónoma por runtime sin sincronización activa
* Reconciliación progresiva sin reescribir historia operacional
* Trazabilidad de origen de eventos por runtime
* Convergencia eventual sin bloqueo operacional

### Restricción de no-ruptura

Las capas 0, 1 y 2 deben funcionar en un solo runtime sin requerir conceptos distribuidos.

La distribución es una capa opcional, no un requisito del modelo base.

---

## CAPA 4 — TRANSFORMACIONES OPERACIONALES

### Problema operacional

El negocio transforma disponibilidad: convierte insumos en productos, descompone paquetes, produce variantes, genera derivados.

La transformación consume disponibilidad de un tipo y genera disponibilidad de otro tipo, con causalidad trazable entre ambos.

### Complejidad introducida

* Relación causal entre insumo y derivado
* Estado intermedio durante la transformación (en proceso)
* Rendimiento real versus rendimiento esperado
* Reversión parcial de transformaciones con contexto preservado

### Dependencias

CAPA 1 — contexto operacional.

Las transformaciones requieren distinguir tipos de disponibilidad y estados.

### Capacidades habilitadas

* Trazabilidad de origen en productos derivados
* Estado intermedio visible durante la transformación
* Registro de rendimiento real versus esperado
* Reversión trazable de transformaciones con causalidad preservada

### Restricción de no-ruptura

Las capas 0 y 1 deben operar para ítems no transformados sin conocer el modelo de transformaciones.

Las transformaciones son una capa especializada, no una dependencia del modelo base.

---

## CAPA 5 — COORDINACIÓN AVANZADA OPCIONAL

### Problema operacional

El negocio requiere coordinación compleja entre disponibilidad, compromisos, runtimes, actores y tiempo: flujos de aprobación, asignaciones contextuales avanzadas, coordinación entre múltiples puntos operacionales con reglas de negocio elaboradas.

### Complejidad introducida

* Flujos de coordinación con múltiples actores y estados
* Reglas de negocio complejas sobre disponibilidad
* Asignación contextual avanzada con criterios múltiples
* Integración con dominios externos (finanzas, logística, compliance)

### Dependencias

CAPAS 3 y 4 — edge distribuido y transformaciones.

### Capacidades habilitadas

* Coordinación multi-actor sobre disponibilidad compartida
* Reglas de negocio configurables sin hardcoding
* Integración con dominios externos preservando causalidad
* Flujos de aprobación operacionales

### Restricción de no-ruptura

Esta capa es estrictamente opcional.

El negocio debe poder operar completamente en CAPAS 0–4 sin necesitar coordinación avanzada.

Si la complejidad de esta capa amenaza la operación de capas inferiores, debe revertirse o aislarse.

---

# 3. MATRIZ DE CAPACIDADES

## CAPACIDADES NÚCLEO

Capacidades que deben existir desde CAPA 0 y permanecer disponibles en toda evolución posterior:

| Capacidad | Capa mínima | Descripción |
|---|---|---|
| Consulta de disponibilidad actual | 0 | Disponibilidad por ítem en runtime activo |
| Registro de movimiento de entrada | 0 | Incremento de disponibilidad con trazabilidad |
| Registro de movimiento de salida | 0 | Reducción de disponibilidad con trazabilidad |
| Ajuste operacional | 0 | Corrección contextual con causalidad |
| Identidad mínima de ítem | 0 | Referencia operacional al ítem sin atributos complejos |

Estas capacidades son el núcleo no negociable.

Ninguna evolución puede degradarlas o eliminarlas.

---

## CAPACIDADES OPCIONALES

Capacidades que se activan con capas superiores y pueden no estar presentes en runtimes simples:

| Capacidad | Capa | Condición de activación |
|---|---|---|
| Disponibilidad contextual por ubicación | 1 | Múltiples puntos operacionales activos |
| Reserva de disponibilidad | 1 | Flujos con compromiso previo a materialización |
| Variantes de ítem | 1 | Ítems con atributos diferenciadores operacionales |
| Operación en modo degradado | 2 | Confianza reducida por sincronización parcial |
| Arbitraje bajo escasez | 2 | Disponibilidad insuficiente para múltiples compromisos |
| Reconciliación distribuida | 3 | Múltiples runtimes con posible divergencia |
| Transformaciones insumo-derivado | 4 | Negocio con producción o conversión de disponibilidad |
| Coordinación multi-actor | 5 | Flujos con múltiples responsables sobre disponibilidad compartida |

---

## DEPENDENCIAS MÍNIMAS ENTRE CAPACIDADES

```text
Consulta disponibilidad actual
  └── Identidad mínima de ítem

Registro de movimientos
  └── Identidad mínima de ítem
  └── Consulta disponibilidad actual

Disponibilidad contextual
  └── Registro de movimientos
  └── Concepto de ubicación operacional

Reserva de disponibilidad
  └── Disponibilidad contextual
  └── Concepto de estado de disponibilidad

Operación en modo degradado
  └── Disponibilidad contextual
  └── Concepto de nivel de confianza

Reconciliación distribuida
  └── Operación en modo degradado
  └── Identidad de runtime

Transformaciones
  └── Disponibilidad contextual
  └── Concepto de insumo y derivado

Coordinación avanzada
  └── Reconciliación distribuida
  └── Transformaciones
```

---

## MATERIALIZACIONES RUNTIME NECESARIAS

Estado mínimo que el runtime debe poder materializar en cada capa para que la capa sea operacionalmente funcional:

### CAPA 0

* Disponibilidad actual por ítem (cantidad)
* Lista de movimientos recientes (auditoría mínima)

### CAPA 1

* Disponibilidad por combinación ítem + ubicación + estado
* Reservas activas por ítem
* Atributos de variante por ítem cuando aplica

### CAPA 2

* Nivel de confianza operacional por ítem o por runtime
* Señales de presión activas (escasez, expiración, divergencia)
* Operaciones marcadas bajo baja confianza para reconciliación

### CAPA 3

* Identidad de runtime de origen por evento
* Cola de reconciliación pendiente
* Divergencias activas entre runtimes

### CAPA 4

* Transformaciones activas con estado intermedio
* Relación causal insumo → derivado por lote de transformación
* Rendimiento real acumulado por tipo de transformación

### CAPA 5

* Flujos de coordinación activos con estado por actor
* Reglas de negocio configuradas aplicables

---

# 4. NÚCLEO MÍNIMO ESTABLE

## INVARIANTES ABSOLUTOS

Invariantes que jamás deben romperse aunque el sistema evolucione hasta CAPA 5:

### Causalidad preservada

Todo movimiento de disponibilidad tiene causa trazable.

No existe cambio de disponibilidad sin evento causal registrado.

### Continuidad operacional

El runtime no puede detenerse porque una capa superior falla o no está disponible.

La operación en CAPA 0 es siempre posible.

### No-reescritura de historia

Los eventos pasados no se modifican.

Las correcciones generan nuevos eventos con causalidad explícita, no sobrescriben eventos anteriores.

### Disponibilidad como coordinación, no como contador

La disponibilidad es un resultado emergente de eventos coordinados, no un número almacenado directamente.

Cualquier lectura de disponibilidad es una proyección sobre el log de eventos en el contexto actual.

### Reconciliación progresiva

La divergencia se reconcilia progresivamente, nunca por reescritura destructiva.

La reconciliación genera eventos de convergencia trazables.

### Edge-first

El runtime operacional puede funcionar sin conectividad al núcleo central.

La sincronización es eventual y progresiva, nunca un requisito bloqueante para la operación.

### Complejidad opcional activable

Ninguna capacidad de capa superior debe ser un requisito para operar en capa inferior.

La complejidad se activa cuando el problema operacional la justifica, no anticipadamente.

---

## LO QUE ESTE NÚCLEO NO ES

Este núcleo mínimo NO es:

### Plugin architecture enterprise

No existe un sistema de plugins con contratos formales, versiones de API, y registro dinámico de módulos.

Las capas son conceptuales y evolutivas, no módulos técnicos intercambiables.

### Microkernel académico

No existe separación entre kernel y servicios con comunicación por mensajes formales.

La arquitectura es pragmáticamente evolutiva, no académicamente pura.

### DDD ceremonial

No existen Aggregates formales, Domain Events con contratos explícitos, ni Bounded Contexts con mapas de contexto.

La causalidad y los eventos son conceptos operacionales, no patrones DDD aplicados por convención.

### WMS accidental

No existe un Warehouse Management System completo con zonas, pasillos, ubicaciones físicas exactas, y gestión de picking.

INVENTARIOS en DISATEQ resuelve disponibilidad operacional contextual, no logística física compleja.

---

## PRINCIPIO DE GRAVEDAD OPERACIONAL

```text
Cuando hay duda sobre qué capa activar:
activar la más simple que resuelve el problema.
```

La complejidad adicional solo se justifica cuando la capa simple ya demostró ser insuficiente en operación real.

No se anticipa complejidad. Se resuelve con la capa mínima suficiente.

---

## GUÍA DE DECISIÓN EVOLUTIVA

Antes de activar una capa superior, responder:

1. ¿El problema operacional existe ya en producción real o es hipotético?
2. ¿La capa anterior es insuficiente para resolverlo, o solo subóptima?
3. ¿La nueva capa puede implementarse sin romper la operación de las capas anteriores?
4. ¿El equipo operacional puede absorber la complejidad adicional sin perder continuidad?
5. ¿La nueva capa puede desactivarse si genera problemas sin destruir la operación base?

Si alguna respuesta es negativa o incierta, no activar la capa todavía.

---

# 5. RELACIÓN CON FOUNDATIONS

Este documento es complementario a:

`inventory-architecture-foundations.md`

La relación es:

```text
foundations.md
  → principios filosóficos del dominio
  → escenarios canónicos de comportamiento esperado
  → invariantes operacionales por escenario

evolution.md  (este documento)
  → cómo crecer sin romper lo anterior
  → capas evolutivas con sus límites
  → núcleo mínimo que jamás se rompe
  → guía de decisión para activar complejidad
```

Ninguno de los dos documentos define implementación técnica final.

Ambos definen el marco semántico y operacional dentro del cual la implementación técnica debe encuadrarse.

---

# 6. ESCENARIOS EVOLUTIVOS POR CAPA

## PROPÓSITO

Los escenarios evolutivos muestran situaciones operacionales concretas que justifican la activación de cada capa.

No son escenarios de comportamiento esperado (eso es responsabilidad de `foundations.md`).

Son escenarios de **decisión de crecimiento**: cuándo y por qué una capa inferior ya no es suficiente y se justifica activar la siguiente.

---

## ESTRUCTURA DE CADA ESCENARIO EVOLUTIVO

Cada escenario responde:

* **Situación:** qué ocurre en la operación real
* **Límite de capa actual:** por qué la capa activa no puede resolverlo
* **Capa que lo resuelve:** cuál es la transición necesaria
* **Señal de activación:** qué evidencia operacional concreta indica que es momento de activar
* **Riesgo de activación prematura:** qué pasa si se activa antes de que el problema sea real

---

## CAPA 0 → CAPA 1: DE DISPONIBILIDAD SIMPLE A CONTEXTO OPERACIONAL

### ESC-EV-01 — EL MISMO ÍTEM EN DOS LUGARES

**Situación:**

El negocio tiene el mismo producto en bodega y en mostrador.

La disponibilidad total es suficiente pero no toda es accesible desde el punto de venta activo.

El operador vende desde mostrador y hay ruptura de disponibilidad local aunque en total el stock es positivo.

**Límite de CAPA 0:**

CAPA 0 solo conoce disponibilidad total del ítem.

No puede distinguir qué porción está en qué ubicación operacional.

El operador no puede saber si la disponibilidad está donde la necesita.

**Capa que lo resuelve:**

CAPA 1 — contexto operacional con disponibilidad por ubicación.

**Señal de activación:**

El negocio tiene más de un punto operacional con disponibilidad diferenciada y el operador necesita saber cuál tiene qué.

**Riesgo de activación prematura:**

Si el negocio opera en un solo punto, la contextualización por ubicación agrega complejidad sin valor.

El operador gestiona mentalmente la ubicación sin necesitar que el sistema lo modele.

---

### ESC-EV-02 — LA RESERVA QUE NO SE VE

**Situación:**

Un cliente solicita apartar un producto antes de pagar.

El operador separa físicamente el ítem pero el sistema sigue mostrando la disponibilidad como si estuviera disponible para cualquier venta.

Otro operador vende el ítem apartado sin saber que estaba reservado.

**Límite de CAPA 0:**

CAPA 0 no modela estados de disponibilidad.

No puede distinguir disponibilidad libre de disponibilidad comprometida pero no materializada.

**Capa que lo resuelve:**

CAPA 1 — estados de disponibilidad: libre, reservada, comprometida, bloqueada.

**Señal de activación:**

El negocio tiene flujos donde el compromiso ocurre antes de la materialización y esa brecha genera conflictos operacionales reales.

**Riesgo de activación prematura:**

Si el negocio no tiene flujos de reserva previos a la venta, el modelo de estados agrega complejidad de sincronización sin resolver ningún problema real.

---

### ESC-EV-03 — EL ÍTEM QUE TIENE TALLAS

**Situación:**

El negocio vende ropa o calzado.

El mismo producto en talla S y talla L son disponibilidades diferentes.

El sistema trata ambas como el mismo ítem y la disponibilidad se mezcla.

**Límite de CAPA 0:**

CAPA 0 solo tiene identidad mínima de ítem.

No puede modelar variantes con disponibilidad independiente.

**Capa que lo resuelve:**

CAPA 1 — variantes de ítem con disponibilidad contextual por atributo.

**Señal de activación:**

El negocio vende ítems donde el atributo diferenciador (talla, color, presentación) genera disponibilidades independientes que el operador necesita consultar por separado.

**Riesgo de activación prematura:**

Si todos los ítems del negocio son genéricos sin variantes, el modelo de variantes agrega estructura de datos sin valor operacional.

---

## CAPA 1 → CAPA 2: DE CONTEXTO OPERACIONAL A PRESIÓN OPERACIONAL

### ESC-EV-04 — EL CONTEO QUE LLEVA DÍAS SIN VALIDARSE

**Situación:**

El sistema muestra disponibilidad de un ítem importante.

Pero el último conteo físico fue hace tres semanas.

Hubo movimientos de ajuste no registrados en ese tiempo.

El operador no sabe si puede confiar en lo que ve.

**Límite de CAPA 1:**

CAPA 1 muestra disponibilidad contextual pero no tiene concepto de confianza ni de degradación temporal de esa confianza.

La disponibilidad se presenta como cierta aunque la evidencia que la sustenta sea antigua.

**Capa que lo resuelve:**

CAPA 2 — nivel de confianza operacional por ítem o por punto operacional.

**Señal de activación:**

El negocio tiene ítems críticos cuya disponibilidad no se valida con frecuencia suficiente y los operadores toman decisiones basadas en datos potencialmente desactualizados.

**Riesgo de activación prematura:**

Si el negocio valida físicamente con frecuencia suficiente y los movimientos se registran en tiempo real, la degradación de confianza no es un problema operacional presente.

---

### ESC-EV-05 — LA ESCASEZ QUE NADIE VE VENIR

**Situación:**

El negocio tiene disponibilidad de un ítem que se agotará en el turno actual según el ritmo de ventas.

Hay múltiples operadores vendiendo simultáneamente.

El sistema permite comprometer más disponibilidad de la que existe porque cada operador ve la disponibilidad total antes de que los demás materialicen sus ventas.

**Límite de CAPA 1:**

CAPA 1 puede mostrar reservas pero no señaliza activamente la presión de escasez ni arbitra cuando la disponibilidad se aproxima al límite.

**Capa que lo resuelve:**

CAPA 2 — señales de presión y arbitraje bajo escasez.

**Señal de activación:**

El negocio tiene ítems con alta rotación y múltiples puntos de venta o múltiples operadores donde la escasez simultánea genera compromisos incobrables.

**Riesgo de activación prematura:**

Si el negocio opera con un solo operador o tiene disponibilidad suficientemente holgada, el arbitraje bajo escasez no resuelve ningún problema real.

---

### ESC-EV-06 — EL PRODUCTO QUE VENCE ESTA SEMANA

**Situación:**

El negocio tiene disponibilidad de un producto perecedero con expiración próxima.

El sistema lo muestra con la misma prioridad que disponibilidad con mayor vida útil.

El producto vence sin ser utilizado aunque había demanda que podría haberlo consumido.

**Límite de CAPA 1:**

CAPA 1 puede registrar la fecha de expiración como atributo pero no genera señalización activa de presión ni afecta la prioridad operacional de la disponibilidad.

**Capa que lo resuelve:**

CAPA 2 — señalización de expiración próxima y reducción progresiva de confianza operacional.

**Señal de activación:**

El negocio tiene disponibilidad con expiración real que genera pérdida económica cuando no se prioriza su consumo antes de vencer.

**Riesgo de activación prematura:**

Si el negocio no maneja disponibilidad perecedera, la señalización de expiración agrega complejidad sin valor.

---

## CAPA 2 → CAPA 3: DE PRESIÓN OPERACIONAL A EDGE DISTRIBUIDO

### ESC-EV-07 — DOS PUNTOS DE VENTA SIN INTERNET

**Situación:**

El negocio tiene dos puntos de venta en la misma ciudad.

La conectividad es intermitente.

Cuando el servicio se interrumpe, ambos puntos necesitan seguir vendiendo de forma autónoma.

Al recuperar conectividad, los movimientos de ambos puntos deben reconciliarse sin generar disponibilidad fantasma ni pérdidas de registro.

**Límite de CAPA 2:**

CAPA 2 opera dentro de un runtime.

No tiene mecanismo para manejar divergencia entre runtimes independientes ni para reconciliar eventos originados en runtimes distintos.

**Capa que lo resuelve:**

CAPA 3 — identidad de runtime, operación autónoma, reconciliación distribuida.

**Señal de activación:**

El negocio tiene múltiples runtimes operacionales con disponibilidad compartida que pueden divergir y necesitan reconciliarse sin perder continuidad operacional en ninguno.

**Riesgo de activación prematura:**

Si el negocio opera en un solo punto, la distribución agrega complejidad de reconciliación sin resolver ningún problema real.

---

### ESC-EV-08 — EL INVENTARIO QUE SE ACTUALIZA EN VIAJE

**Situación:**

El negocio tiene un vendedor que opera en campo con una tablet.

El vendedor registra pedidos y salidas de disponibilidad sin conectividad durante horas.

Al volver, los movimientos deben integrarse sin sobrescribir lo que ocurrió en el punto fijo durante ese tiempo.

**Límite de CAPA 2:**

CAPA 2 no tiene concepto de origen de evento por runtime ni de reconciliación progresiva entre orígenes distintos.

**Capa que lo resuelve:**

CAPA 3 — trazabilidad de origen de evento por runtime y reconciliación progresiva con causalidad preservada.

**Señal de activación:**

El negocio tiene operación desconectada real y frecuente con necesidad de integración posterior sin pérdida de eventos.

**Riesgo de activación prematura:**

Si el negocio siempre opera conectado o el volumen de operación desconectada es tan bajo que se gestiona manualmente, la distribución complica sin valor.

---

## CAPA 3 → CAPA 4: DE EDGE DISTRIBUIDO A TRANSFORMACIONES OPERACIONALES

### ESC-EV-09 — EL POLLO QUE SE CONVIERTE EN PRESAS

**Situación:**

El negocio compra pollos enteros y los procesa para vender presas por separado.

La disponibilidad de pollos enteros se reduce al transformarlos.

La disponibilidad de presas aumenta como resultado de la transformación.

La relación causal entre ambos debe ser trazable.

**Límite de CAPA 3:**

CAPA 3 puede registrar salidas y entradas pero no modela la relación causal entre insumo y derivado dentro de una misma operación de transformación.

**Capa que lo resuelve:**

CAPA 4 — transformaciones con insumo, derivado y causalidad trazable.

**Señal de activación:**

El negocio realiza transformaciones donde la trazabilidad insumo-derivado es operacionalmente relevante para el control de costos, la gestión de rendimiento o la detección de mermas.

**Riesgo de activación prematura:**

Si el negocio compra y vende ítems sin transformación, el modelo de transformaciones agrega estructura sin resolver ningún problema operacional presente.

---

### ESC-EV-10 — EL PAQUETE QUE SE DESCOMPONE

**Situación:**

El negocio compra cajas de 12 unidades y puede vender unidades sueltas o cajas completas.

La descomposición de una caja genera disponibilidad de 12 unidades y reduce la disponibilidad de cajas en uno.

La relación debe ser trazable y reversible si no se vendió ninguna unidad suelta.

**Límite de CAPA 3:**

CAPA 3 no modela la relación entre contenedor y contenido como transformación con reversión posible.

**Capa que lo resuelve:**

CAPA 4 — transformaciones reversibles con estado intermedio y causalidad preservada en reversión.

**Señal de activación:**

El negocio gestiona ítems con presentaciones múltiples donde la descomposición es frecuente y la trazabilidad del rendimiento por descomposición tiene valor operacional.

**Riesgo de activación prematura:**

Si el negocio vende solo en una presentación o la gestión de presentaciones múltiples se hace fuera del sistema, la complejidad de transformaciones no resuelve el problema operacional.

---

### ESC-EV-11 — LA MERMA QUE SIEMPRE EXISTE

**Situación:**

El negocio procesa alimentos con merma esperada.

De 10 kg de carne comprada, 8.5 kg quedan disponibles después del procesado.

La diferencia no es error ni pérdida inesperada: es merma operacional normal.

El sistema debe distinguir merma esperada de pérdida real.

**Límite de CAPA 3:**

CAPA 3 registra salidas y entradas pero no tiene concepto de rendimiento esperado versus real en una operación de transformación.

**Capa que lo resuelve:**

CAPA 4 — rendimiento real versus esperado por tipo de transformación, con registro de merma operacional como evento de primera clase.

**Señal de activación:**

El negocio tiene transformaciones con merma esperada significativa y necesita distinguir operacionalmente entre merma dentro del rango esperado y pérdida real que requiere investigación.

**Riesgo de activación prematura:**

Si el negocio no transforma disponibilidad o la merma no es relevante operacionalmente, el modelo de rendimiento agrega complejidad sin valor.

---

## CAPA 4 → CAPA 5: DE TRANSFORMACIONES A COORDINACIÓN AVANZADA

### ESC-EV-12 — LA COMPRA QUE REQUIERE APROBACIÓN

**Situación:**

El negocio creció y las compras por encima de cierto monto requieren aprobación del dueño antes de materializarse.

El operador genera la orden, el dueño la aprueba desde su dispositivo, y solo entonces la disponibilidad se incrementa.

**Límite de CAPA 4:**

CAPA 4 no modela flujos de coordinación multi-actor con estados intermedios y responsabilidades diferenciadas por rol.

**Capa que lo resuelve:**

CAPA 5 — flujos de coordinación con múltiples actores, estados y reglas de aprobación.

**Señal de activación:**

El negocio tiene procesos de coordinación formal entre actores con roles distintos donde el sistema debe gestionar el estado del flujo y no solo el resultado final.

**Riesgo de activación prematura:**

Si el negocio coordina internamente sin necesidad de que el sistema gestione el flujo, la coordinación avanzada agrega burocracia digital sin valor operacional.

---

### ESC-EV-13 — EL PROVEEDOR QUE NECESITA REPOSICIÓN AUTOMÁTICA

**Situación:**

El negocio tiene ítems de alta rotación con proveedor fijo.

Cuando la disponibilidad cae bajo un umbral, se necesita generar una alerta o pedido automático al proveedor.

**Límite de CAPA 4:**

CAPA 4 puede registrar niveles de disponibilidad pero no tiene mecanismo para disparar flujos de coordinación externos basados en umbrales de disponibilidad.

**Capa que lo resuelve:**

CAPA 5 — coordinación con actores externos, reglas configurables sobre umbrales de disponibilidad.

**Señal de activación:**

El negocio tiene volumen y frecuencia de reposición suficientes como para que la automatización de la coordinación con proveedores tenga valor real frente al costo de la complejidad.

**Riesgo de activación prematura:**

Si el negocio gestiona reposición manualmente sin fricción, automatizar la coordinación agrega complejidad sin resolver un dolor operacional real.

---

# 7. RELACIÓN ENTRE ESCENARIOS EVOLUTIVOS Y ESCENARIOS DE FOUNDATIONS

Los escenarios evolutivos (Sección 6) responden:

```text
¿Cuándo y por qué activar esta capa?
```

Los escenarios canónicos de `foundations.md` responden:

```text
¿Cómo debe comportarse el sistema dentro de esta capa?
```

Son complementarios y no se solapan.

Un escenario evolutivo describe la señal de transición entre capas.

Un escenario canónico describe el comportamiento esperado una vez que la capa está activa.

---

# 8. PROTOCOLO DE DECISIÓN DE CAPAS

## PROPÓSITO

Este protocolo define el proceso explícito para tomar la decisión de activar una capa superior.

No es una guía académica.

Es un proceso operacional que protege al sistema de dos riesgos simétricos:

```text
Activación prematura → complejidad sin valor, carga operacional innecesaria
Activación tardía    → problemas reales sin resolver, fricciones acumuladas
```

---

## FASE 1 — IDENTIFICACIÓN DEL DOLOR OPERACIONAL

Antes de evaluar cualquier capa, debe existir un dolor operacional real y documentable.

Un dolor operacional es real cuando cumple al menos uno de estos criterios:

* Ocurre con frecuencia suficiente como para afectar la operación cotidiana
* Ha generado pérdida económica concreta o riesgo operacional documentado
* El operador lo menciona de forma recurrente como fricción sin resolver
* Genera trabajo manual compensatorio habitual (workarounds estables)

Un dolor operacional NO es válido como señal de activación cuando:

* Es hipotético o proyectado sin evidencia actual
* Ocurrió una sola vez en circunstancias excepcionales
* Es resuelto actualmente por el operador sin fricción significativa
* La solución es un cambio de proceso, no de sistema

---

## FASE 2 — DIAGNÓSTICO DE CAPA ACTUAL

Antes de proponer activar la siguiente capa, verificar que la capa actual fue implementada correctamente.

Preguntas de diagnóstico de capa actual:

* ¿La capa actual está completamente implementada o hay capacidades no activadas?
* ¿El operador conoce y usa todas las capacidades disponibles en la capa actual?
* ¿El dolor existe porque la capa actual tiene un bug o limitación de implementación?
* ¿El dolor existe porque la capa actual no fue configurada correctamente para este negocio?

Si la respuesta a cualquiera es afirmativa, la acción correcta es corregir o completar la capa actual, no activar la siguiente.

La activación de una capa nueva no resuelve problemas de implementación incompleta en capas anteriores.

---

## FASE 3 — EVALUACIÓN DE LA TRANSICIÓN

Si el dolor es real y la capa actual está correctamente implementada, evaluar la transición.

### 3.1 — Verificación de dependencias

La capa a activar tiene dependencias explícitas (ver Sección 2).

Verificar que todas las dependencias están operacionalmente estables, no solo técnicamente presentes.

Una dependencia es operacionalmente estable cuando:

* Está implementada completamente
* El equipo operacional la usa con fluidez
* No tiene deuda técnica activa relevante
* No tiene problemas de confianza operacional sin resolver

Si alguna dependencia no cumple esto, estabilizarla antes de continuar.

### 3.2 — Evaluación de complejidad nueva

Cada capa introduce complejidad documentada (ver Sección 2).

Evaluar explícitamente:

* ¿El equipo operacional puede absorber los nuevos conceptos sin perder continuidad?
* ¿La complejidad nueva requiere cambios en procesos operacionales existentes?
* ¿Existe capacidad de implementación y mantenimiento de la nueva capa?
* ¿El costo de la complejidad nueva es proporcionado al valor operacional que resuelve?

### 3.3 — Verificación de reversibilidad

La activación de una capa debe ser reversible si genera problemas.

Antes de activar, definir explícitamente:

* ¿Qué datos o eventos generados por la nueva capa son irreversibles?
* ¿Cuál es el procedimiento concreto para desactivar la capa si la operación se ve afectada?
* ¿La reversión restaura la operación anterior sin pérdida de datos históricos?

Si la reversión no es posible sin pérdida operacional significativa, la activación requiere validación más exhaustiva antes de proceder.

---

## FASE 4 — ACTIVACIÓN CONTROLADA

La activación de una capa no es un cambio de implementación masivo.

Es una secuencia controlada:

### 4.1 — Activación mínima

Activar solo las capacidades mínimas de la nueva capa que resuelven el dolor operacional identificado.

No activar todas las capacidades de la capa porque están disponibles.

La capa se expande cuando el negocio lo necesita, no porque técnicamente sea posible.

### 4.2 — Período de coexistencia

Durante la activación, la capa anterior debe seguir funcionando íntegramente.

El operador trabaja con ambas capas simultáneamente durante un período de transición.

Las operaciones del período de transición deben ser válidas en el modelo de ambas capas.

### 4.3 — Validación operacional

La activación es exitosa cuando:

* El dolor operacional identificado en Fase 1 está resuelto
* La operación en capas anteriores no fue afectada
* El equipo operacional usa las nuevas capacidades sin fricción visible
* No aparecieron efectos secundarios inesperados en las capas dependientes

Si alguno de estos criterios no se cumple, evaluar si continuar, corregir o revertir.

---

## FASE 5 — CONSOLIDACIÓN

Una vez que la activación es operacionalmente estable:

* Documentar las capacidades activadas y su estado en el contexto del negocio
* Actualizar la evaluación de señales de activación para la siguiente capa
* Identificar si el dolor operacional resuelto generó visibilidad de nuevos dolores en capas superiores
* Registrar el aprendizaje operacional de la transición para informar futuras activaciones

---

## ÁRBOL DE DECISIÓN COMPACTO

```text
¿Existe dolor operacional real y documentable?
  NO → no activar ninguna capa
  SÍ ↓

¿La capa actual está correctamente implementada?
  NO → corregir/completar capa actual primero
  SÍ ↓

¿Todas las dependencias de la nueva capa son operacionalmente estables?
  NO → estabilizar dependencias primero
  SÍ ↓

¿La complejidad nueva es absorbible por el equipo operacional?
  NO → posponer hasta que haya capacidad operacional
  SÍ ↓

¿La activación es reversible sin pérdida operacional crítica?
  NO → validación exhaustiva antes de proceder
  SÍ ↓

Activar mínimo necesario → validar → consolidar
```

---

## ANTI-PATRONES DE DECISIÓN

### Activación por anticipación técnica

```text
"Vamos a activar CAPA 3 ahora que podemos,
para cuando tengamos el segundo punto de venta ya estará listo."
```

La complejidad no activada no es gratuita: requiere mantenimiento, genera confusión, y puede interferir con la operación actual.

Activar solo cuando el dolor existe, no cuando el dolor es posible.

### Activación por presión de funcionalidad

```text
"El cliente pidió esta funcionalidad específica,
tenemos que activar la capa que la habilita."
```

La funcionalidad solicitada debe evaluarse contra el protocolo completo.

Una solicitud de funcionalidad no es suficiente para saltar fases de diagnóstico y evaluación.

### Activación por inercia tecnológica

```text
"Esta tecnología ya soporta distribución,
aprovechemos que lo tenemos disponible."
```

La disponibilidad tecnológica de una capacidad no justifica su activación operacional.

La tecnología sirve a los problemas operacionales, no al revés.

### Reversión por impaciencia

```text
"La activación generó fricción al principio,
mejor revertimos."
```

Toda activación genera fricción inicial.

La fricción inicial de adaptación es diferente de la fricción sistémica que indica un problema real.

Evaluar antes de revertir si la fricción es de adaptación o de diseño incorrecto.

---

# 9. TENSIONES ARQUITECTÓNICAS ENTRE CAPAS

## PROPÓSITO

Las capas evolutivas no son muros aislados.

Cuando coexisten, generan tensiones: dos principios válidos que tiran en direcciones opuestas en una misma situación operacional.

Este documento no resuelve las tensiones con una respuesta única.

Las documenta para que sean reconocibles cuando aparecen y navegables con criterio operacional, no con improvisación.

---

## ESTRUCTURA DE CADA TENSIÓN

Cada tensión responde:

* **Tensión:** los dos polos en conflicto
* **Dónde aparece:** en qué situación operacional concreta emerge
* **Por qué no tiene resolución universal:** qué hace que la respuesta dependa del contexto
* **Criterio de navegación:** cómo decidir hacia dónde inclinar la balanza en un caso concreto
* **Señal de desequilibrio:** qué indica que la balanza se inclinó demasiado hacia un lado

---

## TENSIÓN T-01 — SIMPLICIDAD DE CAPA 0 vs NECESIDAD DE CONTEXTO DE CAPA 1

**Tensión:**

Mantener la disponibilidad simple y directamente consultable (CAPA 0) versus modelar el contexto completo que la hace operacionalmente precisa (CAPA 1).

**Dónde aparece:**

Cuando el negocio crece y aparecen múltiples ubicaciones o estados, pero la operación cotidiana sigue siendo mayoritariamente simple.

Añadir contexto a toda la disponibilidad complica las consultas simples que representan el 90% del uso real.

**Por qué no tiene resolución universal:**

Para un negocio con un solo punto operacional, el contexto de CAPA 1 es ruido.

Para un negocio con múltiples puntos, la simplicidad de CAPA 0 genera errores operacionales reales.

**Criterio de navegación:**

El contexto solo vale cuando el operador toma decisiones distintas en función de él.

Si el operador consulta disponibilidad y actúa igual independientemente de la ubicación o el estado, el contexto no agrega valor operacional.

**Señal de desequilibrio hacia CAPA 0 en exceso:**

El operador consulta disponibilidad total y luego verifica manualmente en qué punto está físicamente el ítem antes de comprometerse.

**Señal de desequilibrio hacia CAPA 1 en exceso:**

Para consultar disponibilidad básica el operador debe especificar ubicación y estado aunque en la práctica la disponibilidad siempre está en el mismo lugar.

---

## TENSIÓN T-02 — CONTINUIDAD OPERACIONAL vs INTEGRIDAD DE DATOS

**Tensión:**

Permitir que la operación continúe bajo condiciones de incertidumbre (CAPA 2) versus garantizar que los datos reflejen la realidad antes de comprometer disponibilidad.

**Dónde aparece:**

Cuando la sincronización está degradada o la confianza operacional es baja pero la operación no puede detenerse.

El sistema puede comprometer disponibilidad cuya certeza es reducida, o puede bloquear hasta recuperar certeza plena.

**Por qué no tiene resolución universal:**

Bloquear protege la integridad de datos pero puede paralizar la operación y generar pérdida comercial real.

Continuar sin certeza puede generar compromisos que luego no pueden honrarse.

El equilibrio correcto depende del tipo de ítem, del nivel real de incertidumbre, y de las consecuencias de comprometerse incorrectamente.

**Criterio de navegación:**

El costo de comprometerse incorrectamente versus el costo de no comprometerse es diferente por ítem y por contexto.

Para ítems donde el error de sobrecompromiso es crítico (un solo servicio de alto valor), inclinar hacia integridad.

Para ítems donde la operación cotidiana debe fluir y los errores se reconcilian (productos de alta rotación), inclinar hacia continuidad.

**Señal de desequilibrio hacia continuidad en exceso:**

Los compromisos bajo baja confianza generan regularmente diferencias en reconciliación que requieren corrección manual frecuente.

**Señal de desequilibrio hacia integridad en exceso:**

La operación se frena frecuentemente esperando confirmación de datos que raramente cambian el resultado operacional.

---

## TENSIÓN T-03 — AUTONOMÍA DE RUNTIME vs CONVERGENCIA DISTRIBUIDA

**Tensión:**

Cada runtime opera autónomamente con su propia disponibilidad (CAPA 3) versus la necesidad de que todos los runtimes converjan hacia una disponibilidad coherente.

**Dónde aparece:**

Cuando dos runtimes operan de forma autónoma y luego se reconcilian.

La disponibilidad comprometida en runtime A mientras runtime B también comprometía la misma disponibilidad genera divergencia que no se resuelve sola.

**Por qué no tiene resolución universal:**

La autonomía total permite operación sin interrupciones pero puede generar divergencias graves en ítems con disponibilidad escasa compartida entre runtimes.

La sincronización frecuente reduce divergencias pero introduce latencia y fragilidad operacional.

**Criterio de navegación:**

El nivel tolerable de divergencia es proporcional a la disponibilidad total del ítem versus la velocidad de consumo compartida.

Un ítem con alta disponibilidad puede tolerar más autonomía porque la probabilidad de sobrecompromiso es baja.

Un ítem con disponibilidad escasa compartida entre runtimes requiere sincronización más frecuente o reserva centralizada.

**Señal de desequilibrio hacia autonomía en exceso:**

Los runtimes generan regularmente sobrecompromisos en ítems escasos que requieren cancelaciones o sustituciones con el cliente.

**Señal de desequilibrio hacia convergencia en exceso:**

Los runtimes no pueden operar de forma autónoma durante períodos breves de desconectividad sin que la operación se detenga.

---

## TENSIÓN T-04 — CAUSALIDAD TRAZABLE vs RENDIMIENTO OPERACIONAL

**Tensión:**

Registrar la causalidad completa de cada movimiento de disponibilidad (principio raíz de foundations.md) versus la velocidad de registro en alta frecuencia operacional.

**Dónde aparece:**

En operaciones de alta frecuencia donde registrar el contexto causal completo en cada movimiento introduce latencia o complejidad de datos que afecta la velocidad del scanner o del teclado.

**Por qué no tiene resolución universal:**

Sin causalidad trazable, la reconciliación y el diagnóstico de diferencias son imposibles.

Con causalidad completa en cada movimiento de alta frecuencia, el sistema puede volverse lento en el punto de venta activo.

**Criterio de navegación:**

La causalidad mínima necesaria es: origen del movimiento (quién, qué operación, cuándo).

El contexto adicional (por qué, en qué circunstancias, con qué nivel de confianza) puede enriquecerse asincrónicamente sin bloquear el registro del movimiento.

La trazabilidad no requiere que todo el contexto se capture de forma síncrona.

**Señal de desequilibrio hacia trazabilidad en exceso:**

El scanner o el flujo de cobro introduce latencia visible al operador por la carga de registro de contexto causal.

**Señal de desequilibrio hacia rendimiento en exceso:**

Al revisar diferencias de disponibilidad no es posible determinar la causa sin investigación manual porque los movimientos no tienen contexto suficiente.

---

## TENSIÓN T-05 — INMUTABILIDAD DE EVENTOS vs CORRECCIÓN OPERACIONAL

**Tensión:**

Los eventos pasados no se reescriben (invariante absoluto de foundations.md) versus la necesidad real del negocio de corregir errores de registro sin que quede rastro confuso en la historia.

**Dónde aparece:**

Cuando un operador registró un movimiento incorrecto (cantidad equivocada, ítem equivocado, operación duplicada) y quiere simplemente borrarlo o corregirlo directamente.

**Por qué no tiene resolución universal:**

La inmutabilidad es necesaria para la integridad del sistema y la trazabilidad de reconciliaciones.

Pero exigir al operador que genere un evento de reversión explícito para cada error puede ser cognitivamente costoso en operación de alta presión.

**Criterio de navegación:**

El sistema puede ofrecer una operación de corrección que internamente genera el evento de reversión de forma automática, sin exponer al operador al modelo de eventos.

El operador dice "esto estuvo mal" y el sistema genera los eventos necesarios manteniendo la causalidad.

La abstracción operacional protege la inmutabilidad sin cargar al operador con el modelo interno.

**Señal de desequilibrio hacia inmutabilidad expuesta en exceso:**

El operador necesita entender el modelo de eventos para corregir errores simples y esto genera errores adicionales o resistencia a corregir.

**Señal de desequilibrio hacia corrección directa en exceso:**

Las correcciones no dejan rastro causal suficiente y las diferencias de disponibilidad son inexplicables en retrospectiva.

---

## TENSIÓN T-06 — COMPLEJIDAD OPCIONAL vs ACTIVACIÓN REAL

**Tensión:**

Las capas superiores son opcionales y se activan cuando el problema las justifica (principio raíz de este documento) versus la presión operacional de activar capacidades preventivamente para evitar dolores futuros.

**Dónde aparece:**

Cuando el negocio está creciendo y el equipo técnico puede anticipar que dentro de tres meses necesitará CAPA 3.

La tentación es activarla ahora para no tener que hacerlo bajo presión después.

**Por qué no tiene resolución universal:**

Activar preventivamente evita la urgencia futura pero introduce complejidad presente que puede generar problemas operacionales actuales.

No activar preventivamente puede generar la situación de activar bajo presión con menos tiempo para validar.

**Criterio de navegación:**

El criterio no es temporal (cuándo lo necesitaremos) sino operacional (lo necesitamos ahora).

Si el dolor aún no existe en operación real, la activación preventiva es siempre prematura.

La preparación correcta es tener el diseño listo, no tener la activación hecha.

**Señal de desequilibrio hacia activación preventiva en exceso:**

Hay capacidades activas en el sistema que ningún operador usa porque el problema que resuelven todavía no existe.

**Señal de desequilibrio hacia activación reactiva en exceso:**

La activación de una capa necesaria ocurre siempre bajo crisis, sin tiempo para validar, generando problemas operacionales en la transición.

---

## TENSIÓN T-07 — TRANSFORMACIÓN ATÓMICA vs CONTINUIDAD DURANTE TRANSFORMACIÓN

**Tensión:**

Una transformación debería ser atómica: o se completa o se revierte (CAPA 4) versus la realidad operacional donde las transformaciones ocurren en el tiempo y el negocio necesita visibilidad del estado intermedio.

**Dónde aparece:**

Cuando una transformación larga (proceso de producción de varias horas) está en curso y el operador necesita saber qué disponibilidad está comprometida, qué ya se generó, y cuánto falta.

La atomicidad completa haría que el estado intermedio fuera invisible hasta la conclusión.

**Por qué no tiene resolución universal:**

La atomicidad completa simplifica el modelo de datos pero oculta información operacional real que el negocio necesita para tomar decisiones durante la transformación.

La visibilidad completa del estado intermedio añade complejidad al modelo y puede generar lecturas de disponibilidad ambiguas para otros operadores.

**Criterio de navegación:**

El estado intermedio es visible como estado diferenciado (en transformación), no como disponibilidad comprometible.

La disponibilidad en transformación no puede ser comprometida para otras operaciones hasta que la transformación genere disponibilidad derivada.

La visibilidad del estado intermedio es informativa para el operador que gestiona la transformación, no operacionalmente disponible para el resto.

**Señal de desequilibrio hacia atomicidad en exceso:**

El operador gestiona manualmente el seguimiento de transformaciones en curso porque el sistema no muestra el estado intermedio.

**Señal de desequilibrio hacia visibilidad en exceso:**

Otros operadores ven disponibilidad en estado intermedio y la comprometen antes de que la transformación la genere efectivamente.

---

## TENSIONES CRUZADAS ENTRE CAPAS NO ADYACENTES

Las tensiones más difíciles son las que involucran capas no adyacentes donde el principio de una capa baja entra en conflicto con una capacidad de una capa alta.

### CAPA 0 (disponibilidad simple) vs CAPA 3 (edge distribuido)

La disponibilidad simple de CAPA 0 asume que hay una única fuente de verdad para la cantidad disponible.

CAPA 3 introduce múltiples fuentes que pueden diverger temporalmente.

La tensión aparece en la proyección de disponibilidad: ¿qué número muestra CAPA 0 cuando hay divergencia distribuida activa?

Criterio: CAPA 0 proyecta la disponibilidad del runtime local activo, no la disponibilidad global consolidada. La consolidación es responsabilidad de CAPA 3, no de la consulta de CAPA 0.

### CAPA 1 (reservas) vs CAPA 3 (autonomía de runtime)

Una reserva generada en runtime A puede afectar disponibilidad que runtime B también necesita comprometer.

Si los runtimes son autónomos, runtime B no conoce la reserva de runtime A hasta la reconciliación.

Criterio: las reservas tienen ámbito de runtime. Una reserva en runtime A no bloquea operaciones en runtime B. La divergencia se reconcilia; los sobrecompromisos tienen protocolo de resolución explícito en foundations.md.

### CAPA 2 (confianza) vs CAPA 4 (transformaciones)

Una transformación iniciada bajo alta confianza puede encontrar que la confianza se degrada durante su ejecución.

¿Debe la transformación detenerse, continuar, o cambiar de estado?

Criterio: la transformación continúa con su estado intermedio visible y marcado con el nivel de confianza vigente en cada etapa. El resultado final registra el contexto de confianza durante el proceso.

---

## PRINCIPIO DE NAVEGACIÓN DE TENSIONES

Cuando una tensión aparece sin respuesta clara en este documento:

```text
1. Identificar cuál es el costo operacional real de cada polo
2. Identificar cuál de los dos costos es recuperable
3. Preferir el polo cuyo error es más fácilmente reconciliable
4. Documentar la decisión y el criterio usado
5. Revisar si el comportamiento observado valida el criterio elegido
```

Las tensiones no resueltas no son fracasos arquitectónicos.

Son puntos de tensión activos que el sistema debe poder navegar con criterio, no eliminar con reglas rígidas.

---