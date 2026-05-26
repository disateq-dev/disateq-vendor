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

## Índice de navegación

| Sección | Contenido | Para qué usarla |
|---|---|---|
| [1. Principio raíz](#1-principio-raíz) | Crecimiento por capas, invariante de no-ruptura | Entender la filosofía base del crecimiento |
| [2. Capas evolutivas](#2-capas-evolutivas) | CAPA 0–5 con problema, complejidad, dependencias, capacidades | Entender qué resuelve cada capa y qué no puede romper |
| [3. Matriz de capacidades](#3-matriz-de-capacidades) | Núcleo vs opcionales, dependencias mínimas, materializaciones | Identificar qué capacidades son necesarias en cada capa |
| [4. Núcleo mínimo estable](#4-núcleo-mínimo-estable) | Invariantes absolutos, lo que no es este núcleo, principio de gravedad | Verificar qué jamás puede romperse al evolucionar |
| [5. Relación con foundations](#5-relación-con-foundations) | Mapa de complementariedad entre documentos | Saber dónde buscar qué tipo de información |
| [6. Escenarios evolutivos por capa](#6-escenarios-evolutivos-por-capa) | ESC-EV-01 a 13, señales de activación y riesgos | Decidir si el negocio actual justifica activar la siguiente capa |
| [7. Relación escenarios evolutivos / foundations](#7-relación-entre-escenarios-evolutivos-y-escenarios-de-foundations) | Distinción entre cuándo activar y cómo comportarse | Navegar entre los dos documentos sin confundirlos |
| [8. Protocolo de decisión de capas](#8-protocolo-de-decisión-de-capas) | Fases 1–5, árbol de decisión, anti-patrones | Ejecutar el proceso de activación de forma controlada |
| [9. Tensiones arquitectónicas entre capas](#9-tensiones-arquitectónicas-entre-capas) | T-01 a T-07 + tensiones cruzadas, criterios de navegación | Reconocer y navegar conflictos entre principios de capas distintas |
| [10. Glosario operacional del dominio](#10-glosario-operacional-del-dominio) | 26 términos con definición operacional propia | Resolver ambigüedad semántica en escenarios, decisiones y diseño |
| [11. Semántica operacional CAPA 1 — consolidación mínima](#11-semántica-operacional-capa-1--consolidación-mínima) | Qué significa DISPONIBLE · qué altera existencia · límites · anti-patrones · tensiones de CAPA 1 implementada | Referencia semántica precisa antes de agregar cualquier funcionalidad sobre CAPA 1 |

---

## Documentos relacionados

| Documento | Propósito |
|---|---|
| `inventory-architecture-foundations.md` | Principios filosóficos del dominio · Escenarios canónicos de comportamiento · Invariantes por escenario |
| `inventory-operational-evolution.md` | Cómo crecer sin romper · Capas evolutivas · Protocolo de decisión · Glosario |

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

# 10. GLOSARIO OPERACIONAL DEL DOMINIO

## PROPÓSITO

Este glosario fija el significado operacional de los términos usados en este documento y en `inventory-architecture-foundations.md`.

No son definiciones académicas ni de estándar externo.

Son definiciones operacionales: cómo DISATEQ VENDOR™ entiende y usa cada término dentro de su dominio.

Cuando un término aparece en cualquier escenario, protocolo o principio de estos documentos, su significado es el aquí registrado.

---

## DISPONIBILIDAD OPERACIONAL

Cantidad de un ítem que puede ser comprometida en el runtime activo actual, en el contexto operacional vigente.

No es lo mismo que existencia ni que stock contable.

La disponibilidad operacional es siempre contextual: depende del runtime, la ubicación, el estado y el nivel de confianza vigente.

```text
disponibilidad operacional ≠ existencia física
disponibilidad operacional ≠ cantidad en base de datos
disponibilidad operacional = proyección sobre eventos en contexto activo
```

Ver: `EXISTENCIA`, `CONFIANZA OPERACIONAL`, `CONTEXTO OPERACIONAL`

---

## EXISTENCIA

Cantidad física real de un ítem en un punto operacional, independientemente de su estado de disponibilidad.

La existencia puede ser mayor que la disponibilidad operacional (hay ítems físicamente presentes pero bloqueados, reservados o expirados).

La existencia se valida mediante conteo físico.

La disponibilidad operacional se calcula a partir de eventos.

La brecha entre existencia y disponibilidad operacional es un indicador de confianza.

Ver: `DISPONIBILIDAD OPERACIONAL`, `CONFIANZA OPERACIONAL`, `RECONCILIACIÓN`

---

## MOVIMIENTO

Evento operacional que modifica la disponibilidad de un ítem.

Todo movimiento tiene:

* tipo (entrada, salida, ajuste, reserva, liberación, transformación)
* cantidad
* ítem afectado
* origen causal (operación que lo generó)
* contexto operacional (runtime, ubicación, operador, momento)

Un movimiento sin origen causal trazable no es válido en el modelo operacional.

Ver: `EVENTO`, `CAUSALIDAD`, `TRAZABILIDAD`

---

## EVENTO

Registro inmutable de algo que ocurrió en el dominio operacional.

Los eventos son la fuente de verdad del sistema de inventarios.

La disponibilidad operacional actual es una proyección sobre el log de eventos, no un valor almacenado directamente.

Los eventos no se modifican.

Las correcciones generan nuevos eventos con causalidad explícita.

Ver: `MOVIMIENTO`, `INMUTABILIDAD`, `PROYECCIÓN`

---

## CAUSALIDAD

Relación entre un evento y el origen operacional que lo causó.

La causalidad responde: ¿por qué ocurrió este movimiento?

Sin causalidad, los movimientos son datos sin contexto.

Con causalidad, los movimientos son historia operacional trazable.

La causalidad fuerte es uno de los principios raíz de `foundations.md`: todo cambio de disponibilidad tiene una causa identificable y registrada.

Ver: `EVENTO`, `TRAZABILIDAD`, `RECONCILIACIÓN`

---

## TRAZABILIDAD

Capacidad de reconstruir la historia operacional de un ítem: qué movimientos ocurrieron, cuándo, por qué, y quién los generó.

La trazabilidad no es auditoría contable.

Es la capacidad operacional de responder preguntas como:

* ¿Por qué la disponibilidad de este ítem bajó a cero?
* ¿Qué operación generó este ajuste?
* ¿Qué transformaciones usaron este insumo?
* ¿Qué compromisos están activos sobre esta disponibilidad?

Ver: `CAUSALIDAD`, `EVENTO`, `RECONCILIACIÓN`

---

## RESERVA

Estado temporal de disponibilidad que la compromete para una operación específica sin materializarla todavía.

La reserva reduce la disponibilidad operacional disponible para otros compromisos.

No reduce la existencia física ni genera un movimiento de salida definitivo.

La reserva se convierte en movimiento de salida cuando la operación se materializa, o se libera cuando la operación se cancela.

Ver: `COMPROMISO`, `MATERIALIZACIÓN`, `DISPONIBILIDAD OPERACIONAL`

---

## COMPROMISO

Promesa operacional de entregar o usar disponibilidad de un ítem.

El compromiso puede estar reservado (la disponibilidad está apartada) o no reservado (la disponibilidad está asignada intencionalmente pero no bloqueada).

El compromiso sin reserva es más frágil: otro proceso puede comprometer la misma disponibilidad antes de que el primero se materialice.

Ver: `RESERVA`, `MATERIALIZACIÓN`, `ARBITRAJE`

---

## MATERIALIZACIÓN

Momento en que un compromiso se convierte en movimiento definitivo.

La materialización reduce la existencia física (una salida ocurre) y registra el evento con causalidad desde el compromiso original.

Antes de la materialización, la disponibilidad está comprometida pero físicamente presente.

Después de la materialización, la disponibilidad fue consumida y el movimiento es irreversible salvo por reversión explícita con causalidad.

Ver: `COMPROMISO`, `RESERVA`, `MOVIMIENTO`

---

## CONFIANZA OPERACIONAL

Nivel de certeza con que el sistema puede afirmar que la disponibilidad operacional proyectada refleja la realidad.

La confianza operacional se degrada por:

* tiempo transcurrido desde la última validación física
* sincronización pendiente o degradada
* movimientos no registrados conocidos
* divergencia activa entre runtimes

La confianza operacional no es binaria: tiene niveles intermedios que informan las decisiones del operador.

La baja confianza no paraliza la operación; la contextualiza con visibilidad explícita.

Ver: `DISPONIBILIDAD OPERACIONAL`, `MODO DEGRADADO`, `RECONCILIACIÓN`

---

## PRESIÓN OPERACIONAL

Condición del sistema donde la disponibilidad está bajo tensión: escasez real o proyectada, expiración próxima, baja confianza, o divergencia activa.

La presión operacional no es un error.

Es un estado normal que el sistema debe señalizar al operador con suficiente contexto para tomar decisiones informadas.

Ver: `ESCASEZ`, `EXPIRACIÓN`, `CONFIANZA OPERACIONAL`, `SEÑAL DE PRESIÓN`

---

## SEÑAL DE PRESIÓN

Indicador contextual que el sistema emite cuando la disponibilidad operacional se aproxima a un estado crítico.

Las señales de presión son preventivas: aparecen antes de que el problema se materialice.

No son errores ni bloqueos: son información operacional para el operador.

Ver: `PRESIÓN OPERACIONAL`, `MODO DEGRADADO`

---

## ESCASEZ

Condición donde la disponibilidad operacional de un ítem es insuficiente para todos los compromisos activos o proyectados.

La escasez requiere arbitraje: decidir qué compromiso tiene prioridad sobre la disponibilidad disponible.

La escasez no bloquea automáticamente la operación; genera presión operacional que el sistema señaliza.

Ver: `ARBITRAJE`, `PRESIÓN OPERACIONAL`, `COMPROMISO`

---

## ARBITRAJE

Proceso de asignación de disponibilidad escasa entre múltiples compromisos concurrentes.

El arbitraje puede ser:

* automático por regla (FIFO, prioridad comercial, proximidad de expiración)
* contextual por operador (decisión humana explícita con trazabilidad)

El arbitraje es siempre un evento con causalidad: la disponibilidad se asignó a X compromiso por Y criterio.

Ver: `ESCASEZ`, `COMPROMISO`, `CAUSALIDAD`

---

## MODO DEGRADADO

Estado operacional donde el runtime continúa funcionando con confianza reducida o capacidades parciales.

En modo degradado:

* la operación no se detiene
* el operador tiene visibilidad explícita del nivel de degradación
* las operaciones realizadas quedan marcadas con el contexto de degradación para reconciliación posterior

El modo degradado es una condición operacional normal en entornos edge-first, no un estado de error.

Ver: `CONFIANZA OPERACIONAL`, `EDGE-FIRST`, `RECONCILIACIÓN`

---

## EDGE-FIRST

Principio operacional que establece que el runtime local debe poder operar autónomamente sin depender de conectividad al núcleo central.

La sincronización con el núcleo es eventual y progresiva, nunca un requisito bloqueante para la operación cotidiana.

Edge-first no significa offline permanente: significa que la operación no puede romperse por pérdida de conectividad.

Ver: `RUNTIME`, `SINCRONIZACIÓN`, `RECONCILIACIÓN`

---

## RUNTIME

Instancia operacional activa del sistema en un punto específico.

Cada runtime tiene:

* identidad propia
* disponibilidad operacional propia (proyección local)
* log de eventos propio
* capacidad de operar autónomamente

Los runtimes pueden diverger cuando operan sin sincronización.

La divergencia es una condición normal que se reconcilia progresivamente.

Ver: `EDGE-FIRST`, `DIVERGENCIA`, `RECONCILIACIÓN`

---

## DIVERGENCIA

Condición donde dos o más runtimes tienen proyecciones de disponibilidad distintas para el mismo ítem.

La divergencia no es un error: es una condición operacional esperada en sistemas edge-first.

La divergencia se detecta en la reconciliación y se resuelve progresivamente generando eventos de convergencia con causalidad explícita.

Ver: `RUNTIME`, `RECONCILIACIÓN`, `CAUSALIDAD`

---

## SINCRONIZACIÓN

Proceso de transmisión de eventos entre runtimes para reducir divergencia.

La sincronización es eventual y progresiva: no requiere que todos los runtimes estén sincronizados en todo momento.

Una sincronización exitosa no garantiza convergencia inmediata: puede requerir reconciliación posterior si los eventos se aplicaron en órdenes distintos.

Ver: `DIVERGENCIA`, `RECONCILIACIÓN`, `RUNTIME`

---

## RECONCILIACIÓN

Proceso de convergencia progresiva entre disponibilidades divergentes, sin reescribir la historia de eventos.

La reconciliación genera nuevos eventos de ajuste con causalidad explícita que explican por qué la disponibilidad de un runtime cambia al integrar eventos de otro.

La reconciliación no es corrección de errores: es el mecanismo normal de convergencia en un sistema edge-first.

Ver: `DIVERGENCIA`, `SINCRONIZACIÓN`, `INMUTABILIDAD`

---

## INMUTABILIDAD

Principio que establece que los eventos pasados no se modifican.

Las correcciones operacionales generan nuevos eventos de reversión o ajuste con causalidad explícita, no sobrescriben eventos anteriores.

La inmutabilidad garantiza que la historia operacional sea siempre reconstruible y auditable.

Ver: `EVENTO`, `CAUSALIDAD`, `TRAZABILIDAD`

---

## PROYECCIÓN

Cálculo de la disponibilidad operacional actual a partir del log de eventos en un contexto específico.

La proyección no es una lectura directa de un campo almacenado: es el resultado de aplicar todos los eventos relevantes al estado inicial.

La disponibilidad operacional es siempre una proyección, no un valor absoluto.

Ver: `EVENTO`, `DISPONIBILIDAD OPERACIONAL`, `CONTEXTO OPERACIONAL`

---

## CONTEXTO OPERACIONAL

Combinación de runtime, ubicación, estado de disponibilidad y nivel de confianza que determina cómo se proyecta y opera la disponibilidad de un ítem.

El mismo ítem puede tener disponibilidades operacionales distintas en contextos distintos.

El contexto operacional es siempre explícito: no hay disponibilidad "global" sin contexto.

Ver: `DISPONIBILIDAD OPERACIONAL`, `RUNTIME`, `CONFIANZA OPERACIONAL`

---

## TRANSFORMACIÓN

Operación que consume disponibilidad de uno o más ítems (insumos) y genera disponibilidad de uno o más ítems distintos (derivados).

La transformación tiene:

* causalidad trazable entre insumo y derivado
* estado intermedio visible durante el proceso
* rendimiento real versus rendimiento esperado
* posibilidad de reversión parcial con causalidad preservada

Ver: `INSUMO`, `DERIVADO`, `MERMA`, `ESTADO INTERMEDIO`

---

## INSUMO

Ítem cuya disponibilidad se consume en una transformación para generar derivados.

La disponibilidad del insumo se reduce al iniciarse la transformación (queda en estado intermedio) y se materializa como salida definitiva al completarse.

Ver: `TRANSFORMACIÓN`, `DERIVADO`

---

## DERIVADO

Ítem cuya disponibilidad se genera como resultado de una transformación a partir de insumos.

La disponibilidad del derivado no existe antes de que la transformación la genere.

La causalidad entre insumo y derivado es trazable y forma parte del registro operacional de la transformación.

Ver: `TRANSFORMACIÓN`, `INSUMO`

---

## MERMA

Diferencia entre el rendimiento esperado y el rendimiento real de una transformación.

La merma esperada es una condición operacional normal, no un error.

La merma inesperada (fuera del rango operacional normal) es una señal de presión que requiere investigación.

El sistema distingue entre merma dentro del rango esperado y pérdida real que requiere acción.

Ver: `TRANSFORMACIÓN`, `RENDIMIENTO`, `SEÑAL DE PRESIÓN`

---

## RENDIMIENTO

Relación entre la cantidad de insumo consumido y la cantidad de derivado generado en una transformación.

El rendimiento esperado es una referencia operacional.

El rendimiento real es el registrado en cada transformación concreta.

La diferencia acumulada entre rendimiento real y esperado es un indicador operacional de control de procesos.

Ver: `TRANSFORMACIÓN`, `MERMA`

---

## ESTADO INTERMEDIO

Condición de la disponibilidad durante una transformación activa: el insumo ya fue consumido del disponible para otros usos, pero el derivado todavía no fue generado.

El estado intermedio es visible al operador que gestiona la transformación.

No es disponibilidad comprometible para otras operaciones.

Se resuelve al completarse la transformación (genera derivado) o al revertirse (libera insumo con causalidad).

Ver: `TRANSFORMACIÓN`, `INSUMO`, `DERIVADO`

---

## CAPA EVOLUTIVA

Conjunto coherente de capacidades operacionales que el sistema puede activar para resolver una familia de problemas operacionales relacionados.

Las capas son evolutivas: cada una se construye sobre las anteriores y puede coexistir con ellas sin romperlas.

La activación de una capa es una decisión operacional deliberada, no una consecuencia automática del crecimiento del negocio.

Ver: `CAPACIDAD OPERACIONAL`, `PROTOCOLO DE DECISIÓN DE CAPAS`

---

## CAPACIDAD OPERACIONAL

Una función concreta que el sistema puede ofrecer al operador para resolver un problema operacional específico.

Las capacidades se clasifican en núcleo (presentes desde CAPA 0, siempre disponibles) y opcionales (activables con capas superiores cuando el problema las justifica).

Ver: `CAPA EVOLUTIVA`, `DISPONIBILIDAD OPERACIONAL`

---

# 11. SEMÁNTICA OPERACIONAL CAPA 1 — CONSOLIDACIÓN MÍNIMA

## PROPÓSITO

Esta sección documenta la semántica precisa de CAPA 1 **tal como está implementada actualmente** en DISATEQ VENDOR™.

No describe la totalidad conceptual de CAPA 1 (ver Sección 2).

Describe lo que CAPA 1 mínima **significa operacionalmente ahora mismo**: sus invariantes reales, sus límites explícitos, sus tensiones activas y sus anti-patrones específicos.

El objetivo es consolidar la semántica antes de agregar cualquier funcionalidad sobre esta capa.

---

## ALCANCE DE CAPA 1 MÍNIMA IMPLEMENTADA

CAPA 1 mínima activa en el runtime actual comprende exactamente:

* `ContextoItem` — registro de `umbralMinimo` por ítem
* `deriveEstado()` — proyección de estado a partir de existencia + umbral
* Tres estados operacionales: `DISPONIBLE` · `BAJO_STOCK` · `AGOTADO`
* Badge contextual en runtime (SubContextBar) con conteo de alertas activas

No están activos en esta implementación mínima:

* Contexto de ubicación o punto operacional
* Estados de disponibilidad comprometida / reservada / bloqueada
* Variantes de ítem con disponibilidad independiente

---

## QUÉ SIGNIFICA "DISPONIBLE" EN CAPA 1

El estado `DISPONIBLE` tiene semántica precisa que depende del contexto operacional del ítem.

### Cuando umbralMinimo = 0

```text
DISPONIBLE ≡ existencia > 0
```

El umbral no está configurado para este ítem.

El sistema solo distingue si hay o no hay existencia.

`umbralMinimo = 0` significa "sin umbral de alerta configurado", no "umbral en cero".

### Cuando umbralMinimo > 0

```text
DISPONIBLE ≡ existencia > umbralMinimo
```

La existencia supera el mínimo operacional configurado para este ítem en este contexto.

La misma existencia física puede generar estados distintos en ítems con umbrales distintos.

### Implicación semántica crítica

`DISPONIBLE` en CAPA 1 no significa:

```text
"hay unidades físicas presentes"
```

Significa:

```text
"la existencia actual supera el contexto operacional mínimo configurado"
```

Un ítem con existencia = 5 y umbralMinimo = 10 está en `BAJO_STOCK`, no `DISPONIBLE`, aunque físicamente existan unidades.

---

## QUÉ SIGNIFICA "BAJO_STOCK"

```text
BAJO_STOCK ≡ existencia > 0 AND existencia ≤ umbralMinimo AND umbralMinimo > 0
```

`BAJO_STOCK` solo es posible cuando el umbral está configurado.

Sin umbral configurado, el sistema no puede derivar `BAJO_STOCK`.

`BAJO_STOCK` es una señal contextual operacional, no un bloqueo.

El operador puede seguir vendiendo ítems en `BAJO_STOCK`.

El sistema informa; no detiene.

---

## QUÉ SIGNIFICA "AGOTADO"

```text
AGOTADO ≡ existencia ≤ 0
```

`AGOTADO` es el único estado que no depende del contexto de umbral.

Es el único estado que deriva exclusivamente de la proyección sobre el log de movimientos.

### Nota sobre existencia negativa

Si se registran salidas sobre disponibilidad ya en cero, `deriveDisponibilidad()` produce un resultado negativo.

El sistema acepta esto como operación causal válida (un ajuste puede ser negativo, una salida puede superar el disponible si el operador así lo registra).

`existencia < 0` también produce `AGOTADO`.

Esto no es un error del modelo: es continuidad operacional bajo override implícito.

La existencia negativa es una señal de divergencia entre lo registrado y la realidad física que requiere reconciliación.

---

## QUÉ PUEDE ALTERAR LA DISPONIBILIDAD OPERACIONAL

En CAPA 1 mínima, la disponibilidad operacional puede cambiar por dos vías:

### 1. Movimientos (heredado de CAPA 0)

* `entrada` → incrementa existencia
* `salida` → decrementa existencia
* `ajuste` → aplica delta firmado sobre existencia

Todo movimiento es causal, inmutable, y forma parte del log permanente.

La disponibilidad operacional es siempre la proyección de estos movimientos.

### 2. Cambio de umbralMinimo (CAPA 1)

Cambiar `umbralMinimo` no altera la existencia.

Pero puede cambiar el estado operacional derivado inmediatamente.

Un ítem con existencia = 8 y umbralMinimo = 5 está `DISPONIBLE`.

Si se cambia umbralMinimo a 10, el mismo ítem pasa a `BAJO_STOCK` sin que ocurra ningún movimiento físico.

**Esta es la característica semántica más importante de CAPA 1:**

```text
el estado operacional puede cambiar
sin que cambie la existencia física
```

---

## QUÉ NO ALTERA LA EXISTENCIA FÍSICA

Las siguientes operaciones no generan movimientos y no modifican la existencia:

* Cambio de `umbralMinimo`
* Cambio de nombre del ítem (`nombre`)
* Cambio de unidad base (`unidadBase`)
* Baja lógica (`eliminado = true`)
* Consulta de disponibilidad
* Proyección de estado (`deriveEstado()`)
* Carga o reconstrucción desde persistencia

La baja lógica merece atención particular:

Cuando un ítem se da de baja (`eliminado = true`), sus movimientos permanecen en el log.

La existencia derivada de ese ítem, calculada sobre su log, no cambia.

Lo que cambia es que el ítem deja de aparecer en las vistas activas del sistema.

Los movimientos de ítems dados de baja son historia operacional válida e inmutable.

---

## CONTEXTO OPERACIONAL TEMPORAL

El `umbralMinimo` es el único elemento de contexto operacional en CAPA 1 mínima.

Tiene las siguientes características temporales:

### Mutabilidad

El operador puede cambiar `umbralMinimo` en cualquier momento.

No hay restricciones de flujo para este cambio.

### Sin trazabilidad propia en implementación actual

En la implementación actual, los cambios de `umbralMinimo` **no generan eventos**.

El `ContextoItem` es un estado mutable que refleja el valor actual, no el historial de cambios.

Esto significa:

* No es posible reconstruir cuándo se configuró el umbral que está activo ahora
* No es posible saber si el umbral cambió entre dos movimientos
* La reconciliación con este estado es más frágil que con los movimientos

Esta es una **deuda semántica conocida** de CAPA 1 mínima.

No bloquea la operación actual pero debe considerarse antes de activar CAPA 2.

### Sin efecto retroactivo

Cambiar `umbralMinimo` no reinterpreta movimientos pasados.

El log de movimientos es inmutable. El umbral es contexto actual aplicado sobre la proyección actual.

No existe "disponibilidad histórica bajo el umbral anterior".

---

## REVERSIBILIDAD

### Movimientos

Los movimientos no son reversibles en el sentido de "deshacer".

Son compensables: una salida incorrecta se compensa con una entrada con causa explícita.

La historia permanece. La corrección es un nuevo evento.

### umbralMinimo

Es completamente reversible: se puede cambiar en cualquier momento sin restricción.

### Baja lógica

En la implementación actual, `eliminado = true` es teóricamente reversible a nivel de datos.

No está expuesta en UI una operación de "reactivar ítem".

Consideración antes de exponer reactivación: ¿el operador necesita entender que el ítem tiene movimientos históricos acumulados antes de reactivarlo?

---

## DEGRADACIÓN OFFLINE

CAPA 1 mínima no agrega dependencias de conectividad sobre CAPA 0.

### Qué funciona offline en CAPA 1

* Consulta de disponibilidad con estados (proyección sobre log local)
* Registro de movimientos con impacto inmediato en estado derivado
* Badge de alertas (proyección local)
* Cambio de umbralMinimo (persistido en localStorage)

### Qué CAPA 0 puede hacer si CAPA 1 no está disponible

Si el `ContextoItem` no pudiera cargarse (localStorage corrupto o ausente):

* Los movimientos siguen siendo válidos
* La disponibilidad numérica sigue siendo proyectable
* Solo se perdería la señalización de estado contextual
* El operador vería números sin estados de alerta

Esta degradación parcial es operacionalmente aceptable: el negocio continúa, la información de alerta se recupera cuando el contexto esté disponible.

---

## LÍMITES EXPLÍCITOS DEL DOMINIO

CAPA 1 mínima implementada **no modela** los siguientes conceptos aunque estén en el glosario del dominio:

### No hay ubicación operacional

Toda la disponibilidad de un ítem es un único número.

No existe distinción entre disponibilidad en bodega y disponibilidad en mostrador.

El operador gestiona mentalmente la ubicación física.

### No hay estados de disponibilidad comprometida

No existe disponibilidad `reservada`, `en tránsito`, `bloqueada`, o `comprometida`.

El flujo operacional actual es:

```text
existencia disponible → salida directa al vender
```

Sin período de reserva previo a materialización.

### No hay variantes de ítem

Un ítem tiene una sola disponibilidad.

Talla S y talla L de una prenda son dos ítems distintos en el sistema, no variantes de un mismo ítem.

### No hay confianza operacional

No existe concepto de cuánto hace que no se valida físicamente un ítem.

La disponibilidad se presenta como proyección sobre el log sin indicador de nivel de certeza.

### No hay señales de presión activas más allá del badge

El badge en SubContextBar es el único mecanismo de presión operacional.

No hay señalización progresiva, no hay umbrales de tiempo, no hay alertas de expiración.

### El umbralMinimo no es un límite bloqueante

El sistema nunca bloquea operaciones porque un ítem esté en `BAJO_STOCK` o `AGOTADO`.

Los estados son señales contextuales, no guardas operacionales.

Esta es la directriz de AP-03 aplicada específicamente al umbral mínimo.

---

## ANTI-PATRONES ESPECÍFICOS DE CAPA 1 MÍNIMA

### AP-CAPA1-01 — TRATAR umbralMinimo COMO LÍMITE BLOQUEANTE

**Cómo aparece:**

Lógica que impide registrar salidas cuando `existencia ≤ umbralMinimo`.

O UI que deshabilita acciones cuando el estado es `BAJO_STOCK` o `AGOTADO`.

**Por qué parece razonable:**

El umbral fue configurado para evitar que el stock baje demasiado. Tiene sentido no dejar vender más.

**Problema real:**

El operador pierde continuidad operacional en situaciones donde tiene información que el sistema no tiene.

Un ítem en `BAJO_STOCK` puede estar a punto de ser repuesto.

Un ítem en `AGOTADO` puede tener unidades físicas no registradas.

El umbral es una señal, no una barrera.

**Dirección correcta:**

El sistema señaliza el estado con visibilidad contextual.

El operador decide con esa información.

El override es siempre posible, con causalidad registrada.

---

### AP-CAPA1-02 — ALMACENAR EL ESTADO EN LUGAR DE DERIVARLO

**Cómo aparece:**

Agregar un campo `estado: EstadoDisponibilidad` al `ItemOperacional` o al `ContextoItem` que se actualiza con cada movimiento o cambio de umbral.

**Por qué parece razonable:**

Parece más eficiente consultar el estado almacenado que recalcularlo.

**Problema real:**

El estado almacenado puede diverger del estado derivado cuando hay movimientos que no actualizaron el campo.

Al reconciliar runtimes o reconstruir desde log, el estado almacenado queda inconsistente.

Viola AP-01 (contador mutable) aplicado al estado.

**Dirección correcta:**

El estado es siempre una proyección:

```text
deriveEstado(deriveDisponibilidad(movimientos, itemId), umbralMinimo)
```

Nunca un campo almacenado directamente.

---

### AP-CAPA1-03 — CONFUNDIR umbralMinimo = 0 CON "ÍTEM SIEMPRE DISPONIBLE"

**Cómo aparece:**

Lógica que trata `umbralMinimo = 0` como "este ítem nunca puede estar en BAJO_STOCK".

O UI que muestra ítems con `umbralMinimo = 0` de forma especial como si estuvieran exentos de alerta.

**Por qué parece razonable:**

Si el umbral es cero, parece que el operador dice "no me importa cuánto quede".

**Problema real:**

`umbralMinimo = 0` significa "umbral no configurado aún", no "acepto cualquier cantidad".

La semántica es: el operador no ha establecido un umbral de alerta para este ítem todavía.

Tratarlo como "exento de alerta permanentemente" puede silenciar señales importantes cuando el operador sí quiere configurar un umbral pero aún no lo hizo.

**Dirección correcta:**

`umbralMinimo = 0` → umbral no configurado → el sistema solo señaliza `AGOTADO` (existencia ≤ 0).

No hay estado `BAJO_STOCK` posible sin umbral configurado.

---

### AP-CAPA1-04 — INCLUIR ÍTEMS DADOS DE BAJA EN ALERTAS Y DISPONIBILIDAD ACTIVA

**Cómo aparece:**

El badge de alertas en SubContextBar cuenta ítems con `eliminado = true`.

O las vistas de disponibilidad muestran ítems dados de baja como si estuvieran activos.

**Por qué parece razonable:**

El ítem tiene movimientos en el log. Su disponibilidad derivada puede ser cero o negativa, generando estado `AGOTADO`. Parece una alerta válida.

**Problema real:**

El ítem fue dado de baja operacionalmente. Su estado ya no es relevante para la operación activa.

Incluirlo en alertas genera ruido operacional y puede confundir al operador.

**Dirección correcta:**

Las vistas activas, el badge de alertas, y cualquier proyección de estado operacional filtran ítems con `eliminado = true`.

Los movimientos de ítems dados de baja permanecen en el log para trazabilidad histórica.

Son historia, no estado activo.

---

## TENSIONES SEMÁNTICAS ACTIVAS EN CAPA 1 MÍNIMA

### T-CAPA1-01 — UMBRAL COMO SEÑAL vs UMBRAL COMO NÚMERO DE REORDEN

**Tensión:**

El operador puede interpretar `umbralMinimo` como "avísame cuando quede menos de N unidades" (señal contextual) o como "el mínimo exacto que debo mantener en stock" (número de reorden operacional).

**Dónde aparece:**

Cuando el operador configura un umbral y espera que el sistema le ayude a decidir cuándo reponer.

**Consecuencia semántica:**

Si el umbral es señal contextual: el sistema informa, el operador decide cuándo y cuánto reponer.

Si el umbral es número de reorden: el operador espera que el sistema dispare acciones (pedidos, alertas avanzadas) cuando se alcanza. Esto requiere CAPA 2 o superior.

**Criterio de navegación en CAPA 1 mínima:**

El umbral es señal contextual.

La UI debe comunicar esto explícitamente: "stock mínimo para alerta", no "punto de reorden".

No hay acciones automáticas al alcanzar el umbral en CAPA 1 mínima.

**Señal de desequilibrio:**

El operador pregunta "¿por qué el sistema no me avisó cuando quedaron X unidades?" porque espera notificación activa, no solo badge pasivo.

---

### T-CAPA1-02 — BAJA LÓGICA vs VISIBILIDAD DEL HISTORIAL

**Tensión:**

Dar de baja un ítem elimina su presencia de las vistas activas (operacionalmente correcto) pero sus movimientos históricos permanecen en el log y pueden ser relevantes para la trazabilidad (semánticamente correcto).

**Dónde aparece:**

Cuando el operador da de baja un ítem que tuvo muchos movimientos, y luego necesita entender por qué la caja cerró con ciertos números.

O cuando el mismo ítem se quiere "reactivar" más adelante con historia acumulada.

**Consecuencia semántica:**

La baja lógica es una decisión sobre visibilidad operacional activa, no sobre integridad del log.

El log de movimientos no tiene concepto de "ítem activo" — tiene eventos con `itemId`.

La baja solo afecta qué se muestra; no qué se conserva.

**Criterio de navegación:**

Los movimientos de ítems dados de baja son accesibles para auditoría y trazabilidad aunque no aparezcan en vistas activas.

Si una vista de log de movimientos muestra todos los movimientos (histórico completo), debe incluir movimientos de ítems dados de baja, identificando el ítem como dado de baja.

---

### T-CAPA1-03 — MUTABILIDAD DE umbralMinimo vs TRAZABILIDAD DE CONTEXTO

**Tensión:**

El `umbralMinimo` es completamente mutable sin generar eventos (simplicidad operacional) versus la necesidad de saber qué umbral estaba activo en un momento pasado (trazabilidad de contexto).

**Dónde aparece:**

Cuando el operador revisa el log de movimientos de hace dos semanas y quiere entender por qué un ítem marcó `BAJO_STOCK` en ese momento.

El log muestra los movimientos con sus cantidades.

Pero el `umbralMinimo` actual puede haber cambiado desde entonces.

No es posible recalcular el estado `BAJO_STOCK` histórico con el umbral histórico porque no hay registro del umbral histórico.

**Consecuencia semántica:**

CAPA 1 mínima tiene trazabilidad completa de existencia (log de movimientos) pero trazabilidad parcial de estado operacional (el umbral es un estado presente, no un historial de estados).

Esto es aceptable en CAPA 1 mínima porque el valor operacional de los estados es presente, no histórico.

**Señal de que la tensión se volvió problema real:**

El operador necesita reconstruir qué estado tenía un ítem en una fecha pasada específica para resolver una discrepancia operacional.

Si esto ocurre con frecuencia, es una señal de activación de capacidades de trazabilidad de contexto (CAPA 2+).

**Criterio de navegación:**

En CAPA 1 mínima: aceptar que el estado histórico no es exactamente reconstruible.

Lo que sí es reconstruible: la existencia en cualquier momento pasado (proyección sobre log de movimientos hasta esa fecha).

Lo que no es reconstruible: el estado operacional (`BAJO_STOCK` / `DISPONIBLE`) en un momento pasado, porque el umbral puede haber cambiado.

---

## INVARIANTES DE CAPA 1 MÍNIMA

Invariantes que deben mantenerse mientras CAPA 1 mínima esté activa:

```text
I-C1-01  El estado operacional es siempre una proyección.
         Nunca un campo almacenado ni calculado fuera de deriveEstado().

I-C1-02  umbralMinimo = 0 significa "sin umbral configurado",
         no "umbral de valor cero".
         La UI debe reflejar esta semántica.

I-C1-03  Los estados BAJO_STOCK y AGOTADO son señales.
         No bloquean operaciones.
         No deshabilitan acciones del operador.

I-C1-04  Los ítems con eliminado = true no participan
         en ningún cálculo de estado activo ni en alertas.
         Sus movimientos permanecen en el log sin modificación.

I-C1-05  CAPA 0 opera íntegramente si ContextoItem no está disponible.
         La proyección de existencia no depende del umbral.

I-C1-06  El estado AGOTADO (existencia ≤ 0) es independiente del umbral.
         Es el único estado derivable sin contexto de CAPA 1.
```

---

## LO QUE CAPA 1 MÍNIMA NO ES

Para evitar expansión semántica no planificada, se define explícitamente lo que CAPA 1 mínima no es ni debe ser tratada como:

**No es un sistema de alertas activas.**

El badge es pasivo: el operador debe mirarlo.

No hay notificaciones push, no hay interrupciones, no hay flujos disparados por umbral.

**No es un sistema de reorden automático.**

El umbral no genera órdenes de compra, no genera pedidos, no automatiza ningún flujo externo.

**No es un sistema de ubicaciones.**

No hay distinción entre bodega, mostrador, tránsito ni ningún otro punto operacional.

**No es un sistema de reservas.**

No hay disponibilidad comprometida, reservada ni apartada.

La existencia disponible para vender es la existencia total proyectada.

**No es un sistema de variantes.**

Cada ítem es una unidad operacional indivisible.

Las variantes son ítems distintos, no dimensiones del mismo ítem.

**No es CAPA 2.**

No tiene confianza operacional, no tiene señales de presión avanzadas, no tiene arbitraje bajo escasez, no tiene modo degradado formalizado.

---

## CRITERIOS PARA EXPANDIR CAPA 1

Antes de agregar cualquier funcionalidad sobre CAPA 1 mínima, verificar:

1. ¿El dolor operacional que justifica la expansión ya existe en producción real?
2. ¿La expansión respeta los invariantes I-C1-01 a I-C1-06?
3. ¿La expansión cabe en CAPA 1 (contexto operacional) o corresponde a CAPA 2 (presión operacional)?
4. ¿La implementación actual de CAPA 0 sigue funcionando íntegramente después de la expansión?
5. ¿La nueva funcionalidad es reversible sin pérdida del log de movimientos?

Si alguna respuesta es negativa o incierta, consolidar la capa actual antes de expandir.

---