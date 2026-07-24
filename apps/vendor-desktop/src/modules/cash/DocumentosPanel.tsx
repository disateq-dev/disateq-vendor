import { useEffect, useState } from 'react'
import { FileText, Printer, X } from 'lucide-react'
import {
  anularComprobanteEnSQLite,
  obtenerComprobantesSesionSQLite,
  registrarEventoComprobanteSQLite,
  type ComprobanteResumen,
} from '../../domains/documents/comprobante-sqlite.service'

interface DocumentosPanelProps {
  sesionId: string
  operadorId: string
}

export function DocumentosPanel({ sesionId, operadorId }: DocumentosPanelProps) {
  const [comprobantes, setComprobantes] = useState<ComprobanteResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'TIQUE_VENTA' | 'BOLETA_VENTA' | 'FACTURA_ELECTRONICA'>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'EMITIDO' | 'ANULADO' | 'CONVERTIDO' | 'REIMPRESO'>('TODOS')

  useEffect(() => {
    async function cargarDocumentos() {
      setCargando(true)
      try {
        const data = await obtenerComprobantesSesionSQLite(sesionId)
        setComprobantes(data)
        setCargando(false)
      } catch {
        setCargando(false)
      }
    }

    void cargarDocumentos()
  }, [sesionId])

  const documentosFiltrados = comprobantes.filter(c => {
    const pasaTipo = filtroTipo === 'TODOS' || c.tipo === filtroTipo
    const pasaEstado =
      filtroEstado === 'TODOS' ? true :
      filtroEstado === 'REIMPRESO' ? c.fueReimpreso :
      c.estado === filtroEstado
    return pasaTipo && pasaEstado
  })

  const recargar = async () => {
    setCargando(true)
    try {
      const data = await obtenerComprobantesSesionSQLite(sesionId)
      setComprobantes(data)
    } finally {
      setCargando(false)
    }
  }

  const chipTipo = (tipo: string) => {
    const contenido = {
      TIQUE_VENTA: ['TIQUE', 'bg-[#f1f5f9] text-[#697387]'],
      BOLETA_VENTA: ['BOLETA', 'bg-blue-50 text-blue-600'],
      FACTURA_ELECTRONICA: ['FACTURA', 'bg-amber-50 text-amber-700'],
    }[tipo] ?? [tipo, 'bg-[#f1f5f9] text-[#697387]']

    return (
      <span className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ${contenido[1]}`}>
        {contenido[0]}
      </span>
    )
  }

  const chipMetodo = (metodo: string) => {
    const contenido = {
      EFECTIVO: ['EFE', 'bg-emerald-50 text-emerald-600'],
      YAPE: ['YAP', 'bg-purple-50 text-purple-600'],
      TARJETA: ['TAR', 'bg-sky-50 text-sky-600'],
    }[metodo] ?? [metodo, 'bg-[#f1f5f9] text-[#697387]']

    return (
      <span className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-bold tabular-nums ${contenido[1]}`}>
        {contenido[0]}
      </span>
    )
  }

  const chipEstado = (estado: string, fueReimpreso: boolean) => {
    const contenido = estado === 'EMITIDO' && fueReimpreso
      ? ['REIMPRESO', 'bg-amber-50 text-amber-600']
      : {
          EMITIDO: ['VIGENTE', 'bg-[#f0fdf4] text-emerald-600'],
          ANULADO: ['ANULADO', 'bg-red-50 text-red-500'],
          CONVERTIDO: ['CONVERTIDO', 'bg-sky-50 text-sky-600'],
          REFERENCIADO: ['REF.', 'bg-[#f1f5f9] text-[#697387]'],
        }[estado] ?? [estado, 'bg-[#f1f5f9] text-[#697387]']

    return (
      <span className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ${contenido[1]}`}>
        {contenido[0]}
      </span>
    )
  }

  const handleReimprimir = async (comp: ComprobanteResumen) => {
    await registrarEventoComprobanteSQLite(comp.id, 'REIMPRESION', operadorId, sesionId)
    await recargar()
  }

  const handleAnular = async (comp: ComprobanteResumen) => {
    if (!window.confirm('¿Anular este comprobante? Esta acción no se puede deshacer.')) {
      return
    }

    await anularComprobanteEnSQLite(comp.id, 'Anulación desde panel DOCUMENTOS')
    await recargar()
  }

  const clasesChip = (activo: boolean) =>
    `rounded-xl px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide transition ${
      activo ? 'bg-[#C59B6D] text-white' : 'text-[#9ca3af] hover:text-[#374151]'
    }`

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-col gap-2 border-b border-[#C59B6D]/15 bg-[#FFF5E6] px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {([
            ['TODOS', 'TODOS'],
            ['TIQUE_VENTA', 'TIQUE'],
            ['BOLETA_VENTA', 'BOLETA'],
            ['FACTURA_ELECTRONICA', 'FACTURA'],
          ] as const).map(([tipo, etiqueta]) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={clasesChip(filtroTipo === tipo)}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {([
            ['TODOS', 'TODOS'],
            ['EMITIDO', 'VIGENTE'],
            ['ANULADO', 'ANULADO'],
            ['CONVERTIDO', 'CONVERTIDO'],
            ['REIMPRESO', 'REIMPRESO'],
          ] as const).map(([estado, etiqueta]) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              className={clasesChip(filtroEstado === estado)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {cargando ? (
          <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Cargando documentos…</p>
        ) : documentosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-[#c8d4e0]">
            <FileText size={18} />
            <p className="text-[10.5px]">Sin documentos en este turno</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px">
            {documentosFiltrados.map(comp => {
              const hora = new Date(comp.emitidoEn).toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={comp.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white">
                  {chipTipo(comp.tipo)}
                  <span className="text-[11px] font-bold tabular-nums text-[#374151]">
                    {comp.serie}-{String(comp.correlativo).padStart(8, '0')}
                  </span>
                  <span className="text-[10px] tabular-nums text-[#9ca3af]">{hora}</span>
                  <span className="text-[11px] font-semibold tabular-nums text-[#374151]">
                    S/ {comp.total.toFixed(2)}
                  </span>
                  {chipMetodo(comp.metodoPago)}
                  {chipEstado(comp.estado, comp.fueReimpreso)}
                  <div className="ml-auto flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => void handleReimprimir(comp)}
                      className="rounded-lg p-1 text-[#9ca3af] transition hover:text-[#2154d8]"
                      aria-label="Reimprimir comprobante"
                    >
                      <Printer size={10} />
                    </button>
                    {comp.estado === 'EMITIDO' && (
                      <button
                        type="button"
                        onClick={() => void handleAnular(comp)}
                        className="rounded-lg p-1 text-[#9ca3af] transition hover:text-red-500"
                        aria-label="Anular comprobante"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
