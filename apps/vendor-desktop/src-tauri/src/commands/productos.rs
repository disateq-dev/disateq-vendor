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

fn bool_a_i64(value: bool) -> i64 {
    if value { 1 } else { 0 }
}

#[tauri::command]
pub async fn crear_producto_generico(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    ifa: String,
    concentracion: String,
    forma_farmaceutica: String,
    categoria_farmacia: String,
    permite_fraccion: bool,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO producto_generico (id, ifa, concentracion, forma_farmaceutica, categoria_farmacia, permite_fraccion, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(ifa)
    .bind(concentracion)
    .bind(forma_farmaceutica)
    .bind(categoria_farmacia)
    .bind(bool_a_i64(permite_fraccion))
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_productos_genericos(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    filtro_ifa: Option<String>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = if let Some(filtro) = filtro_ifa {
        sqlx::query("SELECT * FROM producto_generico WHERE ifa LIKE ? ORDER BY ifa")
            .bind(format!("%{}%", filtro))
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        sqlx::query("SELECT * FROM producto_generico ORDER BY ifa")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
    };

    rows.into_iter()
        .map(|row| {
            let permite_fraccion = row.try_get::<i64, _>("permite_fraccion").map_err(|e| e.to_string())? == 1;
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "ifa": row.try_get::<String, _>("ifa").map_err(|e| e.to_string())?,
                "concentracion": row.try_get::<String, _>("concentracion").map_err(|e| e.to_string())?,
                "forma_farmaceutica": row.try_get::<String, _>("forma_farmaceutica").map_err(|e| e.to_string())?,
                "categoria_farmacia": row.try_get::<String, _>("categoria_farmacia").map_err(|e| e.to_string())?,
                "permite_fraccion": permite_fraccion,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn desactivar_producto_comercial(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query("UPDATE producto_comercial SET estado = 'INACTIVO', modificado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn crear_producto_comercial(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_generico_id: String,
    nombre_comercial: String,
    nombre_fabricante: String,
    nombre_titular: Option<String>,
    pais_origen: Option<String>,
    registro_sanitario: Option<String>,
    estado_registro_sanitario: Option<String>,
    codigo_digemid: Option<String>,
    codigo_interno: Option<String>,
    condicion_venta: String,
    requiere_lote: bool,
    requiere_cadena_frio: bool,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO producto_comercial (id, producto_generico_id, nombre_comercial, nombre_fabricante, nombre_titular, pais_origen, registro_sanitario, estado_registro_sanitario, codigo_digemid, codigo_interno, condicion_venta, requiere_lote, requiere_cadena_frio, estado, creado_en, modificado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(producto_generico_id)
    .bind(nombre_comercial)
    .bind(nombre_fabricante)
    .bind(nombre_titular)
    .bind(pais_origen.unwrap_or_else(|| String::from("PE")))
    .bind(registro_sanitario)
    .bind(estado_registro_sanitario.unwrap_or(String::from("VIGENTE")))
    .bind(codigo_digemid)
    .bind(codigo_interno)
    .bind(condicion_venta)
    .bind(bool_a_i64(requiere_lote))
    .bind(bool_a_i64(requiere_cadena_frio))
    .bind("ACTIVO")
    .bind(&creado_en)
    .bind(&creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_productos_comerciales(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    filtro_nombre: Option<String>,
    solo_activos: Option<bool>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut sql = String::from(
        "SELECT pc.*, pg.ifa, pg.concentracion, pg.forma_farmaceutica, pg.categoria_farmacia FROM producto_comercial pc JOIN producto_generico pg ON pg.id = pc.producto_generico_id",
    );
    let mut condiciones: Vec<&str> = Vec::new();
    if solo_activos == Some(true) {
        condiciones.push("pc.estado = 'ACTIVO'");
    }
    if filtro_nombre.is_some() {
        condiciones.push("(pc.nombre_comercial LIKE ? OR pg.ifa LIKE ? OR pc.nombre_fabricante LIKE ? OR pc.codigo_digemid LIKE ?)");
    }
    if !condiciones.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&condiciones.join(" AND "));
    }
    sql.push_str(" ORDER BY pc.nombre_comercial LIMIT 12");

    let mut query = sqlx::query(&sql);
    if let Some(filtro) = filtro_nombre {
        let patron = format!("%{}%", filtro);
        query = query.bind(patron.clone()).bind(patron.clone()).bind(patron.clone()).bind(patron);
    }
    let rows = query.fetch_all(pool).await.map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            let requiere_lote = row.try_get::<i64, _>("requiere_lote").map_err(|e| e.to_string())? == 1;
            let requiere_cadena_frio = row.try_get::<i64, _>("requiere_cadena_frio").map_err(|e| e.to_string())? == 1;
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "producto_generico_id": row.try_get::<String, _>("producto_generico_id").map_err(|e| e.to_string())?,
                "nombre_comercial": row.try_get::<String, _>("nombre_comercial").map_err(|e| e.to_string())?,
                "nombre_fabricante": row.try_get::<String, _>("nombre_fabricante").map_err(|e| e.to_string())?,
                "nombre_titular": row.try_get::<Option<String>, _>("nombre_titular").unwrap_or(None),
                "pais_origen": row.try_get::<String, _>("pais_origen").map_err(|e| e.to_string())?,
                "registro_sanitario": row.try_get::<Option<String>, _>("registro_sanitario").unwrap_or(None),
                "estado_registro_sanitario": row.try_get::<String, _>("estado_registro_sanitario").map_err(|e| e.to_string())?,
                "codigo_digemid": row.try_get::<Option<String>, _>("codigo_digemid").unwrap_or(None),
                "codigo_interno": row.try_get::<Option<String>, _>("codigo_interno").unwrap_or(None),
                "condicion_venta": row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?,
                "requiere_lote": requiere_lote,
                "requiere_cadena_frio": requiere_cadena_frio,
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
                "modificado_en": row.try_get::<String, _>("modificado_en").map_err(|e| e.to_string())?,
                "ifa": row.try_get::<String, _>("ifa").map_err(|e| e.to_string())?,
                "concentracion": row.try_get::<String, _>("concentracion").map_err(|e| e.to_string())?,
                "forma_farmaceutica": row.try_get::<String, _>("forma_farmaceutica").map_err(|e| e.to_string())?,
                "categoria_farmacia": row.try_get::<String, _>("categoria_farmacia").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn reactivar_producto_comercial(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query("UPDATE producto_comercial SET estado = 'ACTIVO', modificado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn modificar_producto_comercial(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    nombre_comercial: String,
    nombre_fabricante: String,
    nombre_titular: Option<String>,
    pais_origen: String,
    registro_sanitario: Option<String>,
    estado_registro_sanitario: Option<String>,
    codigo_digemid: Option<String>,
    codigo_interno: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query("UPDATE producto_comercial SET nombre_comercial = ?, nombre_fabricante = ?, nombre_titular = ?, pais_origen = ?, registro_sanitario = ?, estado_registro_sanitario = ?, codigo_digemid = ?, codigo_interno = ?, modificado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(nombre_comercial)
        .bind(nombre_fabricante)
        .bind(nombre_titular)
        .bind(pais_origen)
        .bind(registro_sanitario)
        .bind(estado_registro_sanitario)
        .bind(codigo_digemid)
        .bind(codigo_interno)
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn verificar_historial_producto(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_comercial_id: String,
) -> Result<bool, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let presentacion_ids = sqlx::query_scalar::<_, String>(
        "SELECT id FROM presentacion_comercial WHERE producto_comercial_id = ?",
    )
    .bind(producto_comercial_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    if presentacion_ids.is_empty() {
        return Ok(false);
    }

    let placeholders = vec!["?"; presentacion_ids.len()].join(", ");
    let sql = format!("SELECT COUNT(*) FROM movimiento WHERE item_id IN ({})", placeholders);
    let mut query = sqlx::query_scalar::<_, i64>(&sql);
    for presentacion_id in presentacion_ids {
        query = query.bind(presentacion_id);
    }
    let count = query.fetch_one(pool).await.map_err(|e| e.to_string())?;

    Ok(count > 0)
}
