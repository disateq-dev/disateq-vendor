# SESSION BOOT

## Objetivo

Sincronizar nueva sesión ↔ estado real del repo antes de cualquier decisión arquitectónica o implementación.

---

# Reglas

- Repo real manda.
- Nunca asumir arquitectura.
- Nunca asumir runtime.
- Validar antes de continuar.
- Mantener baja fricción operacional.

---

# Flujo Oficial

## 1. Leer contexto operacional

Revisar:

- operational/
- workflow/
- memoria consolidada
- contexto entregado por sesión anterior

---

## 2. Navegar al repo

```powershell
cd D:\DisateQ-DEV\Proyectos\disateq-vendor
pwd