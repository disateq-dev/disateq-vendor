use serde::Serialize;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use tauri::Manager;
use tauri::State;

// ─── Helpers ────────────────────────────────────────────────────────────────

/// Genera un timestamp ISO 8601 UTC usando stdlib pura (sin chrono).
/// Formato: YYYY-MM-DDTHH:MM:SSZ
fn timestamp_utc() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    let days = secs / 86400; // días desde 1970-01-01

    // Algoritmo civil para convertir días epoch a fecha gregoriana
    let z = days + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mo = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if mo <= 2 { y + 1 } else { y };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y, mo, d, h, m, s
    )
}

/// Devuelve true si el nivel debe persistirse en SQLite (WARN, ERROR, CRITICAL).
fn persiste_en_sqlite(nivel: &str) -> bool {
    matches!(nivel, "WARN" | "ERROR" | "CRITICAL")
}

/// Normaliza el nivel: acepta cualquier casing, devuelve el canónico en mayúsculas.
/// Si no reconoce el valor, devuelve "WARN".
fn normalizar_nivel(nivel: &str) -> &'static str {
    match nivel.to_uppercase().as_str() {
        "INFO"     => "INFO",
        "WARN"     => "WARN",
        "ERROR"    => "ERROR",
        "CRITICAL" => "CRITICAL",
        _          => "WARN",
    }
}

/// Escribe una línea al archivo disateq-error.log en app_config_dir.
/// Nunca propaga error — falla silenciosa si el archivo no es accesible.
fn escribir_a_archivo(ruta: &PathBuf, linea: &str) {
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(ruta) {
        let _ = writeln!(file, "{}", linea);
    }
}

// ─── Tipos de respuesta ──────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct EventoLog {
    pub id:        i64,
    pub nivel:     String,
    pub modulo:    String,
    pub mensaje:   String,
    pub contexto:  Option<String>,
    pub sesion_id: Option<String>,
    pub timestamp: String,
}

#[derive(Serialize)]
pub struct ResumenSalud {
    pub estado:               String,
    pub criticos_total:       i64,
    pub errores_total:        i64,
    pub advertencias_total:   i64,
    pub ultimo_critical:      Option<String>,
    pub ultimo_error:         Option<String>,
}

// ─── Comandos Tauri ──────────────────────────────────────────────────────────

/// Registra un evento en el canal dual: archivo (siempre) + SQLite (WARN+).
/// Nunca retorna Err — absorbe todos sus propios fallos.
#[tauri::command]
pub async fn registrar_evento_log(
    app:          tauri::AppHandle,
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nivel:        String,
    modulo:       String,
    mensaje:      String,
    contexto:     Option<String>,
    sesion_id:    Option<String>,
) -> Result<(), String> {
    let nivel_canon = normalizar_nivel(&nivel);
    let ts = timestamp_utc();

    // Construir línea para archivo
    let linea = match &contexto {
        Some(ctx) => format!("[{}] [{}] [{}] {} | ctx={}", ts, nivel_canon, modulo, mensaje, ctx),
        None      => format!("[{}] [{}] [{}] {}", ts, nivel_canon, modulo, mensaje),
    };

    // CANAL A — Archivo (siempre, falla silenciosa)
    let ruta_log: Option<PathBuf> = app
        .path()
        .app_config_dir()
        .ok()
        .map(|d| d.join("disateq-error.log"));

    if let Some(ref ruta) = ruta_log {
        escribir_a_archivo(ruta, &linea);
    }

    // CANAL B — SQLite (solo WARN+, falla silenciosa)
    if persiste_en_sqlite(nivel_canon) {
        let resultado: Result<(), String> = async {
            let instances = db_instances.0.read().await;
            let db = instances
                .get("sqlite:disateq.db")
                .ok_or_else(|| String::from("pool no disponible"))?;
            let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

            sqlx::query(
                "INSERT INTO error_log (nivel, modulo, mensaje, contexto, sesion_id, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?)",
            )
            .bind(nivel_canon)
            .bind(&modulo)
            .bind(&mensaje)
            .bind(&contexto)
            .bind(&sesion_id)
            .bind(&ts)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;

            Ok(())
        }
        .await;

        // Si SQLite falla, intentar registrar el fallo en el archivo
        if let Err(e) = resultado {
            if let Some(ref ruta) = ruta_log {
                let linea_fallo = format!(
                    "[{}] [WARN] [log-interno] Fallo al persistir en SQLite: {}",
                    timestamp_utc(),
                    e
                );
                escribir_a_archivo(ruta, &linea_fallo);
            }
        }
    }

    // El comando siempre retorna Ok — nunca bloquea operaciones de negocio
    Ok(())
}

/// Devuelve eventos del log con filtros opcionales.
#[tauri::command]
pub async fn obtener_eventos_log(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nivel:        Option<String>,
    modulo:       Option<String>,
    limite:       Option<i64>,
) -> Result<Vec<EventoLog>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let limite_real = limite.unwrap_or(100).min(500);

    let rows = sqlx::query_as::<_, (i64, String, String, String, Option<String>, Option<String>, String)>(
        "SELECT id, nivel, modulo, mensaje, contexto, sesion_id, timestamp
         FROM error_log
         WHERE (nivel  = ?1 OR ?1 IS NULL)
           AND (modulo = ?2 OR ?2 IS NULL)
         ORDER BY timestamp DESC
         LIMIT ?3",
    )
    .bind(&nivel)
    .bind(&modulo)
    .bind(limite_real)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let eventos = rows
        .into_iter()
        .map(|(id, nivel, modulo, mensaje, contexto, sesion_id, timestamp)| EventoLog {
            id,
            nivel,
            modulo,
            mensaje,
            contexto,
            sesion_id,
            timestamp,
        })
        .collect();

    Ok(eventos)
}

/// Devuelve resumen de salud del sistema (últimos 7 días).
#[tauri::command]
pub async fn obtener_resumen_salud(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<ResumenSalud, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let row = sqlx::query_as::<_, (i64, i64, i64, Option<String>, Option<String>)>(
        "SELECT
           COUNT(*) FILTER (WHERE nivel = 'CRITICAL') AS criticos,
           COUNT(*) FILTER (WHERE nivel = 'ERROR')    AS errores,
           COUNT(*) FILTER (WHERE nivel = 'WARN')     AS advertencias,
           MAX(CASE WHEN nivel = 'CRITICAL' THEN timestamp END) AS ultimo_critical,
           MAX(CASE WHEN nivel = 'ERROR'    THEN timestamp END) AS ultimo_error
         FROM error_log
         WHERE timestamp >= datetime('now', '-7 days')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let (criticos, errores, advertencias, ultimo_critical, ultimo_error) = row;

    let estado = if criticos > 0 {
        "CRITICO"
    } else if errores > 0 || advertencias > 0 {
        "ALERTA"
    } else {
        "OK"
    }
    .to_string();

    Ok(ResumenSalud {
        estado,
        criticos_total:     criticos,
        errores_total:      errores,
        advertencias_total: advertencias,
        ultimo_critical,
        ultimo_error,
    })
}
