# DISATEQ VENDOR — BLOQUE OPERACIONAL

## Estado

DOCUMENTO AUTORIDAD — CONCEPTO DOCTRINAL

Formalizado: Mayo 2026
Origen: Auditoría operacional de Operadores, Turnos y Cajas

---

# Definición

Bloque Operacional es una unidad operacional que agrupa un conjunto de cajas
bajo reglas operacionales específicas.

Representa el ámbito operacional de caja asignable a un operador.

No es:

- una caja
- una ubicación física
- un atributo del operador
- un atributo del turno
- una sesión

Es una entidad operacional propia con ciclo de vida independiente.

---

# Principios

Las cajas son consecuencia del bloque.

No se crean manualmente ni de forma aislada.

La estructura operacional del bloque es determinista y generada por el sistema.

Los bloques representan infraestructura operacional administrable.

Un bloque puede existir sin operador asignado.

Un bloque puede existir sin turno activo.

Un bloque no desaparece cuando su operador es dado de baja.

---

# Composición

La estructura del bloque es determinista a partir de su número base.

```
bloque(base) = {
  principal:    base
  auxiliar-1:   base + 1
  auxiliar-2:   base + 2
  excepcional:  base + 50
}
```

Ejemplo — Bloque 100:

- Caja Principal 100
- Caja Auxiliar 01 — 101
- Caja Auxiliar 02 — 102
- Caja Excepcional — 150

Ejemplo — Bloque 600:

- Caja Principal 600
- Caja Auxiliar 01 — 601
- Caja Auxiliar 02 — 602
- Caja Excepcional — 650

---

# Categorías de Caja

## Principal

Inicio normal de la jornada operacional.

Sin prerequisitos.

Sin autorización adicional.

Ejemplos: 100 · 200 · 300 · 500

---

## Auxiliar 01

Disponible después del uso y cierre de la Principal del mismo bloque.

Requiere motivo.

Representa continuación operacional ante cierre anticipado de la Principal.

Ejemplos: 101 · 201 · 301 · 501

---

## Auxiliar 02

Disponible después del uso y cierre de la Auxiliar 01 del mismo bloque.

Requiere motivo.

Representa segunda continuación operacional.

Ejemplos: 102 · 202 · 302 · 502

---

## Excepcional

Disponible únicamente cuando la Principal del bloque no fue utilizada durante la jornada.

Requiere autorización operacional.

Requiere motivo.

Su apertura impide iniciar posteriormente la Principal durante la misma jornada.

Representa apertura de emergencia cuando el flujo normal no puede comenzar.

No es una continuación del flujo normal.

Es una modalidad operacional distinta.

Ejemplos: 150 · 250 · 350 · 550

---

# Reglas Operacionales del Bloque

Las reglas de disponibilidad de cajas dentro de un bloque son internas al bloque.

No son atributos de las cajas individuales.

Son condiciones que dependen del estado de otras cajas del mismo bloque.

## Regla de apertura secuencial

Una caja auxiliar solo puede abrirse si la caja anterior del bloque
fue utilizada y cerrada durante la jornada.

## Regla de apertura excepcional

La caja excepcional solo puede abrirse si la principal del bloque
no fue utilizada durante la jornada.

Al abrirse, impide el inicio posterior de la principal el mismo día.

## Regla de exclusividad diaria

Una caja cerrada no puede reabrirse durante la misma jornada.

El ciclo de cada caja dentro del bloque es:
disponible → abierta → cerrada.

## Regla de aislamiento de ciclo

El ciclo completo del bloque se reinicia al inicio de cada jornada.

---

# Ciclo de Vida del Bloque

```
Creado
  ↓
Disponible
  ↓
Asignado
  ↓
En Uso
  ↓
Liberado
  ↓
Inactivo
```

**Disponible** — el bloque existe sin operador asignado.

**Asignado** — el bloque tiene un operador responsable. Sin turno activo.

**En Uso** — hay un turno activo operando sobre una caja del bloque.

**Liberado** — el operador fue desasignado o dado de baja. El bloque queda libre.

**Inactivo** — el bloque fue desactivado administrativamente.

---

# Relación con Operadores

Un operador puede estar asignado a un Bloque Operacional.

La asignación es estable mientras el operador permanezca activo.

Un operador sin bloque asignado puede existir con funciones transversales.

Al desactivar un operador:

- se conserva historial operacional
- el bloque queda liberado para reasignación
- el bloque no desaparece

El operador no posee el bloque.

El operador es responsable operacional del bloque.

La responsabilidad es asignable y transferible.

---

# Relación con Turnos

Los turnos operan sobre cajas pertenecientes a un bloque.

Un operador opera únicamente cajas pertenecientes a su bloque asignado.

El bloque coordina qué cajas están disponibles para apertura durante la jornada.

El bloque actúa como unidad de filtrado del historial de sesiones:
la actividad reciente visible para el operador corresponde a su bloque.

---

# Relación con Cajas

Las cajas son componentes del bloque, no entidades independientes.

La pertenencia de una caja a un bloque es determinada por la composición del bloque
en el momento de su creación.

Las reglas que gobiernan cuándo una caja puede abrirse
son reglas del bloque, no reglas de la caja individualmente.

---

# Reglas de Historial

Elementos con historial operacional no deben eliminarse.

Si un bloque tuvo actividad operacional:

- conservar historial de sesiones
- permitir desactivación administrativa
- impedir eliminación destructiva

La trazabilidad operacional es permanente.

---

# Documentos Relacionados

- [cash-turno-operational-model.md](cash-turno-operational-model.md) — Modelo operacional de Turnos
- [cash-movements-model.md](cash-movements-model.md) — Movimientos de caja
- [cash-runtime-recovery.md](cash-runtime-recovery.md) — Recuperación operacional
