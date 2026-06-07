# Dominio `sales`

## Propósito

Registro operacional persistente de la venta.

Este dominio **persiste**. Cada `Pedido` nace cuando el operador agrega el primer producto y muere cuando se concreta o abandona. Toda la trazabilidad de la venta vive aquí.

## Responsabilidades

- Crear y gestionar el ciclo de vida del `Pedido`
- Registrar eventos operacionales (`LINEA_AGREGADA`, `PEDIDO_CONFIRMADO`, etc.)
- Servir como base para la emisión del `Comprobante`
- Coordinar con `inventory` el descuento de stock al concretar

## Lo que NO hace

- No renderiza nada en pantalla
- No conoce el estado visual de la preventa
- No calcula totales para UI
- No accede directamente a `localStorage` de comprobantes

## Tipos clave

| Tipo | Archivo | Qué representa |
|---|---|---|
| `Pedido` | `pedido.types.ts` | Venta en construcción con trazabilidad completa |
| `LineaPedido` | `pedido.types.ts` | Línea operacional con HOV, valor aplicado y eventos |
| `EstadoPedido` | `pedido.types.ts` | Ciclo de vida: `ABIERTO → CONCRETADO / ABANDONADO` |
| `EventoPedido` | `pedido.types.ts` | Registro inmutable de cada acción sobre el pedido |

## Ciclo de vida del Pedido

```
ABIERTO
  │  agregarLinea() / modificarCantidad()
  ▼
CONFIRMADO
  │  iniciarCobro()
  ▼
EN_COBRO
  │  concretarPedido()
  ▼
CONCRETADO ──────────────────── fin exitoso
  
ABIERTO / CONFIRMADO / EN_COBRO
  │  abandonarPedido(motivo)
  ▼
ABANDONADO ──────────────────── fin con motivo registrado
```

## Archivos y responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `pedido.types.ts` | Tipos canónicos del dominio |
| `pedido.store.ts` | Persistencia en `localStorage` |
| `pedido.service.ts` | Operaciones principales del ciclo de vida |
| `pedido.operations.ts` | Operaciones avanzadas: dividir, fusionar, concretar |
| `bridge-pedido.ts` | Traducción entre `LineaPreVenta` y `LineaPedido` — solo traducción de tipos, sin lógica de negocio |

## Boundary con `preventa`

Ver `domains/preventa/README.md` para la explicación completa de la separación.

Regla corta: `sales` no importa nada de `preventa`.

## Storage key

```
disateq:sales:pedidos
```
