# DISATEQ VENDOR™ — Typography

## Fuente doctrinal

**Inter Tight Variable** (`@fontsource-variable/inter-tight`), aplicada globalmente
vía `--font-sans` en `index.css`.

## Razón de la elección

DISATEQ VENDOR™ opera en un layout de alta densidad operacional (ver
`spacing-density.md`), con etiquetas cortas en mayúscula, badges, códigos
internos y celdas de grilla donde el espacio horizontal es limitado.

Se evaluaron tres opciones mediante mockup comparativo:
1. Inter (fuente previa), tracking por defecto
2. Inter con tracking negativo forzado (`letter-spacing: -0.02em`)
3. Inter Tight, tracking por defecto

Inter Tight fue la opción elegida: es la misma familia tipográfica que Inter
(mismo diseñador, misma altura-x, mismos pesos variables), pero diseñada
específicamente con proporciones más condensadas para interfaces densas. No
requiere overrides de tracking por componente ni introduce una familia
visualmente ajena a lo ya validado en el proyecto.

## Uso

- `--font-sans` es la única variable de fuente del proyecto; no se define
  ninguna fuente monoespaciada ni serif adicional.
- Las etiquetas en mayúscula (headers de panel, badges de código, botones de
  acción) usan `letter-spacing` positivo vía Tailwind (`tracking-tight`,
  `tracking-wider`, etc.) según el componente — Inter Tight no reemplaza esa
  necesidad de tracking positivo en mayúsculas, solo reduce la apertura base
  de la fuente en texto normal.
- No hay pesos personalizados fuera de los que expone el archivo variable
  (400 regular, 500/600 medium/semibold, 700 bold vía Tailwind).

## Historial

- 30 jun 2026 — Migración de Inter a Inter Tight (commit `9c6f1e0`).
