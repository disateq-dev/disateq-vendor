# DISATEQ VENDOR™ — INVENTORY ARCHITECTURE FOUNDATIONS

## Estado

Documento fundacional en consolidación.

Fase actual:

```text
MODELADO SEMÁNTICO OPERACIONAL
DEL DOMINIO INVENTARIOS
```

Objetivo:

Consolidar los principios arquitectónicos, operacionales y filosóficos que regirán el futuro núcleo INVENTARIOS de DISATEQ VENDOR™.

---

## Índice de navegación

### Principios fundacionales (1–20)

| Sección | Título | Núcleo semántico |
|---|---|---|
| [1](#1-principio-raíz) | Principio raíz | Inventario ≠ stock · coordinación de disponibilidad viva |
| [2](#2-filosofía-operacional) | Filosofía operacional | Continuidad responsable · entre rigidez ERP y caos |
| [3](#3-movimiento-como-verdad-persistente) | Movimiento como verdad persistente | Eventos inmutables como fuente de verdad |
| [4](#4-disponibilidad-contextual) | Disponibilidad contextual | Disponibilidad ≠ existencia · proyección por contexto |
| [5](#5-almacén-como-contexto-operacional) | Almacén como contexto operacional | Ubicación como dimensión de disponibilidad |
| [6](#6-ownership-operacional) | Ownership operacional | Responsabilidad contextual de la disponibilidad |
| [7](#7-reservas-operacionales) | Reservas operacionales | Compromiso previo a materialización |
| [8](#8-inventario-como-sistema-temporal) | Inventario como sistema temporal | Tiempo como dimensión operacional |
| [9](#9-materialización-operacional) | Materialización operacional | Transición de compromiso a movimiento definitivo |
| [10](#10-edge-first-operational-runtime) | Edge-first operational runtime | Autonomía de runtime sin conectividad |
| [11](#11-nube-como-capa-de-coordinación) | Nube como capa de coordinación | Sincronización eventual, no fuente de verdad primaria |
| [12](#12-precisión-operacional-y-tributaria) | Precisión operacional y tributaria | Exactitud operacional vs exactitud contable |
| [13](#13-unidades-operacionales-flexibles) | Unidades operacionales flexibles | Presentaciones múltiples sin modelo rígido |
| [14](#14-transformaciones-operacionales) | Transformaciones operacionales | Causalidad insumo → derivado |
| [15](#15-confianza-operacional) | Confianza operacional | Nivel de certeza como atributo de disponibilidad |
| [16](#16-reconciliación-física) | Reconciliación física | Convergencia progresiva por conteo físico |
| [17](#17-prioridad-operacional) | Prioridad operacional | Arbitraje contextual bajo escasez |
| [18](#18-reposiciones) | Reposiciones | Reposición como evento causal trazable |
| [19](#19-inventario-como-sistema-humano) | Inventario como sistema humano | El operador humano como actor central |
| [20](#20-complejidad-interna--simplicidad-operacional) | Complejidad interna + simplicidad operacional | Complejidad interna controlada, superficie operacional simple |

### Marco de validación (21–25)

| Sección | Título | Propósito |
|---|---|---|
| [21](#21-validación-operacional-semántica) | Validación operacional semántica | Criterios para validar que el modelo respeta la filosofía |
| [22](#22-escenarios-operacionales-canónicos) | Escenarios operacionales canónicos | Estructura canónica de escenarios de comportamiento |
| [23](#23-principios-de-validación) | Principios de validación | Reglas de validación transversal del dominio |
| [24](#24-escenarios-prioritarios-iniciales) | Escenarios prioritarios iniciales | Escenarios críticos para la primera fase |
| [25](#25-transición-de-etapa) | Transición de etapa | Criterios para avanzar de modelado a implementación |

### Escenarios canónicos (26–42)

| Escenario | Situación central |
|---|---|
| [26](#26-escenario-canónico--venta-offline-prolongada-con-divergencia-posterior) | Venta offline prolongada con divergencia posterior |
| [27](#27-escenario-canónico--reserva-concurrente-contextual) | Reserva concurrente contextual |
| [28](#28-escenario-canónico--reconciliación-física-después-de-divergencia-operacional) | Reconciliación física después de divergencia operacional |
| [29](#29-escenario-canónico--transformación-operacional-y-fraccionamiento) | Transformación operacional y fraccionamiento |
| [30](#30-escenario-canónico--expiración-bajo-presión-operacional) | Expiración bajo presión operacional |
| [31](#31-escenario-canónico--continuidad-operacional-bajo-baja-confianza) | Continuidad operacional bajo baja confianza |
| [32](#32-escenario-canónico--arbitraje-operacional-bajo-escasez) | Arbitraje operacional bajo escasez |
| [33](#33-escenario-canónico--devolución-posterior-a-divergencia-operacional) | Devolución posterior a divergencia operacional |
| [34](#34-escenario-canónico--sincronización-diferida-con-causalidad-cruzada) | Sincronización diferida con causalidad cruzada |
| [35](#35-escenario-canónico--materialización-diferida-bajo-continuidad-operacional) | Materialización diferida bajo continuidad operacional |
| [36](#36-escenario-canónico--prioridad-operacional-dinámica-bajo-contexto-cambiante) | Prioridad operacional dinámica bajo contexto cambiante |
| [37](#37-escenario-canónico--reserva-expirada-con-continuidad-operacional-activa) | Reserva expirada con continuidad operacional activa |
| [38](#38-escenario-canónico--conteo-físico-parcial-bajo-operación-activa) | Conteo físico parcial bajo operación activa |
| [39](#39-escenario-canónico--transferencia-operacional-en-tránsito-con-sincronización-diferida) | Transferencia operacional en tránsito con sincronización diferida |
| [40](#40-escenario-canónico--operación-en-contingencia-con-reconciliación-diferida) | Operación en contingencia con reconciliación diferida |
| [41](#41-escenario-canónico--override-operacional-contextual-bajo-presión-crítica) | Override operacional contextual bajo presión crítica |
| [42](#42-escenario-canónico--reinterpretación-operacional-posterior-a-nueva-evidencia) | Reinterpretación operacional posterior a nueva evidencia |

### Anti-patrones del dominio (43)

| Sección | Contenido | Para qué usarla |
|---|---|---|
| [43](#43-anti-patrones-del-dominio-inventarios) | AP-01 a AP-12 — trampas de diseño con apariencia de solución | Reconocer decisiones incorrectas antes de tomarlas |
| [44](#44-preguntas-de-validación-del-dominio) | PV-01 a PV-32 — preguntas de validación por grupo temático | Verificar que un diseño o implementación respeta la filosofía del dominio |
| [45](#45-mapa-de-relaciones-entre-principios) | Árbol de derivación · clusters · refuerzos · tensiones · transversales | Navegar el sistema de principios como estructura coherente |
| [46](#46-criterios-de-completitud-del-dominio) | 5 dimensiones · estado actual · umbral mínimo para implementación · criterios de revisión | Determinar cuándo el modelo semántico está listo para implementar |

---

## Documentos relacionados

| Documento | Propósito |
|---|---|
| `inventory-architecture-foundations.md` | Principios filosóficos · Escenarios canónicos de comportamiento · Invariantes por escenario |
| `inventory-operational-evolution.md` | Capas evolutivas · Protocolo de decisión · Tensiones arquitectónicas · Glosario operacional |

---

# 1. PRINCIPIO RAÍZ

## INVENTARIO NO ES STOCK

Inventario NO debe modelarse como:

```text
conteo estático
```

Sino como:

```text
coordinación de disponibilidad operacional viva
```

El sistema debe priorizar:

* continuidad operacional
* resiliencia
* contexto operacional
* disponibilidad contextual
* sincronización progresiva
* reconciliación
* trazabilidad
* operación humana real

---

# 2. FILOSOFÍA OPERACIONAL

## CONTINUIDAD RESPONSABLE

DISATEQ NO debe caer en:

### Rigidez ERP extrema

Ni tampoco en:

### Flexibilidad caótica sin control

Dirección correcta:

```text
continuidad operacional
+
trazabilidad fuerte
+
reconciliación progresiva
+
responsabilidad contextual
```

La operación debe poder continuar incluso bajo:

* degradación
* sincronización parcial
* divergencias temporales
* conectividad imperfecta
* contingencias

SIN perder:

* causalidad
* auditoría
* responsabilidad
* coherencia futura

---

# 3. MOVIMIENTO COMO VERDAD PERSISTENTE

## PRINCIPIO CENTRAL

Persistir principalmente:

* movimientos
* eventos operacionales
* intenciones
* reservas
* transformaciones
* reconciliaciones

NO persistir únicamente:

```text
stock absoluto rígido
```

---

## El estado debe derivarse

Desde:

* movimientos
* reservas
* ownership
* sincronización
* contexto
* transformaciones
* reconciliaciones

Derivar:

* disponibilidad
* estado operacional
* confianza operacional
* materializaciones
* proyecciones

---

# 4. DISPONIBILIDAD CONTEXTUAL

## DISPONIBILIDAD ≠ EXISTENCIA

La disponibilidad operacional depende de:

* reservas activas
* tránsito
* preparación
* sincronización
* prioridad operacional
* ownership contextual
* transformaciones
* confianza operacional
* contexto runtime

---

## Ejemplo

```text
Existencia física: 100
```

Pero:

* reservado: 20
* preparación: 10
* tránsito: 15
* dañado: 5

Disponibilidad operacional real:

```text
50
```

---

# 5. ALMACÉN COMO CONTEXTO OPERACIONAL

## ALMACÉN NO ES SOLO ESPACIO FÍSICO

Debe modelarse como:

```text
contexto operacional
 de disponibilidad y movimiento
```

Puede representar:

* tienda
* depósito
* tránsito
* preparación
* devolución
* contingencia
* runtime móvil
* dark store
* producción
* cuarentena

---

# 6. OWNERSHIP OPERACIONAL

## PRINCIPIO

Ownership NO significa necesariamente propiedad física.

Significa:

```text
capacidad operacional contextual
sobre determinada disponibilidad
```

---

## Características

El ownership puede ser:

* temporal
* parcial
* contextual
* distribuido
* contingente
* delegado

---

# 7. RESERVAS OPERACIONALES

## RESERVA

Una reserva NO es:

```text
descuento definitivo de stock
```

Sino:

```text
compromiso operacional temporal
sobre disponibilidad contextual
```

---

## Estados posibles

* ACTIVE
* PREPARING
* CONFIRMED
* CANCELLED
* EXPIRED
* RECONCILING
* CONTINGENCY

---

# 8. INVENTARIO COMO SISTEMA TEMPORAL

El inventario debe modelarse también como:

```text
sistema temporal operacional
```

Importan:

* expiración
* ventanas temporales
* reservas
* aging
* sincronización
* reconciliación
* disponibilidad futura
* presión operacional

---

# 9. MATERIALIZACIÓN OPERACIONAL

## PRINCIPIO

La verdad persistente vive en eventos y movimientos.

Pero el runtime necesita:

```text
estado materializado acelerado
```

Para preservar:

* velocidad operacional
* continuidad runtime
* respuesta inmediata
* operación edge

---

## Posibles materializaciones

* snapshots operacionales
* disponibilidad actual
* reservas activas
* ownership contextual
* preparación
* tránsito
* proyecciones

---

# 10. EDGE-FIRST OPERATIONAL RUNTIME

## PRINCIPIO

El desktop NO debe comportarse como:

```text
cliente tonto conectado
```

Sino como:

```text
runtime operacional soberano parcial
```

---

## Debe soportar

* operación offline
* persistencia local
* sincronización diferida
* degradación controlada
* continuidad local
* scanner
* impresión
* teclado
* runtime vivo

---

# 11. NUBE COMO CAPA DE COORDINACIÓN

La nube NO debe ser dependencia absoluta.

Debe funcionar principalmente como:

* coordinación
* consolidación
* observabilidad
* analytics
* sincronización
* backups
* integración
* administración global

---

# 12. PRECISIÓN OPERACIONAL Y TRIBUTARIA

## PRINCIPIO CRÍTICO

Separar:

### Operación humana

De:

### Precisión matemática interna

Y de:

### Representación tributaria

---

## Ejemplo

```text
3 soles de queso
```

El operador trabaja sobre:

```text
valor operacional simple
```

Mientras internamente el sistema mantiene:

* precisión monetaria segura
* peso exacto
* cálculo interno consistente
* trazabilidad

Y tributariamente representa:

* subtotal SUNAT
* IGV
* redondeo normativo
* CPE compatible

---

# 13. UNIDADES OPERACIONALES FLEXIBLES

La unidad de inventario NO siempre coincide con:

```text
la unidad operacional humana
```

Ejemplos:

* peso variable
* venta por valor monetario
* fracciones
* gramajes
* cortes aproximados
* presentaciones
* conversiones

---

# 14. TRANSFORMACIONES OPERACIONALES

## PRINCIPIO

Transformaciones representan:

```text
movimientos compuestos
que alteran disponibilidad operacional
```

---

## Ejemplos

* recetas
* producción ligera
* combos
* packs
* ensamblaje
* conversión
* derivados
* preparación

---

# 15. CONFIANZA OPERACIONAL

## DISPONIBILIDAD

NO toda disponibilidad posee el mismo nivel de certeza.

Debe existir noción contextual de:

```text
confianza operacional
```

---

## Factores posibles

* tiempo desde sincronización
* cercanía runtime
* historial operacional
* reconciliación reciente
* calidad sync
* validación física

---

# 16. RECONCILIACIÓN FÍSICA

## PRINCIPIO

Las diferencias físicas NO deben tratarse automáticamente como corrupción.

La reconciliación debe entenderse como:

```text
proceso operacional natural
```

---

## IMPORTANTE

NO sobrescribir brutalmente:

```text
stock = nuevo valor
```

Preferir:

```text
eventos de reconciliación
```

Para preservar:

* trazabilidad
* temporalidad
* causalidad
* auditoría

---

# 17. PRIORIDAD OPERACIONAL

Cuando múltiples operaciones compiten por disponibilidad:

El sistema debe soportar:

```text
arbitraje operacional contextual
```

---

## Posibles prioridades

* temporal
* presencial
* delivery
* preparación
* contingencia
* autorización
* runtime local

---

# 18. REPOSICIONES

## PRINCIPIO

La reposición NO es solo transferencia física.

Es:

```text
preservación de continuidad operacional futura
```

---

## Depende de

* presión operacional
* rotación
* disponibilidad futura
* contexto físico
* flujo humano
* sincronización
* preparación

---

# 19. INVENTARIO COMO SISTEMA HUMANO

## PRINCIPIO

El sistema NO debe sentirse como:

```text
mecanismo policial
```

Pero tampoco perder:

* responsabilidad
* trazabilidad
* seguimiento
* auditoría

---

## Dirección correcta

```text
flexibilidad operacional
+
trazabilidad fuerte
+
responsabilidad contextual
```

---

# 20. COMPLEJIDAD INTERNA + SIMPLICIDAD OPERACIONAL

## PRINCIPIO CENTRAL

La sofisticación debe vivir:

```text
en la arquitectura
```

NO en:

```text
la carga cognitiva del operador
```

---

## Objetivo permanente

Permitir:

* crecimiento progresivo
* capacidades avanzadas
* distribución
* sincronización
* complejidad operacional

SIN romper:

* continuidad humana
* velocidad operacional
* ergonomía
* simplicidad runtime

---

# CONCLUSIÓN PROVISIONAL

DISATEQ INVENTARIOS empieza a consolidarse como:

```text
motor distribuido de continuidad operacional física
```

Más que como:

```text
módulo tradicional de stock
```

La arquitectura emergente prioriza:

* continuidad operacional resiliente
* edge runtime
* sincronización progresiva
* disponibilidad contextual
* reconciliación
* precisión interna
* flexibilidad humana
* responsabilidad contextual
* trazabilidad fuerte
* simplicidad operacional

---

# 21. VALIDACIÓN OPERACIONAL SEMÁNTICA

## OBJETIVO

La siguiente etapa del dominio INVENTARIOS NO busca todavía:

* arquitectura runtime final
* sincronización definitiva
* modelos persistentes finales
* APIs
* tablas complejas
* UX final

El objetivo ahora es:

```text
tensionar la semántica operacional
contra escenarios reales de operación
```

Para:

* detectar contradicciones
* evitar colapso ERP clásico
* validar coherencia contextual
* consolidar invariantes reales
* refinar límites conceptuales
* validar comportamiento bajo presión operacional

---

# 22. ESCENARIOS OPERACIONALES CANÓNICOS

Los escenarios canónicos deben utilizarse para validar:

* continuidad operacional
* reconciliación contextual
* disponibilidad usable
* arbitraje operacional
* presión operacional
* confianza operacional
* temporalidad
* comportamiento edge-first

## Estructura recomendada

Cada escenario debe analizar:

* ESCENARIO
* CONTEXTO
* TENSIÓN OPERACIONAL
* RIESGO ERP A EVITAR
* COMPORTAMIENTO ESPERADO
* INVARIANTES
* PUNTOS ABIERTOS

---

# 23. PRINCIPIOS DE VALIDACIÓN

La validación semántica debe priorizar:

* operación humana real
* continuidad operacional
* causalidad fuerte
* reconciliación progresiva
* degradación controlada
* simplicidad operacional externa

Evitar:

* academicismo artificial
* sobre-DDD
* complejidad ceremonial
* centralización rígida
* snapshots absolutos
* bloqueo operacional prematuro

---

# 24. ESCENARIOS PRIORITARIOS INICIALES

Escenarios iniciales sugeridos:

* venta offline prolongada
* divergencia post-sincronización
* reserva concurrente contextual
* arbitraje por prioridad operacional
* reconciliación física parcial
* expiración bajo compromiso activo
* continuidad bajo baja confianza
* transformación/fraccionamiento
* devolución posterior a divergencia
* sincronización diferida prolongada

---

# 25. TRANSICIÓN DE ETAPA

La siguiente transición natural del dominio será:

```text
semántica consolidada
→ validación operacional
→ modelo operacional mínimo implementable
```

Todavía NO corresponde avanzar a:

* runtime definitivo
* sincronización técnica final
* arquitectura distribuida definitiva
* WMS avanzado
* tablas persistentes finales
* APIs definitivas
* UX operacional final

hasta estabilizar suficientemente la semántica operacional contextual.

---

# 26. ESCENARIO CANÓNICO — VENTA OFFLINE PROLONGADA CON DIVERGENCIA POSTERIOR

## ESCENARIO

Un runtime desktop continúa operando localmente durante una caída prolongada de conectividad.

Durante ese periodo:

* se realizan ventas
* existen reservas activas
* algunos productos poseen alta rotación
* ocurren transformaciones operacionales
* existen otros runtimes operando simultáneamente

La sincronización ocurre posteriormente.

Al reconectarse:

* aparecen divergencias
* diferencias físicas
* conflictos de disponibilidad
* presión operacional acumulada

---

## CONTEXTO

El sistema debe preservar:

* continuidad operacional humana
* operación edge-first
* velocidad operacional
* trazabilidad fuerte
* causalidad operacional

SIN asumir:

```text
consistencia global inmediata
```

---

## TENSIÓN OPERACIONAL

La causalidad acumulada localmente puede colisionar con causalidad acumulada en otros runtimes durante el mismo periodo offline.

La sincronización tardía no puede asumir que la verdad local es secundaria ni que la verdad remota es autoritativa.

Ambos runtimes operaron legítimamente con la información disponible en su contexto.

---

## RIESGO ERP A EVITAR

* Tratar la sincronización como "servidor siempre gana"
* Tratar la sincronización como "último escribe gana"
* Revertir o rechazar operaciones offline válidas al reconectar
* Forzar consistencia inmediata que bloquee la operación al reconectar
* Sobrescribir disponibilidad local con estado remoto sin preservar la delta como evento

---

## COMPORTAMIENTO ESPERADO

* Los movimientos offline se integran como eventos con causalidad explícita y timestamp de contexto
* Las divergencias se expresan como eventos de reconciliación, no como correcciones destructivas
* El operador recibe contexto operacional sobre las divergencias sin bloqueo de la operación
* La disponibilidad derivada post-sincronización refleja la suma de causalidades integradas
* Los conflictos irreconciliables automáticamente son expuestos para decisión humana con contexto completo

---

## INVARIANTES

* Toda operación offline con causalidad válida preserva su trazabilidad al sincronizar
* La sincronización no cancela compromisos operacionales locales ya materializados
* Las divergencias de disponibilidad se expresan como eventos de reconciliación, no sobrescrituras
* La causalidad tiene timestamp de contexto operacional, no solo timestamp de sincronización

---

## PUNTOS ABIERTOS

* Criterios de arbitraje cuando dos runtimes vendieron la misma unidad durante el periodo offline
* Ventana máxima de divergencia aceptable antes de requerir intervención humana obligatoria
* Tratamiento de reservas activas en un runtime que colisionan con ventas materializadas en otro

---

# 27. ESCENARIO CANÓNICO — RESERVA CONCURRENTE CONTEXTUAL

## ESCENARIO

Múltiples operaciones intentan utilizar simultáneamente una misma disponibilidad operacional.

Ejemplos posibles:

* venta presencial
* pedido delivery
* preparación interna
* reserva temporal
* contingencia offline
* runtime remoto parcialmente sincronizado

La existencia física total NO alcanza para satisfacer todas las presiones operacionales simultáneamente.

---

## CONTEXTO

La tensión NO debe modelarse únicamente como:

```text
quién descuenta primero
```

El contexto operacional de cada presión es determinante para el arbitraje correcto.

---

## TENSIÓN OPERACIONAL

El orden temporal de llegada no define necesariamente la prioridad operacional correcta.

Una venta presencial puede ser contextualmente menos prioritaria que una preparación ya comprometida para despacho inmediato.

El sistema no tiene visibilidad perfecta del contexto operacional de cada presión en el momento del arbitraje.

---

## RIESGO ERP A EVITAR

* Resolver puramente por timestamp de registro sin contexto
* Bloquear todas las operaciones concurrentes excepto la primera que "ganó"
* Ignorar el contexto operacional de cada presión al arbitrar
* Cancelar silenciosamente reservas secundarias sin notificación ni trazabilidad

---

## COMPORTAMIENTO ESPERADO

* El conflicto de disponibilidad se expresa con contexto operacional completo de cada presión
* El arbitraje considera tipo de operación, canal y contexto, no solo orden temporal
* Las operaciones postergadas o rechazadas mantienen su intención registrada con causalidad
* La operación primaria no se bloquea mientras se resuelve el conflicto secundario
* Las resoluciones de arbitraje generan eventos trazables con criterio de decisión explícito

---

## INVARIANTES

* Toda reserva posee causalidad trazable, incluso si es rechazada o postergada posteriormente
* El arbitraje no destruye la intención operacional original de ninguna de las partes
* La resolución del conflicto genera evento de arbitraje con criterio explícito, no corrección silenciosa
* Las reservas rechazadas por conflicto no desaparecen; permanecen como intenciones no satisfechas trazables

---

## PUNTOS ABIERTOS

* Criterios de prioridad configurables por tipo de operación y canal
* Notificación contextual al operador sobre conflicto de disponibilidad antes de bloqueo operacional
* Tratamiento de reservas concurrentes en runtimes parcialmente desconectados entre sí

---

# 28. ESCENARIO CANÓNICO — RECONCILIACIÓN FÍSICA DESPUÉS DE DIVERGENCIA OPERACIONAL

## ESCENARIO

Después de un periodo de operación normal y múltiples movimientos operacionales:

* ventas
* reservas
* devoluciones
* transformaciones
* sincronizaciones parciales
* operación offline

Se realiza un conteo físico.

El resultado físico NO coincide con:

```text
la disponibilidad operacional derivada actual
```

---

## CONTEXTO

El conteo físico introduce nueva evidencia operacional real.

Esta evidencia NO puede ser ignorada.

Pero aplicarla como verdad absoluta destruiría la causalidad acumulada operacionalmente válida.

La diferencia puede tener causas conocidas o desconocidas.

---

## TENSIÓN OPERACIONAL

El conteo físico y la disponibilidad derivada representan dos fuentes de verdad con naturaleza diferente.

Ninguna de las dos es absolutamente autoritativa sobre la otra.

La diferencia puede deberse a causas operacionales legítimas no registradas, mermas reales, errores de registro o divergencias de sincronización.

Forzar una a prevalecer sobre la otra sin contexto destruye trazabilidad o ignora evidencia real.

---

## RIESGO ERP A EVITAR

* Sobrescribir la disponibilidad derivada con el resultado del conteo físico sin preservar la delta como evento
* Tratar automáticamente la diferencia como error del sistema
* Ignorar el conteo físico porque contradice el estado derivado
* Aplicar el conteo físico como snapshot absoluto que borra la causalidad acumulada

---

## COMPORTAMIENTO ESPERADO

* El conteo físico genera un evento de reconciliación con la delta explícita entre físico y derivado
* La diferencia se registra como observación operacional con contexto de momento y responsable
* El operador recibe contexto operacional suficiente para decidir el tratamiento de la diferencia
* La causalidad acumulada previo al conteo permanece trazable independientemente del resultado
* Las diferencias atribuibles a causas conocidas pueden documentarse con causalidad explícita

---

## INVARIANTES

* El conteo físico no sobrescribe; genera evento de reconciliación con delta explícita
* La causalidad anterior al conteo permanece trazable en el historial operacional
* La diferencia entre sistema y físico es evidencia operacional, no error inmediato a corregir destructivamente
* El tratamiento de la diferencia genera evento con responsabilidad contextual explícita

---

## PUNTOS ABIERTOS

* Tratamiento de diferencias atribuibles a causas operacionales conocidas versus desconocidas
* Frecuencia y cobertura recomendada de conteos parciales bajo operación activa
* Criterios para diferencias dentro de tolerancia operacional aceptable versus diferencias que requieren acción

---

# 29. ESCENARIO CANÓNICO — TRANSFORMACIÓN OPERACIONAL Y FRACCIONAMIENTO

## ESCENARIO

Una operación transforma disponibilidad existente en nuevas capacidades operacionales.

Ejemplos posibles:

* fraccionamiento
* corte
* pesado variable
* conversión
* empaquetado
* preparación
* producción ligera
* armado de combos
* derivados operacionales

La operación NO representa simplemente:

```text
entrada/salida tradicional
```

---

## CONTEXTO

La transformación altera la naturaleza de la disponibilidad operacional.

Los insumos dejan de estar disponibles en su forma original.

Los derivados emergen con disponibilidad propia.

El proceso puede ser parcial, variable o con rendimiento incierto.

---

## TENSIÓN OPERACIONAL

La transformación no es atómica desde la perspectiva operacional humana.

Existe un periodo de preparación donde los insumos ya no están disponibles en su forma original pero los derivados aún no existen operacionalmente.

El rendimiento puede ser variable: el derivado no necesariamente coincide en cantidad con lo esperado.

Si la transformación es interrumpida o fallida, los insumos pueden ser parcialmente recuperables.

---

## RIESGO ERP A EVITAR

* Modelar la transformación como transacción atómica que consume insumos e instantáneamente genera derivados
* Bloquear insumos indefinidamente sin visibilidad del estado de transformación
* Ignorar el periodo de preparación y transformación parcial
* Asumir rendimiento fijo cuando el proceso tiene variabilidad operacional real

---

## COMPORTAMIENTO ESPERADO

* La transformación tiene estados explícitos: intención → preparación → materialización
* Los insumos entran en estado de transformación: comprometidos pero no definitivamente consumidos
* Los derivados emergen progresivamente con disponibilidad propia a medida que se materializan
* La cancelación parcial es posible con restitución de insumos no consumidos y registro de causalidad
* El rendimiento variable genera evento con delta entre esperado y real

---

## INVARIANTES

* La transformación tiene causalidad trazable desde insumo hasta derivado
* El periodo de transformación genera estado intermedio visible, no una brecha de disponibilidad
* La cancelación parcial no destruye causalidad; genera eventos de reversión con contexto
* El rendimiento real versus esperado queda registrado como evidencia operacional

---

## PUNTOS ABIERTOS

* Modelos de conversión con peso/volumen variable o rendimiento probabilístico
* Transformaciones anidadas donde un derivado es insumo de otra transformación
* Tratamiento de mermas operacionales en transformaciones con pérdida esperada

---

# 30. ESCENARIO CANÓNICO — EXPIRACIÓN BAJO PRESIÓN OPERACIONAL

## ESCENARIO

Determinada disponibilidad operacional se aproxima a expiración mientras existen:

* reservas activas
* compromiso operacional
* presión comercial
* continuidad operacional requerida
* sincronización parcial
* divergencia contextual entre runtimes

La expiración afecta:

* confianza operacional
* prioridad utilizable
* arbitraje operacional
* continuidad futura

SIN necesariamente convertir inmediatamente la disponibilidad en:

```text
inexistente absoluta
```

---

## CONTEXTO

La expiración no es un evento binario instantáneo desde la perspectiva operacional.

Existe una zona de presión temporal donde la disponibilidad es técnicamente próxima a expirar pero operacionalmente aún relevante.

El sistema debe manejar esta zona de presión con contexto, no con bloqueo automático.

---

## TENSIÓN OPERACIONAL

La disponibilidad con expiración próxima tiene valor operacional real que puede justificar su uso prioritario antes de perderlo.

Pero comprometer disponibilidad expirada o próxima a expirar sin contexto puede generar problemas operacionales posteriores.

El sistema no puede bloquear automáticamente sin destruir continuidad; ni ignorar la expiración sin perder integridad.

---

## RIESGO ERP A EVITAR

* Eliminar disponibilidad de forma abrupta al alcanzar la fecha/hora de expiración
* Bloquear automáticamente operaciones sobre disponibilidad expirada sin contexto humano
* Ignorar la proximidad de expiración hasta que el bloqueo sea inevitable
* Tratar la expiración como error o corrupción en lugar de como estado operacional natural

---

## COMPORTAMIENTO ESPERADO

* La proximidad a expiración reduce la confianza operacional progresivamente, no de golpe
* El sistema señala la presión de expiración al operador con suficiente anticipación operacional
* La decisión de usar disponibilidad expirada es un override contextual explícito con trazabilidad
* Las reservas activas sobre disponibilidad próxima a expirar reciben alerta contextual
* El arbitraje en escasez puede priorizar disponibilidad de mayor expiración cuando el contexto lo justifica

---

## INVARIANTES

* La expiración reduce confianza operacional progresivamente; no elimina disponibilidad unilateralmente
* El uso de disponibilidad expirada genera evento trazable con responsabilidad contextual explícita
* La causalidad de operaciones sobre disponibilidad expirada se preserva íntegramente
* Las alertas de pre-expiración tienen contexto de reservas activas y compromisos afectados

---

## PUNTOS ABIERTOS

* Umbral de pre-expiración para señalización al operador según tipo de disponibilidad
* Criterios de arbitraje cuando coexisten disponibilidades con distintos niveles de expiración
* Tratamiento de disponibilidad expirada que aún puede ser operacionalmente usable en contextos específicos

---

# 31. ESCENARIO CANÓNICO — CONTINUIDAD OPERACIONAL BAJO BAJA CONFIANZA

## ESCENARIO

Un runtime operacional continúa funcionando mientras existen señales de:

* sincronización degradada
* reconciliación pendiente
* divergencia contextual
* validación física antigua
* presión operacional acumulada
* incertidumbre parcial de disponibilidad

La operación humana necesita continuar.

Pero el sistema NO posee:

```text
certeza operacional absoluta
```

---

## CONTEXTO

Detener la operación hasta recuperar confianza plena no es viable operacionalmente.

Operar como si la confianza fuera total puede generar compromisos incobrables.

El sistema debe ser capaz de operar en modos degradados con visibilidad contextual al operador.

---

## TENSIÓN OPERACIONAL

El operador necesita tomar decisiones sobre disponibilidad cuya certeza es reducida.

La baja confianza no es una condición binaria: hay niveles intermedios con diferente impacto operacional.

El sistema no puede presentar disponibilidad como cierta cuando no lo es, ni paralizarse ante cualquier degradación.

---

## RIESGO ERP A EVITAR

* Bloquear operaciones cuando la confianza cae bajo un umbral fijo predefinido
* Mostrar disponibilidad como absolutamente cierta cuando existen señales de degradación
* Ignorar la degradación de confianza en la presentación operacional al operador
* Tratar toda baja confianza como error grave en lugar de como condición operacional normal

---

## COMPORTAMIENTO ESPERADO

* El sistema opera en modo degradado con visibilidad explícita al operador sobre el nivel de confianza
* Las operaciones comprometidas bajo baja confianza quedan marcadas para reconciliación posterior
* El operador tiene contexto suficiente para decidir con qué nivel de confianza está operando
* La recuperación de sincronización actualiza el estado sin invalidar retroactivamente operaciones previas
* Las operaciones bajo distintos niveles de confianza tienen trazabilidad del contexto de confianza en el momento

---

## INVARIANTES

* La baja confianza no paraliza la operación; degrada con visibilidad contextual
* Las operaciones bajo baja confianza tienen trazabilidad del nivel de confianza en el momento de ejecución
* La recuperación de confianza no corrige retroactivamente; reconcilia progresivamente
* La confianza es un atributo contextual de la disponibilidad, no solo del runtime

---

## PUNTOS ABIERTOS

* Representación operacional de niveles de confianza sin saturar cognitivamente al operador
* Criterios de degradación de confianza según tiempo sin sincronización y tipo de disponibilidad
* Protocolo de elevación automática de confianza al recuperar sincronización y validación

---

# 32. ESCENARIO CANÓNICO — ARBITRAJE OPERACIONAL BAJO ESCASEZ

## ESCENARIO

La disponibilidad operacional existente NO alcanza para satisfacer simultáneamente:

* ventas presenciales
* delivery
* reservas activas
* compromiso operacional previo
* preparación interna
* contingencias runtime
* sincronización pendiente

Existe presión operacional extrema sobre una misma capacidad contextual.

---

## CONTEXTO

La tensión principal NO es solamente:

```text
quién consume primero
```

Sino cómo distribuir la disponibilidad insuficiente preservando la continuidad operacional más crítica con mínima destrucción de intenciones legítimas.

---

## TENSIÓN OPERACIONAL

La escasez real fuerza decisiones distributivas con consecuencias operacionales concretas e inmediatas.

El criterio de distribución no es universal ni estático: depende del contexto operacional, del tipo de operación y de las prioridades del momento.

No existe un algoritmo único correcto para el arbitraje bajo escasez extrema.

---

## RIESGO ERP A EVITAR

* Resolver escasez puramente por orden cronológico de registro sin contexto
* Bloquear todas las operaciones hasta que el operador resuelva manualmente cada conflicto
* Silenciar la escasez hasta que alguna operación falle en ejecución
* Cancelar silenciosamente operaciones secundarias sin registrar la intención ni notificar

---

## COMPORTAMIENTO ESPERADO

* El sistema detecta la presión de escasez y la expresa con contexto operacional completo de cada presión
* Ofrece criterios de arbitraje configurables por tipo de operación y contexto de negocio
* Preserva las intenciones de todas las operaciones en conflicto aunque solo algunas puedan materializarse
* Las operaciones no atendidas por escasez mantienen su intención registrada para resolución futura
* El criterio de arbitraje aplicado queda trazable en el evento de resolución

---

## INVARIANTES

* La escasez genera eventos de arbitraje con contexto explícito, no cancelaciones silenciosas
* Las operaciones no satisfechas por escasez mantienen su intención registrada con causalidad
* El criterio de arbitraje aplicado queda trazable en el evento
* La escasez detectada es información operacional visible, no condición silenciosa del sistema

---

## PUNTOS ABIERTOS

* Criterios de arbitraje configurables por tipo de operación y contexto de negocio
* Protocolo de notificación y escalada cuando la escasez supera umbrales críticos
* Tratamiento de escasez bajo múltiples runtimes parcialmente sincronizados compitiendo simultáneamente

---

# 33. ESCENARIO CANÓNICO — DEVOLUCIÓN POSTERIOR A DIVERGENCIA OPERACIONAL

## ESCENARIO

Un producto vendido previamente retorna al sistema después de:

* operación offline
* sincronización diferida
* reconciliaciones parciales
* transformaciones operacionales
* divergencias contextuales entre runtimes

La devolución ocurre cuando:

* la causalidad original ya no es perfectamente lineal
* existen reinterpretaciones posteriores
* la disponibilidad actual ya cambió contextual y temporalmente

---

## CONTEXTO

La tensión principal NO es únicamente:

```text
sumar nuevamente cantidad disponible
```

Sino integrar la devolución con la causalidad acumulada posterior, preservando coherencia operacional hacia adelante.

---

## TENSIÓN OPERACIONAL

La devolución ocurre en un contexto temporal diferente al de la venta original.

La disponibilidad actual puede haber cambiado de contexto operacional, estado o incluso de naturaleza.

Simplemente invertir la venta original ignoraría toda la causalidad acumulada entre la venta y la devolución.

---

## RIESGO ERP A EVITAR

* Tratar la devolución como simple inversión matemática de la venta original
* Restaurar disponibilidad como si el tiempo intermedio no hubiera ocurrido
* Ignorar que el producto puede requerir evaluación contextual antes de volver a estar disponible
* Asumir que la disponibilidad restaurada es inmediatamente equivalente a la original

---

## COMPORTAMIENTO ESPERADO

* La devolución genera un nuevo evento de ingreso con referencia causal explícita a la venta original
* La disponibilidad restaurada ingresa en estado de evaluación contextual antes de ser operacionalmente disponible
* La causalidad de la venta original permanece trazable independientemente de la devolución
* El historial refleja tanto la salida original como el reingreso con sus respectivos contextos temporales
* El operador puede documentar el estado del producto devuelto y su contexto de retorno

---

## INVARIANTES

* La devolución no invierte ni borra; genera evento nuevo con referencia causal
* El producto devuelto puede requerir evaluación contextual antes de disponibilidad plena
* La causalidad de la venta original permanece trazable con independencia de la devolución
* La devolución tiene su propio timestamp operacional distinto del de la venta original

---

## PUNTOS ABIERTOS

* Tratamiento de devoluciones parciales en contextos donde la venta original fue transformada o fraccionada
* Estado operacional inicial del producto devuelto según historial contextual y tipo de producto
* Devoluciones de ventas realizadas durante operación offline cuya causalidad fue reconciliada posteriormente

---

# 34. ESCENARIO CANÓNICO — SINCRONIZACIÓN DIFERIDA CON CAUSALIDAD CRUZADA

## ESCENARIO

Múltiples runtimes operan de manera parcialmente independiente durante un periodo prolongado.

Durante ese tiempo ocurren:

* ventas
* reservas
* reconciliaciones
* devoluciones
* transformaciones
* arbitraje operacional
* degradación de confianza

Posteriormente:

* los runtimes sincronizan
* aparecen causalidades cruzadas
* eventos afectan disponibilidad derivada mutuamente
* existen reinterpretaciones contextuales simultáneas

---

## CONTEXTO

La tensión principal NO es:

```text
qué runtime posee la verdad absoluta
```

Sino cómo integrar múltiples causalidades legítimas que operaron en paralelo bajo información parcial.

---

## TENSIÓN OPERACIONAL

Los runtimes acumularon causalidades parcialmente independientes que al sincronizar crean dependencias retroactivas.

No existe una "versión correcta" objetiva que pueda simplemente prevalecer sobre las demás.

La integración de causalidades cruzadas puede revelar disponibilidades comprometidas dos veces legítimamente.

---

## RIESGO ERP A EVITAR

* Elegir un runtime como autoritativo y descartar la causalidad acumulada en los demás
* Tratar la sincronización como merge donde "último escribe gana"
* Forzar consistencia destruyendo causalidad legítima de alguno de los runtimes
* Ignorar causalidades cruzadas esperando que no generen conflictos visibles

---

## COMPORTAMIENTO ESPERADO

* La sincronización integra causalidades sin destruir ninguna de las partes
* Los conflictos detectados se expresan como tensiones operacionales a reconciliar con contexto
* Las reconciliaciones generan nuevos eventos con contexto de los estados anteriores de cada runtime
* El operador recibe visibilidad sobre causalidades cruzadas relevantes que requieren decisión
* La disponibilidad derivada post-sincronización refleja la integración de todas las causalidades

---

## INVARIANTES

* Ningún runtime posee verdad absoluta sobre la disponibilidad global durante operación paralela
* La sincronización integra sin destruir; las diferencias son eventos de reconciliación trazables
* Toda causalidad cruzada resuelta genera registro explícito con contexto de resolución
* La integración de causalidades paralelas preserva la trazabilidad de cada runtime original

---

## PUNTOS ABIERTOS

* Protocolo de integración cuando las causalidades de dos runtimes son directamente contradictorias sobre la misma unidad
* Ventana temporal dentro de la cual los conflictos de causalidad cruzada son reconciliables automáticamente
* Priorización de reconciliaciones cuando el volumen de causalidades cruzadas es alto

---

# 35. ESCENARIO CANÓNICO — MATERIALIZACIÓN DIFERIDA BAJO CONTINUIDAD OPERACIONAL

## ESCENARIO

Una operación genera intención operacional válida antes de que exista:

* materialización física completa
* sincronización consolidada
* confirmación distribuida total
* disponibilidad absoluta validada

Ejemplos posibles:

* preparación pendiente
* separación parcial
* transferencia en curso
* transformación progresiva
* contingencia offline
* ejecución humana diferida

La operación necesita continuar SIN esperar:

```text
certeza material absoluta inmediata
```

---

## CONTEXTO

La intención operacional válida tiene valor propio aunque la materialización física aún no esté completa.

Esperar materialización completa antes de permitir compromisos bloquearía operaciones legítimas.

Pero comprometer disponibilidad que no existe todavía genera riesgos operacionales reales.

El sistema debe distinguir entre disponibilidad confirmada, en materialización y proyectada.

---

## TENSIÓN OPERACIONAL

La operación necesita avanzar sobre una disponibilidad cuya existencia futura es probable pero no garantizada.

El riesgo de materialización fallida puede ser aceptable en algunos contextos y crítico en otros.

Congelar la operación hasta materialización completa puede ser operacionalmente peor que aceptar el riesgo controlado.

---

## RIESGO ERP A EVITAR

* Requerir materialización física completa antes de permitir cualquier compromiso operacional
* Tratar disponibilidad proyectada como equivalente a disponibilidad confirmada sin distinción
* Ignorar el estado de materialización y comprometer disponibilidad futura como si fuera presente
* No registrar el riesgo de dependencia de materialización en los compromisos adquiridos

---

## COMPORTAMIENTO ESPERADO

* El sistema distingue explícitamente entre disponibilidad confirmada, en materialización y proyectada
* Los compromisos sobre disponibilidad en materialización son posibles con visibilidad del riesgo contextual
* La materialización progresiva actualiza el estado sin invalidar compromisos previos válidos
* Si la materialización no se completa, los compromisos dependientes reciben contexto de riesgo actualizado
* El operador puede decidir con información de estado de materialización explícita

---

## INVARIANTES

* La intención operacional válida tiene trazabilidad propia independiente del grado de materialización
* Los compromisos sobre disponibilidad en materialización son posibles con contexto de riesgo explícito
* La materialización completa confirma compromisos anteriores; no los invalida ni los crea retroactivamente
* El estado de materialización es visible como dimensión propia de la disponibilidad

---

## PUNTOS ABIERTOS

* Criterios para considerar materialización "suficiente" para compromisos sin riesgo operacional relevante
* Tratamiento cuando la materialización no se completa por circunstancias operacionales o logísticas
* Niveles de riesgo aceptable según tipo de operación y contexto de negocio

---

# 36. ESCENARIO CANÓNICO — PRIORIDAD OPERACIONAL DINÁMICA BAJO CONTEXTO CAMBIANTE

## ESCENARIO

Distintas operaciones compiten simultáneamente por capacidad operacional limitada.

Pero la prioridad contextual cambia dinámicamente debido a:

* presión comercial
* contingencia operacional
* degradación runtime
* expiración próxima
* continuidad humana
* sincronización pendiente
* autorización contextual
* arbitraje operacional

Una operación inicialmente secundaria puede convertirse posteriormente en:

```text
prioridad operacional crítica
```

---

## CONTEXTO

La prioridad de una operación no es una propiedad estática definida en el momento de su registro.

El contexto operacional evoluciona y con él la relevancia relativa de cada operación.

El sistema debe soportar la revisión de prioridades sin destruir la causalidad acumulada.

---

## TENSIÓN OPERACIONAL

Una decisión de arbitraje tomada en un momento puede necesitar revisión cuando el contexto cambia.

Congelar prioridades al momento de registro puede generar distribuciones operacionalmente incorrectas.

Re-arbitrar continuamente puede generar inestabilidad operacional si no tiene límites claros.

---

## RIESGO ERP A EVITAR

* Congelar la prioridad de las operaciones como propiedad inmutable en el momento de registro
* Requerir cancelación y re-registro completo para cambiar la prioridad de una operación
* Ignorar cambios de contexto que hacen obsoleta la prioridad original
* Re-arbitrar sin límites generando inestabilidad operacional continua

---

## COMPORTAMIENTO ESPERADO

* La prioridad operacional es un estado revisable durante el ciclo de vida de la operación
* Los cambios de prioridad generan eventos trazables con contexto de la razón del cambio
* El re-arbitraje por cambio de prioridad preserva la causalidad de todas las operaciones afectadas
* Las operaciones desplazadas por re-arbitraje reciben notificación contextual
* Existen límites operacionales para la frecuencia de re-arbitraje sobre la misma disponibilidad

---

## INVARIANTES

* El cambio de prioridad genera evento explícito con contexto de razón; no es mutación silenciosa
* Las operaciones desplazadas por re-arbitraje mantienen su intención original registrada con causalidad
* La prioridad en el momento del arbitraje es trazable como dato histórico del contexto operacional
* La historia de cambios de prioridad es parte de la causalidad de la operación

---

## PUNTOS ABIERTOS

* Criterios de escalada automática de prioridad por presión operacional acumulada
* Límites operacionales para re-arbitraje sobre la misma disponibilidad en una ventana temporal
* Tratamiento de operaciones bloqueadas crónicamente por re-arbitraje continuo

---

# 37. ESCENARIO CANÓNICO — RESERVA EXPIRADA CON CONTINUIDAD OPERACIONAL ACTIVA

## ESCENARIO

Una reserva operacional alcanza su ventana de expiración mientras:

* existe operación humana en curso
* la materialización aún no termina
* existen runtimes parcialmente sincronizados
* la disponibilidad continúa bajo presión
* persiste intención operacional válida
* existe continuidad contextual activa

Formalmente la reserva debería:

```text
expirar
```

---

## CONTEXTO

La expiración formal coexiste con continuidad operacional humana legítima.

Cancelar automáticamente puede interrumpir una operación en progreso válida.

Ignorar la expiración indefinidamente degrada la integridad del sistema de reservas.

El sistema debe balancear integridad formal con continuidad operacional real.

---

## TENSIÓN OPERACIONAL

La reserva expiró formalmente pero la operación humana que la justifica aún está en curso.

Cancelar la reserva libera disponibilidad que podría ser tomada por otra operación, rompiendo la continuidad de la operación en curso.

No cancelarla retiene disponibilidad que quizás ya no debería estar retenida.

---

## RIESGO ERP A EVITAR

* Cancelar reservas expiradas automáticamente sin verificar si existe operación activa en curso
* Liberar disponibilidad reservada inmediatamente al expirar independientemente del estado operacional
* Ignorar la expiración indefinidamente mientras exista cualquier actividad contextual relacionada
* Tratar toda expiración como cancelación definitiva sin posibilidad de extensión contextual

---

## COMPORTAMIENTO ESPERADO

* La expiración genera alerta contextual al operador, no cancelación automática inmediata
* Existe una ventana de gracia operacional para confirmar continuidad antes de la liberación
* Si la continuidad es confirmada explícitamente, la reserva se extiende con evento trazable
* Si no hay confirmación dentro de la ventana de gracia, la liberación ocurre con registro completo del contexto
* La disponibilidad liberada por expiración genera evento con contexto de por qué expiró y qué operación estaba en curso

---

## INVARIANTES

* La expiración no cancela automáticamente en presencia de operación activa trazable confirmada
* La extensión por continuidad activa genera evento explícito con responsabilidad contextual
* La disponibilidad liberada por expiración tiene trazabilidad del contexto de liberación
* La ventana de gracia es parte del ciclo de vida trazable de la reserva

---

## PUNTOS ABIERTOS

* Duración de ventana de gracia configurable por tipo de reserva y contexto operacional
* Criterios de detección automática de "operación activa" que justifica la extensión
* Tratamiento de reservas en runtimes offline que expiraron durante el periodo de desconexión

---

# 38. ESCENARIO CANÓNICO — CONTEO FÍSICO PARCIAL BAJO OPERACIÓN ACTIVA

## ESCENARIO

Se realiza un conteo físico parcial mientras:

* continúan ventas activas
* existen reservas operacionales
* ocurren transformaciones
* persiste sincronización parcial
* existen runtimes concurrentes
* continúa presión operacional

El conteo NO cubre:

```text
la totalidad del contexto operacional
```

---

## CONTEXTO

Los resultados parciales son información valiosa pero de alcance limitado.

Aplicarlos como actualización global de disponibilidad generaría incoherencias operacionales reales.

Las operaciones activas durante el conteo alteran la disponibilidad mientras el conteo está en curso.

El sistema debe integrar la evidencia parcial sin extrapolarla más allá de su scope real.

---

## TENSIÓN OPERACIONAL

El conteo parcial produce evidencia real sobre un subconjunto del contexto operacional.

Esa evidencia tiene valor para la reconciliación en su scope pero no puede extenderse al total.

Las operaciones activas simultáneas al conteo hacen que el resultado parcial envejezca durante el proceso de conteo mismo.

---

## RIESGO ERP A EVITAR

* Tratar el conteo parcial como actualización global de la disponibilidad total
* Bloquear operaciones en las áreas siendo contadas durante todo el proceso de conteo
* Ignorar completamente el conteo parcial hasta disponer de un conteo global completo
* Aplicar el resultado parcial sin documentar explícitamente su scope y contexto temporal

---

## COMPORTAMIENTO ESPERADO

* El conteo parcial genera eventos de reconciliación acotados al scope operacional cubierto
* Las operaciones activas durante el conteo son anotadas para reconciliación posterior
* El sistema integra el resultado parcial como evidencia contextual con scope y timestamp explícitos
* El operador ve claramente que la reconciliación es parcial y cuál es su cobertura real
* Resultados de conteos parciales múltiples pueden acumularse progresivamente hacia reconciliación más completa

---

## INVARIANTES

* El conteo parcial no altera disponibilidad fuera de su scope operacional definido
* Las operaciones activas durante el conteo quedan anotadas para reconciliación posterior
* El resultado parcial es evidencia con scope explícito y timestamp; no verdad global
* El scope del conteo parcial es parte del metadato del evento de reconciliación

---

## PUNTOS ABIERTOS

* Definición del scope mínimo útil para un conteo parcial con valor operacional real
* Protocolo de coordinación entre proceso de conteo parcial y operaciones activas concurrentes
* Acumulación progresiva de conteos parciales hacia cobertura más amplia de reconciliación

---

# 39. ESCENARIO CANÓNICO — TRANSFERENCIA OPERACIONAL EN TRÁNSITO CON SINCRONIZACIÓN PARCIAL

## ESCENARIO

Determinada disponibilidad operacional es transferida entre contextos operacionales distintos.

Ejemplos:

* tienda → tienda
* depósito → tienda
* preparación → despacho
* runtime móvil → runtime fijo
* contingencia → operación normal

Durante el tránsito:

* la sincronización es parcial
* la materialización física puede ser incompleta
* existe incertidumbre contextual
* continúan operaciones concurrentes
* persiste presión operacional

La disponibilidad NO pertenece completamente:

```text
a un único contexto absoluto
```

---

## CONTEXTO

La disponibilidad en tránsito no pertenece completamente al contexto origen ni al contexto destino.

Asignarla completamente al origen implica disponibilidad fantasma en destino.

Asignarla completamente al destino implica comprometer disponibilidad que aún no llegó físicamente.

El tránsito es un estado operacional propio que debe ser visible y manejable.

---

## TENSIÓN OPERACIONAL

Los dos contextos operacionales necesitan visibilidad sobre disponibilidad que está en movimiento entre ellos.

El origen necesita saber qué ya no está disponible localmente.

El destino necesita saber qué puede esperar y cuándo.

La sincronización parcial puede hacer que uno de los contextos no tenga información actualizada del estado de tránsito.

---

## RIESGO ERP A EVITAR

* Mover disponibilidad instantáneamente al momento de despacho ignorando el periodo de tránsito
* Mantener disponibilidad en origen hasta confirmación de recepción completa en destino bloqueando ambos contextos
* Ignorar la existencia de disponibilidad en tránsito en el cálculo de disponibilidad de ambos contextos
* No registrar el tránsito como estado operacional explícito con trazabilidad propia

---

## COMPORTAMIENTO ESPERADO

* La transferencia tiene estados explícitos: despachado → en tránsito → recibido
* La disponibilidad en tránsito es visible como capacidad operacional diferenciada con contexto propio
* El destino puede comprometerse sobre disponibilidad esperada con visibilidad del riesgo y estado de tránsito
* El origen no cuenta disponibilidad despachada como disponible localmente
* La recepción confirmada actualiza el estado de tránsito a recibido con evento trazable

---

## INVARIANTES

* El tránsito es un estado operacional explícito con trazabilidad, no una transición instantánea
* La disponibilidad en tránsito tiene causalidad de origen, estado actual y destino esperado
* Los compromisos sobre disponibilidad esperada tienen visibilidad explícita de su dependencia temporal
* La pérdida o merma en tránsito genera evento de reconciliación con contexto

---

## PUNTOS ABIERTOS

* Tratamiento cuando la transferencia llega con mermas respecto a lo despachado
* Disponibilidad en tránsito bajo falla de conectividad entre contexto origen y destino
* Tránsitos con múltiples etapas o puntos intermedios de custodia

---

# 40. ESCENARIO CANÓNICO — OPERACIÓN EN CONTINGENCIA CON RECONCILIACIÓN DIFERIDA

## ESCENARIO

El runtime operacional entra en modo contingencia debido a:

* caída prolongada de conectividad
* degradación de sincronización
* indisponibilidad parcial de servicios externos
* falla de coordinación distribuida
* operación edge aislada temporalmente

La operación humana debe continuar mientras:

* persisten ventas
* reservas continúan activas
* ocurren transformaciones
* existe presión operacional
* la confianza operacional comienza a degradarse

La reconciliación completa solo será posible posteriormente.

---

## CONTEXTO

La tensión principal NO es:

```text
detener operación hasta restaurar consistencia global
```

Sino continuar operación con trazabilidad suficiente para permitir reconciliación futura sin destrucción de causalidad.

---

## TENSIÓN OPERACIONAL

El modo contingencia permite continuidad operacional a costo de divergencia creciente con el estado global.

Cuanto más dura la contingencia, mayor es la complejidad de reconciliación futura.

La trazabilidad durante la contingencia es el recurso crítico para hacer posible la reconciliación posterior.

---

## RIESGO ERP A EVITAR

* Prohibir operaciones en modo contingencia que no pueden validarse globalmente
* Operar en contingencia sin registro del contexto de degradación, imposibilitando reconciliación futura
* Salir de contingencia aplicando el estado global como verdad absoluta que sobrescribe lo acumulado localmente
* Tratar el modo contingencia como excepción a ignorar en lugar de como modo operacional natural planificado

---

## COMPORTAMIENTO ESPERADO

* En modo contingencia el sistema opera con disponibilidad local trazable con marcas de contexto de degradación
* Cada operación de contingencia lleva contexto del estado de degradación en el momento de ejecución
* Al recuperar conectividad, las operaciones de contingencia entran en protocolo de reconciliación con contexto completo
* Las divergencias acumuladas durante contingencia se integran como eventos de reconciliación, no como correcciones destructivas
* El operador recibe visibilidad del estado de reconciliación post-contingencia

---

## INVARIANTES

* Toda operación en contingencia lleva contexto de degradación explícito en el momento de ejecución
* La salida de contingencia activa protocolo de reconciliación, no corrección silenciosa de estado
* La continuidad operacional en contingencia preserva causalidad aunque la consistencia global sea diferida
* El historial de periodos de contingencia es parte de la trazabilidad operacional del runtime

---

## PUNTOS ABIERTOS

* Límites operacionales aceptables durante contingencia prolongada según tipo de operación
* Protocolo de reconciliación priorizada cuando el volumen de operaciones acumuladas en contingencia es alto
* Criterios de alerta cuando la duración de contingencia supera umbrales de riesgo de reconciliación

---

# 41. ESCENARIO CANÓNICO — OVERRIDE OPERACIONAL CONTEXTUAL BAJO PRESIÓN CRÍTICA

## ESCENARIO

Determinada operación requiere continuar aun cuando el sistema detecta:

* disponibilidad degradada
* confianza operacional baja
* reserva conflictiva
* sincronización incompleta
* expiración contextual
* divergencia parcial
* arbitraje no resuelto completamente

La continuidad operacional posee prioridad contextual crítica.

La operación requiere:

```text
override contextual explícito
```

---

## CONTEXTO

El override no es un bypass al sistema; es una decisión operacional explícita con responsabilidad contextual.

Su existencia reconoce que la rigidez absoluta del sistema puede ser operacionalmente más costosa que continuar con la anomalía controlada.

La trazabilidad del override es tan importante como la trazabilidad de las operaciones normales.

---

## TENSIÓN OPERACIONAL

El sistema detecta una condición que normalmente bloquearía o alertaría la operación.

La continuidad operacional en el contexto específico tiene prioridad sobre la condición detectada.

El override permite continuar pero no normaliza el estado; la anomalía persiste como contexto operacional activo.

Abusar del override erosiona la integridad operacional del sistema.

---

## RIESGO ERP A EVITAR

* Permitir overrides silenciosos sin registro de contexto ni responsabilidad
* Bloquear absolutamente overrides eliminando la posibilidad de continuidad en emergencias reales
* Tratar el override como normalización del estado, borrando la señal de anomalía del historial
* No distinguir entre overrides por contexto crítico real y overrides habituales por comodidad operacional

---

## COMPORTAMIENTO ESPERADO

* El override es explícito, visible y requiere confirmación consciente del operador
* El sistema registra el override con contexto completo: qué condición fue sobreescrita, quién, cuándo, por qué
* La anomalía que motivó el override persiste como registro operacional aunque la operación continúe
* El historial de overrides es parte de la trazabilidad operacional y puede ser auditado
* Los overrides frecuentes sobre la misma condición generan alertas operacionales para revisión

---

## INVARIANTES

* No existen overrides silenciosos; todo override es trazable con responsabilidad contextual explícita
* El override no normaliza el estado ni elimina la anomalía del historial operacional
* La trazabilidad del override es permanente e independiente de reconciliaciones posteriores
* La condición que motivó el override permanece visible en el contexto de la operación

---

## PUNTOS ABIERTOS

* Niveles de autorización requeridos según la magnitud y tipo de condición sobreescrita
* Criterios de alerta operacional cuando overrides se vuelven frecuentes sobre la misma condición
* Límites de override aceptables por tipo de operación para prevenir erosión sistemática de integridad

---

# 42. ESCENARIO CANÓNICO — REINTERPRETACIÓN OPERACIONAL POSTERIOR A NUEVA EVIDENCIA

## ESCENARIO

Después de múltiples operaciones ya materializadas:

* ventas
* reservas
* reconciliaciones
* arbitrajes
* transformaciones
* sincronizaciones parciales

Aparece nueva evidencia operacional:

* conteo físico tardío
* sincronización diferida
* evento omitido
* causalidad incompleta
* validación contextual nueva
* divergencia previamente invisible

La nueva evidencia altera parcialmente:

```text
la interpretación operacional previa
```

---

## CONTEXTO

La nueva evidencia no puede ser ignorada; tiene valor operacional real.

Pero reescribir retroactivamente el historial destruiría la causalidad acumulada y la confianza en el registro operacional.

La coexistencia de interpretaciones contextuales distintas en el tiempo es una condición operacional válida.

---

## TENSIÓN OPERACIONAL

La nueva evidencia altera la comprensión de operaciones ya materializadas y su disponibilidad derivada.

Revertir esas operaciones retroactivamente para hacer consistente el estado actual destruiría causalidad legítima.

Ignorar la nueva evidencia perpetuaría una interpretación incorrecta del estado operacional real.

Integrar la nueva evidencia sin destruir el historial requiere modelar la reinterpretación como evento propio.

---

## RIESGO ERP A EVITAR

* Revertir operaciones pasadas para hacer consistente el estado actual con la nueva evidencia
* Ignorar la nueva evidencia porque no puede integrarse sin romper el historial
* Sobrescribir silenciosamente estados derivados previos sin registrar el cambio de interpretación
* Tratar la reinterpretación como corrección de errores en lugar de como nuevo contexto operacional

---

## COMPORTAMIENTO ESPERADO

* La nueva evidencia genera un evento de reinterpretación que coexiste con la causalidad previa
* El sistema expresa explícitamente que la disponibilidad derivada anterior fue calculada con un contexto diferente
* Las operaciones materializadas con interpretación anterior permanecen trazables con su contexto original
* El estado actual refleja la nueva evidencia integrada sin destruir el historial de interpretaciones
* El operador recibe contexto de qué cambió en la interpretación y qué operaciones podrían verse afectadas

---

## INVARIANTES

* La nueva evidencia no reescribe la historia; genera nueva capa de interpretación operacional
* Las operaciones materializadas con interpretación anterior permanecen trazables con su contexto original
* La coexistencia de interpretaciones distintas en el tiempo es operacionalmente válida y trazable
* La reinterpretación es un evento de primera clase en el modelo operacional, no una corrección silenciosa

---

## PUNTOS ABIERTOS

* Criterios para determinar si la nueva evidencia requiere acción operacional activa o solo actualización de interpretación
* Tratamiento de compromisos futuros adquiridos bajo la interpretación anterior que ya no es válida
* Comunicación contextual a operadores sobre el impacto de la reinterpretación en operaciones en curso

---

# 43. ANTI-PATRONES DEL DOMINIO INVENTARIOS

## PROPÓSITO

Los anti-patrones documentan decisiones de diseño que parecen razonables o convenientes pero que violan la filosofía operacional del dominio y generan problemas reales en operación.

No son errores obvios.

Son trampas con apariencia de solución que el sistema debe reconocer y evitar activamente.

Cada anti-patrón tiene un nombre operacional, una descripción de cómo aparece, por qué parece razonable, qué problema real genera, y cuál es la dirección correcta.

---

## AP-01 — DISPONIBILIDAD COMO CONTADOR MUTABLE

**Cómo aparece:**

El sistema almacena la disponibilidad de cada ítem como un campo numérico que se incrementa o decrementa directamente con cada operación.

**Por qué parece razonable:**

Es simple de implementar, fácil de consultar, y produce el número correcto en condiciones normales.

**Problema real:**

Cuando ocurren operaciones concurrentes, offline, o con divergencia entre runtimes, el campo mutable colapsa: no hay historia, no hay causalidad, no hay reconciliación posible.

Una corrección incorrecta destruye información irrecuperable.

La disponibilidad se convierte en un número sin contexto ni trazabilidad.

**Dirección correcta:**

La disponibilidad es una proyección sobre un log de eventos inmutables.

El número es un resultado calculado, no un campo almacenado directamente.

---

## AP-02 — SNAPSHOT ABSOLUTO COMO FUENTE DE VERDAD

**Cómo aparece:**

El sistema toma fotografías periódicas del estado del inventario y las usa como punto de partida para calcular disponibilidad futura.

Los movimientos anteriores al último snapshot se descartan o archivan como irrelevantes.

**Por qué parece razonable:**

Reduce el volumen de datos históricos, simplifica las consultas, y aparentemente mantiene el sistema liviano.

**Problema real:**

El snapshot destruye la causalidad de los eventos anteriores.

No es posible reconstruir por qué la disponibilidad llegó al estado del snapshot.

La reconciliación con sistemas externos o con eventos generados offline se vuelve imposible o aproximada.

La reinterpretación posterior a nueva evidencia no tiene historia para operar.

**Dirección correcta:**

Los eventos son la fuente de verdad permanente.

Los snapshots pueden existir como optimización de lectura (proyecciones materializadas), nunca como reemplazo del log de eventos.

---

## AP-03 — BLOQUEO AUTOMÁTICO POR LÍMITE RÍGIDO

**Cómo aparece:**

El sistema bloquea automáticamente operaciones cuando la disponibilidad llega a cero, cuando la confianza cae bajo un umbral, o cuando la sincronización lleva más de N minutos sin completarse.

**Por qué parece razonable:**

Parece proteger la integridad del inventario y evitar compromisos imposibles de cumplir.

**Problema real:**

El bloqueo automático sin contexto humano detiene la operación en situaciones donde el operador tiene información que el sistema no tiene.

Un producto con disponibilidad cero en el sistema puede estar físicamente presente pero no registrado.

Una sincronización tardía puede deberse a conectividad, no a divergencia real.

El bloqueo convierte la incertidumbre del sistema en paralización del negocio.

**Dirección correcta:**

El sistema señaliza presión operacional con contexto suficiente para que el operador tome la decisión.

El override contextual con trazabilidad explícita es preferible al bloqueo automático.

La continuidad operacional tiene prioridad sobre la exactitud preventiva del sistema.

---

## AP-04 — SINCRONIZACIÓN COMO REQUISITO BLOQUEANTE

**Cómo aparece:**

El runtime local no puede operar hasta completar la sincronización con el núcleo central.

Las operaciones quedan en cola hasta que la sincronización confirme que el estado es válido.

**Por qué parece razonable:**

Garantiza que el runtime siempre opera con datos actualizados y evita divergencias.

**Problema real:**

En entornos de conectividad imperfecta, el negocio se detiene cada vez que la red falla.

La dependencia de sincronización convierte un sistema edge-first en un sistema que requiere conectividad permanente.

La operación humana no puede esperar a que la red coopere.

**Dirección correcta:**

El runtime local opera autónomamente con su proyección local.

La sincronización es eventual y progresiva: reduce divergencia pero no es prerequisito de operación.

---

## AP-05 — EXACTITUD INMEDIATA SOBRE CONTINUIDAD OPERACIONAL

**Cómo aparece:**

El sistema exige que la disponibilidad sea exacta antes de permitir cualquier operación.

Si hay duda sobre el estado real del inventario, se bloquea la operación hasta resolver la duda.

**Por qué parece razonable:**

Parece razonable no comprometer disponibilidad que podría no existir.

**Problema real:**

La exactitud perfecta en tiempo real no es alcanzable en sistemas edge-first con operación humana real.

Exigirla paraliza la operación continuamente por razones que el sistema no puede resolver sin intervención humana.

La continuidad operacional tiene valor económico real que se destruye con cada bloqueo.

**Dirección correcta:**

Operar con la mejor información disponible más visibilidad contextual del nivel de confianza.

La reconciliación posterior corrige las diferencias sin destruir la continuidad operacional.

---

## AP-06 — CORRECCIÓN DESTRUCTIVA DE HISTORIA

**Cómo aparece:**

Cuando se detecta un error de registro, el sistema permite modificar o eliminar el evento incorrecto directamente.

El historial queda "limpio" pero no refleja lo que realmente ocurrió.

**Por qué parece razonable:**

Parece más limpio tener un historial sin errores que uno con eventos de corrección.

**Problema real:**

Modificar eventos pasados destruye la trazabilidad y hace imposible reconstruir qué ocurrió realmente.

Las reconciliaciones externas (con otros sistemas, con conteos físicos, con auditorías) pierden su punto de referencia.

La historia operacional deja de ser confiable como evidencia.

**Dirección correcta:**

Las correcciones generan nuevos eventos de reversión o ajuste con causalidad explícita.

La historia permanece inmutable. El estado actual refleja los eventos incluyendo las correcciones.

---

## AP-07 — DISPONIBILIDAD GLOBAL SIN CONTEXTO

**Cómo aparece:**

El sistema expone un único número de disponibilidad por ítem, sin distinción de ubicación, estado, runtime, ni nivel de confianza.

**Por qué parece razonable:**

Simplifica la consulta: el operador ve un único número que representa "cuánto hay".

**Problema real:**

El número global oculta información operacionalmente crítica.

Disponibilidad en tránsito, en bodega, reservada, o con baja confianza es diferente de disponibilidad disponible en mostrador para venta inmediata.

Las decisiones basadas en el número global generan compromisos incorrectos con frecuencia.

**Dirección correcta:**

La disponibilidad es siempre contextual.

El sistema expone disponibilidad en el contexto operacional relevante para la operación en curso, no un número global descontextualizado.

---

## AP-08 — CONFIANZA BINARIA

**Cómo aparece:**

El sistema trata la confianza operacional como un valor binario: o la información es confiable o no lo es.

Cuando la confianza cae de "confiable" a "no confiable", el sistema bloquea o ignora la disponibilidad afectada.

**Por qué parece razonable:**

Parece más simple operar con certeza total o no operar.

**Problema real:**

La confianza operacional tiene niveles intermedios con diferentes implicaciones prácticas.

Tratar cualquier reducción de confianza como falta total de confianza exagera las restricciones operacionales.

El operador pierde acceso a información que, aunque imperfecta, tiene valor operacional real.

**Dirección correcta:**

La confianza es un atributo gradual.

El sistema comunica el nivel de confianza con contexto suficiente para que el operador tome decisiones informadas, sin bloquear automáticamente.

---

## AP-09 — MERMA COMO ERROR

**Cómo aparece:**

El sistema trata toda diferencia entre disponibilidad esperada y disponibilidad real como un error que debe ser investigado y corregido.

La merma operacional normal aparece como anomalía permanente en el sistema.

**Por qué parece razonable:**

Parece correcto que cualquier diferencia entre lo que debería haber y lo que hay sea un problema a resolver.

**Problema real:**

La merma operacional normal es una condición del negocio, no un error del sistema.

Tratar toda merma como error genera ruido constante de alertas y desgasta la atención operacional sobre diferencias que sí requieren investigación.

El operador aprende a ignorar las alertas porque la mayoría son merma normal, y pierde sensibilidad ante las que son pérdida real.

**Dirección correcta:**

El sistema distingue entre merma dentro del rango operacional esperado y pérdida real fuera de ese rango.

La merma esperada es un evento de primera clase con su propio tipo operacional, no un error de disponibilidad.

---

## AP-10 — OVERRIDE COMO CORRUPCIÓN

**Cómo aparece:**

El sistema trata cualquier operación que supera un límite de disponibilidad como un error o corrupción.

El override contextual del operador no tiene representación formal: o no existe o se registra como anomalía.

**Por qué parece razonable:**

Parece que si el sistema tiene reglas, las excepciones deberían eliminarse, no formalizarse.

**Problema real:**

Las operaciones reales incluyen legítimamente situaciones que los límites del sistema no anticipan.

Un operador que conoce el contexto real puede tener razones válidas para comprometer disponibilidad que el sistema marca como insuficiente.

Sin override formal, el operador busca workarounds que destruyen la trazabilidad completamente.

**Dirección correcta:**

El override contextual es una operación de primera clase con trazabilidad explícita: quién, cuándo, sobre qué, con qué justificación.

El sistema habilita el override con visibilidad, no lo elimina ni lo ignora.

---

## AP-11 — REPOSICIÓN SIN CAUSALIDAD

**Cómo aparece:**

Las entradas de reposición se registran como incrementos simples de disponibilidad sin vínculo causal con la orden de compra, el proveedor, o el contexto que las originó.

**Por qué parece razonable:**

Simplifica el registro: el operador solo aumenta el número.

**Problema real:**

Sin causalidad, no es posible saber qué orden de compra generó esta entrada.

Las discrepancias con proveedores no pueden trazarse.

Las reposiciones parciales no tienen contexto de qué falta por llegar.

**Dirección correcta:**

Toda reposición tiene causalidad trazable desde el origen del requerimiento hasta la entrada de disponibilidad.

La reposición es un evento con contexto, no un ajuste numérico.

---

## AP-12 — RECONCILIACIÓN COMO EVENTO DE ERROR

**Cómo aparece:**

El sistema trata la reconciliación entre runtimes divergentes como una situación excepcional de error que requiere intervención manual de soporte técnico.

**Por qué parece razonable:**

Si el sistema fuera perfecto, no habría divergencias que reconciliar.

**Problema real:**

En sistemas edge-first con operación real, la divergencia es una condición normal, no un error.

Tratar la reconciliación como excepción significa que nunca está diseñada correctamente para el volumen real de divergencias.

El sistema colapsa operacionalmente cuando la reconciliación es frecuente, porque el proceso no escala.

**Dirección correcta:**

La reconciliación es un mecanismo operacional de primera clase, diseñado para ejecutarse con frecuencia y sin intervención manual en el caso común.

La divergencia es normal. La reconciliación es el proceso normal de convergencia.

---

## RESUMEN DE ANTI-PATRONES

| Código | Anti-patrón | Riesgo principal |
|---|---|---|
| AP-01 | Disponibilidad como contador mutable | Pérdida de trazabilidad y causalidad |
| AP-02 | Snapshot absoluto como fuente de verdad | Imposibilidad de reconciliación y reinterpretación |
| AP-03 | Bloqueo automático por límite rígido | Paralización operacional sin contexto humano |
| AP-04 | Sincronización como requisito bloqueante | Dependencia de conectividad permanente |
| AP-05 | Exactitud inmediata sobre continuidad | Paralización por exigencia inalcanzable |
| AP-06 | Corrección destructiva de historia | Pérdida de trazabilidad e integridad histórica |
| AP-07 | Disponibilidad global sin contexto | Decisiones incorrectas por falta de contexto operacional |
| AP-08 | Confianza binaria | Bloqueos exagerados por reducción parcial de confianza |
| AP-09 | Merma como error | Ruido operacional que oculta pérdidas reales |
| AP-10 | Override como corrupción | Workarounds sin trazabilidad que destruyen el modelo |
| AP-11 | Reposición sin causalidad | Imposibilidad de trazar discrepancias con proveedores |
| AP-12 | Reconciliación como evento de error | Proceso de convergencia que no escala operacionalmente |

---

# 44. PREGUNTAS DE VALIDACIÓN DEL DOMINIO

## PROPÓSITO

Estas preguntas permiten validar que una decisión de diseño, una implementación concreta, o una propuesta de cambio respeta la filosofía operacional del dominio.

No son preguntas teóricas.

Son preguntas que se responden mirando el código, el modelo de datos, o el comportamiento observado en runtime.

Una respuesta negativa no bloquea automáticamente, pero sí exige una justificación explícita antes de continuar.

---

## GRUPO 1 — MODELO DE DISPONIBILIDAD

**PV-01** ¿La disponibilidad es una proyección sobre eventos, o un campo mutable que se modifica directamente?

Si es un campo mutable, revisar AP-01.

**PV-02** ¿La consulta de disponibilidad incluye el contexto operacional (runtime, ubicación, estado) o devuelve un número global?

Si devuelve un número global sin contexto, revisar AP-07.

**PV-03** ¿La disponibilidad puede ser consultada sin conectividad al núcleo central?

Si no puede, revisar AP-04 y el principio 10 (edge-first).

**PV-04** ¿El modelo distingue entre existencia física y disponibilidad operacional?

Si trata ambos como equivalentes, revisar el principio 4 y el glosario.

---

## GRUPO 2 — EVENTOS Y CAUSALIDAD

**PV-05** ¿Todo cambio de disponibilidad genera un evento con causa identificable?

Si hay cambios sin evento causal, revisar el principio 3 y AP-01.

**PV-06** ¿Los eventos pasados son inmutables?

Si pueden modificarse o eliminarse, revisar AP-06.

**PV-07** ¿Las correcciones operacionales generan nuevos eventos de ajuste con causalidad, en lugar de sobrescribir eventos anteriores?

Si sobrescriben, revisar AP-06.

**PV-08** ¿Es posible reconstruir el estado de disponibilidad de cualquier ítem en cualquier momento pasado a partir del log de eventos?

Si no es posible, el modelo de eventos tiene una brecha de trazabilidad.

---

## GRUPO 3 — CONTINUIDAD OPERACIONAL

**PV-09** ¿El runtime puede continuar operando cuando la sincronización falla o está degradada?

Si no puede, revisar AP-04 y el principio 10.

**PV-10** ¿El sistema señaliza presión operacional con contexto para que el operador decida, en lugar de bloquear automáticamente?

Si bloquea sin contexto humano, revisar AP-03 y AP-05.

**PV-11** ¿El override contextual del operador tiene representación formal con trazabilidad?

Si no existe o se trata como anomalía, revisar AP-10.

**PV-12** ¿La operación de CAPA 0 (disponibilidad simple) funciona íntegramente aunque fallen las capas superiores?

Si no, hay una violación del invariante raíz de no-ruptura de capas.

---

## GRUPO 4 — CONFIANZA Y PRESIÓN OPERACIONAL

**PV-13** ¿La confianza operacional tiene niveles intermedios o es binaria (confiable / no confiable)?

Si es binaria, revisar AP-08.

**PV-14** ¿El operador tiene visibilidad explícita del nivel de confianza al tomar decisiones sobre disponibilidad?

Si no la tiene, el modo degradado no cumple su función operacional.

**PV-15** ¿La merma operacional normal tiene un tipo de evento propio diferenciado del error de registro?

Si no, revisar AP-09.

**PV-16** ¿Las señales de presión (escasez, expiración, confianza baja) son preventivas y contextuales, no reactivas y bloqueantes?

Si son bloqueantes, revisar AP-03 y el principio 15.

---

## GRUPO 5 — RECONCILIACIÓN Y DIVERGENCIA

**PV-17** ¿La divergencia entre runtimes se trata como condición operacional normal o como estado de error?

Si se trata como error, revisar AP-12 y el principio 10.

**PV-18** ¿La reconciliación genera eventos de convergencia con causalidad, en lugar de sobrescribir el estado de alguno de los runtimes?

Si sobrescribe, revisar AP-06 y AP-12.

**PV-19** ¿El proceso de reconciliación está diseñado para ejecutarse frecuentemente y sin intervención manual en el caso común?

Si requiere intervención manual frecuente, revisar AP-12.

**PV-20** ¿Las operaciones realizadas bajo baja confianza quedan marcadas con el contexto de confianza vigente en el momento?

Si no, la trazabilidad de la reconciliación posterior será incompleta.

---

## GRUPO 6 — TRANSFORMACIONES

**PV-21** ¿La relación causal entre insumo y derivado en una transformación es trazable en el log de eventos?

Si no, revisar el principio 14.

**PV-22** ¿El estado intermedio de una transformación activa es visible al operador que la gestiona?

Si es invisible hasta completarse, revisar la tensión T-07 en el documento de evolución.

**PV-23** ¿La disponibilidad en estado intermedio de transformación no puede ser comprometida por otras operaciones?

Si puede comprometerse, hay un riesgo de sobrecompromiso desde estado intermedio.

**PV-24** ¿El rendimiento real de las transformaciones queda registrado para contraste posterior con el rendimiento esperado?

Si no, revisar AP-09 y el principio 14.

---

## GRUPO 7 — COMPLEJIDAD Y CAPAS

**PV-25** ¿Las capacidades activas en el sistema responden a problemas operacionales reales ya presentes en el negocio?

Si hay capacidades activas sin problema operacional que las justifique, revisar el protocolo de decisión de capas (sección 8 del documento de evolución).

**PV-26** ¿La activación de la capa actual no rompió ninguna capacidad de las capas anteriores?

Si algo dejó de funcionar en capas inferiores, revisar el invariante raíz de no-ruptura.

**PV-27** ¿La nueva complejidad introducida puede revertirse si genera problemas sin pérdida operacional crítica?

Si no puede revertirse, la activación requería validación más exhaustiva antes de proceder.

**PV-28** ¿La superficie operacional que el operador ve permanece simple aunque la complejidad interna haya aumentado?

Si la complejidad interna se filtró a la experiencia del operador, revisar el principio 20.

---

## GRUPO 8 — PREGUNTAS DE CIERRE

Preguntas transversales para cualquier propuesta de cambio al dominio:

**PV-29** ¿Si se corta la conectividad ahora mismo, la operación continúa sin degradación visible para el operador?

**PV-30** ¿Si se produce un error de registro ahora mismo, es posible corregirlo sin destruir la historia operacional?

**PV-31** ¿Si se incorpora un nuevo runtime mañana, puede reconciliarse con los eventos existentes sin intervención manual extraordinaria?

**PV-32** ¿Si el negocio creciera al doble de volumen operacional, el modelo escala sin reescrituras destructivas?

Una respuesta negativa a cualquiera de estas cuatro preguntas indica que el diseño tiene una brecha arquitectónica que debe resolverse antes de avanzar.

---

## USO RECOMENDADO

Usar estas preguntas en tres momentos:

**Antes de diseñar:** identificar qué invariantes debe respetar la solución.

**Antes de implementar:** verificar que el diseño propuesto responde afirmativamente a las preguntas relevantes.

**Antes de consolidar:** confirmar que el comportamiento observado en runtime valida las respuestas afirmativas del diseño.

---

# 45. MAPA DE RELACIONES ENTRE PRINCIPIOS

## PROPÓSITO

Este mapa muestra cómo los 20 principios fundacionales se relacionan entre sí: cuáles son raíz, cuáles derivan, cuáles se refuerzan mutuamente, cuáles están en tensión, y cuáles son transversales al conjunto.

El mapa no reemplaza la lectura de cada principio.

Permite navegar el sistema de principios como una estructura coherente, no como una lista independiente.

---

## ÁRBOL DE DERIVACIÓN

El principio raíz es **P1 — Inventario ≠ stock**.

Todo el sistema de principios deriva de esta afirmación central.

```text
P1 — INVENTARIO ≠ STOCK (raíz)
│
├── P2 — FILOSOFÍA OPERACIONAL
│     Continuidad responsable como marco de la filosofía de P1
│
├── P3 — MOVIMIENTO COMO VERDAD PERSISTENTE
│     Mecanismo concreto que hace operacional a P1
│     │
│     ├── P4 — DISPONIBILIDAD CONTEXTUAL
│     │     La disponibilidad es proyección sobre eventos de P3
│     │     │
│     │     ├── P5 — ALMACÉN COMO CONTEXTO OPERACIONAL
│     │     │     La ubicación como dimensión de P4
│     │     │
│     │     ├── P6 — OWNERSHIP OPERACIONAL
│     │     │     La responsabilidad contextual de P4
│     │     │
│     │     ├── P7 — RESERVAS OPERACIONALES
│     │     │     Estados de disponibilidad de P4
│     │     │
│     │     ├── P15 — CONFIANZA OPERACIONAL
│     │     │     La certeza como atributo de P4
│     │     │
│     │     └── P17 — PRIORIDAD OPERACIONAL
│     │           Arbitraje sobre P4 bajo escasez
│     │
│     ├── P8 — INVENTARIO COMO SISTEMA TEMPORAL
│     │     La dimensión temporal de los eventos de P3
│     │
│     ├── P9 — MATERIALIZACIÓN OPERACIONAL
│     │     Conversión de compromiso en evento definitivo de P3
│     │
│     └── P16 — RECONCILIACIÓN FÍSICA
│           Convergencia entre eventos de P3 y realidad física
│
├── P10 — EDGE-FIRST OPERATIONAL RUNTIME
│     Autonomía operacional que respeta P1 sin conectividad
│     │
│     └── P11 — NUBE COMO CAPA DE COORDINACIÓN
│           La nube como sincronización eventual de P10,
│           no como fuente de verdad
│
├── P14 — TRANSFORMACIONES OPERACIONALES
│     Causalidad entre P3 de insumos y P3 de derivados
│
├── P19 — INVENTARIO COMO SISTEMA HUMANO
│     La dimensión humana de P1: el operador como actor central
│
└── P20 — COMPLEJIDAD INTERNA + SIMPLICIDAD OPERACIONAL
      La forma en que P1 debe manifestarse en la superficie operacional
```

---

## CLUSTERS SEMÁNTICOS

Los 20 principios se agrupan en cuatro clusters según su función en el modelo:

### CLUSTER FUNDACIONAL

Principios que definen la naturaleza y filosofía del dominio.

```text
P1  — Inventario ≠ stock
P2  — Filosofía operacional
P3  — Movimiento como verdad persistente
P19 — Inventario como sistema humano
P20 — Complejidad interna + simplicidad operacional
```

Todo diseño debe ser coherente con este cluster antes que con cualquier otro.

### CLUSTER MODELO DE DISPONIBILIDAD

Principios que definen cómo se modela, proyecta y opera la disponibilidad.

```text
P4  — Disponibilidad contextual
P5  — Almacén como contexto operacional
P6  — Ownership operacional
P7  — Reservas operacionales
P8  — Inventario como sistema temporal
P9  — Materialización operacional
```

Este cluster es la implementación operacional del cluster fundacional.

### CLUSTER RUNTIME OPERACIONAL

Principios que definen cómo el sistema opera bajo condiciones reales: conectividad imperfecta, confianza variable, divergencia entre runtimes.

```text
P10 — Edge-first operational runtime
P11 — Nube como capa de coordinación
P15 — Confianza operacional
P16 — Reconciliación física
```

Este cluster es el que diferencia a DISATEQ de un sistema ERP clásico.

### CLUSTER OPERACIONES ESPECIALIZADAS

Principios que cubren operaciones específicas del dominio que no encajan en los clusters anteriores pero deben respetar todos ellos.

```text
P12 — Precisión operacional y tributaria
P13 — Unidades operacionales flexibles
P14 — Transformaciones operacionales
P17 — Prioridad operacional
P18 — Reposiciones
```

---

## RELACIONES DE REFUERZO

Pares o grupos de principios que se refuerzan mutuamente: cuando uno se respeta, el otro también.

| Relación | Principios | Cómo se refuerzan |
|---|---|---|
| Verdad + Proyección | P3 + P4 | Los eventos de P3 son la fuente de la proyección de P4 |
| Contexto + Ownership | P4 + P6 | La disponibilidad contextual de P4 hace posible el ownership de P6 |
| Contexto + Reservas | P4 + P7 | Los estados de P7 son estados de la disponibilidad contextual de P4 |
| Edge + Confianza | P10 + P15 | La operación autónoma de P10 genera degradación de confianza que P15 formaliza |
| Edge + Reconciliación | P10 + P16 | La divergencia de P10 requiere la reconciliación de P16 |
| Nube + Reconciliación | P11 + P16 | La sincronización de P11 alimenta la reconciliación de P16 |
| Confianza + Reconciliación | P15 + P16 | La reconciliación de P16 restaura la confianza de P15 |
| Temporal + Materialización | P8 + P9 | El tiempo de P8 determina el momento de materialización de P9 |
| Humano + Simplicidad | P19 + P20 | La superficie simple de P20 sirve al operador humano de P19 |
| Transformación + Verdad | P14 + P3 | Las transformaciones de P14 son eventos de P3 con causalidad doble |

---

## RELACIONES DE TENSIÓN

Pares de principios que tiran en direcciones opuestas en situaciones concretas.

Estas tensiones no anulan ninguno de los dos principios: deben navegarse con criterio, no resolviendo eliminando un polo.

| Tensión | Principios | Naturaleza del conflicto |
|---|---|---|
| Continuidad vs Exactitud | P2 + P12 | Operar sin certeza plena (P2) vs precisión operacional y tributaria (P12) |
| Autonomía vs Convergencia | P10 + P11 | Runtime autónomo (P10) vs coordinación eventual con nube (P11) |
| Inmutabilidad vs Corrección | P3 + P12 | Eventos inmutables (P3) vs necesidad de corregir errores de registro (P12) |
| Confianza vs Continuidad | P15 + P2 | Certeza antes de comprometer (P15) vs no detener la operación (P2) |
| Simplicidad vs Riqueza contextual | P20 + P4 | Superficie operacional simple (P20) vs disponibilidad contextual compleja (P4) |
| Ownership vs Continuidad | P6 + P2 | Responsabilidad contextual estricta (P6) vs operar aunque el responsable no esté disponible (P2) |

Ver tensiones arquitectónicas completas en `inventory-operational-evolution.md`, sección 9.

---

## PRINCIPIOS TRANSVERSALES

Tres principios no pertenecen a ningún cluster específico porque aplican a todos:

**P2 — Filosofía operacional**

Es el marco de decisión de todo el dominio.

Cuando hay conflicto entre principios, P2 establece que la continuidad operacional responsable es el criterio de desempate.

**P19 — Inventario como sistema humano**

Recuerda que el destinatario final de todo el modelo es el operador humano.

Un diseño técnicamente correcto pero inoperable para el humano viola P19.

**P20 — Complejidad interna + simplicidad operacional**

Establece que la complejidad del modelo interno es aceptable solo si no se filtra a la superficie operacional.

Un modelo con 20 principios interdependientes debe presentarse al operador como una experiencia directa y simple.

---

## PRINCIPIOS CON MAYOR NÚMERO DE DEPENDENCIAS

Los principios más conectados son los más críticos para la coherencia del modelo.

Modificar uno de estos sin revisar sus dependientes genera inconsistencias arquitectónicas.

| Principio | Dependientes directos | Relevancia |
|---|---|---|
| P1 — Inventario ≠ stock | Todos (raíz) | No modificable sin replantear el dominio completo |
| P3 — Movimiento como verdad | P4, P8, P9, P14, P16 | Base del modelo de eventos |
| P4 — Disponibilidad contextual | P5, P6, P7, P15, P17 | Base del modelo de disponibilidad |
| P10 — Edge-first | P11, P15, P16 | Base del modelo de runtime operacional |
| P2 — Filosofía operacional | Transversal | Marco de decisión de todo conflicto |

---

## USO DEL MAPA

**Al diseñar una nueva capacidad:** identificar en qué cluster opera y qué principios debe respetar obligatoriamente.

**Al detectar una inconsistencia:** usar el árbol de derivación para encontrar qué principio está siendo violado y cuáles dependientes se ven afectados.

**Al navegar una tensión:** usar la tabla de tensiones para identificar el par en conflicto y referir a la sección 9 del documento de evolución para los criterios de navegación.

**Al evaluar un cambio de modelo:** verificar que los principios de mayor número de dependencias no sean alterados sin revisión explícita de sus dependientes.

---

# 46. CRITERIOS DE COMPLETITUD DEL DOMINIO

## PROPÓSITO

Este documento describe un dominio en construcción.

La completitud no es un estado final: el dominio evoluciona con el negocio.

Pero existe un umbral mínimo de completitud que habilita avanzar de la fase de modelado semántico a la siguiente fase de implementación.

Esta sección define ese umbral con criterios verificables, no con sensaciones de "está listo".

---

## LO QUE COMPLETITUD NO ES

Antes de los criterios, es necesario aclarar qué no constituye completitud en este dominio.

**Completitud no es exhaustividad de escenarios.**

No es necesario documentar todos los escenarios posibles del negocio para avanzar.

Los escenarios cubren situaciones canónicas que revelan comportamiento del modelo, no un catálogo de todos los casos.

**Completitud no es ausencia de puntos abiertos.**

Los puntos abiertos son normales en un dominio vivo.

Su presencia indica honestidad sobre el alcance actual, no incompletitud del modelo.

**Completitud no es implementación técnica.**

El modelo semántico puede estar completo antes de que exista una sola línea de código de implementación.

La completitud aquí se refiere al marco conceptual y filosófico, no al runtime.

**Completitud no es estabilidad permanente.**

Un modelo completo puede evolucionar cuando el negocio lo requiere.

Completitud significa que el modelo es suficientemente estable para guiar decisiones de implementación sin ambigüedad frecuente.

---

## DIMENSIONES DE COMPLETITUD

La completitud del dominio se evalúa en cinco dimensiones independientes.

Cada dimensión tiene criterios verificables.

El dominio puede estar completo en algunas dimensiones y en progreso en otras.

---

### DIMENSIÓN 1 — COMPLETITUD FILOSÓFICA

El marco filosófico es completo cuando:

* El principio raíz (P1) es estable y no requiere revisión frecuente
* Las tensiones entre principios están identificadas y tienen criterios de navegación
* Hay consenso sobre qué problemas el dominio resuelve y cuáles no resuelve
* Un nuevo integrante puede leer los principios y tomar decisiones coherentes con la filosofía sin preguntar a los autores originales

Indicador de incompletitud filosófica:

Dos decisiones de diseño independientes tomadas con los mismos principios producen resultados contradictorios.

---

### DIMENSIÓN 2 — COMPLETITUD SEMÁNTICA

El vocabulario es completo cuando:

* Los términos críticos del dominio tienen definición operacional propia en el glosario
* No existen términos usados en los escenarios o principios que no estén definidos o sean ambiguos
* Dos personas leen el mismo escenario y llegan a la misma interpretación del comportamiento esperado
* Los anti-patrones están documentados con suficiente precisión para reconocerlos al verlos

Indicador de incompletitud semántica:

Una discusión sobre un escenario se bloquea porque dos personas usan el mismo término con significados diferentes.

---

### DIMENSIÓN 3 — COMPLETITUD DE ESCENARIOS

La cobertura de escenarios es suficiente cuando:

* Los escenarios cubren todas las situaciones operacionales que generan comportamiento no obvio del modelo
* Cada principio fundacional tiene al menos un escenario que lo pone a prueba en condición límite
* Los escenarios de mayor riesgo operacional (divergencia, reconciliación, escasez, override) tienen comportamiento esperado documentado
* Las preguntas de validación (sección 44) pueden responderse con referencia a escenarios específicos

Indicador de incompletitud de escenarios:

Al diseñar una capacidad concreta, surge frecuentemente una situación operacional sin escenario de referencia y el diseño no tiene orientación sobre cómo proceder.

---

### DIMENSIÓN 4 — COMPLETITUD DE VALIDACIÓN

El sistema de validación es suficiente cuando:

* Existe un conjunto de preguntas que permiten evaluar si una propuesta de diseño respeta el modelo
* Los anti-patrones están documentados con suficiente detalle para reconocerlos en propuestas reales
* El protocolo de decisión de capas permite tomar decisiones de activación con criterio, no con intuición
* El mapa de relaciones permite identificar el impacto de cambiar un principio sobre sus dependientes

Indicador de incompletitud de validación:

Una propuesta de diseño que viola la filosofía del dominio pasa revisión sin que nadie la detecte.

---

### DIMENSIÓN 5 — COMPLETITUD OPERACIONAL

El modelo es operacionalmente completo cuando:

* El modelo puede guiar la implementación de CAPA 0 sin ambigüedad
* Las materializaciones runtime de CAPA 0 están identificadas con suficiente claridad para implementarlas
* El protocolo de decisión permite determinar cuándo activar CAPA 1 en el contexto del negocio real
* Las preguntas PV-29 a PV-32 (cierre) pueden responderse afirmativamente para el diseño de CAPA 0

Esta es la dimensión que habilita el avance a implementación.

Las otras cuatro dimensiones pueden estar en progreso; esta debe estar completa para que la implementación tenga base sólida.

Indicador de incompletitud operacional:

Al intentar implementar CAPA 0, surgen decisiones frecuentes que el modelo no orienta y que generan inconsistencias entre implementadores.

---

## ESTADO ACTUAL DE COMPLETITUD

Evaluación del estado actual del dominio al momento de redactar esta sección:

| Dimensión | Estado | Notas |
|---|---|---|
| Filosófica | En consolidación | 20 principios estables · tensiones identificadas · mapa de relaciones completo |
| Semántica | En consolidación | Glosario con 26 términos · puntos abiertos en términos de CAPA 3+ |
| Escenarios | En progreso | 17 escenarios canónicos (26–42) · 13 escenarios evolutivos · cobertura de situaciones críticas |
| Validación | Completa para fase actual | 32 preguntas · 12 anti-patrones · protocolo de decisión de capas |
| Operacional | En progreso | CAPA 0 orientada · materializaciones identificadas · sin decisiones de implementación final |

---

## UMBRAL MÍNIMO PARA AVANZAR A IMPLEMENTACIÓN

El dominio está listo para iniciar implementación de CAPA 0 cuando:

1. **Dimensión filosófica:** los principios P1, P3, P4, P10 son estables y no tienen ambigüedad activa
2. **Dimensión semántica:** disponibilidad operacional, evento, movimiento, causalidad y contexto operacional tienen definición operacional inequívoca
3. **Dimensión de escenarios:** los escenarios 26, 27, 28 (venta offline, reserva concurrente, reconciliación) tienen comportamiento esperado e invariantes completos
4. **Dimensión de validación:** las preguntas PV-01 a PV-12 (grupos 1–3) pueden responderse sobre el diseño propuesto
5. **Dimensión operacional:** las materializaciones runtime de CAPA 0 están definidas y el modelo de eventos mínimo está especificado

Estos cinco criterios son necesarios.

No se puede compensar la ausencia de uno con fortaleza en otro.

---

## CRITERIOS DE REVISIÓN POSTERIOR

Una vez iniciada la implementación, el modelo semántico debe revisarse cuando:

* Una decisión de implementación no puede tomarse con referencia al modelo actual
* Una situación operacional real genera comportamiento que ningún escenario orientó
* Un nuevo anti-patrón aparece en el código que no está documentado
* Una tensión arquitectónica genera un bug o inconsistencia real en producción
* El negocio cambia de forma que invalida un principio o escenario existente

La revisión no reinicia el modelo.

Genera una actualización puntual en la sección correspondiente con trazabilidad del motivo.

---
