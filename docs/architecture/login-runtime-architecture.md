# DISATEQ VENDOR™ — LOGIN RUNTIME ARCHITECTURE

## Principio arquitectónico

El LOGIN es una ventana operacional aislada desktop-native.

NO es:

* modal web
* overlay
* dashboard previo
* AppShell visible

---

# Flujo oficial

1. inicia aplicación
2. renderiza LoginScreen únicamente
3. operador inicia sesión
4. se activa runtime operacional completo
5. AppShell se monta recién post-login

---

# Resoluciones oficiales

## Login

880 × 548

Configurado en:

tauri.conf.json

También reutilizado durante logout.

---

## Runtime operacional

1366 × 768

Aplicado dinámicamente mediante:

getCurrentWindow().setSize()

al detectar:

activeOperator

---

# Filosofía UX operacional

El LOGIN debe sentirse:

* compacto
* rápido
* desktop-native
* operacional
* estable
* enfocado

NO:

* SaaS
* landing page
* dashboard financiero
* app web genérica

---

# Estructura consolidada

## Layout

* izquierda 40%
* derecha 60%

No son dos cards independientes.

Es un sistema operacional dividido funcionalmente.

---

# Zona izquierda

* branding
* helper operacional
* contexto persistente

---

# Zona derecha

* acceso operacional
* login
* futura continuidad PIN

---

# Validaciones runtime obligatorias

## Login

* no scroll
* foco inmediato
* Enter funcional
* ergonomía 880×548
* continuidad visual
* densidad operacional

---

## Runtime

* resize limpio
* continuidad contextual
* estabilidad visual
* keyboard-first
* ergonomía 1366×768

---

# Separación de dominios

LOGIN:

* autenticación
* alias operador
* PIN
* acceso operacional

TURNOS:

* apertura
* cierre
* contingencias
* continuidad operacional
* trazabilidad
