import { useState, useEffect, useMemo } from "react";
import { Download, Printer, BarChart2, RefreshCw } from "lucide-react";
import type {
  TipoReporte,
  TipoPeriodo,
  PeriodoReporte,
  ReporteVentas,
  ReporteComprobantes,
  ReporteAbastecimiento,
  ReporteTurnos,
} from "../../domains/reports/reporte.types";
import {
  generarReporteVentas,
  generarReporteComprobantes,
  generarReporteAbastecimiento,
  generarReporteTurnos,
} from "../../domains/reports/reporte.service";
import {
  exportarVentasExcel,
  exportarComprobantesExcel,
  exportarTurnosExcel,
  exportarAbastecimientoExcel,
} from "../../domains/reports/reporte.exporter";
import {
  formatearVentasTermico,
  formatearComprobantesTermico,
  formatearTurnosTermico,
  formatearAbastecimientoTermico,
} from "../../domains/reports/reporte.printer";

function inicioDelDiaActualISO(): string {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha.toISOString();
}

function ahoraISO(): string {
  return new Date().toISOString();
}

function toDateInputValue(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function desdeDateInput(value: string): string {
  if (!value) return "";
  const fecha = new Date(`${value}T00:00:00`);
  fecha.setHours(0, 0, 0, 0);
  return fecha.toISOString();
}

function hastaDateInput(value: string): string {
  if (!value) return "";
  const fecha = new Date(`${value}T23:59:59.999`);
  fecha.setHours(23, 59, 59, 999);
  return fecha.toISOString();
}

function fmtMonto(n: number | undefined | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "S/ 0.00";
  return `S/ ${n.toFixed(2)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("es-PE");
}

function fmtFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcularPeriodo(tipo: TipoPeriodo, desde: string, hasta: string): PeriodoReporte {
  const now = new Date();

  if (tipo === "DIA") {
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { tipo, desde: start.toISOString(), hasta: end.toISOString() };
  }

  if (tipo === "SEMANA") {
    const start = new Date(now);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { tipo, desde: start.toISOString(), hasta: end.toISOString() };
  }

  if (tipo === "MES") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { tipo, desde: start.toISOString(), hasta: end.toISOString() };
  }

  return { tipo, desde, hasta };
}

function ControlChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? "bg-[#2154d8] text-white"
          : "border border-[#e0e8f2] bg-white text-[#374151] hover:bg-[#f0f4ff]"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">{label}</p>
      <p className={`mt-1 text-[14px] font-extrabold tabular-nums ${accent ?? "text-[#121416]"}`}>{value}</p>
    </div>
  );
}

export function ReportesWorkspace() {
  const [tipoActivo, setTipoActivo] = useState<TipoReporte>("VENTAS");
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>("DIA");
  const [rangoDesde, setRangoDesde] = useState<string>(inicioDelDiaActualISO());
  const [rangoHasta, setRangoHasta] = useState<string>(ahoraISO());
  const [reporte, setReporte] = useState<ReporteVentas | ReporteComprobantes | ReporteAbastecimiento | ReporteTurnos | null>(null);
  const [generando, setGenerando] = useState(false);

  function generarActual(): void {
    const canGenerate = tipoPeriodo !== "RANGO" || (rangoDesde && rangoHasta);
    if (!canGenerate) {
      setReporte(null);
      setGenerando(false);
      return;
    }

    setGenerando(true);

    Promise.resolve().then(() => {
      const periodo = calcularPeriodo(tipoPeriodo, rangoDesde, rangoHasta);

      switch (tipoActivo) {
        case "VENTAS":
          setReporte(generarReporteVentas(periodo));
          return;
        case "COMPROBANTES":
          setReporte(generarReporteComprobantes(periodo));
          return;
        case "ABASTECIMIENTO":
          setReporte(generarReporteAbastecimiento(periodo));
          return;
        case "TURNOS":
          setReporte(generarReporteTurnos(periodo));
          return;
      }
    }).finally(() => {
      setGenerando(false);
    });
  }

  useEffect(() => {
    const canGenerate = tipoPeriodo !== "RANGO" || (rangoDesde && rangoHasta);

    if (!canGenerate) {
      setReporte(null);
      return;
    }

    generarActual();
  }, [tipoActivo, tipoPeriodo, rangoDesde, rangoHasta]);

  const reporteVentas = tipoActivo === "VENTAS" ? reporte as ReporteVentas | null : null;
  const reporteComprobantes = tipoActivo === "COMPROBANTES" ? reporte as ReporteComprobantes | null : null;
  const reporteAbastecimiento = tipoActivo === "ABASTECIMIENTO" ? reporte as ReporteAbastecimiento | null : null;
  const reporteTurnos = tipoActivo === "TURNOS" ? reporte as ReporteTurnos | null : null;

  const previewText = useMemo(() => {
    if (!reporte) return "";

    switch (tipoActivo) {
      case "VENTAS":
        return formatearVentasTermico(reporte as ReporteVentas);
      case "COMPROBANTES":
        return formatearComprobantesTermico(reporte as ReporteComprobantes);
      case "ABASTECIMIENTO":
        return formatearAbastecimientoTermico(reporte as ReporteAbastecimiento);
      case "TURNOS":
        return formatearTurnosTermico(reporte as ReporteTurnos);
    }
  }, [reporte, tipoActivo]);

  const ventasHourMax = useMemo(() => {
    if (!reporteVentas) return 0;
    return Math.max(...reporteVentas.ventasPorHora.map(item => item.totalVendido), 0);
  }, [reporteVentas]);

  function handleExportar(): void {
    if (!reporte) return;

    switch (tipoActivo) {
      case "VENTAS":
        exportarVentasExcel(reporte as ReporteVentas);
        return;
      case "COMPROBANTES":
        exportarComprobantesExcel(reporte as ReporteComprobantes);
        return;
      case "ABASTECIMIENTO":
        exportarAbastecimientoExcel(reporte as ReporteAbastecimiento);
        return;
      case "TURNOS":
        exportarTurnosExcel(reporte as ReporteTurnos);
        return;
    }
  }

  function handleImprimirTermico(): void {
    if (!reporte) return;

    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;

    const safeText = previewText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    w.document.write(`
      <html>
        <head>
          <title>Vista previa térmica</title>
          <style>
            body { margin: 0; padding: 0; background: #fff; color: #000; font-family: monospace; }
            pre { margin: 0; padding: 8px; font-size: 10pt; line-height: 1.35; white-space: pre-wrap; }
            @media print { @page { margin: 0; size: auto; } body { margin: 0; } }
          </style>
        </head>
        <body>
          <pre>${safeText}</pre>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#2154d8]/20 bg-[#FDFCF9]">
      <header className="flex items-center gap-2 border-b border-[#2154d8]/15 bg-[#f0f4ff] px-4 py-3">
        <BarChart2 size={18} className="text-[#2154d8]" />
        <span className="text-[14px] font-black uppercase tracking-widest text-[#1a2d4e]">REPORTES</span>
        <span className="rounded-full bg-[#2154d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {tipoActivo}
        </span>
        {generando && <RefreshCw size={14} className="animate-spin text-[#2154d8]" />}
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#e8edf5] bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ControlChip label="VENTAS" active={tipoActivo === "VENTAS"} onClick={() => setTipoActivo("VENTAS")} />
          <ControlChip label="COMPROBANTES" active={tipoActivo === "COMPROBANTES"} onClick={() => setTipoActivo("COMPROBANTES")} />
          <ControlChip label="ABASTECIMIENTO" active={tipoActivo === "ABASTECIMIENTO"} onClick={() => setTipoActivo("ABASTECIMIENTO")} />
          <ControlChip label="TURNOS" active={tipoActivo === "TURNOS"} onClick={() => setTipoActivo("TURNOS")} />
        </div>

        <div className="h-5 w-px bg-[#e0e8f2]" />

        <div className="flex flex-wrap items-center gap-1.5">
          <ControlChip label="HOY" active={tipoPeriodo === "DIA"} onClick={() => setTipoPeriodo("DIA")} />
          <ControlChip label="SEMANA" active={tipoPeriodo === "SEMANA"} onClick={() => setTipoPeriodo("SEMANA")} />
          <ControlChip label="MES" active={tipoPeriodo === "MES"} onClick={() => setTipoPeriodo("MES")} />
          <ControlChip label="RANGO" active={tipoPeriodo === "RANGO"} onClick={() => setTipoPeriodo("RANGO")} />
        </div>

        {tipoPeriodo === "RANGO" && (
          <>
            <input
              type="date"
              value={toDateInputValue(rangoDesde)}
              onChange={e => setRangoDesde(desdeDateInput(e.target.value))}
              className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none"
            />
            <input
              type="date"
              value={toDateInputValue(rangoHasta)}
              onChange={e => setRangoHasta(hastaDateInput(e.target.value))}
              className="rounded-xl border border-[#e0e8f2] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none"
            />
            <button
              onClick={generarActual}
              disabled={!rangoDesde || !rangoHasta}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold text-white ${
                rangoDesde && rangoHasta ? "bg-[#2154d8]" : "cursor-not-allowed bg-[#9db4f3]"
              }`}
            >
              GENERAR
            </button>
          </>
        )}

        <div className="h-5 w-px bg-[#e0e8f2]" />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportar}
            disabled={!reporte}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold ${
              reporte
                ? "border border-[#d7e3ff] bg-[#f0f4ff] text-[#2154d8] hover:bg-[#e7efff]"
                : "cursor-not-allowed border border-[#e5e7eb] bg-[#f8fafc] text-[#9ca3af]"
            }`}
          >
            <Download size={13} />
            EXCEL
          </button>
          <button
            onClick={handleImprimirTermico}
            disabled={!reporte}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold ${
              reporte
                ? "border border-[#d7e3ff] bg-[#f0f4ff] text-[#2154d8] hover:bg-[#e7efff]"
                : "cursor-not-allowed border border-[#e5e7eb] bg-[#f8fafc] text-[#9ca3af]"
            }`}
          >
            <Printer size={13} />
            IMPRIMIR
          </button>
        </div>
      </div>

      <div className="border-b border-[#e8edf5] bg-[#f8fafc] px-4 py-2">
        {tipoActivo === "VENTAS" && (
          <div className="grid grid-cols-5 gap-2">
            <StatCard label="Total Vendido" value={reporteVentas ? fmtMonto(reporteVentas.totalVendido) : "S/ 0.00"} accent="text-[#2154d8]" />
            <StatCard label="Transacciones" value={reporteVentas ? fmtNum(reporteVentas.totalTransacciones) : "0"} />
            <StatCard
              label="Ticket Promedio"
              value={reporteVentas ? fmtMonto(reporteVentas.totalTransacciones > 0 ? reporteVentas.totalVendido / reporteVentas.totalTransacciones : 0) : "S/ 0.00"}
            />
            <StatCard label="Efectivo" value={reporteVentas ? fmtMonto(reporteVentas.desglosePago.efectivo.monto) : "S/ 0.00"} accent="text-emerald-700" />
            <StatCard
              label="Yape / Tarjeta"
              value={reporteVentas ? `${fmtMonto(reporteVentas.desglosePago.yape.monto)} / ${fmtMonto(reporteVentas.desglosePago.tarjeta.monto)}` : "--"}
              accent="text-[#374151]"
            />
          </div>
        )}

        {tipoActivo === "COMPROBANTES" && (
          <div className="grid grid-cols-5 gap-2">
            <StatCard label="Total Emitido" value={reporteComprobantes ? fmtMonto(reporteComprobantes.totalEmitido) : "S/ 0.00"} accent="text-[#2154d8]" />
            <StatCard
              label="Boletas"
              value={reporteComprobantes ? fmtNum(reporteComprobantes.conteoPorTipo.find(item => item.tipo === "BOLETA")?.cantidad ?? 0) : "0"}
            />
            <StatCard
              label="Facturas"
              value={reporteComprobantes ? fmtNum(reporteComprobantes.conteoPorTipo.find(item => item.tipo === "FACTURA")?.cantidad ?? 0) : "0"}
            />
            <StatCard
              label="Anulaciones"
              value={reporteComprobantes ? fmtNum(reporteComprobantes.anulaciones) : "0"}
              accent={reporteComprobantes && reporteComprobantes.anulaciones > 0 ? "text-red-600" : undefined}
            />
            <StatCard
              label="Pendientes SUNAT"
              value={reporteComprobantes ? fmtNum(reporteComprobantes.pendientesSUNAT) : "0"}
              accent={reporteComprobantes && reporteComprobantes.pendientesSUNAT > 0 ? "text-amber-600" : undefined}
            />
          </div>
        )}

        {tipoActivo === "ABASTECIMIENTO" && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard
              label="En Alerta"
              value={reporteAbastecimiento ? fmtNum(reporteAbastecimiento.productosEnAlerta.length) : "0"}
              accent="text-amber-600"
            />
            <StatCard
              label="Agotados"
              value={reporteAbastecimiento ? fmtNum(reporteAbastecimiento.productosEnAlerta.filter(item => item.disponible === 0).length) : "0"}
              accent="text-red-600"
            />
            <StatCard label="Compras Período" value={reporteAbastecimiento ? fmtNum(reporteAbastecimiento.comprasDelPeriodo) : "0"} />
            <StatCard label="Gasto Total" value={reporteAbastecimiento ? fmtMonto(reporteAbastecimiento.gastoTotal) : "S/ 0.00"} accent="text-[#2154d8]" />
          </div>
        )}

        {tipoActivo === "TURNOS" && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Turnos Cerrados"
              value={reporteTurnos ? fmtNum(reporteTurnos.turnos.filter(turno => turno.estado === "CERRADO").length) : "0"}
            />
            <StatCard
              label="Turnos Abiertos"
              value={reporteTurnos ? fmtNum(reporteTurnos.turnos.filter(turno => turno.estado === "ABIERTO").length) : "0"}
              accent={reporteTurnos && reporteTurnos.turnos.some(turno => turno.estado === "ABIERTO") ? "text-amber-600" : undefined}
            />
            <StatCard
              label="Diferencia Total"
              value={reporteTurnos ? fmtMonto(reporteTurnos.turnos.reduce((acc, turno) => acc + (turno.diferencia ?? 0), 0)) : "S/ 0.00"}
              accent="text-[#2154d8]"
            />
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!reporte && !generando && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <BarChart2 size={32} className="text-[#cbd5e1]" />
              <p className="text-[13px] font-semibold text-[#94a3b8]">Seleccione un período para generar el reporte</p>
            </div>
          )}

          {generando && (
            <div className="flex h-full items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[#2154d8]" />
            </div>
          )}

          {!generando && reporteVentas && (
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Productos más vendidos</h3>
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="text-[#94a3b8]">
                    <tr>
                      <th className="pb-2 font-semibold">Producto</th>
                      <th className="pb-2 font-semibold">Cantidad</th>
                      <th className="pb-2 text-right font-semibold">Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#334155]">
                    {reporteVentas.productosMasVendidos.slice(0, 10).map(item => (
                      <tr key={item.hovId} className="border-t border-[#eef2f7]">
                        <td className="py-2">{item.nombre}</td>
                        <td className="py-2">{fmtNum(item.cantidadVendida)}</td>
                        <td className="py-2 text-right font-semibold">{fmtMonto(item.totalGenerado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Por operador</h3>
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="text-[#94a3b8]">
                    <tr>
                      <th className="pb-2 font-semibold">Operador</th>
                      <th className="pb-2 font-semibold">Transacciones</th>
                      <th className="pb-2 text-right font-semibold">Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#334155]">
                    {reporteVentas.ventasPorOperador.map(item => (
                      <tr key={item.operadorId} className="border-t border-[#eef2f7]">
                        <td className="py-2">{item.nombre}</td>
                        <td className="py-2">{fmtNum(item.transacciones)}</td>
                        <td className="py-2 text-right font-semibold">{fmtMonto(item.totalVendido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Actividad por hora</h3>
                <div className="mt-4 flex items-end gap-[2px]" style={{ minHeight: "56px" }}>
                  {reporteVentas.ventasPorHora.map(item => {
                    const height = ventasHourMax > 0
                      ? Math.max(2, (item.totalVendido / ventasHourMax) * 48)
                      : 2;

                    return (
                      <div key={item.hora} className="flex flex-col items-center gap-1">
                        <div
                          title={`${item.hora}:00 · ${fmtMonto(item.totalVendido)}`}
                          className="w-full rounded-sm bg-[#2154d8]/70 transition hover:bg-[#2154d8]"
                          style={{ height: `${height}px`, minHeight: "2px" }}
                        />
                        <span className="text-[9px] text-[#94a3b8]">
                          {item.hora % 4 === 0 ? item.hora : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {!generando && reporteComprobantes && (
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Conteo por tipo</h3>
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="text-[#94a3b8]">
                    <tr>
                      <th className="pb-2 font-semibold">Tipo</th>
                      <th className="pb-2 font-semibold">Cantidad</th>
                      <th className="pb-2 text-right font-semibold">Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#334155]">
                    {reporteComprobantes.conteoPorTipo.map(item => (
                      <tr key={item.tipo} className="border-t border-[#eef2f7]">
                        <td className="py-2">{item.tipo}</td>
                        <td className="py-2">{fmtNum(item.cantidad)}</td>
                        <td className="py-2 text-right font-semibold">{fmtMonto(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <div className="flex flex-wrap gap-2">
                {reporteComprobantes.pendientesSUNAT > 0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                    {reporteComprobantes.pendientesSUNAT} pendientes de envío SUNAT
                  </span>
                )}
                {reporteComprobantes.anulaciones > 0 && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                    {reporteComprobantes.anulaciones} anulaciones en el período
                  </span>
                )}
              </div>
            </div>
          )}

          {!generando && reporteAbastecimiento && (
            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Alertas de stock</h3>
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="text-[#94a3b8]">
                    <tr>
                      <th className="pb-2 font-semibold">Producto</th>
                      <th className="pb-2 font-semibold">Disponible</th>
                      <th className="pb-2 font-semibold">Umbral</th>
                      <th className="pb-2 font-semibold">Semáforo</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#334155]">
                    {reporteAbastecimiento.productosEnAlerta.map(item => (
                      <tr key={item.productoId} className="border-t border-[#eef2f7]">
                        <td className="py-2">{item.nombre}</td>
                        <td className="py-2">{fmtNum(item.disponible)}</td>
                        <td className="py-2">{fmtNum(item.umbralAlerta)}</td>
                        <td className="py-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.disponible === 0
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {item.disponible === 0 ? "ROJO" : "AMBER"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                <h3 className="text-[12px] font-black uppercase tracking-wider text-[#1a2d4e]">Proveedores</h3>
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="text-[#94a3b8]">
                    <tr>
                      <th className="pb-2 font-semibold">Proveedor</th>
                      <th className="pb-2 font-semibold">Compras</th>
                      <th className="pb-2 text-right font-semibold">Monto Total S/</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#334155]">
                    {reporteAbastecimiento.resumenProveedores.map(item => (
                      <tr key={item.proveedor} className="border-t border-[#eef2f7]">
                        <td className="py-2">{item.proveedor || "Sin proveedor"}</td>
                        <td className="py-2">{fmtNum(item.cantidadCompras)}</td>
                        <td className="py-2 text-right font-semibold">{fmtMonto(item.montoTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {!generando && reporteTurnos && (
            <div className="flex flex-col gap-3">
              {reporteTurnos.turnos.map((turno, index) => (
                <article key={`${turno.cajaId}-${turno.apertura.hora}-${index}`} className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold text-[#1a2d4e]">Caja {turno.cajaId}</p>
                      <p className="mt-1 text-[11px] text-[#6b7280]">{turno.operador}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      turno.estado === "CERRADO" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {turno.estado}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-[#334155]">
                    <p><span className="font-semibold">Apertura:</span> {fmtFechaHora(turno.apertura.hora)} · {fmtMonto(turno.apertura.montoInicial)}</p>
                    <p>
                      <span className="font-semibold">Cierre:</span>{" "}
                      {turno.cierre ? `${fmtFechaHora(turno.cierre.hora)} · ${fmtMonto(turno.cierre.montoCierre)}` : "Abierto"}
                    </p>
                    <p className={`font-semibold ${
                      turno.diferencia === null
                        ? "text-slate-500"
                        : turno.diferencia >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}>
                      Diferencia: {turno.diferencia === null ? "S/ 0.00" : fmtMonto(turno.diferencia)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-[240px] shrink-0 flex-col border-l border-[#e8edf5]">
          <header className="border-b border-[#e8edf5] bg-[#f8fafc] px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">VISTA PREVIA</span>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#1a1a1a] px-3 py-3">
            {!reporte ? (
              <div className="flex h-full items-center justify-center">
                <span className="font-mono text-[10px] text-[#4a4a4a]">─ sin datos ─</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[#d4d4d4]">
                {previewText}
              </pre>
            )}
          </div>

          <footer className="flex gap-2 border-t border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
            <button
              onClick={handleImprimirTermico}
              disabled={!reporte}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                reporte
                  ? "bg-[#2b2b2b] text-[#e5e7eb] hover:bg-[#343434]"
                  : "cursor-not-allowed bg-[#232323] text-[#5b5b5b]"
              }`}
            >
              IMPRIMIR
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
