use serde::Deserialize;

// ── monetary helpers ────────────────────────────────────────────
// Mirror of src/lib/money.ts — cent-based comparisons for f64 values
fn cents(n: f64) -> i64 { (n * 100.0).round() as i64 }
fn money_pos(n: f64) -> bool { cents(n) > 0 }
fn money_zero(n: f64) -> bool { cents(n) == 0 }
// ───────────────────────────────────────────────────────────────

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
pub struct MixtoBreakdown {
    pub efe: f64,
    pub yap: f64,
    pub tar: f64,
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
    pub mixto_breakdown:  Option<MixtoBreakdown>,
}

fn normalize(s: &str) -> String {
    s.chars().map(|c| match c {
        '\u{00E1}' | '\u{00E0}' | '\u{00E2}' | '\u{00E4}' => 'a',
        '\u{00E9}' | '\u{00E8}' | '\u{00EA}' | '\u{00EB}' => 'e',
        '\u{00ED}' | '\u{00EC}' | '\u{00EE}' | '\u{00EF}' => 'i',
        '\u{00F3}' | '\u{00F2}' | '\u{00F4}' | '\u{00F6}' => 'o',
        '\u{00FA}' | '\u{00F9}' | '\u{00FB}' | '\u{00FC}' => 'u',
        '\u{00C1}' | '\u{00C0}' | '\u{00C2}' | '\u{00C4}' => 'A',
        '\u{00C9}' | '\u{00C8}' | '\u{00CA}' | '\u{00CB}' => 'E',
        '\u{00CD}' | '\u{00CC}' | '\u{00CE}' | '\u{00CF}' => 'I',
        '\u{00D3}' | '\u{00D2}' | '\u{00D4}' | '\u{00D6}' => 'O',
        '\u{00DA}' | '\u{00D9}' | '\u{00DB}' | '\u{00DC}' => 'U',
        '\u{00F1}' => 'n',
        '\u{00D1}' => 'N',
        '\u{00BF}' | '\u{00A1}' => ' ',
        _ => c,
    }).collect()
}

fn money(n: f64) -> String {
    format!("S/ {:.2}", n)
}

fn diff_str(sistema: f64, operador: f64) -> String {
    let diff = operador - sistema;
    let sign = if cents(diff) < 0 { "-" } else { "+" };
    format!("{sign}{:.2}", diff.abs())
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

    fn four_col(&mut self, label: &str, c1: &str, c2: &str, c3: &str) {
        const LBL: usize = 9;
        const COL: usize = 13;
        let l = normalize(label);
        let mut out = if l.len() >= LBL {
            l[..LBL].to_string()
        } else {
            format!("{l:<LBL$}")
        };
        for c in [c1, c2, c3] {
            let cn = normalize(c);
            if cn.len() >= COL {
                out.push_str(&cn[cn.len() - COL..]);
            } else {
                out.push_str(&format!("{cn:>COL$}"));
            }
        }
        self.line(&out);
    }

    fn item_row(&mut self, qty: u32, desc: &str, subtotal: f64) {
        let qty_str = format!("{qty}x");
        let amt_str = money(subtotal);
        let desc_n = normalize(desc);
        let amt_len = amt_str.len() as u8;
        let tab_col = COLS as u8;

        // Set tab stop at right edge minus amount width
        self.set_tab(tab_col.saturating_sub(amt_len));

        let fixed = qty_str.len() + 1 + amt_str.len() + 1;
        let desc_max = COLS.saturating_sub(fixed);

        let chunks: Vec<String> = if desc_n.len() <= desc_max {
            vec![desc_n.clone()]
        } else {
            desc_n
                .as_bytes()
                .chunks(desc_max)
                .map(|c| std::str::from_utf8(c).unwrap_or("").to_string())
                .collect()
        };

        // First line: qty + desc + TAB + amount (tab aligns to right)
        let first = &chunks[0];
        self.text(&format!("{qty_str} {first}"));
        self.tab();
        self.line(&amt_str);

        // Continuation lines indented
        for chunk in chunks.iter().skip(1) {
            let indent = " ".repeat(qty_str.len() + 1);
            self.line(&format!("{indent}{chunk}"));
        }
    }

    fn set_tab(&mut self, pos: u8) {
        // ESC D — set horizontal tab at column pos
        self.raw(&[ESC, b'D', pos, 0]);
    }

    fn tab(&mut self) {
        // HT — jump to next tab stop
        self.raw(&[0x09]);
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
        d.doc_correlative
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
    if money_pos(d.discount_num) {
        b.two_col("Subtotal bruto", &money(d.total));
        b.two_col("Descuento", &format!("-{}", money(d.discount_num)));
    }

    // IGV
    if money_pos(d.igv) {
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
    if d.pay_method == "efectivo" && money_pos(d.received_num) {
        b.two_col("Efectivo", &money(d.received_num));
        b.two_col("Vuelto", &money(d.change.max(0.0)));
    } else if d.pay_method == "mixto" {
        let label = if let Some(ref mb) = d.mixto_breakdown {
            let mut parts: Vec<String> = Vec::new();
            if money_pos(mb.efe) { parts.push(format!("E({:.2})", mb.efe)); }
            if money_pos(mb.yap) { parts.push(format!("Y({:.2})", mb.yap)); }
            if money_pos(mb.tar) { parts.push(format!("T({:.2})", mb.tar)); }
            if parts.is_empty() { "Pago Mixto".to_string() } else { format!("MIXTO {}", parts.join(" ")) }
        } else {
            "Pago Mixto".to_string()
        };
        b.two_col("Metodo de pago", &label);
    } else {
        b.two_col("Metodo de pago", pay_label(&d.pay_method));
    }

    b.dashes();

    // Footer — hardware centering, use line()
    b.align_center();
    b.line("GRACIAS POR SU COMPRA");
    b.line("CONSERVE SU COMPROBANTE");
    if d.doc_type == "nota" {
        b.lf();
        b.bold_on();
        b.line("SIN VALOR FISCAL.");
        b.bold_off();
        b.line("Solicite Boleta o Factura.");
    }
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

// ─── ARQUEO DE CIERRE ────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SistemaEsperado {
    pub efe:     f64,
    pub yape:    f64,
    pub tarjeta: f64,
    pub total:   f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArqueoPrintData {
    pub business_name:     String,
    pub cash_box_code:     String,
    pub operator:          String,
    pub terminal:          String,
    pub date_time:         String,
    pub apertura:          f64,
    pub ingresos_total:    f64,
    pub egresos_total:     f64,
    pub total_ventas:      f64,
    pub sales_count:       u32,
    pub efectivo_esperado: f64,
    pub contado_efe:       f64,
    pub contado_yape:      f64,
    pub contado_tar:       f64,
    pub contado_total:     f64,
    pub diferencia:        f64,
    pub observations:      Option<String>,
    pub zero_motive:       Option<String>,
    pub sistema_esperado:  Option<SistemaEsperado>,
}

pub fn build_arqueo_escpos(d: &ArqueoPrintData) -> Vec<u8> {
    let mut b = Buf::new();
    b.init();

    // Header
    b.align_center();
    b.bold_on();
    b.dbl_h_on();
    b.line(&normalize(&d.business_name));
    b.dbl_h_off();
    b.bold_off();
    b.bold_on();
    b.line("CIERRE DE TURNO");
    b.bold_off();
    b.line(&normalize(&d.date_time));
    b.align_left();

    b.equals();

    b.two_col("CAJA:", &normalize(&format!("CAJA {}", d.cash_box_code)));
    b.two_col("OPERADOR:", &normalize(&d.operator));
    b.two_col("TERMINAL:", &normalize(&d.terminal));

    b.dashes();

    // Contexto operacional
    b.bold_on();
    b.line("CONTEXTO OPERACIONAL");
    b.bold_off();
    b.dashes();

    b.two_col("Fondo apertura (ref.)", &money(d.apertura));
    let ventas_label = if d.sales_count > 0 {
        format!("Ventas ({})", d.sales_count)
    } else {
        "Ventas".to_string()
    };
    b.two_col(&ventas_label, &money(d.total_ventas));
    b.two_col("Ingresos ^", &format!("+{}", money(d.ingresos_total)));
    b.two_col("Egresos v", &format!("-{}", money(d.egresos_total)));
    b.bold_on();
    b.two_col("Esperado oper.", &money(d.efectivo_esperado));
    b.bold_off();

    b.dashes();

    // Conteo conciliado
    b.bold_on();
    b.line("CONTEO CONCILIADO");
    b.bold_off();
    b.dashes();

    if let Some(ref se) = d.sistema_esperado {
        b.four_col("", "SISTEMA", "OPERADOR", "DIFER.");
        b.four_col("Efectivo", &format!("{:.2}", se.efe), &format!("{:.2}", d.contado_efe), &diff_str(se.efe, d.contado_efe));
        b.four_col("Yape", &format!("{:.2}", se.yape), &format!("{:.2}", d.contado_yape), &diff_str(se.yape, d.contado_yape));
        b.four_col("Tarjetas", &format!("{:.2}", se.tarjeta), &format!("{:.2}", d.contado_tar), &diff_str(se.tarjeta, d.contado_tar));
        b.equals();
        b.bold_on();
        b.dbl_h_on();
        b.four_col("TOTAL", &format!("{:.2}", se.total), &format!("{:.2}", d.contado_total), &diff_str(se.total, d.contado_total));
        b.dbl_h_off();
        b.bold_off();
    } else {
        b.two_col("Efectivo", &money(d.contado_efe));
        b.two_col("Yape", &money(d.contado_yape));
        b.two_col("Tarjetas", &money(d.contado_tar));

        b.equals();

        b.bold_on();
        b.dbl_h_on();
        b.two_col("TOTAL CONTADO", &money(d.contado_total));
        b.dbl_h_off();
        b.bold_off();
    }

    b.dashes();

    // Diferencia
    let cuadrado   = money_zero(d.diferencia);
    let diff_abs   = d.diferencia.abs();
    let diff_label = if cuadrado {
        "ARQUEO CUADRADO"
    } else if money_pos(d.diferencia) {
        "SOBRANTE"
    } else {
        "FALTANTE"
    };
    let diff_sign = if cents(d.diferencia) >= 0 { "+" } else { "-" };

    b.bold_on();
    b.two_col(diff_label, &format!("{}{}", diff_sign, money(diff_abs)));
    b.bold_off();

    if let Some(ref motive) = d.zero_motive {
        let m = normalize(motive);
        if !m.is_empty() {
            b.dashes();
            b.two_col("Motivo:", &m);
        }
    }

    if let Some(ref obs) = d.observations {
        let text = normalize(obs);
        if !text.is_empty() {
            b.dashes();
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
                    b.line(&format!("  {}", std::str::from_utf8(&bytes[i..end]).unwrap_or("")));
                    i = end;
                }
            }
        }
    }

    b.equals();

    b.align_center();
    b.bold_on();
    b.line("CIERRE CONCILIADO");
    b.bold_off();
    b.line("Operacion irreversible");
    b.lf();
    b.lf();
    b.lf();
    b.lf();
    b.lf();

    b.cut();
    b.0
}

// ─── CORRECCIÓN DE CIERRE ────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CorreccionPrintData {
    pub business_name:     String,
    pub cash_box_code:     String,
    pub session_date_time: String,
    pub date_time:         String,
    pub authorized_by:     String,
    pub executed_by:       String,
    pub motivo:            String,
    pub prev_efe:          f64,
    pub prev_yape:         f64,
    pub prev_tar:          f64,
    pub prev_total:        f64,
    pub new_efe:           f64,
    pub new_yape:          f64,
    pub new_tar:           f64,
    pub new_total:         f64,
}

pub fn build_correccion_escpos(d: &CorreccionPrintData) -> Vec<u8> {
    let mut b = Buf::new();
    b.init();

    b.align_center();
    b.bold_on();
    b.dbl_h_on();
    b.line(&normalize(&d.business_name));
    b.dbl_h_off();
    b.bold_off();
    b.bold_on();
    b.line("CORRECCION DE CIERRE");
    b.bold_off();
    b.line(&normalize(&d.date_time));
    b.align_left();

    b.equals();

    b.two_col("CAJA:", &normalize(&format!("CAJA {}", d.cash_box_code)));
    b.two_col("SESION:", &normalize(&d.session_date_time));

    b.dashes();

    b.two_col("Autorizado por:", &normalize(&d.authorized_by));
    b.two_col("Ejecutado por:", &normalize(&d.executed_by));

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
                b.line(&format!("  {}", std::str::from_utf8(&bytes[i..end]).unwrap_or("")));
                i = end;
            }
        }
    }

    b.dashes();

    b.four_col("", "ORIGINAL", "CORREGIDO", "DIFER.");
    b.four_col("Efectivo", &format!("{:.2}", d.prev_efe), &format!("{:.2}", d.new_efe), &diff_str(d.prev_efe, d.new_efe));
    b.four_col("Yape", &format!("{:.2}", d.prev_yape), &format!("{:.2}", d.new_yape), &diff_str(d.prev_yape, d.new_yape));
    b.four_col("Tarjetas", &format!("{:.2}", d.prev_tar), &format!("{:.2}", d.new_tar), &diff_str(d.prev_tar, d.new_tar));
    b.equals();
    b.bold_on();
    b.dbl_h_on();
    b.four_col("TOTAL", &format!("{:.2}", d.prev_total), &format!("{:.2}", d.new_total), &diff_str(d.prev_total, d.new_total));
    b.dbl_h_off();
    b.bold_off();

    b.equals();

    b.align_center();
    b.bold_on();
    b.line("CORRECCION REGISTRADA");
    b.bold_off();
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
