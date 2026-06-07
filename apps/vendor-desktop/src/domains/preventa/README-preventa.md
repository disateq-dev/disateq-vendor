# Dominio `preventa`

## Propósito

Estado visual efímero de la venta en construcción.

Este dominio **no persiste**. Vive exclusivamente en memoria (Zustand/RAM) mientras el operador arma la venta en pantalla. Cuando el operador cierra la aplicación o limpia la preventa, este estado desaparece sin dejar rastro — eso es correcto y esperado.

## Responsabilidades

- Renderizado inmediato de líneas en pantalla
- Feedback visual de cantidades, subtotales y notas
- UX del flujo de cobro
- Cálculo de totales para presentación al operador

## Lo que NO hace

- No persiste datos en `localStorage`
- No emite eventos operacionales
- No descuenta inventario
- No genera comprobantes
- No conoce el estado del turno ni la caja

## Tipos clave

| Tipo | Archivo | Qué representa |
|---|---|---|
| `LineaPreVenta` | `dto/LineaPreVenta.ts` | Línea individual visible en pantalla |
| `EstadoPreVenta` | `state/preventa.store.ts` | Estado completo del store Zustand |
| `TotalesPreVenta` | `services/preventa-calculation.service.ts` | Subtotal, IGV y total calculados |

## Flujo de datos

```
SalesWorkspace (agrega HOV)
        │
        ▼
preVentaService.agregarProductoDesdeHOV()
        │
        ├──► bridge-pedido.traducirATicketLine()  → LineaPreVenta (capa visual)
        │
        └──► pedido.service.agregarLinea()        → LineaPedido   (capa operacional)
```

## Boundary con `sales`

`preventa` y `sales` son **dos capas del mismo flujo**, no dos implementaciones del mismo concepto.

```
preventa/   →  estado visual efímero   →  RAM (Zustand)
sales/      →  registro operacional    →  localStorage → sincronización futura
```

Un equipo nuevo que vea ambos dominios y piense que son duplicados está equivocado. La separación es intencional y necesaria:

- `preventa` garantiza feedback visual instantáneo sin depender de persistencia
- `sales` garantiza trazabilidad operacional sin depender del estado visual

**Nunca fusionar estos dominios.**

## Regla de dependencia

`preventa` puede conocer tipos de `sales` a través del bridge.
`sales` **no debe** importar nada de `preventa`.
