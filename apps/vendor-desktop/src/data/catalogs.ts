export type Rubro = "abarrotes" | "food-fast" | "panaderia" | "farmacia" | "optica" | "zapateria" | "reparacion" | "celulares";

export interface PrecioTipo {
  tipo:  string;   // "Normal" | "Mayoreo" | "Promoción" | "Libre"
  valor: number;
}

export interface Presentacion {
  id:      string;
  label:   string;   // "Unidad", "Blíster", "Caja x10", "1/4 Pollo"
  precio:  number;   // precio base de esta presentación
  precios?: PrecioTipo[];  // opcional — tipos de precio
}

export type StockStatus = "normal" | "low" | "out" | "promo" | "expiring";

export type VisualMode = "lista" | "visual";

export type PrintFlow =
  | "solo-comprobante"
  | "comprobante-despacho"
  | "comprobante-comanda"
  | "comprobante-precuenta"
  | "comprobante-turno"
  | "comprobante-embarque";

export interface CatalogProduct {
  id:       string;
  name:     string;
  short:    string;
  emoji:    string;
  category: string;
  price:    number;
  code:     string;
  color:    string;
  accent:   string;
  stock:    number;
  status:   StockStatus;
  presentaciones?: Presentacion[];
}

export interface RubroConfig {
  label:              string;
  description:        string;
  defaultVisualMode:  VisualMode;
  defaultPrintFlow:   PrintFlow;
  categories:         { id: string; label: string }[];
  catalog:            CatalogProduct[];
}

export const RUBROS: Record<Rubro, RubroConfig> = {
  optica: {
    label:             "Óptica",
    description:       "Armazones · Lunas · Lentes · Servicios",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",         label: "Todo"              },
      { id: "armazones",   label: "️ Armazones"      },
      { id: "lunas",       label: " Lunas"           },
      { id: "contacto",    label: "️ Lentes contacto" },
      { id: "soluciones",  label: " Soluciones"      },
      { id: "accesorios",  label: " Accesorios"      },
      { id: "servicios",   label: " Servicios"       },
    ],
    catalog: [
      // ── ARMAZONES ────────────────────────────────────────────────
      {
        id: "OP01", name: "Armazón Clásico Metal", short: "Armazón Metal",
        emoji: "️", category: "armazones",
        price: 45.00, code: "OPT0001",
        color: "#F8FAFC", accent: "#475467",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 45.00,
            precios: [
              { tipo: "Normal", valor: 45.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "OP02", name: "Armazón Acetato", short: "Armazón Acetato",
        emoji: "️", category: "armazones",
        price: 55.00, code: "OPT0002",
        color: "#FEF3C7", accent: "#B45309",
        stock: 15, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 55.00,
            precios: [
              { tipo: "Normal", valor: 55.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "OP03", name: "Armazón Niños", short: "Armazón Niños",
        emoji: "️", category: "armazones",
        price: 35.00, code: "OPT0003",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 10, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 35.00,
            precios: [
              { tipo: "Normal", valor: 35.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "OP04", name: "Armazón Sol Polarizado", short: "Sol Polarizado",
        emoji: "️", category: "armazones",
        price: 80.00, code: "OPT0004",
        color: "#1f2937", accent: "#f9fafb",
        stock: 8, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 80.00,
            precios: [
              { tipo: "Normal", valor: 80.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      // ── LUNAS ────────────────────────────────────────────────────
      {
        id: "OP10", name: "Luna Simple", short: "Luna Simple",
        emoji: "", category: "lunas",
        price: 30.00, code: "OPT0010",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "blanca",      label: "Blanca",           precio: 30.00 },
          { id: "antireflex",  label: "Antirreflejo",     precio: 45.00 },
          { id: "fotocromica", label: "Fotocrómica",      precio: 65.00 },
          { id: "polarizada",  label: "Polarizada",       precio: 70.00 },
        ],
      },
      {
        id: "OP11", name: "Luna Bifocal", short: "Luna Bifocal",
        emoji: "", category: "lunas",
        price: 60.00, code: "OPT0011",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "blanca",     label: "Blanca",       precio: 60.00 },
          { id: "antireflex", label: "Antirreflejo", precio: 80.00 },
        ],
      },
      {
        id: "OP12", name: "Luna Progresiva", short: "Luna Progresiva",
        emoji: "", category: "lunas",
        price: 120.00, code: "OPT0012",
        color: "#F0F9FF", accent: "#0C4A6E",
        stock: 15, status: "normal",
        presentaciones: [
          { id: "blanca",     label: "Blanca",       precio: 120.00 },
          { id: "antireflex", label: "Antirreflejo", precio: 150.00 },
          { id: "premium",    label: "Premium",      precio: 200.00 },
        ],
      },
      // ── LENTES DE CONTACTO ────────────────────────────────────────
      {
        id: "OP20", name: "Lentes Contacto Diarios", short: "L.C. Diarios",
        emoji: "️", category: "contacto",
        price: 35.00, code: "OPT0020",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "caja30", label: "Caja x30 días",  precio: 35.00 },
          { id: "caja90", label: "Caja x90 días",  precio: 90.00,
            precios: [
              { tipo: "Normal",    valor: 90.00 },
              { tipo: "Promoción", valor: 80.00 },
            ]
          },
        ],
      },
      {
        id: "OP21", name: "Lentes Contacto Mensuales", short: "L.C. Mensuales",
        emoji: "️", category: "contacto",
        price: 45.00, code: "OPT0021",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 15, status: "normal",
        presentaciones: [
          { id: "par",   label: "Par 1 mes",   precio: 45.00 },
          { id: "caja6", label: "Caja 6 meses", precio: 240.00,
            precios: [
              { tipo: "Normal",    valor: 240.00 },
              { tipo: "Promoción", valor: 210.00 },
            ]
          },
        ],
      },
      // ── SOLUCIONES ────────────────────────────────────────────────
      {
        id: "OP30", name: "Solución Multiusos 360ml", short: "Solución 360ml",
        emoji: "", category: "soluciones",
        price: 22.00, code: "OPT0030",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 15, status: "normal",
      },
      {
        id: "OP31", name: "Solución Multiusos 120ml", short: "Solución 120ml",
        emoji: "", category: "soluciones",
        price: 12.00, code: "OPT0031",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 20, status: "normal",
      },
      {
        id: "OP32", name: "Gotas Lubricantes", short: "Gotas",
        emoji: "", category: "soluciones",
        price: 15.00, code: "OPT0032",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 10, status: "normal",
      },
      // ── ACCESORIOS ────────────────────────────────────────────────
      {
        id: "OP40", name: "Estuche Rígido", short: "Estuche",
        emoji: "", category: "accesorios",
        price: 8.00, code: "OPT0040",
        color: "#F8FAFC", accent: "#475467",
        stock: 25, status: "normal",
      },
      {
        id: "OP41", name: "Cadena para Lentes", short: "Cadena",
        emoji: "", category: "accesorios",
        price: 5.00, code: "OPT0041",
        color: "#FEF9C3", accent: "#92400E",
        stock: 30, status: "normal",
      },
      {
        id: "OP42", name: "Paño Microfibra", short: "Paño",
        emoji: "", category: "accesorios",
        price: 3.00, code: "OPT0042",
        color: "#F0FDF4", accent: "#166534",
        stock: 40, status: "normal",
      },
      {
        id: "OP43", name: "Spray Limpiador", short: "Spray",
        emoji: "", category: "accesorios",
        price: 6.00, code: "OPT0043",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 20, status: "normal",
      },
      {
        id: "OP44", name: "Kit Reparación", short: "Kit Rep.",
        emoji: "", category: "accesorios",
        price: 4.00, code: "OPT0044",
        color: "#F8FAFC", accent: "#475467",
        stock: 15, status: "normal",
      },
      // ── SERVICIOS ────────────────────────────────────────────────
      {
        id: "OP50", name: "Toma de Medida", short: "Toma Medida",
        emoji: "", category: "servicios",
        price: 10.00, code: "OPT0050",
        color: "#F0FDF4", accent: "#166534",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 10.00,
            precios: [
              { tipo: "Normal", valor: 10.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "OP51", name: "Ajuste de Armazón", short: "Ajuste",
        emoji: "", category: "servicios",
        price: 5.00, code: "OPT0051",
        color: "#F0FDF4", accent: "#166534",
        stock: 99, status: "normal",
      },
      {
        id: "OP52", name: "Reparación de Armazón", short: "Reparación",
        emoji: "", category: "servicios",
        price: 15.00, code: "OPT0052",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 15.00,
            precios: [
              { tipo: "Normal", valor: 15.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "OP53", name: "Cambio de Luna", short: "Cambio Luna",
        emoji: "", category: "servicios",
        price: 20.00, code: "OPT0053",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 20.00,
            precios: [
              { tipo: "Normal", valor: 20.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
    ],
  },

  abarrotes: {
    label:             "Abarrotes",
    description:       "Scanner · Lista · Menudeo y Mayoreo",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",      label: "Todo"           },
      { id: "lacteos",  label: " Lácteos"     },
      { id: "despensa", label: " Despensa"     },
      { id: "bebidas",  label: " Bebidas"      },
      { id: "limpieza", label: " Limpieza"     },
      { id: "snacks",   label: " Snacks"       },
    ],
    catalog: [],
  },

  "food-fast": {
    label:             "Food Fast",
    description:       "Visual · Touch · Combos · Despacho",
    defaultVisualMode: "visual",
    defaultPrintFlow:  "comprobante-despacho",
    categories: [
      { id: "all",       label: "Todo"            },
      { id: "burgers",   label: " Hamburguesas"  },
      { id: "combos",    label: " Combos"        },
      { id: "acompanam", label: " Acompañamientos"},
      { id: "bebidas",   label: " Bebidas"       },
      { id: "postres",   label: " Postres"       },
    ],
    catalog: [
      // ── HAMBURGUESAS ─────────────────────────────────────────────
      {
        id: "FF01", name: "Hamburguesa Clásica", short: "Clásica",
        emoji: "", category: "burgers",
        price: 12.00, code: "8800001001",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 30, status: "normal",
      },
      {
        id: "FF02", name: "Hamburguesa Doble", short: "Doble",
        emoji: "", category: "burgers",
        price: 16.00, code: "8800001002",
        color: "#FEF3C7", accent: "#B45309",
        stock: 20, status: "normal",
      },
      {
        id: "FF03", name: "Hamburguesa Especial", short: "Especial",
        emoji: "", category: "burgers",
        price: 18.00, code: "8800001003",
        color: "#FEF9C3", accent: "#92400E",
        stock: 15, status: "normal",
      },
      {
        id: "FF04", name: "Hamburguesa BBQ", short: "BBQ",
        emoji: "", category: "burgers",
        price: 20.00, code: "8800001004",
        color: "#FEE2E2", accent: "#991B1B",
        stock: 12, status: "normal",
      },
      {
        id: "FF05", name: "Hamburguesa Hawaiana", short: "Hawaiana",
        emoji: "", category: "burgers",
        price: 19.00, code: "8800001005",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 10, status: "normal",
      },
      {
        id: "FF06", name: "Hamburguesa Veggie", short: "Veggie",
        emoji: "", category: "burgers",
        price: 14.00, code: "8800001006",
        color: "#F0FDF4", accent: "#166534",
        stock: 8, status: "normal",
      },
      // ── COMBOS ───────────────────────────────────────────────────
      {
        id: "FF10", name: "Combo Clásica", short: "Combo Clásica",
        emoji: "", category: "combos",
        price: 18.00, code: "8800002001",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal · Burger + Papas + Bebida",  precio: 18.00 },
          { id: "familiar", label: "Familiar · 2 Burger + Papas + 2 Beb", precio: 32.00 },
        ],
      },
      {
        id: "FF11", name: "Combo Doble", short: "Combo Doble",
        emoji: "", category: "combos",
        price: 22.00, code: "8800002002",
        color: "#FEF3C7", accent: "#B45309",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal · Burger + Papas + Bebida",  precio: 22.00 },
          { id: "familiar", label: "Familiar · 2 Burger + Papas + 2 Beb", precio: 38.00 },
        ],
      },
      {
        id: "FF12", name: "Combo Especial", short: "Combo Especial",
        emoji: "", category: "combos",
        price: 25.00, code: "8800002003",
        color: "#FEF9C3", accent: "#92400E",
        stock: 15, status: "promo",
        presentaciones: [
          { id: "personal", label: "Personal · Burger + Papas + Bebida",  precio: 25.00 },
          { id: "familiar", label: "Familiar · 2 Burger + Papas + 2 Beb", precio: 44.00 },
        ],
      },
      // ── ACOMPAÑAMIENTOS ──────────────────────────────────────────
      {
        id: "FF20", name: "Papas Fritas", short: "Papas",
        emoji: "", category: "acompanam",
        price: 5.00, code: "8800003001",
        color: "#FEFCE8", accent: "#A16207",
        stock: 50, status: "normal",
        presentaciones: [
          { id: "chica",  label: "Chica",  precio: 5.00 },
          { id: "grande", label: "Grande", precio: 7.00 },
        ],
      },
      {
        id: "FF21", name: "Nuggets de Pollo", short: "Nuggets",
        emoji: "", category: "acompanam",
        price: 8.00, code: "8800003002",
        color: "#FEF3C7", accent: "#B45309",
        stock: 25, status: "normal",
        presentaciones: [
          { id: "x6",  label: "6 piezas",  precio: 8.00  },
          { id: "x12", label: "12 piezas", precio: 14.00 },
        ],
      },
      {
        id: "FF22", name: "Tequeños", short: "Tequeños",
        emoji: "", category: "acompanam",
        price: 6.00, code: "8800003003",
        color: "#FFFBEB", accent: "#B45309",
        stock: 18, status: "normal",
        presentaciones: [
          { id: "x4", label: "4 piezas", precio: 6.00  },
          { id: "x8", label: "8 piezas", precio: 10.00 },
        ],
      },
      {
        id: "FF23", name: "Yuca Frita", short: "Yuca",
        emoji: "", category: "acompanam",
        price: 5.50, code: "8800003004",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 20, status: "normal",
      },
      {
        id: "FF24", name: "Ensalada", short: "Ensalada",
        emoji: "", category: "acompanam",
        price: 5.00, code: "8800003005",
        color: "#F0FDF4", accent: "#166534",
        stock: 15, status: "normal",
      },
      // ── BEBIDAS ───────────────────────────────────────────────────
      {
        id: "FF30", name: "Coca-Cola", short: "Coca",
        emoji: "", category: "bebidas",
        price: 4.50, code: "8800004001",
        color: "#FEE2E2", accent: "#991B1B",
        stock: 40, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal 500ml", precio: 4.50 },
          { id: "familiar", label: "Familiar 1.5L",  precio: 8.00 },
        ],
      },
      {
        id: "FF31", name: "Inca Kola", short: "Inca",
        emoji: "", category: "bebidas",
        price: 4.50, code: "8800004002",
        color: "#FEFCE8", accent: "#A16207",
        stock: 40, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal 500ml", precio: 4.50 },
          { id: "familiar", label: "Familiar 1.5L",  precio: 8.00 },
        ],
      },
      {
        id: "FF32", name: "Agua", short: "Agua",
        emoji: "", category: "bebidas",
        price: 2.00, code: "8800004003",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal 600ml", precio: 2.00 },
          { id: "familiar", label: "Familiar 2.5L",  precio: 5.00 },
        ],
      },
      {
        id: "FF33", name: "Chicha Morada", short: "Chicha",
        emoji: "", category: "bebidas",
        price: 4.00, code: "8800004004",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal 500ml", precio: 4.00 },
          { id: "familiar", label: "Familiar 1.5L",  precio: 7.00 },
        ],
      },
      {
        id: "FF34", name: "Jugo Natural", short: "Jugo",
        emoji: "", category: "bebidas",
        price: 5.00, code: "8800004005",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "personal", label: "Personal",  precio: 5.00 },
          { id: "familiar", label: "Familiar",  precio: 9.00 },
        ],
      },
      // ── POSTRES ───────────────────────────────────────────────────
      {
        id: "FF40", name: "Helado de Vainilla", short: "Helado",
        emoji: "", category: "postres",
        price: 4.00, code: "8800005001",
        color: "#FEF9C3", accent: "#92400E",
        stock: 15, status: "normal",
      },
      {
        id: "FF41", name: "Brownie", short: "Brownie",
        emoji: "", category: "postres",
        price: 5.00, code: "8800005002",
        color: "#FDF2F8", accent: "#9D174D",
        stock: 10, status: "normal",
      },
      {
        id: "FF42", name: "Pie de Manzana", short: "Pie",
        emoji: "", category: "postres",
        price: 6.00, code: "8800005003",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 8, status: "normal",
      },
    ],
  },

  panaderia: {
    label:             "Panadería",
    description:       "Visual · Desayunos · Rápido",
    defaultVisualMode: "visual",
    defaultPrintFlow:  "comprobante-despacho",
    categories: [
      { id: "all",       label: "Todo"          },
      { id: "panes",     label: " Panes"       },
      { id: "desayunos", label: " Desayunos"   },
      { id: "bebidas",   label: "☕ Bebidas"     },
      { id: "extras",    label: " Extras"      },
    ],
    catalog: [
      // ── PANES ────────────────────────────────────────────────────
      {
        id: "PN01", name: "Pan Francés", short: "Pan Francés",
        emoji: "", category: "panes",
        price: 0.20, code: "7800000001",
        color: "#FEF3C7", accent: "#B45309",
        stock: 200, status: "normal",
      },
      {
        id: "PN02", name: "Pan Yema", short: "Pan Yema",
        emoji: "", category: "panes",
        price: 0.50, code: "7800000002",
        color: "#FEF9C3", accent: "#92400E",
        stock: 100, status: "normal",
      },
      {
        id: "PN03", name: "Pan Colisa", short: "Pan Colisa",
        emoji: "", category: "panes",
        price: 0.30, code: "7800000003",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 80, status: "normal",
      },
      {
        id: "PN04", name: "Pan Ciabatta", short: "Ciabatta",
        emoji: "", category: "panes",
        price: 1.50, code: "7800000004",
        color: "#FFFBEB", accent: "#B45309",
        stock: 30, status: "normal",
      },
      {
        id: "PN05", name: "Pan Integral", short: "Integral",
        emoji: "", category: "panes",
        price: 1.00, code: "7800000005",
        color: "#ECFDF5", accent: "#065F46",
        stock: 40, status: "normal",
      },
      {
        id: "PN06", name: "Pan Chapla", short: "Pan Chapla",
        emoji: "", category: "panes",
        price: 0.50, code: "7800000006",
        color: "#FEF3C7", accent: "#B45309",
        stock: 60, status: "normal",
      },
      {
        id: "PN07", name: "Pan Caracol", short: "Pan Caracol",
        emoji: "", category: "panes",
        price: 0.80, code: "7800000007",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 45, status: "promo",
      },
      {
        id: "PN08", name: "Pan Cachito", short: "Pan Cachito",
        emoji: "", category: "panes",
        price: 1.00, code: "7800000008",
        color: "#FEF3C7", accent: "#92400E",
        stock: 3, status: "low",
      },
      {
        id: "PN09", name: "Pan de Molde 500g", short: "Pan Molde",
        emoji: "", category: "panes",
        price: 4.50, code: "7800000009",
        color: "#FEF3C7", accent: "#B45309",
        stock: 4, status: "expiring",
      },
      {
        id: "PN10", name: "Empanada de Carne", short: "Empanada",
        emoji: "", category: "panes",
        price: 2.50, code: "7800000010",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 18, status: "normal",
      },
      {
        id: "PN11", name: "Croissant", short: "Croissant",
        emoji: "", category: "panes",
        price: 2.00, code: "7800000011",
        color: "#FEF3C7", accent: "#B45309",
        stock: 20, status: "normal",
      },
      // ── DESAYUNOS ────────────────────────────────────────────────
      {
        id: "DS01", name: "Desayuno Clásico", short: "D. Clásico",
        emoji: "", category: "desayunos",
        price: 5.00, code: "7800001001",
        color: "#FEFCE8", accent: "#A16207",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "simple",   label: "Simple · Pan + Bebida",           precio: 5.00 },
          { id: "completo", label: "Completo · Pan + Huevo + Bebida", precio: 7.00 },
        ],
      },
      {
        id: "DS02", name: "Desayuno Especial", short: "D. Especial",
        emoji: "", category: "desayunos",
        price: 8.00, code: "7800001002",
        color: "#FEF9C3", accent: "#92400E",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "simple",   label: "Simple · Pan + Bebida",                    precio: 8.00  },
          { id: "completo", label: "Completo · Pan + Huevo + Jamón + Bebida",  precio: 12.00 },
        ],
      },
      // ── BEBIDAS ───────────────────────────────────────────────────
      {
        id: "BE01", name: "Café", short: "Café",
        emoji: "☕", category: "bebidas",
        price: 1.50, code: "7800002001",
        color: "#FEF3C7", accent: "#78350F",
        stock: 50, status: "normal",
      },
      {
        id: "BE02", name: "Café con Leche", short: "Café c/Leche",
        emoji: "☕", category: "bebidas",
        price: 2.00, code: "7800002002",
        color: "#FFF7ED", accent: "#92400E",
        stock: 50, status: "normal",
      },
      {
        id: "BE03", name: "Leche", short: "Leche",
        emoji: "", category: "bebidas",
        price: 2.00, code: "7800002003",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 30, status: "normal",
      },
      {
        id: "BE04", name: "Té / Eco", short: "Té / Eco",
        emoji: "☕", category: "bebidas",
        price: 1.00, code: "7800002004",
        color: "#F5F5F4", accent: "#57534E",
        stock: 40, status: "normal",
      },
      {
        id: "BE05", name: "Cocoa", short: "Cocoa",
        emoji: "", category: "bebidas",
        price: 1.50, code: "7800002005",
        color: "#FDF2F8", accent: "#9D174D",
        stock: 35, status: "normal",
      },
      {
        id: "BE06", name: "Anís", short: "Anís",
        emoji: "", category: "bebidas",
        price: 1.00, code: "7800002006",
        color: "#ECFDF5", accent: "#065F46",
        stock: 20, status: "normal",
      },
      {
        id: "BE07", name: "Emoliente", short: "Emoliente",
        emoji: "", category: "bebidas",
        price: 1.50, code: "7800002007",
        color: "#F0FDF4", accent: "#166534",
        stock: 15, status: "normal",
      },
      {
        id: "BE08", name: "Manzanilla", short: "Manzanilla",
        emoji: "", category: "bebidas",
        price: 1.00, code: "7800002008",
        color: "#F0FDF4", accent: "#166534",
        stock: 20, status: "normal",
      },
      {
        id: "BE09", name: "Maracuyá", short: "Maracuyá",
        emoji: "", category: "bebidas",
        price: 2.00, code: "7800002009",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 15, status: "normal",
      },
      // ── EXTRAS ────────────────────────────────────────────────────
      {
        id: "OT01", name: "Jamón 100g", short: "Jamón",
        emoji: "", category: "extras",
        price: 5.00, code: "7800003001",
        color: "#FEE2E2", accent: "#991B1B",
        stock: 20, status: "normal",
      },
      {
        id: "OT02", name: "Queso 100g", short: "Queso",
        emoji: "", category: "extras",
        price: 4.50, code: "7800003002",
        color: "#FFFBEB", accent: "#B45309",
        stock: 15, status: "normal",
      },
      {
        id: "OT03", name: "Mantequilla", short: "Mantequilla",
        emoji: "", category: "extras",
        price: 1.50, code: "7800003003",
        color: "#FEFCE8", accent: "#A16207",
        stock: 25, status: "normal",
      },
      {
        id: "OT04", name: "Huevo Frito", short: "Huevo",
        emoji: "", category: "extras",
        price: 1.00, code: "7800003004",
        color: "#FEF9C3", accent: "#92400E",
        stock: 50, status: "normal",
      },
      {
        id: "OT05", name: "Mermelada", short: "Mermelada",
        emoji: "", category: "extras",
        price: 1.00, code: "7800003005",
        color: "#FDF2F8", accent: "#9D174D",
        stock: 30, status: "normal",
      },
      {
        id: "OT06", name: "Torta Tres Leches", short: "Tres Leches",
        emoji: "", category: "extras",
        price: 8.00, code: "7800003006",
        color: "#FDF2F8", accent: "#9D174D",
        stock: 0, status: "out",
      },
    ],
  },

  farmacia: {
    label:             "Farmacia",
    description:       "Control lotes · Vencimientos · Trazabilidad",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",          label: "Todo"              },
      { id: "analgesicos",  label: " Analgésicos"    },
      { id: "antibioticos", label: " Antibióticos"   },
      { id: "vitaminas",    label: " Vitaminas"       },
      { id: "topicos",      label: " Tópicos"         },
      { id: "cuidado",      label: " Cuidado personal"},
      { id: "bebes",        label: " Bebés"           },
      { id: "dispositivos", label: "️ Dispositivos"    },
    ],
    catalog: [
      // ── ANALGÉSICOS ──────────────────────────────────────────────
      {
        id: "FM01", name: "Paracetamol 500mg", short: "Paracetamol", emoji: "",
        category: "analgesicos", price: 0.15, code: "9900001001",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 200, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",    precio: 0.15 },
          { id: "blister", label: "Blíster x10", precio: 1.50,
            precios: [
              { tipo: "Normal",    valor: 1.50 },
              { tipo: "Promoción", valor: 1.20 },
            ]
          },
          { id: "caja", label: "Caja x100", precio: 12.00,
            precios: [
              { tipo: "Normal",  valor: 12.00 },
              { tipo: "Mayoreo", valor: 10.00 },
            ]
          },
        ],
      },
      {
        id: "FM02", name: "Ibuprofeno 400mg", short: "Ibuprofeno", emoji: "",
        category: "analgesicos", price: 0.25, code: "9900001002",
        color: "#F0F9FF", accent: "#0369A1", stock: 150, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",      precio: 0.25 },
          { id: "blister", label: "Blíster x10",  precio: 2.50,
            precios: [
              { tipo: "Normal",    valor: 2.50 },
              { tipo: "Promoción", valor: 2.00 },
            ]
          },
          { id: "caja", label: "Caja x100", precio: 20.00,
            precios: [
              { tipo: "Normal",  valor: 20.00 },
              { tipo: "Mayoreo", valor: 17.00 },
            ]
          },
        ],
      },
      {
        id: "FM03", name: "Naproxeno 500mg", short: "Naproxeno", emoji: "",
        category: "analgesicos", price: 0.30, code: "9900001003",
        color: "#EFF6FF", accent: "#1E40AF", stock: 80, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.30 },
          { id: "blister", label: "Blíster x10", precio: 3.00 },
        ],
      },
      {
        id: "FM04", name: "Metamizol 500mg", short: "Metamizol", emoji: "",
        category: "analgesicos", price: 0.20, code: "9900001004",
        color: "#F0F9FF", accent: "#0C4A6E", stock: 120, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.20 },
          { id: "blister", label: "Blíster x10", precio: 2.00 },
        ],
      },
      {
        id: "FM05", name: "Aspirina 100mg", short: "Aspirina", emoji: "",
        category: "analgesicos", price: 0.20, code: "9900001005",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 90, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.20 },
          { id: "blister", label: "Blíster x10", precio: 2.00 },
          { id: "caja",    label: "Caja x100",   precio: 16.00,
            precios: [
              { tipo: "Normal",  valor: 16.00 },
              { tipo: "Mayoreo", valor: 13.50 },
            ]
          },
        ],
      },
      // ── ANTIBIÓTICOS ─────────────────────────────────────────────
      {
        id: "FM10", name: "Amoxicilina 500mg", short: "Amoxicilina", emoji: "",
        category: "antibioticos", price: 0.50, code: "9900002001",
        color: "#FEF9C3", accent: "#92400E", stock: 80, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.50 },
          { id: "blister", label: "Blíster x12", precio: 6.00,
            precios: [
              { tipo: "Normal",    valor: 6.00 },
              { tipo: "Promoción", valor: 5.00 },
            ]
          },
        ],
      },
      {
        id: "FM11", name: "Azitromicina 500mg", short: "Azitromicina", emoji: "",
        category: "antibioticos", price: 1.50, code: "9900002002",
        color: "#FEF3C7", accent: "#B45309", stock: 40, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",    precio: 1.50 },
          { id: "blister", label: "Blíster x3", precio: 4.50 },
        ],
      },
      {
        id: "FM12", name: "Loratadina 10mg", short: "Loratadina", emoji: "",
        category: "antibioticos", price: 0.30, code: "9900002003",
        color: "#F0F9FF", accent: "#0369A1", stock: 60, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.30 },
          { id: "blister", label: "Blíster x10", precio: 3.00 },
        ],
      },
      // ── VITAMINAS ────────────────────────────────────────────────
      {
        id: "FM20", name: "Vitamina C 500mg", short: "Vit C", emoji: "",
        category: "vitaminas", price: 0.30, code: "9900003001",
        color: "#FFF7ED", accent: "#C2410C", stock: 100, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",     precio: 0.30 },
          { id: "blister", label: "Blíster x10", precio: 3.00 },
          { id: "frasco",  label: "Frasco x100", precio: 25.00,
            precios: [
              { tipo: "Normal",  valor: 25.00 },
              { tipo: "Mayoreo", valor: 21.00 },
            ]
          },
        ],
      },
      {
        id: "FM21", name: "Vitamina D3 1000UI", short: "Vit D3", emoji: "",
        category: "vitaminas", price: 8.00, code: "9900003002",
        color: "#FEFCE8", accent: "#A16207", stock: 60, status: "normal",
        presentaciones: [
          { id: "frasco", label: "Frasco x30", precio: 8.00 },
        ],
      },
      {
        id: "FM22", name: "Complejo B", short: "Complejo B", emoji: "",
        category: "vitaminas", price: 6.00, code: "9900003003",
        color: "#F0FDF4", accent: "#166534", stock: 45, status: "low",
        presentaciones: [
          { id: "frasco", label: "Frasco x30", precio: 6.00 },
          { id: "unidad", label: "Unidad",     precio: 0.30 },
        ],
      },
      {
        id: "FM23", name: "Omega 3 1000mg", short: "Omega 3", emoji: "",
        category: "vitaminas", price: 12.00, code: "9900003004",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 38, status: "promo",
        presentaciones: [
          { id: "frasco", label: "Frasco x30", precio: 12.00,
            precios: [
              { tipo: "Normal",    valor: 12.00 },
              { tipo: "Promoción", valor: 9.90 },
            ]
          },
        ],
      },
      // ── TÓPICOS ──────────────────────────────────────────────────
      {
        id: "FM30", name: "Alcohol 70% 250ml", short: "Alcohol 250ml", emoji: "",
        category: "topicos", price: 4.50, code: "9900004001",
        color: "#F5F5F4", accent: "#57534E", stock: 30, status: "normal",
        presentaciones: [
          { id: "frasco250", label: "Frasco 250ml", precio: 4.50 },
          { id: "frasco1l",  label: "Frasco 1L",    precio: 14.00,
            precios: [
              { tipo: "Normal",  valor: 14.00 },
              { tipo: "Mayoreo", valor: 12.00 },
            ]
          },
        ],
      },
      {
        id: "FM31", name: "Agua Oxigenada 250ml", short: "Agua Ox.", emoji: "",
        category: "topicos", price: 3.00, code: "9900004002",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 25, status: "normal",
        presentaciones: [
          { id: "frasco250", label: "Frasco 250ml", precio: 3.00 },
        ],
      },
      {
        id: "FM32", name: "Betadine 30ml", short: "Betadine", emoji: "",
        category: "topicos", price: 7.50, code: "9900004003",
        color: "#FEF9C3", accent: "#92400E", stock: 20, status: "normal",
        presentaciones: [
          { id: "frasco30",  label: "Frasco 30ml",  precio: 7.50 },
          { id: "frasco120", label: "Frasco 120ml", precio: 22.00 },
        ],
      },
      {
        id: "FM33", name: "Gasas Estériles", short: "Gasas x10", emoji: "",
        category: "topicos", price: 2.00, code: "9900004004",
        color: "#F5F5F4", accent: "#57534E", stock: 30, status: "normal",
        presentaciones: [
          { id: "sobre",  label: "Sobre x10",  precio: 2.00 },
          { id: "caja50", label: "Caja x50",   precio: 8.50,
            precios: [
              { tipo: "Normal",  valor: 8.50 },
              { tipo: "Mayoreo", valor: 7.00 },
            ]
          },
        ],
      },
      {
        id: "FM34", name: "Vendas Elásticas 3\"", short: "Venda 3\"", emoji: "",
        category: "topicos", price: 3.50, code: "9900004005",
        color: "#F5F5F4", accent: "#57534E", stock: 15, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 3.50 },
        ],
      },
      // ── CUIDADO PERSONAL ─────────────────────────────────────────
      {
        id: "FM40", name: "Jabón Protex 110g", short: "Protex 110g", emoji: "",
        category: "cuidado", price: 3.50, code: "9900005001",
        color: "#FDF4FF", accent: "#7E22CE", stock: 40, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 3.50 },
        ],
      },
      {
        id: "FM41", name: "Shampoo H&S 200ml", short: "H&S 200ml", emoji: "",
        category: "cuidado", price: 12.00, code: "9900005002",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 20, status: "normal",
        presentaciones: [
          { id: "frasco200", label: "Frasco 200ml", precio: 12.00 },
          { id: "frasco400", label: "Frasco 400ml", precio: 20.00 },
        ],
      },
      {
        id: "FM42", name: "Colgate Triple Acción", short: "Colgate", emoji: "",
        category: "cuidado", price: 4.50, code: "9900005003",
        color: "#EFF6FF", accent: "#0369A1", stock: 30, status: "normal",
        presentaciones: [
          { id: "tubo75",  label: "Tubo 75ml",  precio: 4.50 },
          { id: "tubo150", label: "Tubo 150ml", precio: 7.50 },
        ],
      },
      // ── BEBÉS ────────────────────────────────────────────────────
      {
        id: "FM50", name: "Pañal Huggies RN", short: "Huggies RN", emoji: "",
        category: "bebes", price: 1.20, code: "9900006001",
        color: "#FDF4FF", accent: "#7E22CE", stock: 80, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",    precio: 1.20 },
          { id: "paquete", label: "Paquete x20", precio: 22.00,
            precios: [
              { tipo: "Normal",  valor: 22.00 },
              { tipo: "Mayoreo", valor: 19.00 },
            ]
          },
        ],
      },
      {
        id: "FM51", name: "Talco Johnson's 100g", short: "Talco J&J", emoji: "",
        category: "bebes", price: 8.00, code: "9900006002",
        color: "#F0FDF4", accent: "#166534", stock: 15, status: "normal",
        presentaciones: [
          { id: "frasco100", label: "Frasco 100g", precio: 8.00 },
        ],
      },
      // ── DISPOSITIVOS MÉDICOS ──────────────────────────────────────
      {
        id: "FM60", name: "Termómetro Digital", short: "Termómetro", emoji: "️",
        category: "dispositivos", price: 15.00, code: "9900007001",
        color: "#F0F9FF", accent: "#0C4A6E", stock: 8, status: "low",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 15.00 },
        ],
      },
      {
        id: "FM61", name: "Jeringa 5ml c/aguja", short: "Jeringa 5ml", emoji: "",
        category: "dispositivos", price: 0.50, code: "9900007002",
        color: "#EFF6FF", accent: "#1D4ED8", stock: 100, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",   precio: 0.50 },
          { id: "caja100", label: "Caja x100", precio: 38.00,
            precios: [
              { tipo: "Normal",  valor: 38.00 },
              { tipo: "Mayoreo", valor: 32.00 },
            ]
          },
        ],
      },
      {
        id: "FM62", name: "Guantes de Látex S", short: "Guantes S", emoji: "",
        category: "dispositivos", price: 0.80, code: "9900007003",
        color: "#F5F5F4", accent: "#57534E", stock: 50, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Par",      precio: 0.80 },
          { id: "caja100", label: "Caja x100", precio: 55.00,
            precios: [
              { tipo: "Normal",  valor: 55.00 },
              { tipo: "Mayoreo", valor: 48.00 },
            ]
          },
        ],
      },
    ],
  },

  zapateria: {
    label:             "Zapatería",
    description:       "Calzado · Tallas · Accesorios",
    defaultVisualMode: "visual",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",        label: "Todo"           },
      { id: "damas",      label: " Damas"        },
      { id: "caballeros", label: " Caballeros"   },
      { id: "ninos",      label: " Niños"        },
      { id: "accesorios", label: " Accesorios"   },
    ],
    catalog: [
      {
        id: "ZA01", name: "Zapatilla Damas", short: "Zapatilla D.",
        emoji: "", category: "damas",
        price: 65.00, code: "ZAP0001",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 65.00,
            precios: [
              { tipo: "Normal", valor: 65.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "ZA02", name: "Zapatilla Caballeros", short: "Zapatilla C.",
        emoji: "", category: "caballeros",
        price: 75.00, code: "ZAP0002",
        color: "#1f2937", accent: "#f9fafb",
        stock: 15, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 75.00,
            precios: [
              { tipo: "Normal", valor: 75.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "ZA03", name: "Zapatilla Niños", short: "Zapatilla N.",
        emoji: "", category: "ninos",
        price: 45.00, code: "ZAP0003",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 18, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 45.00,
            precios: [
              { tipo: "Normal", valor: 45.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "ZA04", name: "Sandalia Damas", short: "Sandalia",
        emoji: "", category: "damas",
        price: 50.00, code: "ZAP0004",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 12, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 50.00,
            precios: [
              { tipo: "Normal", valor: 50.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "ZA05", name: "Plantilla", short: "Plantilla",
        emoji: "", category: "accesorios",
        price: 8.00, code: "ZAP0005",
        color: "#F8FAFC", accent: "#475467",
        stock: 30, status: "normal",
      },
      {
        id: "ZA06", name: "Betún Negro", short: "Betún",
        emoji: "", category: "accesorios",
        price: 4.00, code: "ZAP0006",
        color: "#1f2937", accent: "#f9fafb",
        stock: 20, status: "normal",
      },
    ],
  },

  reparacion: {
    label:             "Reparación",
    description:       "Servicios · Presupuesto · Entrega",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",       label: "Todo"            },
      { id: "servicios", label: " Servicios"    },
      { id: "repuestos", label: " Repuestos"    },
      { id: "insumos",   label: " Insumos"      },
    ],
    catalog: [
      {
        id: "RP01", name: "Diagnóstico", short: "Diagnóstico",
        emoji: "", category: "servicios",
        price: 10.00, code: "REP0001",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 10.00,
            precios: [
              { tipo: "Normal", valor: 10.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "RP02", name: "Mano de Obra", short: "Mano de Obra",
        emoji: "", category: "servicios",
        price: 20.00, code: "REP0002",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 20.00,
            precios: [
              { tipo: "Normal", valor: 20.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "RP03", name: "Cambio de Pantalla", short: "Pantalla",
        emoji: "", category: "servicios",
        price: 80.00, code: "REP0003",
        color: "#1f2937", accent: "#f9fafb",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 80.00,
            precios: [
              { tipo: "Normal", valor: 80.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "RP04", name: "Cambio de Batería", short: "Batería",
        emoji: "", category: "servicios",
        price: 40.00, code: "REP0004",
        color: "#FEF9C3", accent: "#92400E",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 40.00,
            precios: [
              { tipo: "Normal", valor: 40.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "RP05", name: "Limpieza Interna", short: "Limpieza",
        emoji: "", category: "servicios",
        price: 25.00, code: "REP0005",
        color: "#F0FDF4", accent: "#166534",
        stock: 99, status: "normal",
      },
      {
        id: "RP06", name: "Repuesto Genérico", short: "Repuesto",
        emoji: "", category: "repuestos",
        price: 15.00, code: "REP0006",
        color: "#F8FAFC", accent: "#475467",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 15.00,
            precios: [
              { tipo: "Normal", valor: 15.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
    ],
  },

  celulares: {
    label:             "Celulares",
    description:       "Equipos · Accesorios · Suministros",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",        label: "Todo"             },
      { id: "equipos",    label: " Equipos"        },
      { id: "accesorios", label: " Accesorios"     },
      { id: "suministros",label: " Suministros"    },
      { id: "servicios",  label: " Servicios"      },
    ],
    catalog: [
      {
        id: "CE01", name: "Smartphone Básico", short: "Smartphone",
        emoji: "", category: "equipos",
        price: 350.00, code: "CEL0001",
        color: "#1f2937", accent: "#f9fafb",
        stock: 5, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 350.00,
            precios: [
              { tipo: "Normal", valor: 350.00 },
              { tipo: "Libre",  valor: 0.00   },
            ]
          },
        ],
      },
      {
        id: "CE02", name: "Audífonos Bluetooth", short: "Audífonos BT",
        emoji: "", category: "accesorios",
        price: 35.00, code: "CEL0002",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 15, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 35.00,
            precios: [
              { tipo: "Normal", valor: 35.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "CE03", name: "Audífonos con Cable", short: "Audífonos",
        emoji: "", category: "accesorios",
        price: 15.00, code: "CEL0003",
        color: "#F8FAFC", accent: "#475467",
        stock: 20, status: "normal",
      },
      {
        id: "CE04", name: "Case Protector", short: "Case",
        emoji: "", category: "accesorios",
        price: 12.00, code: "CEL0004",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 12.00,
            precios: [
              { tipo: "Normal", valor: 12.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "CE05", name: "Vidrio Templado", short: "Vidrio",
        emoji: "", category: "accesorios",
        price: 8.00, code: "CEL0005",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 40, status: "normal",
      },
      {
        id: "CE06", name: "Cargador USB-C", short: "Cargador",
        emoji: "", category: "suministros",
        price: 18.00, code: "CEL0006",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 25, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 18.00,
            precios: [
              { tipo: "Normal", valor: 18.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "CE07", name: "Cable USB-C 1m", short: "Cable USB-C",
        emoji: "", category: "suministros",
        price: 10.00, code: "CEL0007",
        color: "#F8FAFC", accent: "#475467",
        stock: 35, status: "normal",
      },
      {
        id: "CE08", name: "Power Bank 10000mAh", short: "Power Bank",
        emoji: "", category: "suministros",
        price: 55.00, code: "CEL0008",
        color: "#FEFCE8", accent: "#A16207",
        stock: 10, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad", precio: 55.00,
            precios: [
              { tipo: "Normal", valor: 55.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
      {
        id: "CE09", name: "Instalación de App", short: "Inst. App",
        emoji: "", category: "servicios",
        price: 5.00, code: "CEL0009",
        color: "#F0FDF4", accent: "#166534",
        stock: 99, status: "normal",
      },
      {
        id: "CE10", name: "Configuración de Equipo", short: "Configuración",
        emoji: "", category: "servicios",
        price: 15.00, code: "CEL0010",
        color: "#F0FDF4", accent: "#166534",
        stock: 99, status: "normal",
        presentaciones: [
          { id: "servicio", label: "Servicio", precio: 15.00,
            precios: [
              { tipo: "Normal", valor: 15.00 },
              { tipo: "Libre",  valor: 0.00  },
            ]
          },
        ],
      },
    ],
  },
};
