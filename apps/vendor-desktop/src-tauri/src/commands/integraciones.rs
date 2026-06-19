use serde_json::{json, Value};
use tauri::State;

const API_RUC_FALLBACK: &str = "https://api.apis.net.pe/v1/ruc";

async fn obtener_url_base(pool: &sqlx::SqlitePool) -> String {
    let resultado = sqlx::query_scalar::<_, Option<String>>("SELECT api_ruc_url FROM config_establecimiento LIMIT 1")
        .fetch_optional(pool)
        .await;

    match resultado {
        Ok(Some(Some(url))) if !url.trim().is_empty() => url,
        _ => String::from(API_RUC_FALLBACK),
    }
}

#[tauri::command]
pub async fn consultar_ruc(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    ruc: String,
) -> Result<Value, String> {
    if ruc.len() != 11 || !ruc.chars().all(|c| c.is_ascii_digit()) {
        return Err(String::from("RUC inválido: debe tener exactamente 11 dígitos numéricos"));
    }

    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let url_base = obtener_url_base(pool).await;
    let url_completa = format!("{}/{}", url_base.trim_end_matches('/'), ruc);
    let cliente = reqwest::Client::new();
    let respuesta = cliente
        .get(&url_completa)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !respuesta.status().is_success() {
        return Err(format!("Error al consultar SUNAT: HTTP {}", respuesta.status()));
    }

    let cuerpo = respuesta.json::<Value>().await.map_err(|e| e.to_string())?;
    let razon_social = cuerpo.get("razonSocial").and_then(Value::as_str).unwrap_or_default();
    let direccion = cuerpo.get("direccion").and_then(Value::as_str).unwrap_or_default();
    let estado = cuerpo.get("estado").and_then(Value::as_str).unwrap_or_default();
    let condicion = cuerpo.get("condicion").and_then(Value::as_str).unwrap_or_default();
    let tipo = cuerpo.get("tipo").and_then(Value::as_str).unwrap_or_default();

    Ok(json!({
        "razon_social": razon_social,
        "direccion": direccion,
        "estado": estado,
        "condicion": condicion,
        "tipo": tipo,
    }))
}
