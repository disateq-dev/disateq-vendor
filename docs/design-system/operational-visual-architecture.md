# ARQUITECTURA OPERACIONAL VISUAL — DISATEQ VENDOR™

## Objetivo

Formalizar la arquitectura operacional visual del entorno DISATEQ VENDOR™.

Este documento define:

* estructura visual operacional
* jerarquía contextual
* semántica de componentes
* comportamiento del runtime
* filosofía UX/UI operacional

IMPORTANTE:

Esta arquitectura NO es estática.

Puede evolucionar con:

* nuevos contextos
* nuevos componentes
* nuevos patrones operacionales
* nuevas necesidades runtime

Por lo tanto:

```txt
este documento representa la filosofía operacional actual
NO una limitación rígida futura
```

---

# PRINCIPIO CENTRAL

DISATEQ VENDOR™ NO debe sentirse como:

* dashboard SaaS
* ERP web clásico
* webapp genérica dentro de desktop
* sistema administrativo inflado

DISATEQ VENDOR™ debe sentirse como:

```txt
software operacional vivo
```

Orientado a:

* desktop-first
* continuidad operacional
* keyboard-first
* resiliencia operacional
* densidad operacional
* baja fricción cognitiva
* runtime vivo

---

# FILOSOFÍA VISUAL OPERACIONAL

Mantener siempre:

* Modern Operational UI
* continuidad visual
* densidad operacional
* microcontexto contextual
* superficies suaves
* semántica operacional del color
* keyboard-first
* desktop-native feel
* continuidad operacional viva

Evitar:

* exceso de whitespace
* dashboards SaaS
* tabs modernas superficiales
* layouts inflados
* glassmorphism excesivo
* UI centrada en decoración
* navegación webapp genérica

---

# ESTRUCTURA OFICIAL DEL ENTORNO

El entorno operacional principal DISATEQ VENDOR™ se compone de:

| Área            | Función                            |
| --------------- | ---------------------------------- |
| Barra de título | Integración ventana Windows/Tauri  |
| TOPBAR          | Identidad operacional superior     |
| CONTEXTBAR      | Navegación operacional principal   |
| SUBCONTEXTBAR   | Subcontexto operacional contextual |
| WORKSPACE       | Área operacional viva              |
| PANELS          | Agrupadores funcionales            |
| SHEETS          | Subvistas operacionales            |
| FOOTBAR         | Estado operacional inferior        |

---

# LOGIN

## IMPORTANTE

El LOGIN:

* pertenece al entorno DISATEQ VENDOR™
* mantiene identidad visual DISATEQ
* mantiene filosofía operacional

PERO:

```txt
opera como ventana independiente
```

con comportamiento distinto al runtime principal.

---

# BARRA DE TÍTULO

## Naturaleza

Barra heredada de Windows/Tauri.

## Función

* mover ventana
* controles sistema
* integración desktop-native

## IMPORTANTE

NO reemplazar innecesariamente con titlebars fake webapp.

Mantener:

```txt
desktop-native feel
```

---

# TOPBAR

## Naturaleza

Barra operacional superior principal.

## Función

Conviven:

* marca DISATEQ VENDOR™
* información negocio
* operador actual
* caja operativa
* turno actual
* estado runtime
* acciones globales
* botón cerrar sistema

## IMPORTANTE

La TOPBAR NO es decorativa.

Representa:

```txt
identidad operacional viva
```

## Debe sentirse

* compacta
* contextual
* estable
* operacional
* siempre presente

---

# CONTEXTBAR

## Naturaleza

Barra principal de navegación operacional.

## Función

Contiene:

```txt
las opciones principales del sistema
```

Ejemplos:

* TURNOS
* VENTAS
* INVENTARIO
* CONFIGURACIÓN
* REPORTES

## IMPORTANTE

La CONTEXTBAR:

```txt
NO trabaja sola
```

Tiene relación directa con:

```txt
SUBCONTEXTBAR
```

---

# SUBCONTEXTBAR

## Naturaleza

Barra contextual secundaria operacional.

## Función

Muestra:

```txt
subcontextos operacionales contextualizados
```

según la opción activa en la CONTEXTBAR.

## Ejemplo

### CONTEXTBAR

```txt
TURNOS
```

### SUBCONTEXTBAR

```txt
CAJAS
OPERADORES
MOVIMIENTOS
ARQUEO
```

## IMPORTANTE

La SUBCONTEXTBAR NO representa tabs SaaS.

Representa:

```txt
subcontextos operacionales reales
```

---

# WORKSPACE

## Naturaleza

Área operacional viva principal.

## Función

Aquí se renderiza la operación real del sistema.

## IMPORTANTE

El WORKSPACE:

```txt
NO es una página estática
```

Es:

```txt
espacio operacional dinámico
```

---

# PANELS

## Naturaleza

Agrupadores funcionales dentro del WORKSPACE.

## Función

Organizan:

* módulos
* operaciones
* flujos
* contextos
* herramientas

## IMPORTANTE

Un Panel puede contener:

* una o múltiples SHEETS
* overlays
* bloques operacionales
* transiciones contextuales

---

# SHEETS

## Naturaleza

Subvistas operacionales completas.

## IMPORTANTE

En DISATEQ:

```txt
SHEET ≠ TAB
```

Una SHEET:

* posee contexto propio
* puede tener layout propio
* puede tener scroll propio
* puede tener acciones propias
* puede tener footbar propia
* puede convivir con otras sheets
* puede mantener independencia operacional

## DISPOSICIÓN

Las SHEETS pueden:

* ocupar todo el WORKSPACE
* dividirse en 2
* dividirse en 3
* dividirse en 4

según necesidad operacional.

## SUPERPOSICIÓN

Las SHEETS pueden:

```txt
montarse unas sobre otras
```

como transición operacional contextual.

## IMPORTANTE

Esto:

```txt
NO es un modal web tradicional
```

Representa:

```txt
continuidad operacional contextual
```

---

# SOBRE TABS

## IMPORTANTE

Actualmente DISATEQ prioriza:

```txt
Sheets operacionales
```

por encima de:

```txt
tabs estilo SaaS/webapp
```

PERO:

```txt
esto NO significa que las tabs estén prohibidas
```

A futuro podrían existir:

* tabs internas
* tabs contextuales
* tabs técnicas
* tabs auxiliares

SIEMPRE que:

* respeten filosofía operacional DISATEQ
* no rompan continuidad visual
* no conviertan la UI en dashboard web genérico
* no destruyan densidad operacional
* no reemplacen incorrectamente las Sheets

## PRINCIPIO IMPORTANTE

Una TAB:

```txt
NO reemplaza una SHEET
```

Porque una SHEET representa:

```txt
subcontexto operacional completo
```

---

# FOOTBAR

## Naturaleza

Barra operacional inferior.

## Estado actual

Aún sin definición funcional definitiva.

## Posibles responsabilidades futuras

* estado runtime
* shortcuts
* hints contextuales
* métricas vivas
* información operacional
* mensajes sistema
* indicadores runtime

---

# PRINCIPIO OPERACIONAL FINAL

DISATEQ VENDOR™ NO debe sentirse como:

```txt
una web dentro de desktop
```

Debe sentirse como:

```txt
software operacional vivo real
```

Con:

* continuidad operacional
* resiliencia
* claridad contextual
* velocidad operacional
* densidad útil
* UX operacional real
