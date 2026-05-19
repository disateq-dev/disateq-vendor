# DISATEQ VENDOR™ — UIX Design System Foundations

# Filosofía Global

DISATEQ VENDOR™ es:

```text
Software Operacional con Identidad
```

NO busca parecer:

* dashboard SaaS
* ERP legacy
* admin template
* fintech web app

Busca sentirse:

* operacional
* rápido
* contextual
* desktop-native
* keyboard-first
* continuo
* coherente

---

# Principios Fundamentales

## Modern Operational UI

La UI debe:

* reducir fricción operacional
* mantener continuidad visual
* preservar densidad útil
* acelerar orientación contextual
* reforzar memoria muscular
* comunicar contexto vivo

---

## Continuidad Operacional

El sistema completo debe sentirse:

* integrado
* estable
* consistente
* continuo

Evitar:

* fragmentación visual
* chrome excesivo
* cards SaaS
* dashboards genéricos

---

## Keyboard-first

Toda la arquitectura UIX debe contemplar:

* navegación por teclado
* shortcuts consistentes
* foco visible
* Enter/Escape semantics
* memoria muscular operacional

---

# Arquitectura Visual Operacional

```text
Window
└── AppShell
    ├── Topbar
    ├── ContextBar
    ├── SubContextBar
    ├── Workspace
    │   ├── Panels
    │   │   └── Sheets
    │   │       ├── SheetHeader
    │   │       ├── SheetBody
    │   │       └── SheetFootbar
    └── Global Footbar
```

---

# Nomenclatura Oficial

## Window

Contenedor nativo Tauri.

---

## AppShell

Estructura operacional raíz persistente.

---

## Topbar

Header institucional compacto superior.

Contiene:

* branding
* turno
* caja
* cierre operacional

NO contiene:

* widgets decorativos
* telemetría excesiva
* reloj principal

---

## ContextBar

Navegación operacional primaria.

Determina:

* módulo activo
* contexto operacional global
* identidad contextual

---

## SubContextBar

Navegación contextual secundaria.

Características:

* aparece solo cuando corresponde
* hover preview
* click persistente
* micro-contexto contextual

---

## Workspace

Superficie operacional principal.

Debe sentirse:

* rápida
* amplia
* operacional
* continua

---

## Panel

Unidad operacional independiente.

NO:

* card flotante
* widget SaaS

SÍ:

* superficie contextual delimitada
* continuidad operacional
* independencia espacial ligera

---

## Sheet

Vista operacional contextual dentro de un Panel.

Ejemplo:

```text
VENTAS
 ├── Venta rápida
 ├── Historial
 ├── Clientes
```

---

## SheetHeader

Contexto operacional local.

Contiene:

* título
* acciones máximas
* navegación contextual
* shortcuts

Características:

* compacto
* contextual
* integrado
* sin apariencia SaaS

---

## SheetBody

Área operacional principal.

Características:

* limpia
* silenciosa
* operacional
* alta densidad legible

Base:

```text
#FDFCF9
```

---

## SheetFootbar

Telemetría contextual periférica.

Opcional.

---

## Global Footbar

Telemetría operacional global persistente.

---

# Contextual Visual Semantics

## Principio

La identidad contextual debe:

* respirarse
* contextualizar
* orientar

NO:

* gritar
* saturar
* fragmentar

---

## Modelo Visual Oficial

```text
superficie operacional compartida
+
micro-contexto contextual
```

---

## Identidad Contextual

* TURNO → verde
* VENTAS → ámbar
* COMPROBANTES → cyan
* AJUSTES → violeta

La identidad contextual se expresa mediante:

* borders
* accents
* active indicators
* micro-dividers
* contextual strips
* SheetHeaders

NO mediante:

* fondos saturados
* branding agresivo
* gradientes

---

# Operational Typography System

## Principio

La jerarquía NO depende principalmente del color.

La jerarquía depende de:

* tamaño
* peso
* spacing
* agrupación
* posición

---

# Escala Tipográfica Oficial

## Nivel 1

Uso:

* ContextBar
* SheetHeaders

Definición:

* 14–15px
* semibold/bold
* uppercase
* Inter Tight
* #121416

---

## Nivel 2

Texto operacional principal.

Definición:

* 12px

Uso:

* formularios
* labels
* datos operacionales
* contenido principal

---

## Nivel 3

Texto secundario.

Definición:

* 11px

---

## Nivel 4

Texto periférico.

Definición:

* 10px

Uso limitado.

---

# Operational Action System

## Principios

Las acciones deben:

* comunicar operaciones claramente
* reducir carga cognitiva
* mantener coherencia operacional
* reforzar memoria muscular

---

## Semántica del Color

* verde → confirmar / registrar / continuar
* rojo → cerrar / finalizar / irreversible
* ámbar → advertencia / revisión
* azul/navy → navegación / contexto

El color NO es decoración.

El color es:

```text
semántica operacional
```

---

## Botones

Reglas oficiales:

* sólidos
* MAYÚSCULAS
* sin abreviaturas
* sin contracciones
* sin transparencias
* sin glassmorphism
* sin ghost buttons lavados
* alto contraste
* geometría consistente

---

## Geometría Operacional

Dentro de una misma área operacional:

* misma altura
* mismo padding
* mismo radius
* mismo tamaño tipográfico
* misma densidad
* misma alineación iconográfica

Objetivo:

* memoria muscular
* velocidad operacional
* precisión

---

## Iconografía

La iconografía:

* NO decora
* NO reemplaza texto
* refuerza intención operacional
* acelera reconocimiento

Debe:

* mantener consistencia
* respetar escala oficial
* evitar arbitrariedad

---

# Jerarquía Visual

## Orden de autoridad contextual

```text
ContextBar
↓
SheetHeader
↓
Sections
↓
Operational Content
↓
Peripheral Metadata
```

---

# Filosofía Espacial

## Workspace

Superficie compartida.

## Panels

Unidades delimitadas semánticamente.

## Sheets

Contextos operacionales vivos.

---

# Interaction Philosophy

Toda interacción debe sentirse:

* rápida
* clara
* estable
* operacional

Evitar:

* animaciones innecesarias
* chrome excesivo
* efectos decorativos
* UI inflada

---

# Regla Operacional Global

Cada capa visual debe justificar su existencia operacional.

Si un elemento:

* no aporta contexto
* no aporta navegación
* no aporta claridad
* no aporta velocidad

→ no debe existir.
