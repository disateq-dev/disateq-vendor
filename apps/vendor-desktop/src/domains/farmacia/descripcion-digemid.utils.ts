export function construirDescripcionDigemid(
  ifa: string,
  concentracion: string,
  formaFarmaceutica: string,
  descripcionPresentacion: string,
): string {
  const ifaLimpio = ifa.trim()
  const concentracionLimpia = concentracion.trim()
  const formaFarmaceuticaLimpia = formaFarmaceutica.trim()
  const descripcionPresentacionLimpia = descripcionPresentacion.trim()

  const formaFarmaceuticaLegible = formaFarmaceuticaLimpia
    .replaceAll('_', ' ')
    .toUpperCase()

  const descripcionPresentacionLegible = descripcionPresentacionLimpia.length > 0
    ? descripcionPresentacionLimpia.charAt(0).toUpperCase() + descripcionPresentacionLimpia.slice(1).toLowerCase()
    : ''

  return [
    ifaLimpio.toUpperCase(),
    concentracionLimpia.toUpperCase(),
    formaFarmaceuticaLegible,
    descripcionPresentacionLegible,
  ]
    .filter(parte => parte.length > 0)
    .join(' ')
}
