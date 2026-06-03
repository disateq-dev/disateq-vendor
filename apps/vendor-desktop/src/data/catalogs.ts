export type Rubro = "abarrotes" | "food-fast" | "panaderia" | "farmacia";

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

export type VisualMode = "lista" | "visual" | "mixto";

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
  abarrotes: {
    label:             "Abarrotes",
    description:       "Scanner · Lista · Velocidad extrema",
    defaultVisualMode: "lista",
    defaultPrintFlow:  "solo-comprobante",
    categories: [
      { id: "all",       label: "Todo"          },
      { id: "lacteos",   label: "🥛 Lácteos"    },
      { id: "abarrotes", label: "🛒 Abarrotes"  },
      { id: "bebidas",   label: "🥤 Bebidas"    },
    ],
    catalog: [
      { id: "AB01", name: "Leche Gloria 400g",   short: "Gloria 400g",  emoji: "🥛", category: "lacteos",   price:  3.50, code: "7750025000001", color: "#F0F9FF", accent: "#0369A1", stock:  80, status: "normal" },
      { id: "AB02", name: "Leche Gloria 1L",     short: "Gloria 1L",    emoji: "🥛", category: "lacteos",   price:  5.20, code: "7750025000002", color: "#E0F2FE", accent: "#0369A1", stock:  60, status: "normal" },
      { id: "AB03", name: "Yogurt Tigo 200g",    short: "Yogurt 200g",  emoji: "🫙", category: "lacteos",   price:  1.80, code: "7750025000003", color: "#FDF4FF", accent: "#7E22CE", stock:  40, status: "normal" },
      { id: "AB04", name: "Arroz Extra 1kg",     short: "Arroz 1kg",    emoji: "🌾", category: "abarrotes", price:  3.80, code: "7750025000010", color: "#FEFCE8", accent: "#A16207", stock: 120, status: "normal" },
      { id: "AB05", name: "Azúcar 1kg",          short: "Azúcar 1kg",   emoji: "🍬", category: "abarrotes", price:  3.20, code: "7750025000011", color: "#FFFBEB", accent: "#B45309", stock:  90, status: "normal" },
      { id: "AB06", name: "Aceite Primor 1L",    short: "Primor 1L",    emoji: "🫙", category: "abarrotes", price:  8.50, code: "7750025000012", color: "#FFF7ED", accent: "#C2410C", stock:  35, status: "normal" },
      { id: "AB07", name: "Fideos Don Vittorio", short: "Fideos 500g",  emoji: "🍝", category: "abarrotes", price:  2.50, code: "7750025000013", color: "#FEF9C3", accent: "#92400E", stock:  55, status: "normal" },
      { id: "AB08", name: "Sal 1kg",             short: "Sal 1kg",      emoji: "🧂", category: "abarrotes", price:  1.20, code: "7750025000014", color: "#F8FAFC", accent: "#475467", stock:  70, status: "normal" },
      { id: "AB09", name: "Inca Kola 1.5L",      short: "Inca 1.5L",    emoji: "🥤", category: "bebidas",   price:  5.50, code: "7750025000020", color: "#FEFCE8", accent: "#A16207", stock:  48, status: "normal" },
      { id: "AB10", name: "Coca-Cola 1.5L",      short: "Coca 1.5L",    emoji: "🥤", category: "bebidas",   price:  5.50, code: "7750025000021", color: "#FEE2E2", accent: "#991B1B", stock:  36, status: "normal" },
      { id: "AB11", name: "Agua San Luis 625ml", short: "Agua 625ml",   emoji: "💧", category: "bebidas",   price:  1.50, code: "7750025000022", color: "#EFF6FF", accent: "#1D4ED8", stock:  60, status: "normal" },
      { id: "AB12", name: "Cifrut Naranja 500ml", short: "Cifrut 500ml", emoji: "🍊", category: "bebidas",  price:  2.00, code: "7750025000023", color: "#FFF7ED", accent: "#C2410C", stock:   5, status: "low"      },
      { id: "AB13", name: "Mortadela San Fernando 100g", short: "Mortadela 100g", emoji: "🥩", category: "abarrotes", price: 3.90, code: "7750025000031", color: "#FEE2E2", accent: "#991B1B", stock:  6, status: "expiring" },
      { id: "AB14", name: "Atún Florida 170g",           short: "Atún 170g",      emoji: "🐟", category: "abarrotes", price: 4.20, code: "7750025000032", color: "#F0F9FF", accent: "#0369A1", stock:  0, status: "out"      },
      { id: "AB15", name: "Yogurt Tigo x6 Unid.",        short: "Yogurt x6",      emoji: "🫙", category: "lacteos",   price: 9.50, code: "7750025000033", color: "#FDF4FF", accent: "#7E22CE", stock: 24, status: "promo"    },
      { id: "AB16", name: "Leche UHT Laive 200ml",       short: "UHT 200ml",      emoji: "🥛", category: "lacteos",   price: 1.90, code: "7750025000034", color: "#E0F2FE", accent: "#0369A1", stock:  9, status: "expiring" },
      { id: "AB17", name: "Harina Blanca Flor 1kg",      short: "Harina 1kg",     emoji: "🌾", category: "abarrotes", price: 3.50, code: "7750025000035", color: "#FEFCE8", accent: "#A16207", stock:  0, status: "out"      },
    ],
  },

  "food-fast": {
    label:             "Food Fast",
    description:       "Visual · Touch · Notas · Despacho",
    defaultVisualMode: "visual",
    defaultPrintFlow:  "comprobante-despacho",
    categories: [
      { id: "all",     label: "Todo"          },
      { id: "comidas", label: "🍔 Comidas"    },
      { id: "bebidas", label: "🥤 Bebidas"    },
      { id: "snacks",  label: "🍟 Snacks"     },
    ],
    catalog: [
      { id: "FF01", name: "Hamburguesa Clásica",  short: "Classic",    emoji: "🍔", category: "comidas", price: 12.00, code: "8800001001", color: "#FFF7ED", accent: "#C2410C", stock: 30, status: "normal" },
      { id: "FF02", name: "Hamburguesa Doble",    short: "Doble",      emoji: "🍔", category: "comidas", price: 16.00, code: "8800001002", color: "#FEF3C7", accent: "#B45309", stock: 20, status: "normal" },
      { id: "FF03", name: "Hamburguesa Especial", short: "Especial",   emoji: "🍔", category: "comidas", price: 18.00, code: "8800001003", color: "#FEF9C3", accent: "#92400E", stock: 15, status: "promo"  },
      { id: "FF04", name: "Yuca Frita",           short: "Yuca Frita", emoji: "🫚", category: "comidas", price:  5.50, code: "8800001004", color: "#FFF7ED", accent: "#C2410C", stock:  3, status: "low"    },
      { id: "FF05", name: "Coca-Cola 500ml",      short: "Coca 500ml", emoji: "🥤", category: "bebidas", price:  4.50, code: "8800001020", color: "#FEE2E2", accent: "#991B1B", stock: 40, status: "normal" },
      { id: "FF06", name: "Inca Kola 500ml",      short: "Inca 500ml", emoji: "🥤", category: "bebidas", price:  4.50, code: "8800001021", color: "#FEFCE8", accent: "#A16207", stock: 40, status: "normal" },
      { id: "FF07", name: "Agua 600ml",           short: "Agua 600ml", emoji: "💧", category: "bebidas", price:  2.00, code: "8800001022", color: "#EFF6FF", accent: "#1D4ED8", stock: 30, status: "normal" },
      { id: "FF08", name: "Jugo Natural",         short: "Jugo",       emoji: "🍊", category: "bebidas", price:  5.00, code: "8800001023", color: "#FFF7ED", accent: "#C2410C", stock: 20, status: "normal" },
      { id: "FF09", name: "Papas Fritas Chica",   short: "Papas Ch",   emoji: "🍟", category: "snacks",  price:  5.00, code: "8800001030", color: "#FEFCE8", accent: "#A16207", stock: 50, status: "normal" },
      { id: "FF10", name: "Papas Fritas Grande",  short: "Papas Gd",   emoji: "🍟", category: "snacks",  price:  7.00, code: "8800001031", color: "#FEF9C3", accent: "#B45309", stock: 50, status: "normal" },
      { id: "FF11", name: "Nuggets 6pzs",         short: "Nuggets",    emoji: "🍗", category: "snacks",  price:  8.00, code: "8800001032", color: "#FEF3C7", accent: "#B45309", stock: 25, status: "normal" },
      { id: "FF12", name: "Tequeños 4pzs",        short: "Tequeños",    emoji: "🧀", category: "snacks",  price:  6.00, code: "8800001033", color: "#FFFBEB", accent: "#B45309", stock: 18, status: "normal"   },
      { id: "FF13", name: "Wrap de Pollo",        short: "Wrap Pollo",  emoji: "🌯", category: "comidas", price: 10.00, code: "8800001005", color: "#ECFDF5", accent: "#065F46", stock:  0, status: "out"      },
      { id: "FF14", name: "Combo Burger + Papas", short: "Combo Burger",emoji: "🍔", category: "comidas", price: 18.00, code: "8800001006", color: "#FEF3C7", accent: "#B45309", stock: 12, status: "promo"    },
      { id: "FF15", name: "Ensalada César",       short: "Ensalada",    emoji: "🥗", category: "comidas", price:  9.00, code: "8800001007", color: "#F0FDF4", accent: "#166534", stock:  2, status: "expiring" },
      { id: "FF16", name: "Chicha Morada 500ml",  short: "Chicha 500ml",emoji: "🫙", category: "bebidas", price:  4.00, code: "8800001024", color: "#FDF4FF", accent: "#7E22CE", stock:  0, status: "out"      },
    ],
  },

  panaderia: {
    label:             "Panadería",
    description:       "Visual híbrido · Notas · Ticket despacho",
    defaultVisualMode: "visual",
    defaultPrintFlow:  "comprobante-despacho",
    categories: [
      { id: "all",     label: "Todo"         },
      { id: "panes",   label: "🥖 Panes"     },
      { id: "bebidas", label: "☕ Bebidas"   },
      { id: "otros",   label: "🧀 Otros"     },
    ],
    catalog: [
      { id: "PN01", name: "Pan Francés",    short: "Pan Francés",    emoji: "🥖", category: "panes",   price:  0.20, code: "7800000001", color: "#FEF3C7", accent: "#B45309", stock: 200, status: "normal" },
      { id: "PN02", name: "Pan Yema",       short: "Pan Yema",       emoji: "🍞", category: "panes",   price:  0.50, code: "7800000002", color: "#FEF9C3", accent: "#92400E", stock: 100, status: "normal" },
      { id: "PN03", name: "Pan Colisa",     short: "Pan Colisa",     emoji: "🥐", category: "panes",   price:  0.30, code: "7800000003", color: "#FFF7ED", accent: "#C2410C", stock:  80, status: "normal" },
      { id: "PN04", name: "Pan Ciabatta",   short: "Pan Ciabatta",   emoji: "🫓", category: "panes",   price:  1.50, code: "7800000004", color: "#FFFBEB", accent: "#B45309", stock:  30, status: "normal" },
      { id: "PN05", name: "Pan Integral",   short: "Pan Integral",   emoji: "🍞", category: "panes",   price:  1.00, code: "7800000005", color: "#ECFDF5", accent: "#065F46", stock:  40, status: "normal" },
      { id: "PN06", name: "Pan Chapla",     short: "Pan Chapla",     emoji: "🫓", category: "panes",   price:  0.50, code: "7800000006", color: "#FEF3C7", accent: "#B45309", stock:  60, status: "normal" },
      { id: "PN07", name: "Pan Caracol",    short: "Pan Caracol",    emoji: "🍞", category: "panes",   price:  0.80, code: "7800000007", color: "#FFF7ED", accent: "#C2410C", stock:  45, status: "promo"  },
      { id: "PN08", name: "Pan Cachito",    short: "Pan Cachito",    emoji: "🥐", category: "panes",   price:  1.00, code: "7800000008", color: "#FEF3C7", accent: "#92400E", stock:   3, status: "low"    },
      { id: "BE01", name: "Café",           short: "Café",           emoji: "☕", category: "bebidas", price:  1.50, code: "7800000011", color: "#FEF3C7", accent: "#78350F", stock:  50, status: "normal" },
      { id: "BE02", name: "Café con Leche", short: "Café con Leche", emoji: "☕", category: "bebidas", price:  2.00, code: "7800000012", color: "#FFF7ED", accent: "#92400E", stock:  50, status: "normal" },
      { id: "BE03", name: "Leche",          short: "Leche",          emoji: "🥛", category: "bebidas", price:  2.00, code: "7800000013", color: "#F0F9FF", accent: "#0369A1", stock:  30, status: "normal" },
      { id: "BE04", name: "Eco",            short: "Eco",            emoji: "☕", category: "bebidas", price:  1.00, code: "7800000014", color: "#F5F5F4", accent: "#57534E", stock:  40, status: "normal" },
      { id: "BE05", name: "Cocoa",          short: "Cocoa",          emoji: "🍫", category: "bebidas", price:  1.50, code: "7800000015", color: "#FDF2F8", accent: "#9D174D", stock:  35, status: "normal" },
      { id: "BE06", name: "Anís",           short: "Anís",           emoji: "🌿", category: "bebidas", price:  1.00, code: "7800000016", color: "#ECFDF5", accent: "#065F46", stock:  20, status: "normal" },
      { id: "BE07", name: "Emoliente",      short: "Emoliente",      emoji: "🫖", category: "bebidas", price:  1.50, code: "7800000017", color: "#F0FDF4", accent: "#166534", stock:  15, status: "normal" },
      { id: "OT01", name: "Jamón",          short: "Jamón 100g",     emoji: "🥩", category: "otros",   price:  5.00, code: "7800000021", color: "#FEE2E2", accent: "#991B1B", stock:  20, status: "normal" },
      { id: "OT02", name: "Queso",          short: "Queso 100g",     emoji: "🧀", category: "otros",   price:  4.50, code: "7800000022", color: "#FFFBEB", accent: "#B45309", stock:  15, status: "normal" },
      { id: "OT03", name: "Mantequilla",    short: "Mantequilla",    emoji: "🧈", category: "otros",   price:  1.50, code: "7800000023", color: "#FEFCE8", accent: "#A16207", stock:  25, status: "normal" },
      { id: "OT04", name: "Huevo",                short: "Huevo c/u",       emoji: "🥚", category: "otros",   price:  0.80, code: "7800000024", color: "#FEF9C3", accent: "#92400E", stock: 50, status: "normal"   },
      { id: "PN09", name: "Torta Tres Leches",    short: "Tres Leches",     emoji: "🎂", category: "otros",   price:  8.00, code: "7800000025", color: "#FDF2F8", accent: "#9D174D", stock:  0, status: "out"      },
      { id: "PN10", name: "Pan de Molde 500g",    short: "Pan Molde",       emoji: "🍞", category: "panes",   price:  4.50, code: "7800000009", color: "#FEF3C7", accent: "#B45309", stock:  4, status: "expiring" },
      { id: "PN11", name: "Empanada de Carne",    short: "Empanada",        emoji: "🥟", category: "otros",   price:  2.50, code: "7800000026", color: "#FFF7ED", accent: "#C2410C", stock: 18, status: "promo"    },
      { id: "BE08", name: "Manzanilla",           short: "Manzanilla",      emoji: "🌸", category: "bebidas", price:  1.00, code: "7800000018", color: "#F0FDF4", accent: "#166534", stock:  5, status: "expiring" },
      { id: "OT05", name: "Crema de Leche 200ml", short: "Crema Leche",     emoji: "🧴", category: "otros",   price:  3.20, code: "7800000027", color: "#E0F2FE", accent: "#0369A1", stock:  0, status: "out"      },
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
};
