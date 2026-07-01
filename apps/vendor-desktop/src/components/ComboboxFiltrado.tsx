import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactElement } from 'react'

export interface OpcionComboboxFiltrado {
  valor: string
  etiqueta: string
}

interface ComboboxFiltradoProps {
  opciones: OpcionComboboxFiltrado[]
  valor?: string
  onChange(valor: string): void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ComboboxFiltrado({
  opciones,
  valor,
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  className = '',
}: ComboboxFiltradoProps): ReactElement {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState<boolean>(false)
  const [filtro, setFiltro] = useState<string>('')

  const opcionSeleccionada = useMemo(
    (): OpcionComboboxFiltrado | undefined => opciones.find((opcion: OpcionComboboxFiltrado) => opcion.valor === valor),
    [opciones, valor],
  )

  const opcionesFiltradas = useMemo((): OpcionComboboxFiltrado[] => {
    const filtroNormalizado = filtro.trim().toLowerCase()
    if (filtroNormalizado === '') return opciones
    return opciones.filter((opcion: OpcionComboboxFiltrado) => opcion.etiqueta.toLowerCase().includes(filtroNormalizado))
  }, [filtro, opciones])

  useEffect(() => {
    if (!abierto) return

    const onMouseDown = (event: MouseEvent): void => {
      if (contenedorRef.current === null) return
      if (event.target instanceof Node && !contenedorRef.current.contains(event.target)) {
        setAbierto(false)
        setFiltro('')
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [abierto])

  const abrir = (): void => {
    if (disabled) return
    setAbierto(true)
  }

  const onFiltroChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (disabled) return
    if (!abierto) setAbierto(true)
    setFiltro(event.target.value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Escape') return
    setAbierto(false)
    setFiltro('')
  }

  const onSeleccionar = (valorSeleccionado: string): void => {
    onChange(valorSeleccionado)
    setAbierto(false)
    setFiltro('')
  }

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={abierto ? filtro : opcionSeleccionada?.etiqueta ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={abrir}
          onClick={abrir}
          onChange={onFiltroChange}
          onKeyDown={onKeyDown}
          className="h-[38px] w-full rounded-xl border border-[#E0F2FE] bg-white px-3 pr-9 text-[13px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-2 focus:ring-[#E0F2FE] disabled:cursor-not-allowed disabled:opacity-50"
        />
        {!abierto && opcionSeleccionada !== undefined ? (
          <Check
            size={16}
            strokeWidth={2.5}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#45b356]"
          />
        ) : (
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {abierto && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#E0F2FE] bg-white shadow-md">
          <div className="max-h-[220px] overflow-y-auto">
            {opcionesFiltradas.length > 0 ? (
              opcionesFiltradas.map((opcion: OpcionComboboxFiltrado) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => onSeleccionar(opcion.valor)}
                  className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-[#E0F2FE]"
                >
                  {opcion.etiqueta}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[12px] font-semibold text-slate-400">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
