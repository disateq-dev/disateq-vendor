use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
pub(crate) struct LineaIngreso {
    presentacion_id: String,
    unidades_recibidas: f64,
    unidades_facturadas: f64,
    costo_unitario: Option<f64>,
    requiere_lote: bool,
    numero_lote: Option<String>,
    fecha_vencimiento: Option<String>,
    es_lote_generico: bool,
}

async fn obtener_timestamp(pool: &sqlx::SqlitePool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

async fn obtener_fecha(pool: &sqlx::SqlitePool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%d','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn registrar_ingreso(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    proveedor_id: String,
    operador_id: String,
    runtime_id: String,
    lineas: Vec<LineaIngreso>,
) -> Result<Vec<String>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let fecha = obtener_fecha(pool).await?;
    let timestamp = obtener_timestamp(pool).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut movimientos: Vec<String> = Vec::new();

    for linea in lineas {
        let lote_id = if linea.requiere_lote {
            let id = Uuid::new_v4().to_string();
            let numero_lote = if linea.es_lote_generico {
                format!("SIN-LOTE-{}", fecha)
            } else {
                linea.numero_lote.clone().ok_or_else(|| String::from("Número de lote requerido"))?
            };
            sqlx::query(
                "INSERT INTO lote (id, presentacion_id, numero_lote, fecha_vencimiento, fecha_fabricacion, cantidad_ingresada, cantidad_disponible, proveedor_id, precio_compra, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&id)
            .bind(&linea.presentacion_id)
            .bind(numero_lote)
            .bind(linea.fecha_vencimiento.clone())
            .bind(None::<String>)
            .bind(linea.unidades_recibidas)
            .bind(linea.unidades_recibidas)
            .bind(&proveedor_id)
            .bind(linea.costo_unitario)
            .bind("VIGENTE")
            .bind(&timestamp)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            Some(id)
        } else {
            None
        };

        let movimiento_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO movimiento (id, item_id, tipo, unidades_base, lote_id, nodo_id, causa, referencia_id, operador_id, timestamp, runtime_id, unidades_facturadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&movimiento_id)
        .bind(&linea.presentacion_id)
        .bind("entrada")
        .bind(linea.unidades_recibidas)
        .bind(lote_id)
        .bind(None::<String>)
        .bind("compra")
        .bind(None::<String>)
        .bind(&operador_id)
        .bind(&timestamp)
        .bind(&runtime_id)
        .bind(linea.unidades_facturadas)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        movimientos.push(movimiento_id);
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(movimientos)
}
