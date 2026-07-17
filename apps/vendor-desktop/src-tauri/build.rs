fn main() {
  match std::env::var("DISATEQ_SYSTEM_PIN") {
    Ok(pin) if !pin.is_empty() => {
      println!("cargo:rerun-if-env-changed=DISATEQ_SYSTEM_PIN");
    }
    _ => {
      println!("cargo:warning=DISATEQ_SYSTEM_PIN no definida — operadores SISTEMA no podrán autenticarse");
    }
  }

  tauri_build::build()
}
