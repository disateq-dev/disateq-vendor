# SESSION CLOSE

## Objetivo

Cerrar sesión manteniendo continuidad operacional, sincronización contextual y estado consistente del repo.

---

# Reglas

- Mantener baja fricción operacional.
- No cerrar sesión con estado ambiguo.
- Consolidar antes de cambiar de ventana.
- Repo real manda.
- Runtime validado antes de cerrar.

---

# Flujo Oficial

## 1. Validar runtime actual

Confirmar:

- estado runtime correcto
- flujo operativo validado
- errores críticos identificados
- comportamiento esperado confirmado

---

## 2. Revisar estado Git

```powershell
git status
git branch
git log --oneline -10