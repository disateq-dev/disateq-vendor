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
