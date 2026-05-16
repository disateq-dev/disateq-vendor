use serde::Deserialize;

const COLS: usize = 48;

// ESC/POS constants
const ESC: u8 = 0x1B;
const GS:  u8 = 0x1D;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintLine {
    pub description: String,
    pub quantity:    u32,
    pub unit_price:  f64,
    pub subtotal:    f64,
    pub note:        Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintCustomer {
    pub doc_number: String,
    pub name:       String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketPrintData {
    pub business_name:    String,
    pub business_ruc:     String,
    pub business_addr:    String,
    pub business_phone:   Option<String>,
    pub doc_type:         String,
    pub doc_series:       String,
    pub doc_correlative:  u32,
    pub date_time:        String,
    pub customer:         Option<PrintCustomer>,
    pub lines:            Vec<PrintLine>,
    pub base_imponible:   f64,
    pub igv:              f64,
    pub discount_num:     f64,
    pub total:            f64,
    pub net_total:        f64,
    pub pay_method:       String,
    pub received_num:     f64,
    pub change:           f64,
}

fn normalize(s: &str) -> String {
    s.chars().map(|c| match c {
        'á' | 'à' | 'â' | 'ä' => 'a',
        'é' | 'è' | 'ê' | 'ë' => 'e',
        'í' | 'ì' | 'î' | 'ï' => 'i',
        'ó' | 'ò' | 'ô' | 'ö' => 'o',
        'ú' | 'ù' | 'û' | 'ü' => 'u',
        'Á' | 'À' | 'Â' | 'Ä' => 'A',
        'É' | 'È' | 'Ê' | 'Ë' => 'E',
        'Í' | 'Ì' | 'Î' | 'Ï' => 'I',
        'Ó' | 'Ò' | 'Ô' | 'Ö' => 'O',
        'Ú' | 'Ù' | 'Û' | 'Ü' => 'U',
        'ñ' => 'n',
        'Ñ' => 'N',
        '¿' | '¡' => ' ',
        _ => c,
    }).collect()
}

fn money(n: f64) -> String {
    format!("S/ {:.2}", n)
}

struct Buf(Vec<u8>);

impl Buf {
    fn new() -> Self { Buf(Vec::with_capacity(1024)) }

    fn raw(&mut self, bytes: &[u8]) { self.0.extend_from_slice(bytes); }

    fn init(&mut self) { self.raw(&[ESC, b'@']); }

    fn bold_on(&mut self)  { self.raw(&[ESC, b'E', 1]); }
    fn bold_off(&mut self) { self.raw(&[ESC, b'E', 0]); }

    fn align_center(&mut self) { self.raw(&[ESC, b'a', 1]); }
    fn align_left(&mut self)   { self.raw(&[ESC, b'a', 0]); }

    fn dbl_h_on(&mut self)  { self.raw(&[ESC, b'!', 0x10]); }
    fn dbl_h_off(&mut self) { self.raw(&[ESC, b'!', 0x00]); }

    fn lf(&mut self) { self.raw(&[b'\n']); }

    fn text(&mut self, s: &str) {
        self.raw(normalize(s).as_bytes());
    }

    fn line(&mut self, s: &str) {
        self.text(s);
        self.lf();
    }

    fn dashes(&mut self) {
        self.line(&"-".repeat(COLS));
    }

    fn equals(&mut self) {
        self.line(&"=".repeat(COLS));
    }

    fn two_col(&mut self, left: &str, right: &str) {
        let l = normalize(left);
        let r = normalize(right);
        let rlen = r.len();
        let max_left = COLS.saturating_sub(rlen + 1);
        let ltrunc = if l.len() > max_left { &l[..max_left] } else { &l };
        let spaces = COLS - ltrunc.len() - rlen;
        let mut out = ltrunc.to_string();
        out.push_str(&" ".repeat(spaces));
        out.push_str(&r);
        self.line(&out);
    }

    fn item_row(&mut self, qty: u32, desc: &str, subtotal: f64) {
        let qty_str = format!("{qty}x");
        let amt_str = money(subtotal);
        // qty(3) + space + desc + space + amt
        let fixed = qty_str.len() + 1 + amt_str.len() + 1;
        let desc_n = normalize(desc);
        let desc_max = COLS.saturating_sub(fixed);

        let chunks: Vec<&str> = if desc_n.len() <= desc_max {
            vec![&desc_n]
        } else {
            desc_n
                .as_bytes()
                .chunks(desc_max)
                .map(|c| std::str::from_utf8(c).unwrap_or(""))
                .collect()
        };

        // First line: qty + first chunk + amount
        let first = chunks[0];
        let spaces = COLS - qty_str.len() - 1 - first.len() - 1 - amt_str.len();
        let mut row = format!("{qty_str} {first}");
        row.push_str(&" ".repeat(spaces + 1));
        row.push_str(&amt_str);
        self.line(&row);

        // Continuation lines indented
        for chunk in chunks.iter().skip(1) {
            let indent = " ".repeat(qty_str.len() + 1);
            self.line(&format!("{indent}{chunk}"));
        }
    }

    fn cut(&mut self) {
        // Feed + full cut
        self.raw(&[GS, b'V', 0]);
    }
}

fn doc_label(doc_type: &str) -> &str {
    match doc_type {
        "nota"       => "NOTA DE VENTA",
        "boleta"     => "BOLETA DE VENTA",
        "factura"    => "FACTURA ELECTRONICA",
        "cotizacion" => "COTIZACION",
        _            => doc_type,
    }
}

fn pay_label(method: &str) -> &str {
    match method {
        "efectivo" => "Efectivo",
        "yape"     => "Yape",
        "tarjeta"  => "Tarjeta",
        "mixto"    => "Pago Mixto",
        _          => method,
    }
}

pub fn build_escpos(d: &TicketPrintData) -> Vec<u8> {
    let mut b = Buf::new();
    b.init();

    // Business header — hardware centering active, use line() not center_line()
    b.align_center();
    b.bold_on();
    b.dbl_h_on();
    b.line(&normalize(&d.business_name));
    b.dbl_h_off();
    b.bold_off();
    b.line(&normalize(&format!("RUC: {}", d.business_ruc)));
    b.line(&normalize(&d.business_addr));
    if let Some(ref phone) = d.business_phone {
        b.line(&normalize(&format!("Tel: {phone}")));
    }
    b.lf();

    b.align_left();
    b.dashes();

    // Document type
    b.align_center();
    b.bold_on();
    b.line(doc_label(&d.doc_type));
    b.bold_off();

    let doc_num = format!(
        "{}-{:0>8}",
        d.doc_series,
        d.doc_correlative + 1
    );
    b.line(&doc_num);
    b.line(&normalize(&d.date_time));
    b.align_left();

    // Customer
    if let Some(ref c) = d.customer {
        b.dashes();
        b.two_col("Cliente:", &c.name);
        if !c.doc_number.is_empty() {
            b.two_col("Doc.:", &c.doc_number);
        }
    }

    b.dashes();

    // Lines
    for line in &d.lines {
        b.item_row(line.quantity, &line.description, line.subtotal);
        if let Some(ref note) = line.note {
            b.line(&format!("  > {}", normalize(note)));
        }
    }

    b.dashes();

    // Discount
    if d.discount_num > 0.0 {
        b.two_col("Subtotal bruto", &money(d.total));
        b.two_col("Descuento", &format!("-{}", money(d.discount_num)));
    }

    // IGV
    if d.igv > 0.0 {
        b.two_col("Op. Gravada", &money(d.base_imponible));
        b.two_col("IGV 18%", &money(d.igv));
    }

    b.equals();

    // Total
    b.bold_on();
    b.dbl_h_on();
    b.two_col("TOTAL", &money(d.net_total));
    b.dbl_h_off();
    b.bold_off();

    b.dashes();

    // Payment
    if d.pay_method == "efectivo" && d.received_num > 0.0 {
        b.two_col("Efectivo", &money(d.received_num));
        b.two_col("Vuelto", &money(d.change.max(0.0)));
    } else {
        b.two_col("Metodo de pago", pay_label(&d.pay_method));
    }

    b.dashes();

    // Footer — hardware centering, use line()
    b.align_center();
    b.line("GRACIAS POR SU COMPRA");
    b.line("CONSERVE SU COMPROBANTE");
    b.lf();
    b.lf();
    b.lf();
    b.lf();
    b.lf();

    b.cut();
    b.0
}

#[cfg(target_os = "windows")]
pub fn print_raw(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use windows_sys::Win32::Foundation::HANDLE;
    use windows_sys::Win32::Graphics::Printing::{
        ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterW,
        StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W,
    };

    let name_wide: Vec<u16> = printer_name
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();
    let raw_wide: Vec<u16> = "RAW\0".encode_utf16().collect();

    let mut handle: HANDLE = std::ptr::null_mut();
    let ok = unsafe {
        OpenPrinterW(name_wide.as_ptr(), &mut handle, std::ptr::null_mut())
    };
    if ok == 0 {
        return Err(format!("OpenPrinterW failed for '{printer_name}'"));
    }

    let doc_info = DOC_INFO_1W {
        pDocName:    std::ptr::null_mut(),
        pOutputFile: std::ptr::null_mut(),
        pDatatype:   raw_wide.as_ptr() as *mut u16,
    };

    let job = unsafe { StartDocPrinterW(handle, 1, &doc_info as *const _ as *const _) };
    if job == 0 {
        unsafe { ClosePrinter(handle) };
        return Err("StartDocPrinterW failed".into());
    }

    let ok = unsafe { StartPagePrinter(handle) };
    if ok == 0 {
        unsafe { EndDocPrinter(handle); ClosePrinter(handle); }
        return Err("StartPagePrinter failed".into());
    }

    let mut written: u32 = 0;
    let ok = unsafe {
        WritePrinter(
            handle,
            data.as_ptr() as *const _,
            data.len() as u32,
            &mut written,
        )
    };
    if ok == 0 {
        unsafe { EndPagePrinter(handle); EndDocPrinter(handle); ClosePrinter(handle); }
        return Err("WritePrinter failed".into());
    }

    unsafe {
        EndPagePrinter(handle);
        EndDocPrinter(handle);
        ClosePrinter(handle);
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn print_raw(_printer_name: &str, _data: &[u8]) -> Result<(), String> {
    Err("Raw thermal printing is only supported on Windows".into())
}

// ─── CASH MOVE VOUCHER ───────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoucherMovePrintData {
    pub business_name: String,
    pub move_type:     String,
    pub source_label:  Option<String>,
    pub amount:        f64,
    pub motivo:        String,
    pub observacion:   Option<String>,
    pub operator:      String,
    pub cash_box_code: String,
    pub terminal:      String,
    pub date_time:     String,
}

pub fn build_cash_move_escpos(d: &VoucherMovePrintData) -> Vec<u8> {
    let mut b = Buf::new();
    b.init();

    let type_label = normalize(
        d.source_label.as_deref()
            .unwrap_or(if d.move_type == "ingreso" { "INGRESO" } else { "EGRESO" })
    );

    b.align_center();
    b.bold_on();
    b.dbl_h_on();
    b.line(&normalize(&d.business_name));
    b.dbl_h_off();
    b.bold_off();
    b.bold_on();
    b.line("MOVIMIENTO DE CAJA");
    b.line(&type_label);
    b.bold_off();
    b.align_left();
    b.equals();

    b.bold_on();
    b.dbl_h_on();
    b.two_col("MONTO", &money(d.amount));
    b.dbl_h_off();
    b.bold_off();

    b.dashes();

    // Motivo — wrap if needed (normalize gives pure ASCII so byte-slice is safe)
    {
        let text = normalize(&d.motivo);
        let prefix = "Motivo: ";
        if prefix.len() + text.len() <= COLS {
            b.line(&format!("{prefix}{text}"));
        } else {
            b.line("Motivo:");
            let width = COLS - 2;
            let bytes = text.as_bytes();
            let mut i = 0;
            while i < bytes.len() {
                let end = (i + width).min(bytes.len());
                let chunk = std::str::from_utf8(&bytes[i..end]).unwrap_or("");
                b.line(&format!("  {chunk}"));
                i = end;
            }
        }
    }

    if let Some(ref obs) = d.observacion {
        let text = normalize(obs);
        if !text.is_empty() {
            let prefix = "Obs.: ";
            if prefix.len() + text.len() <= COLS {
                b.line(&format!("{prefix}{text}"));
            } else {
                b.line("Obs.:");
                let width = COLS - 2;
                let bytes = text.as_bytes();
                let mut i = 0;
                while i < bytes.len() {
                    let end = (i + width).min(bytes.len());
                    let chunk = std::str::from_utf8(&bytes[i..end]).unwrap_or("");
                    b.line(&format!("  {chunk}"));
                    i = end;
                }
            }
        }
    }

    b.dashes();

    b.two_col("Operador:", &normalize(&d.operator));
    b.two_col("Caja:", &normalize(&d.cash_box_code));
    b.two_col("Terminal:", &normalize(&d.terminal));
    b.two_col("Fecha/Hora:", &normalize(&d.date_time));

    b.dashes();

    b.align_center();
    b.line("Conserve este comprobante");
    b.lf();
    b.lf();
    b.lf();
    b.lf();
    b.lf();

    b.cut();
    b.0
}

// ─── DISPATCH TICKET ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DispatchLine {
    pub description: String,
    pub quantity:    u32,
    pub note:        Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DispatchPrintData {
    pub correlative: u32,
    pub date_time:   String,
    pub lines:       Vec<DispatchLine>,
    pub op_number:   String,
}

pub fn build_dispatch_escpos(d: &DispatchPrintData) -> Vec<u8> {
    let mut b = Buf::new();
    b.init();

    b.align_center();
    b.bold_on();
    b.line("TICKET DESPACHO");
    b.bold_off();

    b.bold_on();
    b.dbl_h_on();
    b.line(&format!("#{:0>4}", d.correlative));
    b.dbl_h_off();
    b.bold_off();

    b.line(&normalize(&d.date_time));
    b.align_left();
    b.dashes();

    for line in &d.lines {
        let qty_str  = format!("{}x", line.quantity);
        let desc_up  = normalize(&line.description.to_uppercase());
        let max_desc = COLS.saturating_sub(qty_str.len() + 1);
        let desc_out = if desc_up.len() <= max_desc { desc_up } else { desc_up[..max_desc].to_string() };
        b.line(&format!("{} {}", qty_str, desc_out));
        if let Some(ref note) = line.note {
            b.line(&format!("  > {}", normalize(note)));
        }
    }

    b.dashes();
    b.align_center();
    b.line(&normalize(&format!("OP: {}", d.op_number)));
    b.lf();
    b.lf();
    b.lf();
    b.lf();
    b.lf();

    b.cut();
    b.0
}
