
## Regla sobre autorizacion de commits (agregado 13 julio 2026)
Claude Code nunca ejecuta git commit a menos que el mensaje de la tarea
contenga una autorizacion textual explicita ("aprobado, comitea" o
equivalente). No infiere aprobacion de que los tests pasen, de que el
resumen se vea completo, o de que no encuentre nada raro.
