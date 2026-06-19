import type { ReactElement } from 'react'
import type {
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
} from '../../../../domains/farmacia/types'
import type { TabDetalleFarmacia } from '../hooks/useCatalogoFarmacia'

interface DetalleProductoProps {
  producto: ProductoComercial
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  tabActiva: TabDetalleFarmacia
  cargando: boolean
  onTabChange: (t: TabDetalleFarmacia) => void
  onVolver: () => void
}

interface CampoLecturaProps {
  label: string
  valor?: string | number
}

interface HeaderProductoProps {
  producto: ProductoComercial
}

interface TabsProductoProps {
  tabActiva: TabDetalleFarmacia
  onTabChange: (t: TabDetalleFarmacia) => void
}

interface PresentacionesTabProps {
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
}

interface PreciosTabProps {
  nodos: NodoFraccionamiento[]
}

interface ProductoComercialConCategoria extends ProductoComercial {
  categoriaFarmacia?: string
}

function categoriaProducto(producto: ProductoComercial): string {
  const productoConCategoria = producto as ProductoComercialConCategoria
  return productoConCategoria.categoriaFarmacia ?? 'SIN CATEGORIA'
}

function CampoLectura({ label, valor }: CampoLecturaProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#EAF3DE] bg-white px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 min-h-5 text-[13px] font-semibold text-slate-800">{valor ?? '-'}</div>
    </div>
  )
}

function HeaderProducto({ producto }: HeaderProductoProps): ReactElement {
  return (
    <header className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
      <h2 className="text-[20px] font-bold text-slate-900">
        {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')}
      </h2>
      <p className="mt-1 text-[13px] font-semibold text-slate-500">{producto.nombreFabricante}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[producto.condicionVenta, categoriaProducto(producto)].map((chip) => (
          <span key={chip} className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
            {chip}
          </span>
        ))}
        {producto.requiereLote && (
          <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">Lote</span>
        )}
        {producto.requiereCadenaFrio && (
          <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
            Cadena de frío
          </span>
        )}
      </div>
    </header>
  )
}

function TabsProducto({ tabActiva, onTabChange }: TabsProductoProps): ReactElement {
  const tabs: { id: TabDetalleFarmacia; label: string }[] = [
    { id: 'detalle', label: 'Detalle' },
    { id: 'presentaciones', label: 'Presentaciones' },
    { id: 'precios', label: 'Precios' },
  ]
  return (
    <nav className="flex gap-2 border-b border-[#EAF3DE]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-[12px] font-bold uppercase tracking-wide ${
            tabActiva === tab.id ? 'border-b-2 border-[#639922] text-[#639922]' : 'text-slate-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

function PresentacionesTab({ presentaciones, nodos }: PresentacionesTabProps): ReactElement {
  return (
    <div className="space-y-4">
      {presentaciones.map((presentacion) => (
        <article key={presentacion.id} className="rounded-2xl border border-[#EAF3DE] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">{presentacion.descripcion}</h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                Fracción DIGEMID: {presentacion.fraccionDIGEMID} {presentacion.unidadConteo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.alert('Nueva forma de venta pendiente')}
              className="rounded-full border border-[#EAF3DE] px-3 py-1.5 text-[11px] font-bold text-[#639922]"
            >
              Agregar forma de venta
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {nodos
              .filter((nodo) => nodo.presentacionId === presentacion.id)
              .map((nodo) => (
                <div key={nodo.id} className={`rounded-xl bg-[#EAF3DE] px-3 py-2 ${nodo.nodoPadreId ? 'ml-6' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-bold text-slate-800">{nodo.nombreFormaVenta}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#639922]">
                      {nodo.tipoFormaVenta}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Unidades base: {nodo.unidadesBase}</p>
                </div>
              ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function PreciosTab({ nodos }: PreciosTabProps): ReactElement {
  return (
    <div className="space-y-3">
      {nodos
        .filter((nodo) => nodo.esVendible)
        .map((nodo) => (
          <label key={nodo.id} className="block rounded-xl border border-[#EAF3DE] bg-white px-4 py-3">
            <span className="text-[12px] font-bold text-slate-800">{nodo.nombreFormaVenta}</span>
            <input
              type="number"
              min="0"
              placeholder="Precio pendiente"
              className="mt-2 h-10 w-full rounded-lg border border-[#EAF3DE] px-3 text-[13px] font-semibold outline-none focus:border-[#639922]"
            />
          </label>
        ))}
    </div>
  )
}

export function DetalleProducto({
  producto,
  presentaciones,
  nodos,
  tabActiva,
  cargando,
  onTabChange,
  onVolver,
}: DetalleProductoProps): ReactElement {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={onVolver} className="w-fit text-[12px] font-bold text-[#639922]">
        ← Volver a búsqueda
      </button>
      <HeaderProducto producto={producto} />
      <TabsProducto tabActiva={tabActiva} onTabChange={onTabChange} />
      {cargando && <p className="text-[13px] font-semibold text-[#639922]">Cargando...</p>}
      {!cargando && tabActiva === 'detalle' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CampoLectura label="IFA" valor={producto.ifa} />
          <CampoLectura label="Concentración" valor={producto.concentracion} />
          <CampoLectura label="Forma farmacéutica" valor={producto.formaFarmaceutica} />
          <CampoLectura label="Categoría" valor={categoriaProducto(producto)} />
          <CampoLectura label="Fabricante" valor={producto.nombreFabricante} />
          <CampoLectura label="Registro sanitario" valor={producto.registroSanitario} />
          <CampoLectura label="Código DIGEMID" valor={producto.codigoDIGEMID} />
        </div>
      )}
      {!cargando && tabActiva === 'presentaciones' && <PresentacionesTab presentaciones={presentaciones} nodos={nodos} />}
      {!cargando && tabActiva === 'precios' && <PreciosTab nodos={nodos} />}
    </section>
  )
}
