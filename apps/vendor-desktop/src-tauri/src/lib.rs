mod thermal;

#[tauri::command]
async fn print_ticket(printer: String, data: thermal::TicketPrintData) -> Result<(), String> {
    let bytes = thermal::build_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_ticket_with_dispatch(
    printer: String,
    receipt: thermal::TicketPrintData,
    dispatch: thermal::DispatchPrintData,
) -> Result<(), String> {
    let mut bytes = thermal::build_escpos(&receipt);
    bytes.extend(thermal::build_dispatch_escpos(&dispatch));
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_cash_move(printer: String, data: thermal::VoucherMovePrintData) -> Result<(), String> {
    let bytes = thermal::build_cash_move_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
fn app_exit(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![print_ticket, print_ticket_with_dispatch, print_cash_move, app_exit])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
