use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn obtener_operadores(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono, codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en, estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en, registrado_por, modificado_en FROM operador ORDER BY codigo_operador ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    let operadores: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "codigo_operador": row.try_get::<String, _>("codigo_operador").map_err(|e| e.to_string())?,
            "alias": row.try_get::<String, _>("alias").map_err(|e| e.to_string())?,
            "apellidos": row.try_get::<String, _>("apellidos").map_err(|e| e.to_string())?,
            "nombres": row.try_get::<String, _>("nombres").map_err(|e| e.to_string())?,
            "nombre_completo": row.try_get::<String, _>("nombre_completo").map_err(|e| e.to_string())?,
            "dni": row.try_get::<Option<String>, _>("dni").unwrap_or(None),
            "telefono": row.try_get::<Option<String>, _>("telefono").unwrap_or(None),
            "codigo_rol": row.try_get::<String, _>("codigo_rol").map_err(|e| e.to_string())?,
            "nombre_rol": row.try_get::<String, _>("nombre_rol").map_err(|e| e.to_string())?,
            "base_bloque": row.try_get::<Option<i64>, _>("base_bloque").unwrap_or(None),
            "asignacion_bloque_en": row.try_get::<Option<String>, _>("asignacion_bloque_en").unwrap_or(None),
            "liberacion_bloque_en": row.try_get::<Option<String>, _>("liberacion_bloque_en").unwrap_or(None),
            "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "motivo_estado": row.try_get::<Option<String>, _>("motivo_estado").unwrap_or(None),
            "fecha_estado": row.try_get::<Option<String>, _>("fecha_estado").unwrap_or(None),
            "pin": row.try_get::<String, _>("pin").map_err(|e| e.to_string())?,
            "pin_salt": row.try_get::<Option<String>, _>("pin_salt").unwrap_or(None),
            "capacidades": row.try_get::<String, _>("capacidades").map_err(|e| e.to_string())?,
            "registrado_en": row.try_get::<String, _>("registrado_en").map_err(|e| e.to_string())?,
            "registrado_por": row.try_get::<String, _>("registrado_por").map_err(|e| e.to_string())?,
            "modificado_en": row.try_get::<String, _>("modificado_en").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(operadores?))
}

#[tauri::command]
pub async fn obtener_roles(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, codigo, nombre, descripcion, capacidades, requiere_bloque, activo, creado_en, creado_por FROM rol ORDER BY codigo ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    let roles: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "codigo": row.try_get::<String, _>("codigo").map_err(|e| e.to_string())?,
            "nombre": row.try_get::<String, _>("nombre").map_err(|e| e.to_string())?,
            "descripcion": row.try_get::<String, _>("descripcion").map_err(|e| e.to_string())?,
            "capacidades": row.try_get::<String, _>("capacidades").map_err(|e| e.to_string())?,
            "requiere_bloque": row.try_get::<i64, _>("requiere_bloque").map_err(|e| e.to_string())?,
            "activo": row.try_get::<i64, _>("activo").map_err(|e| e.to_string())?,
            "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            "creado_por": row.try_get::<String, _>("creado_por").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(roles?))
}

#[tauri::command]
pub async fn crear_operador(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    codigo_operador: String,
    alias: String,
    apellidos: String,
    nombres: String,
    nombre_completo: String,
    dni: Option<String>,
    telefono: Option<String>,
    codigo_rol: String,
    nombre_rol: String,
    base_bloque: Option<i64>,
    asignacion_bloque_en: Option<String>,
    estado: String,
    pin: String,
    pin_salt: Option<String>,
    capacidades: String,
    registrado_en: String,
    registrado_por: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO operador (id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono, codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en, estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en, registrado_por, modificado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&codigo_operador)
    .bind(&alias)
    .bind(&apellidos)
    .bind(&nombres)
    .bind(&nombre_completo)
    .bind(&dni)
    .bind(&telefono)
    .bind(&codigo_rol)
    .bind(&nombre_rol)
    .bind(&base_bloque)
    .bind(&asignacion_bloque_en)
    .bind(&estado)
    .bind(&pin)
    .bind(&pin_salt)
    .bind(&capacidades)
    .bind(&registrado_en)
    .bind(&registrado_por)
    .bind(&modificado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn actualizar_operador(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    alias: String,
    apellidos: String,
    nombres: String,
    nombre_completo: String,
    dni: Option<String>,
    telefono: Option<String>,
    codigo_rol: String,
    nombre_rol: String,
    base_bloque: Option<i64>,
    asignacion_bloque_en: Option<String>,
    liberacion_bloque_en: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE operador SET alias=?, apellidos=?, nombres=?, nombre_completo=?, dni=?, telefono=?, codigo_rol=?, nombre_rol=?, base_bloque=?, asignacion_bloque_en=?, liberacion_bloque_en=?, modificado_en=? WHERE id=?")
        .bind(&alias)
        .bind(&apellidos)
        .bind(&nombres)
        .bind(&nombre_completo)
        .bind(&dni)
        .bind(&telefono)
        .bind(&codigo_rol)
        .bind(&nombre_rol)
        .bind(&base_bloque)
        .bind(&asignacion_bloque_en)
        .bind(&liberacion_bloque_en)
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn actualizar_estado_operador(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    estado: String,
    motivo_estado: Option<String>,
    fecha_estado: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE operador SET estado=?, motivo_estado=?, fecha_estado=?, modificado_en=? WHERE id=?")
        .bind(&estado)
        .bind(&motivo_estado)
        .bind(&fecha_estado)
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn actualizar_pin_operador(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    pin: String,
    pin_salt: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE operador SET pin=?, pin_salt=?, modificado_en=? WHERE id=?")
        .bind(&pin)
        .bind(&pin_salt)
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn actualizar_capacidades_operador(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    capacidades: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE operador SET capacidades=?, modificado_en=? WHERE id=?")
        .bind(&capacidades)
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn crear_rol(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    codigo: String,
    nombre: String,
    descripcion: String,
    capacidades: String,
    requiere_bloque: i64,
    creado_en: String,
    creado_por: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    sqlx::query("INSERT INTO rol (id, codigo, nombre, descripcion, capacidades, requiere_bloque, activo, creado_en, creado_por) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)")
        .bind(&id)
        .bind(&codigo)
        .bind(&nombre)
        .bind(&descripcion)
        .bind(&capacidades)
        .bind(requiere_bloque)
        .bind(&creado_en)
        .bind(&creado_por)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn actualizar_rol(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    codigo: String,
    nombre: String,
    descripcion: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    sqlx::query("UPDATE rol SET codigo=?, nombre=?, descripcion=? WHERE id=?")
        .bind(&codigo)
        .bind(&nombre)
        .bind(&descripcion)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn actualizar_capacidades_rol(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    capacidades: String,
    activo: Option<i64>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    if let Some(activo) = activo {
        sqlx::query("UPDATE rol SET capacidades=?, activo=? WHERE id=?")
            .bind(&capacidades)
            .bind(activo)
            .bind(&id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        sqlx::query("UPDATE rol SET capacidades=? WHERE id=?")
            .bind(&capacidades)
            .bind(&id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
