# PURCHASES DOMAIN FOUNDATIONS

## Propósito del documento

Definir las fundaciones semánticas y operacionales del dominio COMPRAS dentro de DISATEQ VENDOR™.

El documento consolida:
- propósito del dominio,
- principios operacionales,
- límites semánticos,
- tensiones estructurales,
- invariantes,
- y criterios de evolución arquitectónica.

Su objetivo es proteger:
- continuidad operacional,
- simplicidad evolutiva,
- desacople entre dominios,
- y coherencia arquitectónica futura.

---

## Propósito del dominio

COMPRAS define el registro progresivo de abastecimiento operacional dentro de DISATEQ VENDOR™.

El dominio existe para:
- preservar continuidad operacional,
- registrar causalidad de abastecimiento,
- mantener contexto comercial suficiente,
- y permitir reconciliación progresiva posterior.

COMPRAS no debe modelarse inicialmente como:
- módulo contable,
- workflow tributario,
- sistema documental rígido,
- ni ERP financiero.

La prioridad del dominio es:
- operación real,
- velocidad operacional,
- tolerancia contextual,
- y degradación elegante.

---

## Realidad operacional

El dominio debe reconocer explícitamente la realidad operacional del pequeño negocio:

- temporalidad imperfecta,
- informalidad comercial,
- pagos desacoplados,
- crédito proveedor,
- recepciones parciales,
- bonificaciones,
- estructuras tributarias mixtas,
- conectividad limitada,
- y documentación incompleta o progresiva.

La arquitectura debe tolerar esta realidad sin perder:
- trazabilidad,
- causalidad,
- ni capacidad posterior de regularización.

---

## Hecho operacional de abastecimiento

El núcleo del dominio es el registro de un hecho operacional de abastecimiento.

Ese hecho puede existir:
- antes del documento,
- antes del pago,
- antes de validación tributaria,
- o antes de conciliación completa.

La causalidad operacional tiene prioridad sobre representación normativa.

---

## Filosofía operacional

Principios fundamentales del dominio:

- captura operacional primero,
- normalización después,
- continuidad operacional antes que completitud documental,
- operación offline-first,
- enriquecimiento externo desacoplado,
- reconstrucción desde causalidad preservada,
- degradación elegante,
- y complejidad progresiva.

El operador actúa como reconciliador contextual de la realidad operacional.

---

## Temporalidad imperfecta

El dominio debe asumir que:
- abastecimiento,
- documento,
- pago,
- conciliación,
- validación,
- y regularización

no ocurren simultáneamente.

La arquitectura debe permitir:
- captura progresiva,
- reconciliación posterior,
- corrección contextual,
- y enriquecimiento evolutivo

sin invalidar causalidad previamente registrada.

---

## Tolerancia operacional

DISATEQ debe permitir continuidad operacional aun cuando la información:
- sea parcial,
- ambigua,
- incompleta,
- o progresivamente reconciliada.

La tolerancia operacional:
- no implica ausencia de estructura,
- no implica pérdida de trazabilidad,
- y no implica inconsistencia arbitraria.

El objetivo es preservar operación real sin rigidizar captura inicial.

---

## Causalidad operacional

El dominio debe preservar:
- qué ocurrió,
- cuándo ocurrió,
- cómo ocurrió,
- y bajo qué contexto operacional sucedió.

Correcciones posteriores no deben destruir:
- historia operacional,
- intención original,
- ni trazabilidad causal.

Evitar modelos basados en sobrescritura destructiva de estado.

---

## Información parcial

COMPRAS debe tolerar:
- proveedor incompleto,
- documento pendiente,
- recepción parcial,
- pagos posteriores,
- tributación incompleta,
- acuerdos informales,
- y regularización progresiva.

La ausencia de completitud documental no debe bloquear abastecimiento operacional legítimo.

---

## Contexto comercial

El dominio debe reconocer:
- bonificaciones,
- promociones,
- compensaciones,
- descuentos,
- devoluciones,
- y crédito proveedor

como parte natural de la operación comercial.

El significado comercial pertenece a COMPRAS.

INVENTARIOS no debe depender de interpretación comercial compleja para preservar existencia y disponibilidad.

---

## Desacople financiero

Abastecimiento y obligación financiera son conceptos distintos.

El ingreso operacional de mercadería:
- no implica pago inmediato,
- no implica conciliación financiera completa,
- y no debe depender de cierre financiero para existir.

El dominio debe tolerar:
- pagos parciales,
- crédito progresivo,
- conciliación posterior,
- y acuerdos operacionales contextualizados.

---

## Representación tributaria

La representación tributaria no debe controlar el núcleo operacional del dominio.

El sistema debe tolerar:
- IGV mixto,
- productos exonerados,
- promociones,
- diferencias tributarias,
- regularización posterior,
- y estructuras documentales imperfectas.

La complejidad tributaria debe permanecer desacoplada del abastecimiento operacional.

---

## Captura progresiva

La captura operacional puede iniciar con información mínima suficiente y enriquecerse posteriormente.

La completitud documental no debe ser requisito para:
- registrar abastecimiento,
- preservar causalidad,
- ni mantener continuidad operacional.

La normalización debe ser progresiva y desacoplada de la captura inicial.

---

## Reconciliación progresiva

El dominio debe permitir reconciliación posterior de:
- documentos,
- pagos,
- recepción,
- costos,
- tributación,
- y contexto proveedor

sin invalidar causalidad previamente registrada.

La regularización no debe destruir historia operacional.

---

## Realidad física prioritaria

Cuando exista divergencia entre:
- documento,
- acuerdo comercial,
- y recepción física,

el sistema debe preservar primero la realidad operacional ocurrida.

La causalidad física no debe perderse por inconsistencias administrativas posteriores.

---

## Captura no bloqueante

La captura operacional debe minimizar bloqueos innecesarios.

Información faltante o pendiente no debe impedir:
- abastecimiento,
- continuidad operacional,
- ni preservación causal,

salvo cuando exista riesgo crítico real para la operación.

---

## Complejidad progresiva

La complejidad debe incorporarse únicamente cuando exista:
- necesidad operacional validada,
- dolor real,
- o evolución contextual comprobada.

Evitar anticipar:
- workflows complejos,
- automatización excesiva,
- modelado financiero avanzado,
- o rigidez tributaria temprana.

---

## Desacople de dominios

Separaciones fundamentales:

- INVENTARIOS → existencia y disponibilidad
- PAGOS/CAJA → movimiento financiero
- COMPROBANTES → representación normativa
- PROVEEDORES → contexto relacional/comercial

COMPRAS conserva:
- abastecimiento operacional,
- causalidad comercial,
- y continuidad de ingreso de mercadería.

---

## Degradación operacional

El dominio debe continuar operando ante:
- falta de internet,
- servicios externos inaccesibles,
- validaciones pendientes,
- documentación incompleta,
- o conciliaciones parciales.

La degradación operacional debe preservar:
- continuidad,
- trazabilidad,
- y capacidad posterior de reconciliación.

---

## Evolución controlada

El dominio debe permitir incorporación futura de:
- automatización,
- integración documental,
- validación avanzada,
- conciliación inteligente,
- y capacidades analíticas

sin romper:
- simplicidad operacional,
- continuidad runtime,
- ni filosofía edge-first.

Las capacidades avanzadas deben actuar como complemento progresivo y nunca como dependencia obligatoria del núcleo operacional.

---

## Anti-patrones

Evitar explícitamente:

- ERPización accidental,
- bloqueo operacional por validación tributaria,
- workflows rígidos,
- obligatoriedad documental prematura,
- acoplamiento duro con servicios externos,
- modelado financiero enterprise,
- sobrescritura destructiva de estado,
- y exigir verdad perfecta al momento de captura.

---

## Invariantes

- La operación nunca debe depender de conectividad externa.
- La causalidad operacional debe preservarse.
- La reconciliación puede ser progresiva.
- La realidad física registrada no debe perderse.
- INVENTARIOS no depende de interpretación comercial compleja.
- La captura operacional debe tolerar información parcial.
- La regularización posterior no debe destruir historia operacional.
- La complejidad debe introducirse progresivamente.
- El sistema debe priorizar continuidad operacional sin perder trazabilidad.
