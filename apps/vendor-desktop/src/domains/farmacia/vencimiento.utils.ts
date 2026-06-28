export type NivelVencimiento = 'CRITICO' | 'ALERTA' | 'OK'

export function calcularNivelVencimiento(fechaVencimiento?: string): {
  nivel: NivelVencimiento | null
  dias: number | null
} {
  if (fechaVencimiento === undefined || fechaVencimiento === '') {
    return { nivel: null, dias: null }
  }

  const dias = Math.floor((Date.parse(fechaVencimiento) - Date.now()) / 86400000)

  if (dias < 0) {
    return { nivel: 'CRITICO', dias: 0 }
  }

  if (dias < 60) {
    return { nivel: 'CRITICO', dias }
  }

  if (dias < 180) {
    return { nivel: 'ALERTA', dias }
  }

  return { nivel: 'OK', dias }
}
