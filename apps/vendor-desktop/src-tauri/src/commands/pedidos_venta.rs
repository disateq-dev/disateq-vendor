use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

#[derive(serde::Deserialize)]
pub struct GuardarPedidoVentaInput {
    pub id: String,
    pub codigo: String,
    pub estado: String,
    pub contexto_operacional_id: String,
    pub identidad_operacional_id: String,
    pub operador_id: String,
    pub lineas_json: String,
    pub eventos_json: String,
    pub momento_apertura: String,
    pub momento_concrecion: Option<String>,
    pub momento_abandono: Option<String>,
    pub motivo_abandono: Option<String>,
}

#[tauri::command]
pub async fn guardar_pedido_venta(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    input: GuardarPedidoVentaInput,
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

    sqlx::query(
        "INSERT INTO pedido_venta (
            id, codigo, estado, contexto_operacional_id, identidad_operacional_id,
            operador_id, lineas_json, eventos_json, momento_apertura,
            momento_concrecion, momento_abandono, motivo_abandono,
            sincronizado_en, creado_en, modificado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            estado                   = excluded.estado,
            lineas_json              = excluded.lineas_json,
            eventos_json             = excluded.eventos_json,
            momento_concrecion       = excluded.momento_concrecion,
            momento_abandono         = excluded.momento_abandono,
            motivo_abandono          = excluded.motivo_abandono,
            modificado_en            = excluded.modificado_en",
    )
    .bind(&input.id)
    .bind(&input.codigo)
    .bind(&input.estado)
    .bind(&input.contexto_operacional_id)
    .bind(&input.identidad_operacional_id)
    .bind(&input.operador_id)
    .bind(&input.lineas_json)
    .bind(&input.eventos_json)
    .bind(&input.momento_apertura)
    .bind(&input.momento_concrecion)
    .bind(&input.momento_abandono)
    .bind(&input.motivo_abandono)
    .bind(&ahora)
    .bind(&ahora)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn obtener_pedidos_activos_venta(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = sqlx::query(
        "SELECT id, codigo, estado, contexto_operacional_id, identidad_operacional_id,
                operador_id, lineas_json, eventos_json, momento_apertura,
                momento_concrecion, momento_abandono, motivo_abandono
         FROM pedido_venta
         WHERE estado IN ('ABIERTO', 'CONFIRMADO', 'EN_COBRO')
         ORDER BY momento_apertura ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let pedidos: Result<Vec<Value>, String> = rows
        .into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "codigo": row.try_get::<String, _>("codigo").map_err(|e| e.to_string())?,
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "contextoOperacionalId": row.try_get::<String, _>("contexto_operacional_id").map_err(|e| e.to_string())?,
                "identidadOperacionalId": row.try_get::<String, _>("identidad_operacional_id").map_err(|e| e.to_string())?,
                "operadorId": row.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
                "lineasJson": row.try_get::<String, _>("lineas_json").map_err(|e| e.to_string())?,
                "eventosJson": row.try_get::<String, _>("eventos_json").map_err(|e| e.to_string())?,
                "momentoApertura": row.try_get::<String, _>("momento_apertura").map_err(|e| e.to_string())?,
                "momentoConcrecion": row.try_get::<Option<String>, _>("momento_concrecion").unwrap_or(None),
                "momentoAbandono": row.try_get::<Option<String>, _>("momento_abandono").unwrap_or(None),
                "motivoAbandono": row.try_get::<Option<String>, _>("motivo_abandono").unwrap_or(None),
            }))
        })
        .collect();

    Ok(json!(pedidos?))
}
