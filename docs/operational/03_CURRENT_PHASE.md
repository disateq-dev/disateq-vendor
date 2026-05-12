# CURRENT PHASE

## Fase Activa

CAJA

---

## Objetivo Actual

Implementar infraestructura operacional mínima para:
- navegación modular ligera
- módulo CAJA separado
- continuidad operacional
- preservación del flujo POS actual

---

## Arquitectura Validada

- AppShell operacional validado.
- POSContext mantiene responsabilidad UX operacional.
- No usar routing web tradicional.
- CAJA será módulo operacional separado.
- Mantener filosofía offline-first.

---

## Pendientes Inmediatos

- Definir navegación modular ligera.
- Definir integración operacional de CAJA.
- Mantener desacople entre:
  - POS UX
  - navegación
  - dominio caja

---

## Restricciones Activas

- No sobrearquitectura.
- No refactor masivo.
- No romper flujo operacional actual.
- Validación incremental continua.