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
pub async fn corregir_datos_operacionales(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    condicion_venta: String,
    requiere_lote: bool,
    requiere_cadena_frio: bool,
    motivo: String,
    operador_id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let row = sqlx::query("SELECT condicion_venta, requiere_lote, requiere_cadena_frio FROM producto_comercial WHERE id = ?")
        .bind(&id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    let condicion_venta_actual = row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?;
    let requiere_lote_actual = row.try_get::<i64, _>("requiere_lote").map_err(|e| e.to_string())?;
    let requiere_cadena_frio_actual = row.try_get::<i64, _>("requiere_cadena_frio").map_err(|e| e.to_string())?;
    let requiere_lote_nuevo = bool_a_i64(requiere_lote);
    let requiere_cadena_frio_nuevo = bool_a_i64(requiere_cadena_frio);
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if condicion_venta_actual != condicion_venta {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("producto_comercial")
            .bind(&id)
            .bind("condicion_venta")
            .bind(&condicion_venta_actual)
            .bind(&condicion_venta)
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if requiere_lote_actual != requiere_lote_nuevo {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("producto_comercial")
            .bind(&id)
            .bind("requiere_lote")
            .bind(requiere_lote_actual.to_string())
            .bind(requiere_lote_nuevo.to_string())
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if requiere_cadena_frio_actual != requiere_cadena_frio_nuevo {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("producto_comercial")
            .bind(&id)
            .bind("requiere_cadena_frio")
            .bind(requiere_cadena_frio_actual.to_string())
            .bind(requiere_cadena_frio_nuevo.to_string())
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("UPDATE producto_comercial SET condicion_venta = ?, requiere_lote = ?, requiere_cadena_frio = ?, modificado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
        .bind(condicion_venta)
        .bind(requiere_lote_nuevo)
        .bind(requiere_cadena_frio_nuevo)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

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

    let sql_movimiento = format!("SELECT COUNT(*) FROM movimiento WHERE item_id IN ({})", placeholders);
    let mut query_movimiento = sqlx::query_scalar::<_, i64>(&sql_movimiento);
    for presentacion_id in &presentacion_ids {
        query_movimiento = query_movimiento.bind(presentacion_id);
    }
    let count_movimiento = query_movimiento.fetch_one(pool).await.map_err(|e| e.to_string())?;

    if count_movimiento > 0 {
        return Ok(true);
    }

    let sql_lote = format!("SELECT COUNT(*) FROM lote WHERE presentacion_id IN ({})", placeholders);
    let mut query_lote = sqlx::query_scalar::<_, i64>(&sql_lote);
    for presentacion_id in &presentacion_ids {
        query_lote = query_lote.bind(presentacion_id);
    }
    let count_lote = query_lote.fetch_one(pool).await.map_err(|e| e.to_string())?;

    Ok(count_lote > 0)
}

#[tauri::command]
pub async fn eliminar_producto_comercial_fisico(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let presentacion_ids = sqlx::query_scalar::<_, String>(
        "SELECT id FROM presentacion_comercial WHERE producto_comercial_id = ?",
    )
    .bind(&id)
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if !presentacion_ids.is_empty() {
        let placeholders = vec!["?"; presentacion_ids.len()].join(", ");

        let sql_movimiento = format!("SELECT COUNT(*) FROM movimiento WHERE item_id IN ({})", placeholders);
        let mut query_movimiento = sqlx::query_scalar::<_, i64>(&sql_movimiento);
        for presentacion_id in &presentacion_ids {
            query_movimiento = query_movimiento.bind(presentacion_id);
        }
        let count_movimiento = query_movimiento.fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

        if count_movimiento > 0 {
            return Err(String::from("TIENE_HISTORIAL"));
        }

        let sql_lote = format!("SELECT COUNT(*) FROM lote WHERE presentacion_id IN ({})", placeholders);
        let mut query_lote = sqlx::query_scalar::<_, i64>(&sql_lote);
        for presentacion_id in &presentacion_ids {
            query_lote = query_lote.bind(presentacion_id);
        }
        let count_lote = query_lote.fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

        if count_lote > 0 {
            return Err(String::from("TIENE_HISTORIAL"));
        }
    }

    let producto_generico_id = sqlx::query_scalar::<_, String>(
        "SELECT producto_generico_id FROM producto_comercial WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if !presentacion_ids.is_empty() {
        let placeholders = vec!["?"; presentacion_ids.len()].join(", ");
        let sql_nodo_ids = format!("SELECT id FROM nodo_fraccionamiento WHERE presentacion_id IN ({})", placeholders);
        let mut query_nodo_ids = sqlx::query_scalar::<_, String>(&sql_nodo_ids);
        for presentacion_id in &presentacion_ids {
            query_nodo_ids = query_nodo_ids.bind(presentacion_id);
        }
        let nodo_ids = query_nodo_ids.fetch_all(&mut *tx).await.map_err(|e| e.to_string())?;

        if !nodo_ids.is_empty() {
            let placeholders_nodo = vec!["?"; nodo_ids.len()].join(", ");
            let sql_borrar_valores = format!("DELETE FROM valor_operacional WHERE nodo_id IN ({})", placeholders_nodo);
            let mut query_borrar_valores = sqlx::query(&sql_borrar_valores);
            for nodo_id in &nodo_ids {
                query_borrar_valores = query_borrar_valores.bind(nodo_id);
            }
            query_borrar_valores.execute(&mut *tx).await.map_err(|e| e.to_string())?;
        }

        let sql_borrar_nodos = format!("DELETE FROM nodo_fraccionamiento WHERE presentacion_id IN ({})", placeholders);
        let mut query_borrar_nodos = sqlx::query(&sql_borrar_nodos);
        for presentacion_id in &presentacion_ids {
            query_borrar_nodos = query_borrar_nodos.bind(presentacion_id);
        }
        query_borrar_nodos.execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    sqlx::query("DELETE FROM presentacion_comercial WHERE producto_comercial_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM producto_comercial WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let otros_comerciales = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM producto_comercial WHERE producto_generico_id = ?",
    )
    .bind(&producto_generico_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if otros_comerciales == 0 {
        sqlx::query("DELETE FROM producto_principio_activo WHERE producto_generico_id = ?")
            .bind(&producto_generico_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("DELETE FROM producto_generico WHERE id = ?")
            .bind(&producto_generico_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn listar_principios_activos(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT id, nombre_dci, descripcion, descripcion_uso, grupo_terapeutico, condicion_venta, activo, es_esencial_minsa, es_psicotropico, es_combinacion FROM principio_activo WHERE activo = 1 ORDER BY nombre_dci")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            let activo = row.try_get::<i64, _>("activo").map_err(|e| e.to_string())? == 1;
            let es_esencial_minsa = row.try_get::<i64, _>("es_esencial_minsa").map_err(|e| e.to_string())? == 1;
            let es_psicotropico = row.try_get::<i64, _>("es_psicotropico").map_err(|e| e.to_string())? == 1;
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nombreDci": row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
                "activo": activo,
                "esEsencialMinsa": es_esencial_minsa,
                "esPsicotropico": es_psicotropico,
                "grupoTerapeutico": row.try_get::<String, _>("grupo_terapeutico").map_err(|e| e.to_string())?,
                "condicionVenta": row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?,
                "esCombinacion": row.try_get::<i64, _>("es_combinacion").map_err(|e| e.to_string())? == 1,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn buscar_principios_activos(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    query: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let patron = format!("%{}%", query.to_uppercase());
    let rows = sqlx::query("SELECT id, nombre_dci, descripcion, descripcion_uso, grupo_terapeutico, condicion_venta, es_esencial_minsa, es_psicotropico, es_combinacion FROM principio_activo WHERE activo = 1 AND (nombre_dci LIKE ? OR grupo_terapeutico LIKE ?) ORDER BY nombre_dci LIMIT 20")
        .bind(patron.clone())
        .bind(patron)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            let es_esencial_minsa = row.try_get::<i64, _>("es_esencial_minsa").map_err(|e| e.to_string())? == 1;
            let es_psicotropico = row.try_get::<i64, _>("es_psicotropico").map_err(|e| e.to_string())? == 1;
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nombreDci": row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
                "esEsencialMinsa": es_esencial_minsa,
                "esPsicotropico": es_psicotropico,
                "grupoTerapeutico": row.try_get::<String, _>("grupo_terapeutico").map_err(|e| e.to_string())?,
                "condicionVenta": row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?,
                "esCombinacion": row.try_get::<i64, _>("es_combinacion").map_err(|e| e.to_string())? == 1,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn obtener_principios_de_producto(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_generico_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT pa.id, pa.nombre_dci, pa.descripcion, ppa.orden FROM principio_activo pa JOIN producto_principio_activo ppa ON ppa.principio_activo_id = pa.id WHERE ppa.producto_generico_id = ? ORDER BY ppa.orden",
    )
    .bind(producto_generico_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nombreDci": row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
                "orden": row.try_get::<i64, _>("orden").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn asignar_principios_a_producto(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_generico_id: String,
    principio_activo_ids: Vec<String>,
    operador_id: String,
    motivo: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let nombres_anteriores = sqlx::query_scalar::<_, String>(
        "SELECT pa.nombre_dci FROM principio_activo pa JOIN producto_principio_activo ppa ON ppa.principio_activo_id = pa.id WHERE ppa.producto_generico_id = ? ORDER BY ppa.orden",
    )
    .bind(&producto_generico_id)
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;
    let ifa_anterior = nombres_anteriores.join(" + ");

    sqlx::query("DELETE FROM producto_principio_activo WHERE producto_generico_id = ?")
        .bind(&producto_generico_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    for (index, principio_activo_id) in principio_activo_ids.iter().enumerate() {
        sqlx::query("INSERT INTO producto_principio_activo (producto_generico_id, principio_activo_id, orden) VALUES (?, ?, ?)")
            .bind(&producto_generico_id)
            .bind(principio_activo_id)
            .bind((index + 1) as i64)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let ifa_nuevo = if principio_activo_ids.is_empty() {
        String::new()
    } else {
        let placeholders = vec!["?"; principio_activo_ids.len()].join(", ");
        let sql = format!("SELECT id, nombre_dci FROM principio_activo WHERE id IN ({})", placeholders);
        let mut query = sqlx::query(&sql);
        for principio_activo_id in &principio_activo_ids {
            query = query.bind(principio_activo_id);
        }
        let rows = query.fetch_all(&mut *tx).await.map_err(|e| e.to_string())?;
        let mut nombres_por_id = std::collections::HashMap::new();
        for row in rows {
            nombres_por_id.insert(
                row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
            );
        }

        principio_activo_ids
            .iter()
            .filter_map(|principio_activo_id| nombres_por_id.get(principio_activo_id).cloned())
            .collect::<Vec<String>>()
            .join(" + ")
    };

    sqlx::query("UPDATE producto_generico SET ifa = ? WHERE id = ?")
        .bind(&ifa_nuevo)
        .bind(&producto_generico_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(motivo_valor) = motivo.filter(|value| !value.trim().is_empty()) {
        let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("producto_generico")
            .bind(&producto_generico_id)
            .bind("composicion_ifa")
            .bind(&ifa_anterior)
            .bind(&ifa_nuevo)
            .bind(motivo_valor)
            .bind(&operador_id)
            .bind(creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn obtener_principio_activo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let row = sqlx::query(
        "SELECT id, nombre_dci, descripcion, descripcion_uso, grupo_terapeutico, condicion_venta, activo, es_esencial_minsa, es_psicotropico, es_combinacion FROM principio_activo WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| String::from("PRINCIPIO_NO_ENCONTRADO"))?;

    let productos_rows = sqlx::query(
        "SELECT pc.id, pc.nombre_comercial, pc.codigo_interno FROM producto_comercial pc JOIN producto_generico pg ON pg.id = pc.producto_generico_id JOIN producto_principio_activo ppa ON ppa.producto_generico_id = pg.id WHERE ppa.principio_activo_id = ? AND pc.estado = 'ACTIVO' ORDER BY pc.nombre_comercial",
    )
    .bind(&id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    let productos_vinculados = productos_rows
        .into_iter()
        .map(|producto_row| {
            Ok(json!({
                "id": producto_row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nombreComercial": producto_row.try_get::<String, _>("nombre_comercial").map_err(|e| e.to_string())?,
                "codigoInterno": producto_row.try_get::<Option<String>, _>("codigo_interno").unwrap_or(None),
            }))
        })
        .collect::<Result<Vec<Value>, String>>()?;

    Ok(json!({
        "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
        "nombreDci": row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
        "descripcion": row.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
        "descripcionUso": row.try_get::<String, _>("descripcion_uso").map_err(|e| e.to_string())?,
        "grupoTerapeutico": row.try_get::<String, _>("grupo_terapeutico").map_err(|e| e.to_string())?,
        "condicionVenta": row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?,
        "activo": row.try_get::<i64, _>("activo").map_err(|e| e.to_string())? == 1,
        "esEsencialMinsa": row.try_get::<i64, _>("es_esencial_minsa").map_err(|e| e.to_string())? == 1,
        "esPsicotropico": row.try_get::<i64, _>("es_psicotropico").map_err(|e| e.to_string())? == 1,
        "esCombinacion": row.try_get::<i64, _>("es_combinacion").map_err(|e| e.to_string())? == 1,
        "productosVinculados": productos_vinculados,
    }))
}

#[tauri::command]
pub async fn crear_principio_activo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nombre_dci: String,
    descripcion_uso: String,
    grupo_terapeutico: String,
    condicion_venta: String,
    es_combinacion: bool,
    es_psicotropico: bool,
    es_esencial_minsa: bool,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    let resultado = sqlx::query(
        "INSERT INTO principio_activo (id, nombre_dci, descripcion_uso, grupo_terapeutico, condicion_venta, es_combinacion, es_psicotropico, es_esencial_minsa, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
    )
    .bind(&id)
    .bind(nombre_dci)
    .bind(descripcion_uso)
    .bind(grupo_terapeutico)
    .bind(condicion_venta)
    .bind(bool_a_i64(es_combinacion))
    .bind(bool_a_i64(es_psicotropico))
    .bind(bool_a_i64(es_esencial_minsa))
    .bind(creado_en)
    .execute(pool)
    .await;

    match resultado {
        Ok(_) => Ok(id),
        Err(e) => {
            let mensaje = e.to_string();
            if mensaje.contains("UNIQUE") {
                Err(String::from("NOMBRE_DUPLICADO"))
            } else {
                Err(mensaje)
            }
        }
    }
}

#[tauri::command]
pub async fn modificar_principio_activo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    nombre_dci: String,
    descripcion_uso: String,
    grupo_terapeutico: String,
    condicion_venta: String,
    es_combinacion: bool,
    es_psicotropico: bool,
    es_esencial_minsa: bool,
    motivo: String,
    operador_id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let row = sqlx::query(
        "SELECT nombre_dci, descripcion_uso, grupo_terapeutico, condicion_venta, es_combinacion, es_psicotropico, es_esencial_minsa FROM principio_activo WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| String::from("PRINCIPIO_NO_ENCONTRADO"))?;

    let nombre_dci_actual = row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?;
    let descripcion_uso_actual = row.try_get::<String, _>("descripcion_uso").map_err(|e| e.to_string())?;
    let grupo_terapeutico_actual = row.try_get::<String, _>("grupo_terapeutico").map_err(|e| e.to_string())?;
    let condicion_venta_actual = row.try_get::<String, _>("condicion_venta").map_err(|e| e.to_string())?;
    let es_combinacion_actual = row.try_get::<i64, _>("es_combinacion").map_err(|e| e.to_string())?;
    let es_psicotropico_actual = row.try_get::<i64, _>("es_psicotropico").map_err(|e| e.to_string())?;
    let es_esencial_minsa_actual = row.try_get::<i64, _>("es_esencial_minsa").map_err(|e| e.to_string())?;
    let es_combinacion_nuevo = bool_a_i64(es_combinacion);
    let es_psicotropico_nuevo = bool_a_i64(es_psicotropico);
    let es_esencial_minsa_nuevo = bool_a_i64(es_esencial_minsa);
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if nombre_dci_actual != nombre_dci {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("nombre_dci")
            .bind(&nombre_dci_actual)
            .bind(&nombre_dci)
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if descripcion_uso_actual != descripcion_uso {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("descripcion_uso")
            .bind(&descripcion_uso_actual)
            .bind(&descripcion_uso)
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if grupo_terapeutico_actual != grupo_terapeutico {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("grupo_terapeutico")
            .bind(&grupo_terapeutico_actual)
            .bind(&grupo_terapeutico)
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if condicion_venta_actual != condicion_venta {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("condicion_venta")
            .bind(&condicion_venta_actual)
            .bind(&condicion_venta)
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if es_combinacion_actual != es_combinacion_nuevo {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("es_combinacion")
            .bind(es_combinacion_actual.to_string())
            .bind(es_combinacion_nuevo.to_string())
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if es_psicotropico_actual != es_psicotropico_nuevo {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("es_psicotropico")
            .bind(es_psicotropico_actual.to_string())
            .bind(es_psicotropico_nuevo.to_string())
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    if es_esencial_minsa_actual != es_esencial_minsa_nuevo {
        sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind("principio_activo")
            .bind(&id)
            .bind("es_esencial_minsa")
            .bind(es_esencial_minsa_actual.to_string())
            .bind(es_esencial_minsa_nuevo.to_string())
            .bind(&motivo)
            .bind(&operador_id)
            .bind(&creado_en)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("UPDATE principio_activo SET nombre_dci = ?, descripcion_uso = ?, grupo_terapeutico = ?, condicion_venta = ?, es_combinacion = ?, es_psicotropico = ?, es_esencial_minsa = ? WHERE id = ?")
        .bind(nombre_dci)
        .bind(descripcion_uso)
        .bind(grupo_terapeutico)
        .bind(condicion_venta)
        .bind(es_combinacion_nuevo)
        .bind(es_psicotropico_nuevo)
        .bind(es_esencial_minsa_nuevo)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
