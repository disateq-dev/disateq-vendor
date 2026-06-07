# Dominio `documents`

## Propósito

Documento fiscal emitido como consecuencia de un `Pedido` concretado.

Este es el **único dominio de comprobantes** del sistema. El directorio `domains/comprobantes/` fue eliminado — todo vive aquí.

## Responsabilidades

- Modelar el `Comprobante` en su forma canónica y tributaria
- Persistir comprobantes emitidos
- Validar estructura antes de emisión
- Servir como base para impresión y futura integración SUNAT

## Lo que NO hace

- No coordina el flujo de cobro (eso es responsabilidad de `CobroPanel` + `POSContext`)
- No calcula totales (los recibe ya calculados)
- No conoce el estado de la preventa

## Tipos clave

| Tipo | Archivo | Qué representa |
|---|---|---|
| `Comprobante` | `comprobante.types.ts` | Documento fiscal completo |
| `LineaComprobante` | `comprobante.types.ts` | Línea individual del comprobante |
| `EstadoComprobante` | `comprobante.types.ts` | `EMITIDO / REFERENCIADO / ANULADO` |

## Tipos de comprobante soportados

| Tipo | Uso |
|---|---|
| `TIQUE_VENTA` | Nota de venta sin valor tributario formal |
| `BOLETA` | Boleta de venta (persona natural) |
| `FACTURA` | Factura (empresa con RUC) |
| `COTIZACION` | Documento de cotización sin efecto fiscal |

## Archivos y responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `comprobante.types.ts` | Tipos canónicos — modelo único y definitivo |
| `comprobante.store.ts` | Persistencia en `localStorage` |
| `comprobante.service.ts` | Operaciones: emitir, anular, consultar |
| `comprobante.validator.ts` | Validaciones previas a emisión |
| `bridge-comprobante.ts` | Traducción desde datos del cobro hacia `Comprobante` |

## Storage key

```
disateq:documents:comprobantes
```

## Nota sobre facturación electrónica

Este dominio está preparado para integración SUNAT. Los campos `estadoSUNAT`, `cdr`, `fechaEnvioSUNAT` y `requiereEnvioSUNAT` están reservados para esa fase. No implementados aún — fuera de alcance del roadmap actual.
