use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct RegistroAuditoria {
    pub id:             String,
    pub rubro:          String,
    pub dominio:        String,
    pub tipo_operacion: String,
    pub operador_id:    String,
    pub operador_alias: String,
    pub ejecutado_por:  String,
    pub detalle:        Option<String>,
    pub resultado:      String,
    pub ip_terminal:    Option<String>,
    pub registrado_en:  String,
}

#[derive(Serialize)]
pub struct ResumenAuditoriaDominio {
    pub dominio:   String,
    pub total:     i64,
    pub exitosos:  i64,
    pub fallidos:  i64,
    pub ultimo_en: Option<String>,
}

// Movido desde commands/operadores.rs — lógica idéntica, sin modificaciones
#[tauri::command]
pub async fn registrar_auditoria_operacion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    rubro: String,
    dominio: String,
    tipo_operacion: String,
    operador_id: String,
    operador_alias: String,
    ejecutado_por: String,
    detalle: Option<String>,
    resultado: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO auditoria_operacion
           (id, rubro, dominio, tipo_operacion, operador_id, operador_alias,
            ejecutado_por, detalle, resultado, ip_terminal, registrado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)",
    )
    .bind(&id)
    .bind(&rubro)
    .bind(&dominio)
    .bind(&tipo_operacion)
    .bind(&operador_id)
    .bind(&operador_alias)
    .bind(&ejecutado_por)
    .bind(&detalle)
    .bind(&resultado)
    .bind(&ahora)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn obtener_registros_auditoria(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    dominio: Option<String>,
    tipo_operacion: Option<String>,
    operador_alias: Option<String>,
    resultado: Option<String>,
    desde: Option<String>,
    hasta: Option<String>,
    limite: Option<i64>,
) -> Result<Vec<RegistroAuditoria>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let limite_real = limite.unwrap_or(100).min(500);

    let rows = sqlx::query_as::<_, (String, String, String, String, String, String, String, Option<String>, String, Option<String>, String)>(
        "SELECT id, rubro, dominio, tipo_operacion, operador_id, operador_alias,
                ejecutado_por, detalle, resultado, ip_terminal, registrado_en
         FROM auditoria_operacion
         WHERE (dominio        = ?1 OR ?1 IS NULL)
           AND (tipo_operacion = ?2 OR ?2 IS NULL)
           AND (operador_alias = ?3 OR ?3 IS NULL)
           AND (resultado      = ?4 OR ?4 IS NULL)
           AND (registrado_en >= ?5 OR ?5 IS NULL)
           AND (registrado_en <= ?6 OR ?6 IS NULL)
         ORDER BY registrado_en DESC
         LIMIT ?7",
    )
    .bind(&dominio)
    .bind(&tipo_operacion)
    .bind(&operador_alias)
    .bind(&resultado)
    .bind(&desde)
    .bind(&hasta)
    .bind(limite_real)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let registros = rows
        .into_iter()
        .map(|(id, rubro, dominio, tipo_operacion, operador_id, operador_alias,
               ejecutado_por, detalle, resultado, ip_terminal, registrado_en)| {
            RegistroAuditoria {
                id, rubro, dominio, tipo_operacion, operador_id, operador_alias,
                ejecutado_por, detalle, resultado, ip_terminal, registrado_en,
            }
        })
        .collect();

    Ok(registros)
}

#[tauri::command]
pub async fn obtener_resumen_auditoria(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<ResumenAuditoriaDominio>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = sqlx::query_as::<_, (String, i64, i64, i64, Option<String>)>(
        "SELECT dominio,
                COUNT(*) AS total,
                SUM(CASE WHEN resultado = 'EXITOSO' THEN 1 ELSE 0 END) AS exitosos,
                SUM(CASE WHEN resultado = 'FALLIDO' THEN 1 ELSE 0 END) AS fallidos,
                MAX(registrado_en) AS ultimo_en
         FROM auditoria_operacion
         WHERE registrado_en >= datetime('now', '-30 days')
         GROUP BY dominio
         ORDER BY total DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let resumen = rows
        .into_iter()
        .map(|(dominio, total, exitosos, fallidos, ultimo_en)| {
            ResumenAuditoriaDominio { dominio, total, exitosos, fallidos, ultimo_en }
        })
        .collect();

    Ok(resumen)
}
