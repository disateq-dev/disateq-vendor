# SESSION BOOT

## Objetivo

Sincronizar nueva sesión ↔ estado real del repo antes de cualquier decisión arquitectónica o implementación.

---

# Reglas

- Repo real manda.
- Nunca asumir arquitectura.
- Nunca asumir runtime.
- Validar antes de continuar.
- Mantener baja fricción operacional.

---

# Flujo Oficial

## 1. Leer contexto operacional

Revisar:

- operational/
- workflow/
- design-system/
- visual-philosophy.md
- memoria consolidada
- contexto entregado por sesión anterior

---

## 1.1 Validación UIX obligatoria

Toda implementación UI/UX debe respetar:

- docs/design-system/visual-philosophy.md

Mantener:

- Modern Operational UI
- densidad operacional
- superficies suaves
- semántica operacional del color
- consistencia tipográfica
- continuidad visual
- cero dashboards SaaS

NO asumir decisiones visuales arbitrarias.

El estándar UIX es fuente de verdad operacional.

---

## 2. Navegar al repo

```powershell
cd D:\DisateQ-DEV\Proyectos\disateq-vendor
pwd