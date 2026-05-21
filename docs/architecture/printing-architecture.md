# DISATEQ VENDOR™ — PRINTING ARCHITECTURE

## Filosofía operacional

La impresión en DISATEQ prioriza:

* continuidad operacional
* resiliencia
* compatibilidad real
* velocidad POS
* soporte híbrido

La arquitectura soporta:

* impresión HTML
* impresión térmica ESC/POS

---

# HTML Printing

Mecanismo:

window.print()

Render temporal:

#pt-overlay

Uso principal:

* fallback universal
* vouchers
* arqueos
* pruebas
* impresión Windows estándar

---

# Thermal Printing

Mecanismo:

Tauri invoke()

Objetivo:

* impresión POS real
* velocidad operacional
* corte físico
* runtime térmico

---

# Funciones actuales

## printTicket(data)

Impresión HTML comprobante.

---

## printTicketThermal(printer, data)

ESC/POS térmica.

invoke("print_ticket")

---

## printTicketWithDispatch(printer, receipt, dispatch)

Impresión térmica combinada.

invoke("print_ticket_with_dispatch")

---

## printDispatchTicket(data)

Despacho HTML 58mm.

---

## printReceiptWithDispatch(receipt, dispatch)

Recibo + despacho combinado.

---

## printCashMoveVoucher(data)

Voucher movimiento caja HTML.

---

## printCashMoveVoucherThermal(printer, data)

Voucher térmico.

invoke("print_cash_move")

---

## printArqueo(data)

Arqueo HTML.

---

## printArqueoThermal(printer, data)

Arqueo térmico.

invoke("print_arqueo")

---

# Papel operacional oficial

## 58mm

Uso:

* despacho
* operación rápida
* continuidad logística

---

## 80mm

Uso:

* comprobantes
* arqueos
* conciliación
* auditoría operacional

---

# Principio arquitectónico crítico

Operación ≠ representación.

Los dominios operacionales permanecen desacoplados del mecanismo de impresión.

---

# Riesgos a controlar

* crecimiento descontrolado printTicket.ts
* mezcla HTML + ESC/POS
* lógica operacional dentro rendering
* estilos acoplados

---

# Dirección futura

Solo si el runtime lo exige:

src/print/

* html/
* thermal/
* templates/
* escpos/
* formatters/

NO refactorizar prematuramente.
