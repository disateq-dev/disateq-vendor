use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

async fn obtener_timestamp(pool: &sqlx::SqlitePool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub(crate) struct LineaPedidoInput {
    presentacion_id: String,
    producto_nombre: String,
    presentacion_descripcion: String,
    cantidad_pedida: f64,
    costo_unitario_acordado: Option<f64>,
    requiere_lote: bool,
}

#[derive(Deserialize)]
pub(crate) struct RecepcionLineaInput {
    linea_id: String,
    cantidad_recibida_ahora: f64,
}

#[tauri::command]
pub async fn crear_pedido_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    proveedor_id: String,
    operador_id: String,
    referencia: Option<String>,
    observacion: Option<String>,
    fecha_esperada: Option<String>,
    lineas: Vec<LineaPedidoInput>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let ts = obtener_timestamp(pool).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO pedido_proveedor (id, proveedor_id, operador_id, estado, referencia, observacion, fecha_esperada, creado_en, modificado_en) VALUES (?, ?, ?, 'BORRADOR', ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&proveedor_id)
    .bind(&operador_id)
    .bind(&referencia)
    .bind(&observacion)
    .bind(&fecha_esperada)
    .bind(&ts)
    .bind(&ts)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    for linea in &lineas {
        let linea_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO linea_pedido_proveedor (id, pedido_id, presentacion_id, producto_nombre, presentacion_descripcion, cantidad_pedida, cantidad_recibida, costo_unitario_acordado, requiere_lote, creado_en) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)",
        )
        .bind(&linea_id)
        .bind(&id)
        .bind(&linea.presentacion_id)
        .bind(&linea.producto_nombre)
        .bind(&linea.presentacion_descripcion)
        .bind(linea.cantidad_pedida)
        .bind(linea.costo_unitario_acordado)
        .bind(if linea.requiere_lote { 1i64 } else { 0i64 })
        .bind(&ts)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub async fn obtener_pedidos_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    estado: Option<String>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = match &estado {
        Some(e) => sqlx::query(
            "SELECT pp.*, p.razon_social as proveedor_nombre FROM pedido_proveedor pp JOIN proveedor p ON p.id = pp.proveedor_id WHERE pp.estado = ? ORDER BY pp.creado_en DESC LIMIT 50",
        )
        .bind(e)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?,
        None => sqlx::query(
            "SELECT pp.*, p.razon_social as proveedor_nombre FROM pedido_proveedor pp JOIN proveedor p ON p.id = pp.proveedor_id ORDER BY pp.creado_en DESC LIMIT 50",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?,
    };

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "proveedor_id": row.try_get::<String, _>("proveedor_id").map_err(|e| e.to_string())?,
                "proveedor_nombre": row.try_get::<String, _>("proveedor_nombre").map_err(|e| e.to_string())?,
                "operador_id": row.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "referencia": row.try_get::<Option<String>, _>("referencia").unwrap_or(None),
                "observacion": row.try_get::<Option<String>, _>("observacion").unwrap_or(None),
                "fecha_esperada": row.try_get::<Option<String>, _>("fecha_esperada").unwrap_or(None),
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
                "modificado_en": row.try_get::<String, _>("modificado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn obtener_lineas_pedido(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    pedido_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = sqlx::query(
        "SELECT * FROM linea_pedido_proveedor WHERE pedido_id = ? ORDER BY creado_en",
    )
    .bind(&pedido_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "pedido_id": row.try_get::<String, _>("pedido_id").map_err(|e| e.to_string())?,
                "presentacion_id": row.try_get::<String, _>("presentacion_id").map_err(|e| e.to_string())?,
                "producto_nombre": row.try_get::<String, _>("producto_nombre").map_err(|e| e.to_string())?,
                "presentacion_descripcion": row.try_get::<String, _>("presentacion_descripcion").map_err(|e| e.to_string())?,
                "cantidad_pedida": row.try_get::<f64, _>("cantidad_pedida").map_err(|e| e.to_string())?,
                "cantidad_recibida": row.try_get::<f64, _>("cantidad_recibida").map_err(|e| e.to_string())?,
                "costo_unitario_acordado": row.try_get::<Option<f64>, _>("costo_unitario_acordado").unwrap_or(None),
                "requiere_lote": row.try_get::<i64, _>("requiere_lote").unwrap_or(0) != 0,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn confirmar_pedido_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let estado = sqlx::query_scalar::<_, Option<String>>(
        "SELECT estado FROM pedido_proveedor WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .flatten()
    .ok_or_else(|| String::from("Pedido no encontrado"))?;

    if estado != "BORRADOR" {
        return Err(String::from("Solo se puede confirmar un pedido en estado BORRADOR"));
    }

    let ts = obtener_timestamp(pool).await?;
    sqlx::query(
        "UPDATE pedido_proveedor SET estado = 'CONFIRMADO', modificado_en = ? WHERE id = ?",
    )
    .bind(&ts)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn marcar_en_transito(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let estado = sqlx::query_scalar::<_, Option<String>>(
        "SELECT estado FROM pedido_proveedor WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .flatten()
    .ok_or_else(|| String::from("Pedido no encontrado"))?;

    if estado != "CONFIRMADO" {
        return Err(String::from("Solo se puede marcar en tránsito un pedido CONFIRMADO"));
    }

    let ts = obtener_timestamp(pool).await?;
    sqlx::query(
        "UPDATE pedido_proveedor SET estado = 'EN_TRANSITO', modificado_en = ? WHERE id = ?",
    )
    .bind(&ts)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn cancelar_pedido_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let estado = sqlx::query_scalar::<_, Option<String>>(
        "SELECT estado FROM pedido_proveedor WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .flatten()
    .ok_or_else(|| String::from("Pedido no encontrado"))?;

    if estado == "RECIBIDO" || estado == "CANCELADO" {
        return Err(String::from("No se puede cancelar un pedido ya recibido o cancelado"));
    }

    let ts = obtener_timestamp(pool).await?;
    sqlx::query(
        "UPDATE pedido_proveedor SET estado = 'CANCELADO', modificado_en = ? WHERE id = ?",
    )
    .bind(&ts)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn recibir_lineas_pedido(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    pedido_id: String,
    recepciones: Vec<RecepcionLineaInput>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let estado = sqlx::query_scalar::<_, Option<String>>(
        "SELECT estado FROM pedido_proveedor WHERE id = ?",
    )
    .bind(&pedido_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .flatten()
    .ok_or_else(|| String::from("Pedido no encontrado"))?;

    if estado == "RECIBIDO" {
        return Err(String::from("El pedido ya fue recibido completamente"));
    }
    if estado == "CANCELADO" {
        return Err(String::from("No se puede recibir un pedido cancelado"));
    }

    let ts = obtener_timestamp(pool).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for recepcion in &recepciones {
        if recepcion.cantidad_recibida_ahora <= 0.0 {
            continue;
        }
        sqlx::query(
            "UPDATE linea_pedido_proveedor SET cantidad_recibida = cantidad_recibida + ? WHERE id = ? AND pedido_id = ?",
        )
        .bind(recepcion.cantidad_recibida_ahora)
        .bind(&recepcion.linea_id)
        .bind(&pedido_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    let totales = sqlx::query_as::<_, (f64, f64)>(
        "SELECT COALESCE(SUM(cantidad_pedida), 0), COALESCE(SUM(cantidad_recibida), 0) FROM linea_pedido_proveedor WHERE pedido_id = ?",
    )
    .bind(&pedido_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let (total_pedido, total_recibido) = totales;
    let nuevo_estado = if total_recibido >= total_pedido {
        Some("RECIBIDO")
    } else if total_recibido > 0.0 {
        Some("RECIBIDO_PARCIAL")
    } else {
        None
    };

    if let Some(nuevo) = nuevo_estado {
        sqlx::query(
            "UPDATE pedido_proveedor SET estado = ?, modificado_en = ? WHERE id = ?",
        )
        .bind(nuevo)
        .bind(&ts)
        .bind(&pedido_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn obtener_pedidos_activos_por_presentacion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = sqlx::query(
        "SELECT lpp.presentacion_id, SUM(lpp.cantidad_pedida - lpp.cantidad_recibida) as unidades_pendientes FROM linea_pedido_proveedor lpp JOIN pedido_proveedor pp ON pp.id = lpp.pedido_id WHERE pp.estado IN ('CONFIRMADO', 'EN_TRANSITO') AND lpp.cantidad_pedida > lpp.cantidad_recibida GROUP BY lpp.presentacion_id",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "presentacion_id": row.try_get::<String, _>("presentacion_id").map_err(|e| e.to_string())?,
                "unidades_pendientes": row.try_get::<f64, _>("unidades_pendientes").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn vincular_ingreso_a_pedido(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
    cantidad_recibida: f64,
) -> Result<(), String> {
    if cantidad_recibida <= 0.0 {
        return Ok(());
    }

    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    // Buscar líneas con cantidad pendiente en pedidos activos,
    // ordenadas por fecha de creación del pedido (FIFO)
    let rows = sqlx::query(
        "SELECT lpp.id as linea_id, lpp.pedido_id, lpp.cantidad_pedida, lpp.cantidad_recibida
         FROM linea_pedido_proveedor lpp
         JOIN pedido_proveedor pp ON pp.id = lpp.pedido_id
         WHERE lpp.presentacion_id = ?
           AND pp.estado IN ('CONFIRMADO', 'EN_TRANSITO')
           AND lpp.cantidad_pedida > lpp.cantidad_recibida
         ORDER BY pp.creado_en ASC",
    )
    .bind(&presentacion_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    if rows.is_empty() {
        return Ok(());
    }

    let ts = obtener_timestamp(pool).await?;
    let mut restante = cantidad_recibida;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for row in &rows {
        if restante <= 0.0 { break; }

        let linea_id: String = row.try_get("linea_id").map_err(|e| e.to_string())?;
        let pedido_id: String = row.try_get("pedido_id").map_err(|e| e.to_string())?;
        let cantidad_pedida: f64 = row.try_get("cantidad_pedida").map_err(|e| e.to_string())?;
        let cantidad_ya_recibida: f64 = row.try_get("cantidad_recibida").map_err(|e| e.to_string())?;

        let pendiente = cantidad_pedida - cantidad_ya_recibida;
        let a_recibir = restante.min(pendiente);

        sqlx::query(
            "UPDATE linea_pedido_proveedor SET cantidad_recibida = cantidad_recibida + ? WHERE id = ?",
        )
        .bind(a_recibir)
        .bind(&linea_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // Recalcular estado del pedido
        let totales = sqlx::query_as::<_, (f64, f64)>(
            "SELECT COALESCE(SUM(cantidad_pedida), 0), COALESCE(SUM(cantidad_recibida), 0)
             FROM linea_pedido_proveedor WHERE pedido_id = ?",
        )
        .bind(&pedido_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        let (total_pedido, total_recibido) = totales;
        let nuevo_estado = if total_recibido >= total_pedido {
            "RECIBIDO"
        } else {
            "RECIBIDO_PARCIAL"
        };

        sqlx::query(
            "UPDATE pedido_proveedor SET estado = ?, modificado_en = ? WHERE id = ?",
        )
        .bind(nuevo_estado)
        .bind(&ts)
        .bind(&pedido_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        restante -= a_recibir;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
