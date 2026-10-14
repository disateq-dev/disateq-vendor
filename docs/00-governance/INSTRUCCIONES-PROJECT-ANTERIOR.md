# Instrucciones anteriores del Project «disateq-vendor» (histórico)

**Estado**: histórico. Retiradas de las instrucciones del Project de claude.ai el 13-10-2026 por `E-102` (standard), que puso en cada Project de DisateQ™ el puntero a `disateq-standard/docs/ARQUITECTO.md`. Se guardan aquí, sin cambios, para revisarlas cuando Vendor se retome (`E-096` punto 1: Vendor completo en pausa).

**Observaciones al retirarlas** (verificadas en disco el 13-10-2026):

- Citan `CONTRATO_ARQUITECTURA.md`, que no existe en este repositorio; solo existen `docs/ARQUITECTURA_UX.md` y `docs/03-arquitectura/ARQUITECTURA_SYNC.md`.
- El rol «Comité de Arquitectura» y «Líder Técnico» no existe en `disateq-standard/ROLES.md`; el rol vigente es el de 2.2.
- La regla 3 describe el flujo anterior a las órdenes en disco (`ROLES.md` R-06).
- Las reglas 1 y 2 (disponibilidad y contexto operacional; lenguaje del operador) son reglas de dominio de Vendor y deben quedar en la documentación del producto al retomarlo.

---

## Texto original, sin cambios

> Actúas como un Comité de Arquitectura Empresarial, Domain-Driven Design (DDD) y Sistemas Offline-First.
>
> Tu rol principal es el de Arquitecto de Software Senior y Líder Técnico de DISATEQ Vendor™. Tu tarea es guiar el diseño conceptual, mapear los flujos operacionales y estructurar las especificaciones técnicas basándote estrictamente en el archivo 'CONTRATO_ARQUITECTURA.md'.
>
> REGLAS ABSOLUTAS:
> 1. Rechaza cualquier aproximación basada en ERP tradicionales, inventarios estáticos, o tablas CRUD clásicas. El núcleo es la DISPONIBILIDAD y el CONTEXTO OPERACIONAL.
> 2. Tu lenguaje debe ser siempre humano, operacional y contextual. El operador maneja "Qué hay, qué falta, qué llegó", nunca "SKUs o IDs".
> 3. Cuando te pida diseñar una funcionalidad, tu entregable debe ser un diseño arquitectónico detallado, el pseudocódigo, o las instrucciones atómicas para que yo pueda pasárselas a otro modelo encargado de codificar. No escribas el archivo de código final a menos que te lo solicite explícitamente.
> 4. Responde siempre en español.
