import type {
  PrincipioActivo,
  ProductoComercial,
  ResumenInventarioFarmacia,
} from './types'

export interface AlertaStockEsencial {
  nombreComercial: string
  ifa: string
  totalDisponible: number
  stockMinimo: number
}

export function calcularAlertasStockEsencial(
  resumenInventario: ResumenInventarioFarmacia[],
  productosComerciales: ProductoComercial[],
  principiosActivos: PrincipioActivo[],
): AlertaStockEsencial[] {
  return resumenInventario.reduce<AlertaStockEsencial[]>((alertas, item) => {
    if (item.stockMinimo === 0 || item.totalDisponible > item.stockMinimo) return alertas

    const productoComercial = productosComerciales.find(producto => producto.id === item.productoId)
    if (!productoComercial) return alertas

    const nombresDci = (productoComercial.ifa ?? '')
      .split(' + ')
      .map(nombreDci => nombreDci.trim())
      .filter(nombreDci => nombreDci.length > 0)

    const tienePrincipioEsencial = nombresDci.some(nombreDci => {
      const nombreProductoNormalizado = nombreDci.toLowerCase()
      return principiosActivos.some(principioActivo => {
        if (!principioActivo.esEsencialMinsa) return false
        const nombrePrincipioNormalizado = principioActivo.nombreDci.toLowerCase()
        return nombreProductoNormalizado.includes(nombrePrincipioNormalizado) ||
          nombrePrincipioNormalizado.includes(nombreProductoNormalizado)
      })
    })

    if (!tienePrincipioEsencial) return alertas

    return [
      ...alertas,
      {
        nombreComercial: item.nombreComercial,
        ifa: productoComercial.ifa ?? '',
        totalDisponible: item.totalDisponible,
        stockMinimo: item.stockMinimo,
      },
    ]
  }, [])
}
