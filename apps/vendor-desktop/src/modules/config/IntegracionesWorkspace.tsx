import { useState, useEffect } from "react";
import { Plug, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

const inputBase = "w-full rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#4A5265]/40 focus:outline-none focus:ring-1 focus:ring-[#4A5265]/20 transition";

export function IntegracionesWorkspace() {
  const [url,         setUrl]         = useState("");
  const [token,       setToken]       = useState("");
  const [mostrarToken, setMostrarToken] = useState(false);
  const [guardado,    setGuardado]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [cargando,    setCargando]    = useState(true);
  const [probando,    setProbando]    = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    invoke<{ url: string; token: string }>("obtener_config_integraciones")
      .then(cfg => { setUrl(cfg.url); setToken(cfg.token); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  async function handleGuardar() {
    setError(null);
    if (!url.trim()) { setError("La URL es requerida"); return; }
    if (!token.trim()) { setError("El token es requerido"); return; }
    try {
      await invoke("guardar_config_integraciones", { url: url.trim(), token: token.trim() });
      setGuardado(true);
      setResultadoPrueba(null);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleProbar() {
    if (!url.trim() || !token.trim()) return;
    setProbando(true);
    setResultadoPrueba(null);
    try {
      await invoke("consultar_ruc", { numRuc: "20100017491" });
      setResultadoPrueba({ ok: true, msg: "Conexión exitosa — RUC de prueba respondió correctamente" });
    } catch (e) {
      const msg = typeof e === "string" ? e : (e instanceof Error ? e.message : "Sin respuesta");
      if (msg.startsWith("INTEGRACION_NO_CONFIGURADA")) {
        setResultadoPrueba({ ok: false, msg: "Guarda la configuración antes de probar" });
      } else if (msg.startsWith("SIN_CONEXION")) {
        setResultadoPrueba({ ok: false, msg: "Sin conexión — verifica la URL y tu acceso a internet" });
      } else {
        setResultadoPrueba({ ok: false, msg });
      }
    } finally {
      setProbando(false);
    }
  }

  if (cargando) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4A5265] border-t-transparent" />
    </div>
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#4A5265]/50 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#4A5265]/15 bg-[#F3F4F6] px-4">
        <Plug size={13} strokeWidth={2} className="text-[#4A5265]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">AJUSTES · INTEGRACIONES</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">
        <div className="flex flex-col gap-5 max-w-md">

          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Consulta DNI / RUC</p>
            <p className="text-[11px] text-[#9ca3af] leading-relaxed">
              Servicio externo para consultar nombres desde DNI y razón social desde RUC.
              Configura la URL base y el token de acceso del proveedor activo.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[#E9E4DC] bg-white px-4 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">URL base</label>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setResultadoPrueba(null); }}
                placeholder="https://my.apidev.pro"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Token de acceso</label>
              <div className="relative">
                <input
                  type={mostrarToken ? "text" : "password"}
                  value={token}
                  onChange={e => { setToken(e.target.value); setResultadoPrueba(null); }}
                  placeholder="Bearer token"
                  className={`${inputBase} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0bac8] hover:text-[#4A5265] transition"
                >
                  {mostrarToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle size={12} className="shrink-0 text-red-500" />
                <p className="text-[11px] text-red-600">{error}</p>
              </div>
            )}

            {resultadoPrueba && (
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
                resultadoPrueba.ok
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}>
                {resultadoPrueba.ok
                  ? <Check size={12} className="shrink-0 mt-0.5 text-emerald-600" />
                  : <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-500" />
                }
                <p className={`text-[11px] leading-snug ${resultadoPrueba.ok ? "text-emerald-700" : "text-red-600"}`}>
                  {resultadoPrueba.msg}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleProbar}
                disabled={probando || !url.trim() || !token.trim()}
                className="flex-1 rounded-xl border border-[#4A5265]/20 bg-[#4A5265]/5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#4A5265] transition hover:bg-[#4A5265]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {probando ? "Probando..." : "PROBAR CONEXIÓN"}
              </button>
              <button
                onClick={handleGuardar}
                disabled={!url.trim() || !token.trim()}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  guardado ? "bg-emerald-500" : "bg-[#4A5265] hover:bg-[#3a4155]"
                }`}
              >
                {guardado ? <><Check size={12} strokeWidth={2.5} />Guardado</> : "GUARDAR"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E9E4DC] bg-[#f8fafc] px-4 py-3 flex flex-col gap-1.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Endpoints utilizados</p>
            <p className="font-mono text-[10.5px] text-[#6b7280]">GET {"{url}"}/api/dni/{"{8 dígitos}"}</p>
            <p className="font-mono text-[10.5px] text-[#6b7280]">GET {"{url}"}/api/ruc/{"{11 dígitos}"}</p>
            <p className="text-[10px] text-[#b0bac8] leading-relaxed mt-1">
              Cambia la URL base para migrar a otro proveedor o a la API propia de Disateq sin recompilar la aplicación.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
