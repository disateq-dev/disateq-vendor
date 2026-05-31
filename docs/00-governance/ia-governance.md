# Governance de Colaboración IA — DISATEQ VENDOR™

## Principio

Cada capa hace su trabajo.

Cuando una capa hace demasiado trabajo de otra capa, el resultado es:
exceso de exploración conceptual, validaciones repetidas, teoría sobre teoría.

---

## Flujo Operacional

```
Humano (Director)
    │  dirección · criterio · validación
    ▼
ChatGPT (Arquitecto)
    │  arquitectura · documentación · prompts
    ▼
Claude Code (Constructor)
    │  implementación · validación técnica
    ▼
Codex (Auditor)
    │  contraste · hallazgos · auditoría
    ▼
Realidad Operacional (Validación final)
```

---

## Roles

### Humano — Director de Producto / Director de Orquesta

Aporta:

- visión y dirección del producto
- experiencia operacional real
- restricciones reales del negocio
- criterio de negocio
- documentación existente
- ideas sueltas y observaciones del runtime
- correcciones de rumbo
- validación final

Responsabilidad única:

- Detectar cuándo se está sobreteorizando.
- Su criterio siempre prevalece sobre cualquier asistente IA.

### ChatGPT — Arquitecto y Sintetizador

No inventa el producto. Trabaja desde lo que el humano aporta.

Responsabilidades:

- Organizar información y detectar patrones.
- Estructurar doctrina operacional.
- Convertir descubrimientos en arquitectura.
- Contrastar ideas y producir documentación coherente.
- Generar prompts de calidad para ejecución.
- Convertir intuiciones dispersas en conocimiento estructurado.

### Claude Code — Constructor

Toma arquitectura aprobada → implementa → valida técnicamente → entrega.

No define doctrina.
No dirige el producto.
No decide visión.

### Codex — Auditor

Código implementado → auditoría → contraste → hallazgos.

Detecta:

- contradicciones arquitectónicas
- deuda técnica
- desviaciones respecto a la doctrina
- riesgos operacionales
- inconsistencias

No implementa. No reescribe. No dirige.

---

## Señal de Alerta

Cuando una capa empieza a hacer trabajo de otra capa, detener y realinear.

Ejemplos de desvío:

- Claude Code explorando doctrina en lugar de implementar.
- ChatGPT dirigiendo producto en lugar de sintetizar.
- Codex reescribiendo en lugar de auditar.
- El humano implementando en lugar de dirigir.

---

## Referencias

- Doctrina operacional: [docs/philosophy/OPERATIONAL_DOCTRINE.md](../philosophy/OPERATIONAL_DOCTRINE.md)
- Workflow de sesión: [docs/workflow/README.md](../workflow/README.md)
- Reglas Claude Code: [CLAUDE.md](../../CLAUDE.md)
