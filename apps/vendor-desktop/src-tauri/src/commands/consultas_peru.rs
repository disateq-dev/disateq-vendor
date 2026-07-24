use reqwest::Client;
use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

async fn obtener_config_consulta(
    db_instances: &State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(String, String), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| "Base de datos no inicializada".to_string())?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let row = sqlx::query(
        "SELECT COALESCE(consulta_doc_url,''), COALESCE(consulta_doc_token,'') FROM config_establecimiento LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match row {
        None => Err("Sin configuración de establecimiento".to_string()),
        Some(r) => {
            let url: String = r.try_get(0).unwrap_or_default();
            let token: String = r.try_get(1).unwrap_or_default();
            if url.is_empty() || token.is_empty() {
                Err("INTEGRACION_NO_CONFIGURADA".to_string())
            } else {
                Ok((url, token))
            }
        }
    }
}

#[tauri::command]
pub async fn consultar_dni(
    num_doc: String,
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let num = num_doc.trim().to_string();
    if num.len() != 8 || !num.chars().all(|c| c.is_ascii_digit()) {
        return Err("DNI debe tener exactamente 8 dígitos".to_string());
    }

    let (base_url, token) = obtener_config_consulta(&db_instances).await?;

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("{}/api/dni/{}", base_url.trim_end_matches('/'), num);
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("SIN_CONEXION: {}", e))?;

    let body: Value = resp.json().await.map_err(|e| e.to_string())?;
    let success = body.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
    if !success {
        let msg = body.get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("DNI no encontrado")
            .to_string();
        return Err(msg);
    }

    let data = body.get("data").ok_or("Respuesta sin campo data")?;
    Ok(json!({
        "nombres":         data.get("nombres").and_then(|v| v.as_str()).unwrap_or(""),
        "apellidoPaterno": data.get("apellido_paterno").and_then(|v| v.as_str()).unwrap_or(""),
        "apellidoMaterno": data.get("apellido_materno").and_then(|v| v.as_str()).unwrap_or(""),
        "numDoc":          num,
    }))
}

#[tauri::command]
pub async fn consultar_ruc(
    num_ruc: String,
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let num = num_ruc.trim().to_string();
    if num.len() != 11 || !num.chars().all(|c| c.is_ascii_digit()) {
        return Err("RUC debe tener exactamente 11 dígitos".to_string());
    }

    let (base_url, token) = obtener_config_consulta(&db_instances).await?;

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("{}/api/ruc/{}", base_url.trim_end_matches('/'), num);
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("SIN_CONEXION: {}", e))?;

    let body: Value = resp.json().await.map_err(|e| e.to_string())?;
    let success = body.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
    if !success {
        let msg = body.get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("RUC no encontrado")
            .to_string();
        return Err(msg);
    }

    let data = body.get("data").ok_or("Respuesta sin campo data")?;
    Ok(json!({
        "razonSocial": data.get("nombre_o_razon_social").and_then(|v| v.as_str()).unwrap_or(""),
        "direccion":   data.get("direccion_completa").and_then(|v| v.as_str()).unwrap_or(""),
        "estado":      data.get("estado").and_then(|v| v.as_str()).unwrap_or(""),
        "condicion":   data.get("condicion").and_then(|v| v.as_str()).unwrap_or(""),
        "numRuc":      num,
    }))
}

#[tauri::command]
pub async fn obtener_config_integraciones(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| "Base de datos no inicializada".to_string())?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let row = sqlx::query(
        "SELECT COALESCE(consulta_doc_url,''), COALESCE(consulta_doc_token,'') FROM config_establecimiento LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match row {
        None => Ok(json!({ "url": "", "token": "" })),
        Some(r) => Ok(json!({
            "url":   r.try_get::<String,_>(0).unwrap_or_default(),
            "token": r.try_get::<String,_>(1).unwrap_or_default(),
        })),
    }
}

#[tauri::command]
pub async fn guardar_config_integraciones(
    url: String,
    token: String,
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| "Base de datos no inicializada".to_string())?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query(
        "UPDATE config_establecimiento SET consulta_doc_url = ?, consulta_doc_token = ?",
    )
    .bind(url.trim())
    .bind(token.trim())
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
