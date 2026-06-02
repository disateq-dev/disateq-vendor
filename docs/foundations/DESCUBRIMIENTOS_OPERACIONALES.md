# Descubrimientos Operacionales — DISATEQ VENDOR™

Registro de realidades operacionales identificadas mediante el Método DISATEQ de Descubrimiento Operacional.

Metodología: [METODO_DESCUBRIMIENTO_OPERACIONAL.md](METODO_DESCUBRIMIENTO_OPERACIONAL.md)

---

## Descubrimientos Preliminares (Auditoría Inicial)

Los descubrimientos 1–8 surgieron de la auditoría operacional inicial.
Se documentan aquí en forma mínima a partir de los hallazgos consolidados.

---

# Descubrimiento 1
## El Principio de Persistencia Operacional como criterio de validación

### Conclusión

Las realidades operacionales fundacionales se revelan por su capacidad de sobrevivir transformaciones significativas del negocio, no por su clasificación administrativa.

---

# Descubrimiento 2
## Producto sobrevive como realidad operacional fundacional

### Conclusión

Producto supera la Prueba de Persistencia Operacional.

Permanece reconocible bajo cambios de dueño, marca, razón social y catálogo.

---

# Descubrimiento 3
## Turno sobrevive como realidad operacional fundacional

### Conclusión

Turno supera la Prueba de Persistencia Operacional.

Representa la unidad de responsabilidad operacional con apertura, cierre y operador asignado.

---

# Descubrimiento 4
## Empresa como convergencia de identidades

### Observación

Empresa no debe asumirse como realidad operacional simple.

Es una convergencia de identidades: legal, comercial, fiscal, operacional y humana.

Cada identidad puede evolucionar de forma independiente.

---

# Descubrimiento 5
## Identidad histórica como requisito de trazabilidad

### Observación

La identidad operacional debe preservarse históricamente.

Los cambios de nombre, razón social o marca no deben destruir la trazabilidad de operaciones previas.

---

# Descubrimiento 6
## Áreas operacionales son contextuales al rubro

### Observación

Las áreas operacionales (producción, distribución, almacén, etc.) no son universalizables.

Su existencia y forma dependen del tipo de negocio.

No deben imponerse como estructura universal.

---

# Descubrimiento 7
## Fenómenos operacionales muestran mayor universalidad que estructuras

### Observación

Los fenómenos (disponibilidad, continuidad, reconciliación, causalidad) son más estables y universales que las estructuras administrativas que los contienen.

---

# Descubrimiento 8
## Método DISATEQ de Descubrimiento Operacional formalizado

### Conclusión

El método de auditoría operacional queda formalizado como herramienta de validación antes de promover cualquier concepto a fundación operacional, dominio principal o contexto delimitado.

---

> Descubrimientos 9 y 10 no están formalmente documentados.

---

## Descubrimientos Formales (Metodología Aplicada)

A partir del Descubrimiento 11 se aplica el método completo con observación, evidencia, conclusión e impacto.

---

# Descubrimiento 11
## Disponibilidad representa capacidad operacional efectiva

### Observación

La operación distingue claramente entre la existencia de un producto o servicio y su disponibilidad.

Un producto o servicio puede existir y no estar disponible para la operación.

### Evidencia

Escenarios observados:

- Producto agotado.
- Producto reservado.
- Producto bloqueado.
- Producto vencido.
- Servicio sin capacidad operativa.
- Servicio temporalmente suspendido.

En todos los casos la realidad observada por la operación no es la existencia, sino la capacidad efectiva de compromiso.

### Conclusión Provisional

Disponibilidad representa la capacidad operacional efectiva de productos y servicios para ser comprometidos por la operación en un momento determinado.

### Impacto

Disponibilidad no debe confundirse con:

- Producto
- Inventario
- Stock
- Reserva
- Ubicación

Estas realidades pueden afectar la disponibilidad, pero no la definen.

---

# Descubrimiento 12
## Abastecimiento existe para garantizar continuidad operacional mediante disponibilidad

### Observación

La operación no abastece por abastecer.

La operación abastece para preservar, recuperar o incrementar disponibilidad.

### Evidencia

Escenarios observados:

- Compra de productos.
- Recepción de mercadería.
- Reposición.
- Producción.
- Transferencias internas.
- Redistribución.

Aunque los mecanismos cambian, el propósito permanece.

### Conclusión Provisional

Abastecimiento representa la capacidad operacional orientada a preservar, recuperar o incrementar disponibilidad para garantizar continuidad operacional.

### Impacto

Compras, recepciones, transferencias, producción y redistribución deben entenderse como mecanismos operacionales.

La continuidad operacional constituye el propósito.

### Observación Adicional

Abastecimiento muestra señales de comportarse como una capacidad operacional más que como una realidad fundacional.

Esta hipótesis requiere auditorías posteriores.

---

# Descubrimiento 13
## Bloque Operacional existe como entidad operacional independiente

### Observación

La operación organiza las cajas en grupos funcionales
que poseen reglas propias de disponibilidad secuencial.

Cada grupo opera de forma autónoma durante la jornada.

Los grupos pueden existir sin operador asignado.

Los grupos sobreviven a cambios de operador, dueño y configuración.

### Evidencia

El concepto fue encontrado ya implementado implícitamente
en cinco componentes independientes del sistema:

- `OperatorRecord.blockBase` — referencia desde el operador al bloque
- `BOX_DEFS` — catálogo de cajas organizado por bloque implícito
- `CajasWorkspace.OperationalBlock` — tipo modelado con ciclo de vida propio
- `CashWorkspace.operatorBoxes` — filtrado de cajas por bloque en runtime
- `session-history` — historial filtrado por bloque para actividad reciente

Ninguno de estos componentes se coordinó explícitamente.

La convergencia evidencia descubrimiento, no diseño deliberado.

### Conclusión Provisional

Bloque Operacional es una entidad operacional que:

- agrupa cajas bajo reglas de disponibilidad secuencial propias
- puede existir sin operador asignado
- posee ciclo de vida propio: Disponible → Asignado → En Uso → Liberado → Inactivo
- actúa como unidad de coordinación entre Operadores, Cajas y Turnos

### Impacto

Bloque Operacional no debe confundirse con:

- una caja individual
- una ubicación física
- un atributo del operador
- un atributo del turno

El Bloque Operacional es la fuente de coordinación del dominio Cash.

Coordina qué cajas están disponibles, para qué operador, durante qué jornada.

Ver: [bloque-operacional.md](../architecture/bloque-operacional.md)

---

## Observación Metodológica

Las auditorías de Disponibilidad, Abastecimiento y Bloque Operacional reforzaron hallazgos previos:

- Las fundaciones operacionales se revelan por persistencia.
- Los dominios se revelan por propósito operacional.
- Las entidades operacionales se revelan por convergencia implícita en múltiples dominios.

# Descubrimiento Provisional — Habilitación Operacional de Venta

## Observación

La operación no comercializa productos directamente.

La operación comercializa productos y servicios a través de habilitaciones operacionales de venta que determinan bajo qué modalidades, condiciones y reglas pueden ser comercializados.

---

## Separación Fundamental

### Producto

Responde:

¿Qué es?

Ejemplos:

* Paracetamol
* Pañal Huggies
* Viaje Lima-Cusco
* Pollo a la Brasa
* Consulta Médica

### Habilitación Operacional de Venta

Responde:

¿Cómo puede venderse?

Ejemplos:

#### Farmacia

* Unidad
* Blister
* Caja

#### Restaurante

* 1/8
* 1/4
* 1/2
* Entero
* Combo

#### Ferretería

* Metro
* Rollo

#### Transporte

* VIP
* Estándar
* Primer Piso
* Segundo Piso

#### Retail

* Unidad
* Pack
* Promoción
* Mayorista

#### Servicios

* Consulta Regular
* Consulta Especializada
* Teleconsulta
* Consulta Domiciliaria

---

## Conclusión Provisional

Producto y Habilitación Operacional de Venta representan conceptos distintos.

El producto define la identidad de lo ofertado.

La Habilitación Operacional de Venta define las modalidades bajo las cuales dicha identidad puede ser comercializada.

---

## Propiedades Observadas de una Habilitación Operacional de Venta

Una Habilitación Operacional de Venta puede:

* Activarse
* Desactivarse
* Restringirse
* Modificarse
* Programarse
* Caducar

sin modificar la identidad del producto o servicio.

---

## Prueba de Persistencia

Si desaparece una Habilitación Operacional de Venta:

* El producto continúa existiendo.
* Desaparece una forma específica de comercialización.

Si desaparece el producto:

* Desaparecen todas sus habilitaciones asociadas.

---

# Valor Operacional Asociado

Se observa que una misma Habilitación Operacional de Venta puede poseer múltiples Valores Operacionales Asociados.

Ejemplos:

* Normal
* Oferta
* Preferencial
* Mayorista
* Libre
* Campaña
* Cliente Frecuente

---

## Observación

El Valor Operacional Asociado responde:

¿Qué valor aplica a esta Habilitación Operacional de Venta en este contexto?

El valor no forma parte de la identidad del producto.

El valor no forma parte de la identidad de la Habilitación Operacional de Venta.

Representa una valorización contextual aplicable a una habilitación determinada.

---

## Ejemplo

Paracetamol
↓
Venta por Caja
↓
Valor Normal

Paracetamol
↓
Venta por Caja
↓
Valor Preferencial

Paracetamol
↓
Venta por Caja
↓
Valor Mayorista

La Habilitación Operacional de Venta permanece inalterada.

Lo que cambia es el Valor Operacional Asociado aplicable al contexto.

---

# Intención Operacional de Materialización Comercial

La implementación actualmente denominada Ticket no evidencia una venta materializada.

La evidencia observada muestra operaciones de:

* Agregar
* Quitar
* Modificar
* Dividir
* Anotar
* Limpiar

sin producir todavía efectos comerciales definitivos.

---

## Definición Provisional

La Intención Operacional de Materialización Comercial representa un ámbito operacional temporal donde se agregan Habilitaciones Operacionales de Venta valorizadas con el propósito de materializar posteriormente una operación comercial.

---

## Secuencia Operacional Observada

Producto

↓

Habilitación Operacional de Venta

↓

Valor Operacional Asociado

↓

Intención Operacional de Materialización Comercial

↓

Cobro

↓

Comprobante

---

## Impacto Arquitectónico

El modelo actual:

Producto → Ticket

parece incompleto desde una perspectiva operacional.

La evidencia observada sugiere la existencia de al menos dos capas operacionales no modeladas explícitamente:

* Habilitación Operacional de Venta
* Valor Operacional Asociado

Asimismo, el concepto actual de Ticket requiere reevaluación doctrinal al no existir evidencia suficiente de que represente la realidad operacional principal del dominio.

---

## Estado

Descubrimiento provisional.

Requiere contraste posterior contra:

* Dominio VENTAS
* TicketLineDTO
* ticket.store
* ticket.service
* Sales Workspace
* Flujo de Cobro
