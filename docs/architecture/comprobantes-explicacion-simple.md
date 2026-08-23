# CÓMO FUNCIONAN LOS COMPROBANTES EN VENDOR (explicación simple)

Versión en lenguaje llano de `comprobantes-architecture.md`. Fecha: 2026-08-02.

## ¿Qué es un comprobante aquí?

Cualquier documento que se entrega al cliente al cerrar una venta: un tique
simple, una boleta, una factura, una nota de crédito/débito, o una cotización.
Todos viven bajo el mismo concepto en el sistema, solo cambia el tipo.

## Los 6 tipos que existen

- **Tique de venta** — el documento por defecto, sin valor tributario. Dice
  explícitamente "esto no es un comprobante de pago".
- **Cotización** — tampoco tiene valor tributario, es solo una propuesta.
- **Boleta** — comprobante formal simple, para venta a persona natural.
- **Factura** — comprobante formal con RUC, para venta a empresa.
- **Nota de crédito / débito** — documentos que corrigen una factura o boleta
  ya emitida (no se puede emitir una sin apuntar a cuál corrige).

Un Tique o una Cotización se pueden **convertir después** en Boleta o Factura
si el cliente lo pide (por ejemplo, se llevó el producto con tique y al día
siguiente pide factura).

## Reglas que el sistema ya obliga

- Una **factura** no se puede emitir sin RUC válido del cliente.
- Una **boleta** por más de S/700 no se puede emitir a un cliente genérico —
  exige pedirle DNI o algún documento de identidad.
- Si el monto se acerca a S/700, el sistema avisa antes de que sea obligatorio.
- Una **nota de crédito/débito** no se puede emitir sin decir a qué factura o
  boleta corrige.

## Cómo se numeran

Cada tipo tiene una serie fija: Tique = T001, Boleta = B001, Factura = F001,
Cotización = C001. El número correlativo (el 00000001, 00000002...) lo lleva
el sistema automáticamente y no se puede repetir ni saltarse — está protegido
a nivel de base de datos.

**Punto a tener en cuenta:** hoy esas series (T001, B001, F001, C001) están
fijas en el código, no hay una pantalla donde configurarlas o cambiarlas. Si
en el futuro se necesita más de una serie por caja/local (como exige SUNAT
cuando hay varios puntos de venta), eso requiere trabajo adicional — ya está
anotado como pendiente en la arquitectura de sincronización.

## Los datos del negocio (RUC, razón social, dirección)

Se configuran en la pantalla general de AJUSTES/CONFIG del sistema, no en un
lugar aparte para comprobantes. Esos datos son los que salen impresos como
emisor en cada comprobante.

## Qué pasa al anular un comprobante

Se pide un motivo obligatorio. Si el comprobante es formal (boleta/factura) y
ya fue aceptado por SUNAT, el sistema no deja anularlo directo — obliga a
hacer una nota de crédito en su lugar, que es lo correcto tributariamente.

**Punto importante detectado:** existen dos pantallas donde se puede anular
un comprobante — el módulo COMPROBANTES y un panel dentro de CAJA/TURNO.
Verificamos el código de ambas y **el botón de anular del módulo COMPROBANTES
parece no estar guardando el cambio de forma definitiva** — solo el panel de
CAJA/TURNO sí lo guarda con seguridad. Esto necesita una prueba real (anular
un comprobante de prueba desde COMPROBANTES y confirmar si de verdad queda
anulado en la base) antes de confiar en ese botón en operación real.

## Envío a SUNAT

El sistema está preparado en su diseño para llevar el estado de envío a SUNAT
(pendiente, enviado, aceptado, rechazado), pero **hoy no existe la conexión
real que efectivamente envíe nada a SUNAT**. Es una pieza que está prevista
pero no construida.

## Resumen de lo que falta o está flojo

1. Confirmar si anular desde COMPROBANTES realmente guarda el cambio (riesgo alto).
2. Un filtro por tipo de documento en el panel de CAJA no está funcionando bien internamente.
3. No hay pantalla para configurar series de comprobante — están fijas en código.
4. Los datos del negocio (RUC, etc.) se guardan distinto al resto de los comprobantes.
5. No hay envío real a SUNAT todavía.
