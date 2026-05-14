# DISATEQ VENDOR — CONSOLIDACIÓN MODELO OPERACIONAL CONTEXTUAL

## CONTEXTO

Durante la validación runtime real del flujo de ventas/cobro/impresión se detectó un problema arquitectónico importante:

# contaminación operacional contextual

Esto explica múltiples bugs detectados previamente:

* focos heredados
* shortcuts cruzados
* acciones disparadas fuera contexto
* sheets interpoladas
* estados persistentes
* listeners vivos
* comportamiento impredecible

La solución NO es visual.
La solución es:

# encapsulamiento operacional contextual.

==================================================
MODELO OPERACIONAL OFICIAL DISATEQ
==================================

# 1. MAIN WORKSPACE

Todo el espacio posterior a:

* barra superior
* navegación principal

Cada opción principal:
activa SU workspace contextual.

==================================================

# 2. WORKSPACES PRINCIPALES

==================================================

Ejemplos:

* Sales Workspace
* Inventory Workspace
* Turnos/Cajas Workspace

Cada Workspace:
posee:

* comportamiento operacional propio
* shortcuts propios
* navegación propia
* contexto operacional propio
* color contextual propio

==================================================
REGLA CRÍTICA
=============

Los Workspaces:
NO deben compartir:

* shortcuts globales innecesarios
* focos persistentes
* listeners cruzados
* estado operacional contextual

==================================================

# 3. COLOR CONTEXTUAL

==================================================

Cada Workspace principal:
tiene color contextual identificable.

El color:
NO es decorativo.

El color comunica:

* contexto activo
* herramientas activas
* navegación contextual
* comportamiento operacional activo

==================================================

# 4. OPCIONES SECUNDARIAS

==================================================

Las opciones secundarias:
pertenecen SOLO al Workspace activo.

Reglas:

* heredan color contextual Workspace padre
* aparecen SOLO si existen
* ocultarse automáticamente si no existen

Evitar:

* subnavegación vacía
* ruido visual
* placeholders inútiles

==================================================

# 5. SALES WORKSPACE

==================================================

Sales Workspace actualmente contiene:

==================================================
PRODUCT WORKSPACE
=================

Zona izquierda.

Responsable de:

* búsqueda productos
* exploración productos
* resultados búsqueda
* selección productos
* envío productos a transacción

==================================================
TRANSACTION WORKSPACE
=====================

Zona derecha.

NO es:
ticket simple/carrito.

Es:
workspace operacional contextual.

==================================================

# 6. TRANSITION SHEETS

==================================================

Dentro de Transaction Workspace existen:

* PRE-VENTA
* COBRO
* CLIENTE

==================================================
REGLA CRÍTICA
=============

Las Transition Sheets:
deben ser:

# operacionalmente herméticas.

==================================================
NO DEBEN
========

* interpolarse
* encimarse
* heredar foco
* compartir shortcuts activos
* compartir listeners vivos
* arrastrar lógica contextual
* contaminar otras sheets

==================================================
AL ENTRAR
=========

Activar SOLO:

* shortcuts propios
* handlers propios
* foco propio
* contexto propio

==================================================
AL SALIR
========

Destruir:

* listeners
* shortcuts
* foco
* handlers
* contexto operacional

==================================================
IMPORTANTE
==========

Las sheets:
SÍ deben compartir:

* estructura visual
* grid
* spacing
* identidad visual
* jerarquía visual

PERO NO:
estado operacional.

==================================================
VALIDACIONES IMPORTANTES YA REALIZADAS
======================================

Fixes aplicados alineados al modelo:

* F4 collision guard
* Enter contextual protegido por foco/input
* closeCobro() al cambiar Workspace

Esto confirma:
la dirección arquitectónica contextual es correcta.

==================================================
CONCLUSIÓN
==========

DISATEQ NO debe sentirse:
como SaaS/dashboard tradicional.

Debe sentirse:
como sistema operacional contextual:

* rápido
* continuo
* hermético
* operacional
* POS real
* baja fricción
* runtime-first
