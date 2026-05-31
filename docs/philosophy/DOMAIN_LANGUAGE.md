# DISATEQ VENDOR™ — Domain Language

---

# Propósito

Este documento estabiliza el lenguaje doctrinal y operacional de DISATEQ VENDOR™.

Su objetivo es:

- evitar deriva semántica
- evitar ERPización accidental
- preservar coherencia conceptual
- mantener consistencia UX
- alinear humanos e IA
- proteger identidad operacional

---

# Reglas Generales

## El lenguaje visible debe ser

- humano
- operacional
- contextual
- semánticamente claro

---

## Evitar lenguaje innecesariamente corporativo

DISATEQ evita:

- terminología enterprise vacía
- naming burocrático
- lenguaje administrativo innecesario
- nomenclatura ERP clásica cuando no represente operación real

---

# Naming Doctrinal Preferido

| Evitar | Preferir |
|---|---|
| almacén | ubicación operacional |
| stock | disponibilidad operacional |
| ajuste | reconciliación |
| transferencia | continuidad entre ubicaciones |
| validación rígida | control contextual |
| cierre absoluto | convergencia operacional |
| módulo aislado | flujo operacional |
| usuario administrativo | operador |
| error operacional | diferencia operacional |
| zona de caja | Bloque Operacional |
| área de caja | Bloque Operacional |
| estación de trabajo | Bloque Operacional |
| puesto de caja | Bloque Operacional |
| caja secundaria | Caja Auxiliar |
| caja contingencia (tipo X50) | Caja Excepcional |
| perfil de usuario | Rol Operacional |
| nivel de acceso | Rol Operacional |
| permiso | Capacidad Operacional |
| privilegio | Capacidad Operacional |

---

# Conceptos Oficiales

## Continuidad Operacional

Capacidad de mantener operación real activa sin bloqueos innecesarios.

---

## Disponibilidad Operacional

Capacidad contextual real de operar.

No representa únicamente existencia física.

Incluye:

- reservas
- temporalidad
- contexto operacional
- disponibilidad observable
- operación activa

---

## Reconciliación Operacional

Proceso de convergencia posterior de diferencias operacionales.

---

## Flexibilidad Auditable

Capacidad de flexibilizar operación bajo:

- trazabilidad
- responsabilidad observable
- causalidad contextual
- auditabilidad

---

## Convergencia Operacional

Corrección progresiva hacia consistencia operacional sin destruir continuidad operacional.

---

## Complejidad Encapsulada

La sofisticación pertenece a la arquitectura.

No debe trasladarse innecesariamente al operador.

---

## Simplicidad Operacional Visible

La experiencia operacional debe sentirse:

- rápida
- clara
- humana
- contextual
- natural

---

## Control Contextual

El control debe adaptarse al contexto operacional real.

---

## Operación Humana Real

DISATEQ asume:

- diferencias humanas
- urgencias operacionales
- contexto dinámico
- incertidumbre contextual
- necesidad de continuidad

---

# Conceptos de Dominio Cash

## Bloque Operacional

Unidad operacional de infraestructura de caja.

Agrupa un conjunto de cajas bajo reglas de disponibilidad secuencial propias.

Representa el ámbito operacional de caja asignable a un operador.

Puede existir sin operador asignado.

Posee ciclo de vida propio.

No es:

- una caja individual
- una ubicación física
- un atributo del operador
- un atributo del turno

Ver: [bloque-operacional.md](../architecture/bloque-operacional.md)

---

## Categorías de Caja dentro de un Bloque

### Caja Principal

Caja de inicio normal de la jornada.

Sin prerequisitos operacionales.

### Caja Auxiliar

Caja de continuación operacional disponible tras el cierre de la caja anterior.

Requiere motivo.

No es inferior a la Principal — es complementaria y secuencial.

### Caja Excepcional

Caja de apertura de emergencia disponible únicamente cuando la Principal no fue utilizada.

Requiere autorización y motivo.

Su apertura impide iniciar la Principal durante la misma jornada.

No es una continuación del flujo normal — es una modalidad operacional distinta.

---

# Conceptos de Dominio Operador

## Operador

Identidad operacional a la que se atribuye responsabilidad, trazabilidad y acciones dentro del sistema.

Puede tener:

- Rol Operacional asignado
- Bloque Operacional asignado
- Credenciales de acceso asociadas

No es:

- un usuario de sistema
- un empleado o cargo laboral
- un Rol Operacional
- una Credencial
- un Bloque Operacional

---

## Rol Operacional

Función operacional nombrada con un conjunto estándar de capacidades asignadas.

Los roles nombran qué hace el operador en términos operacionales.

Los roles agrupan capacidades para simplificar la configuración.

Un rol sin capacidades asignadas es válido — describe una función sin ampliar el acceso base.

No es:

- una jerarquía de autoridad
- un cargo laboral o nivel organizacional
- un nivel de acceso al sistema
- un gate de módulos

---

## Capacidad Operacional

Acción operacional específica para la que un operador está habilitado.

Las capacidades efectivas de un operador son la unión de:

- capacidades otorgadas por el Rol Operacional asignado
- capacidades asignadas directamente al operador

La definición doctrinal de las capacidades es independiente de los mecanismos de enforcement que cada módulo implemente.

---

## Alias Operacional

Representación humana operacional del Operador.

Se utiliza preferentemente en:

- UI operacional
- tickets
- comprobantes
- impresiones
- identificación rápida dentro de la operación

Evita exponer nombres completos en documentos que pueden circular fuera de la organización.

**Regla de generación:**

`<Inicial Primer Nombre><Primer Apellido>` en mayúsculas.

- Fernando Miguel Tejada Quevedo → FTEJADA
- Carlos Alberto Ramírez Flores → CRAMIREZ
- Miguel Ángel Pérez Soto → MPEREZ

**Resolución de colisiones:**

`<Inicial Primer Nombre><Primer Apellido>_<Inicial Segundo Apellido>`

- Fernando Miguel Tejada Quevedo → FTEJADA_Q
- Francisco Andrés Tejada Ruiz → FTEJADA_R

La resolución de colisiones persistentes es manual.

No utilizar sufijos numéricos automáticos (FTEJADA_2, FTEJADA_3) — reducen legibilidad operacional.

La generación es automática únicamente como valor inicial.

Puede modificarse manualmente si la operación lo requiere.

---

## Código Operador

*Estado: Candidato — pendiente de validación operacional final.*

Referencia documental estable del Operador.

Casos de uso plausibles:

- reportes
- auditoría
- exportaciones
- integraciones futuras
- referencia documental entre sistemas

Formato conceptual: `OP023`

No formalizar como requisito doctrinal obligatorio hasta completar validación operacional.

---

## Separación de Representaciones del Operador

| Representación | Propósito | Estado |
|---|---|---|
| Nombre Completo | Referencia administrativa | Dato referencial |
| Alias Operacional | Representación operacional visible | Aprobado |
| Código Operador | Referencia documental estable | Candidato en evaluación |
| ID Técnico | Persistencia interna del sistema | Implementado |

---

# Reglas de Naming

## El naming debe representar

- intención operacional
- causalidad
- contexto real
- continuidad operacional
- lectura humana rápida

---

## Evitar naming especulativo

No introducir:

- conceptos enterprise innecesarios
- abstracciones prematuras
- naming excesivamente técnico
- nomenclatura ERP heredada sin validación operacional

---

# Naming UX/UI

La UX debe utilizar:

- lenguaje humano
- lenguaje operacional
- semántica contextual
- estados claros
- causalidad visible

Debe evitar:

- mensajes ambiguos
- terminología administrativa innecesaria
- tecnicismo visible
- semántica corporativa genérica

---

# Naming Arquitectónico

La arquitectura interna puede ser sofisticada.

Pero los nombres visibles deben priorizar:

- operación
- continuidad
- claridad contextual
- lectura operacional

---

# IA y Lenguaje

Las IAs deben:

- detectar deriva semántica
- corregir naming ERP accidental
- preservar coherencia doctrinal
- validar consistencia contextual
- proteger identidad operacional

---

# Regla Fundamental

El lenguaje en DISATEQ debe representar operación real.

No estructuras administrativas heredadas.