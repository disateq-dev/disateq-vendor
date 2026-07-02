import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type { PrincipioActivo } from '../../../../domains/farmacia/types'
import { buscarPrincipiosActivos, obtenerPrincipiosDeProducto } from '../../../../domains/farmacia/farmacia.service'

interface SelectorPrincipiosActivosProps {
  productoGenericoId: string
  tieneHistorial: boolean
  operadorId: string
  onCambio: (ids: string[]) => void
  motivo: string
  disabled: boolean
}

export function SelectorPrincipiosActivos({
  productoGenericoId,
  tieneHistorial,
  operadorId,
  onCambio,
  motivo,
  disabled,
}: SelectorPrincipiosActivosProps): ReactElement {
  const [principiosSeleccionados, setPrincipiosSeleccionados] = useState<PrincipioActivo[]>([])
  const [query, setQuery] = useState<string>('')
  const [resultados, setResultados] = useState<PrincipioActivo[]>([])
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(true)
  const [mostrandoDropdown, setMostrandoDropdown] = useState<boolean>(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  void operadorId
  void motivo

  useEffect(() => {
    let activo = true
    setCargandoInicial(true)
    obtenerPrincipiosDeProducto(productoGenericoId)
      .then((respuesta) => {
        if (!activo) return
        const seleccionados = respuesta
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((principio) => ({
            id: principio.id,
            nombreDci: principio.nombreDci,
            descripcion: principio.descripcion,
            activo: true,
            esEsencialMinsa: false,
            esPsicotropico: false,
          }))
        setPrincipiosSeleccionados(seleccionados)
        onCambio(seleccionados.map((principio) => principio.id))
      })
      .catch(() => {
        if (!activo) return
        setPrincipiosSeleccionados([])
        onCambio([])
      })
      .finally(() => {
        if (activo) setCargandoInicial(false)
      })

    return () => {
      activo = false
    }
  }, [productoGenericoId])

  const onSeleccionar = useCallback((principio: PrincipioActivo): void => {
    if (principiosSeleccionados.some((seleccionado) => seleccionado.id === principio.id)) return
    const actualizados = [...principiosSeleccionados, principio]
    setPrincipiosSeleccionados(actualizados)
    setQuery('')
    setMostrandoDropdown(false)
    setResultados([])
    onCambio(actualizados.map((seleccionado) => seleccionado.id))
  }, [onCambio, principiosSeleccionados])

  const onEliminar = useCallback((id: string): void => {
    const actualizados = principiosSeleccionados.filter((principio) => principio.id !== id)
    setPrincipiosSeleccionados(actualizados)
    onCambio(actualizados.map((principio) => principio.id))
  }, [onCambio, principiosSeleccionados])

  const onCambioQuery = useCallback((valor: string): void => {
    setQuery(valor)
    if (valor.length < 2) {
      setResultados([])
      setMostrandoDropdown(false)
      return
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      buscarPrincipiosActivos(valor)
        .then((respuesta) => {
          setResultados(respuesta)
          setMostrandoDropdown(true)
        })
        .catch(() => {
          setResultados([])
        })
    }, 250)
  }, [])

  return (
    <div className="relative">
      {principiosSeleccionados.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {principiosSeleccionados.map((principio) => (
              <span key={principio.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F1FA] px-2.5 py-1 text-[11px] font-bold text-[#1E88C7]">
                {principio.nombreDci}
                <button
                  type="button"
                  onClick={() => onEliminar(principio.id)}
                  disabled={disabled}
                  className="text-[#1E88C7] hover:text-red-500 disabled:opacity-50"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          {tieneHistorial && (
            <p className="text-[10px] text-amber-600 mt-1">
              Producto con movimientos. Los cambios en principio activo quedan registrados en el historial de auditoria.
            </p>
          )}
        </>
      )}

      <input
        type="text"
        value={query}
        onChange={(event) => onCambioQuery(event.target.value)}
        placeholder="Buscar principio activo..."
        disabled={disabled || cargandoInicial}
        className="h-[34px] w-full rounded-lg border border-[var(--dv-input-border)] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[var(--dv-input-border-focus)] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {!disabled && (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('disateq:navegar', {
                detail: { destino: 'abastecimiento', subtab: 'ifa' },
              })
            )
          }}
          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#1E88C7]/60 hover:text-[#1E88C7] transition-colors"
        >
          <span>¿No encuentras el IFA?</span>
          <span className="underline underline-offset-2">Ir al catálogo de principios activos →</span>
        </button>
      )}

      {mostrandoDropdown && resultados.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E3F1FA] bg-white shadow-lg max-h-48 overflow-auto">
          {resultados.map((principio) => {
            const seleccionado = principiosSeleccionados.some((item) => item.id === principio.id)
            return (
              <button
                key={principio.id}
                type="button"
                onClick={() => onSeleccionar(principio)}
                disabled={seleccionado}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-[#E3F1FA] ${seleccionado ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{principio.nombreDci}</span>
                {principio.esEsencialMinsa && (
                  <span className="text-[9px] font-bold text-green-700 bg-green-100 rounded px-1">ESENCIAL</span>
                )}
                {principio.esPsicotropico && (
                  <span className="text-[9px] font-bold text-red-700 bg-red-100 rounded px-1">CTRL</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
