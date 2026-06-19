use tauri::State;
use uuid::Uuid;

async fn obtener_timestamp(pool: &sqlx::SqlitePool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn registrar_movimiento(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    item_id: String,
    tipo: String,
    unidades_base: f64,
    lote_id: Option<String>,
    nodo_id: Option<String>,
    causa: String,
    referencia_id: Option<String>,
    operador_id: String,
    runtime_id: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let timestamp = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO movimiento (id, item_id, tipo, unidades_base, lote_id, nodo_id, causa, referencia_id, operador_id, timestamp, runtime_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(item_id)
    .bind(&tipo)
    .bind(unidades_base)
    .bind(&lote_id)
    .bind(nodo_id)
    .bind(causa)
    .bind(referencia_id)
    .bind(operador_id)
    .bind(timestamp)
    .bind(runtime_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(lote_id_value) = lote_id {
        if tipo == "salida" {
            sqlx::query("UPDATE lote SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?")
                .bind(unidades_base)
                .bind(&lote_id_value)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;

            let cantidad_disponible = sqlx::query_scalar::<_, f64>("SELECT cantidad_disponible FROM lote WHERE id = ?")
                .bind(&lote_id_value)
                .fetch_one(pool)
                .await
                .map_err(|e| e.to_string())?;

            if cantidad_disponible <= 0.0 {
                sqlx::query("UPDATE lote SET estado = 'AGOTADO' WHERE id = ?")
                    .bind(&lote_id_value)
                    .execute(pool)
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }

        if tipo == "entrada" {
            sqlx::query("UPDATE lote SET cantidad_disponible = cantidad_disponible + ? WHERE id = ?")
                .bind(unidades_base)
                .bind(lote_id_value)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(id)
}
