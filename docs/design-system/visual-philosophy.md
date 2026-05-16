# DISATEQ VENDOR — Operational UIX Standards

## Objetivo

Este documento consolida las reglas permanentes de UIX/UI operacional de DISATEQ VENDOR.

Debe ser utilizado como:

* referencia oficial visual/operacional
* fuente de verdad UIX
* guía obligatoria para ChatGPT, Claude Code y cualquier implementación futura
* criterio de validación antes de aprobar cambios visuales

Toda implementación UI debe respetar estrictamente este documento.

---

# 1. FILOSOFÍA VISUAL GENERAL

DISATEQ VENDOR utiliza una filosofía:

# Modern Operational UI

Objetivos:

* continuidad operacional
* baja fricción
* velocidad operacional
* ergonomía real
* memoria muscular
* baja fatiga visual
* claridad contextual
* control flexible

La UI debe sentirse:

* profesional
* compacta
* operacional
* rápida
* coherente
* calmada visualmente

NO debe sentirse:

* SaaS genérico
* ERP pesado
* dashboard corporativo
* fintech exagerado
* app gamer
* UI decorativa

---

# 2. SUPERFICIE OPERACIONAL GLOBAL

Todas las áreas de trabajo del sistema deben compartir:

# una misma superficie operacional suave.

Objetivo:

* evitar blanco puro intenso
* evitar negro intenso
* reducir fatiga visual
* mejorar continuidad visual
* mantener ergonomía operacional en jornadas largas

La superficie base:

* NO debe competir visualmente
* debe retirarse visualmente
* debe permitir protagonismo a señales operacionales

IMPORTANTE:
La identidad contextual NO debe venir del fondo.

---

# 3. IDENTIDAD CONTEXTUAL POR MÓDULO

Cada módulo expresa identidad mediante:

* contornos
* bordes
* outlines
* líneas estructurales
* separadores
* focus states
* acentos operacionales

NO mediante:

* fondos saturados
* pantallas coloreadas completas
* dashboards coloridos

## Módulos actuales

### VENTAS

Color contextual:

* azul operacional

Sensación:

* flujo comercial
* rapidez operacional
* continuidad de venta

### TURNOS

Color contextual:

* verde operacional

Sensación:

* control
* conciliación
* continuidad operacional
* validación

### CONFIGURACIÓN

Color contextual:

* ámbar/cobre operacional suave

Sensación:

* revisión
* atención
* criterio operacional

---

# 4. SEMÁNTICA OPERACIONAL DEL COLOR

IMPORTANTE:
En DISATEQ el color SIEMPRE representa:

# una acción o contexto operacional real.

El color NUNCA es decorativo.

## VERDE

Representa:

* confirmar
* registrar
* aceptar
* continuar
* validar

Ejemplos:

* REGISTRAR
* ABRIR TURNO
* CONFIRMAR

---

## ROJO

Representa:

* cerrar
* finalizar
* consolidar
* detener
* acción irreversible

Ejemplos:

* CERRAR TURNO
* FINALIZAR

---

## ÁMBAR / NARANJA

Representa:

* advertencia
* contingencia
* revisión
* continuidad excepcional

---

## AZUL / NAVY

Representa:

* navegación
* contexto módulo
* identidad operacional

NO representa:

* acciones destructivas

---

# 5. TIPOGRAFÍA GLOBAL

Todo DISATEQ VENDOR debe usar:

# una sola familia tipográfica coherente.

Referencia oficial:

* tipografía actualmente usada en VENTAS.

Objetivos:

* continuidad visual
* lectura rápida
* ergonomía desktop
* densidad operacional

---

# 6. ESCALA TIPOGRÁFICA

Mantener:

* jerarquías consistentes
* mismos tamaños base
* mismo ritmo visual
* misma lógica visual entre módulos

Evitar:

* tamaños arbitrarios
* títulos exagerados
* labels gigantes
* subtítulos diminutos
* mezcla inconsistente

TURNOS debe alinearse tipográficamente a VENTAS.

---

# 7. BOTONES OPERACIONALES

Todos los botones del sistema deben mantener:

## TEXTO

* MAYÚSCULAS
* sin abreviaturas
* semántica clara

Correcto:

* REGISTRAR
* CERRAR TURNO
* IMPRIMIR

Incorrecto:

* REG
* MOV
* CTG

---

## COLOR

* sólido
* sin transparencias
* sin glassmorphism
* sin overlays translúcidos

---

## CONTRASTE

* texto blanco
* contraste firme y claro

---

## ALTURA Y PADDING

* misma altura operacional
* mismo padding
* misma densidad visual
* coherencia global

---

## ICONOGRAFÍA

* iconos siempre visibles
* coherentes
* ligeros
* operacionales
* funcionales

NO decorativos.

---

# 8. DENSIDAD OPERACIONAL

La UI debe priorizar:

* continuidad visual
* compactación inteligente
* densidad útil
* lectura rápida

Evitar:

* exceso de aire
* cards infladas
* bloques gigantes
* separación innecesaria
* layouts corporativos vacíos

---

# 9. MOVIMIENTOS / TURNOS

MOVIMIENTOS debe sentirse:

* operacional
* contextual
* compacto
* rápido
* continuo

NO:

* contable
* ERP administrativo
* dashboard financiero

## Layout

División operacional:

* contexto operacional
* histórico operacional

Mantener:

* continuidad visual
* misma superficie operacional
* separación sutil

---

# 10. IMPRESIÓN OPERACIONAL

Toda impresión debe reutilizar:

* flujo RAW existente
* arquitectura térmica actual
* lógica ya consolidada

NO crear:

* motores paralelos
* sistemas nuevos de impresión
* layouts administrativos nuevos

La impresión operacional debe sentirse:

* compacta
* rápida
* térmica
* operacional

Referencia oficial:

* ticket despacho actual.

---

# 11. PROHIBICIONES VISUALES

NO usar:

* dashboards SaaS
* glassmorphism
* neones
* transparencias
* fondos saturados por módulo
* tablas ERP gigantes
* fintech UI
* glow exagerado
* sombras fuertes innecesarias
* cards infladas
* layouts administrativos pesados

---

# 12. VALIDACIÓN OBLIGATORIA

Antes de aprobar cualquier implementación UI:

Preguntar:

# ¿Esto realmente se siente DISATEQ?

NO solo:

* ¿funciona?
* ¿se ve moderno?

Validar siempre:

* ergonomía operacional
* continuidad visual
* memoria muscular
* coherencia tipográfica
* semántica operacional del color
* densidad operacional
* continuidad runtime

---

# 13. WORKFLOW OBLIGATORIO UIX / IA

Toda nueva sesión, ventana o tarea relacionada con UI/UX debe iniciar obligatoriamente leyendo el estándar UIX oficial.

## Regla operacional

Antes de cualquier implementación visual:

Claude Code, ChatGPT u otra IA debe leer:

```txt
/docs/uix/design-system.md
```

---

## Session Boot UIX recomendado

Usar siempre un inicio compacto tipo:

```txt
Leer y respetar estrictamente:
docs/uix/design-system.md

Mantener:
- Modern Operational UI
- densidad operacional
- superficies suaves
- semántica operacional del color
- consistencia tipográfica
- cero dashboards SaaS
```

---

## Objetivo

Evitar:

* deriva visual
* inconsistencias UI
* reinterpretaciones SaaS
* pérdida de ergonomía operacional
* retrabajo constante
* regresiones visuales
* pérdida de identidad DISATEQ

---

## Regla práctica

NO asumir que la IA recordará consistentemente:

* filosofía visual
* ergonomía
* impresión operacional
* semántica del color
* consistencia tipográfica
* arquitectura UI

El estándar UIX debe ser siempre:

# fuente de verdad operacional.

---

# 14. REGLA OPERACIONAL FINAL

DISATEQ VENDOR NO busca:

* impresionar visualmente
* verse trendy
* parecer SaaS moderno

DISATEQ busca:

* continuidad operacional
* velocidad real
* ergonomía operacional
* control flexible
* baja fatiga
* claridad contextual
* profesionalismo operacional
* memoria muscular consistente
* resiliencia operacional
