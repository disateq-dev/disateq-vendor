# DISATEQ Engineering Workflow

## Objetivo

Mantener continuidad operacional, sincronización IA ↔ repo y baja fricción de ingeniería durante el desarrollo de DISATEQ.

---

# Principios Operacionales

- Repo real manda.
- Runtime primero.
- Validar antes de abstraer.
- Mantener simplicidad operacional.
- Priorizar continuidad operacional.
- Reducir fricción cognitiva.
- Evitar sobreingeniería y burocracia.

---

# Arquitectura del Workflow

## governance/

Define principios permanentes, reglas y filosofía operacional.

---

## operational/

Mantiene contexto operacional y runtime activo.

---

## workflow/

Define cómo se trabaja operacionalmente.

Incluye:

- SESSION BOOT
- SESSION FLOW
- SESSION CLOSE
- continuidad operacional
- interacción IA ↔ repo
- validación operacional

---

## scripts/workflow/

Automatización operacional ligera y reusable.

---

# SESSION BOOT

Toda nueva sesión debe:

1. Leer contexto operacional.
2. Revisar memoria consolidada.
3. Ejecutar inspección del repo real.
4. Validar arquitectura actual.
5. Recién después continuar implementación.

---

# Filosofía del Workflow

El workflow debe ser:

- operacional
- observable
- reversible
- resiliente
- low-friction

Si el workflow falla, el trabajo debe continuar manualmente.

---

# Regla Crítica

Nunca asumir:

- arquitectura
- módulos
- lifecycle
- runtime
- estructura

sin validar primero el repo real.