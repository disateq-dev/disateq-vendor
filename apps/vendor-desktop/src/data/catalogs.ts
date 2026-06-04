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
    catalog: [
      // ── LÁCTEOS ──────────────────────────────────────────────────
      {
        id: "AB01", name: "Leche Gloria 400g", short: "Gloria 400g",
        emoji: "", category: "lacteos",
        price: 3.50, code: "7750025000001",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 80, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 3.50 },
          { id: "caja24", label: "Caja x24", precio: 75.00,
            precios: [
              { tipo: "Normal",  valor: 75.00 },
              { tipo: "Mayoreo", valor: 68.00 },
            ]
          },
        ],
      },
      {
        id: "AB02", name: "Leche Gloria 1L", short: "Gloria 1L",
        emoji: "", category: "lacteos",
        price: 5.20, code: "7750025000002",
        color: "#E0F2FE", accent: "#0369A1",
        stock: 60, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 5.20 },
          { id: "caja12", label: "Caja x12", precio: 57.00,
            precios: [
              { tipo: "Normal",  valor: 57.00 },
              { tipo: "Mayoreo", valor: 52.00 },
            ]
          },
        ],
      },
      {
        id: "AB03", name: "Yogurt Tigo 200g", short: "Yogurt 200g",
        emoji: "", category: "lacteos",
        price: 1.80, code: "7750025000003",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 40, status: "normal",
      },
      {
        id: "AB04", name: "Yogurt Tigo x6", short: "Yogurt x6",
        emoji: "", category: "lacteos",
        price: 9.50, code: "7750025000004",
        color: "#FDF4FF", accent: "#7E22CE",
        stock: 24, status: "promo",
        presentaciones: [
          { id: "pack", label: "Pack x6", precio: 9.50,
            precios: [
              { tipo: "Normal",    valor: 9.50 },
              { tipo: "Promoción", valor: 8.50 },
            ]
          },
        ],
      },
      {
        id: "AB05", name: "Leche UHT Laive 200ml", short: "UHT Laive",
        emoji: "", category: "lacteos",
        price: 1.90, code: "7750025000005",
        color: "#E0F2FE", accent: "#0369A1",
        stock: 9, status: "expiring",
      },
      // ── DESPENSA ─────────────────────────────────────────────────
      {
        id: "AB10", name: "Arroz Extra 1kg", short: "Arroz 1kg",
        emoji: "", category: "despensa",
        price: 3.80, code: "7750025000010",
        color: "#FEFCE8", accent: "#A16207",
        stock: 120, status: "normal",
        presentaciones: [
          { id: "kg1",   label: "1 kg",    precio: 3.80 },
          { id: "saco5", label: "Saco 5kg", precio: 17.00,
            precios: [
              { tipo: "Normal",  valor: 17.00 },
              { tipo: "Mayoreo", valor: 15.50 },
            ]
          },
        ],
      },
      {
        id: "AB11", name: "Azúcar 1kg", short: "Azúcar 1kg",
        emoji: "", category: "despensa",
        price: 3.20, code: "7750025000011",
        color: "#FFFBEB", accent: "#B45309",
        stock: 90, status: "normal",
        presentaciones: [
          { id: "kg1",   label: "1 kg",    precio: 3.20 },
          { id: "saco5", label: "Saco 5kg", precio: 14.50,
            precios: [
              { tipo: "Normal",  valor: 14.50 },
              { tipo: "Mayoreo", valor: 13.00 },
            ]
          },
        ],
      },
      {
        id: "AB12", name: "Aceite Primor 1L", short: "Primor 1L",
        emoji: "", category: "despensa",
        price: 8.50, code: "7750025000012",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 35, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 8.50 },
          { id: "caja12", label: "Caja x12", precio: 92.00,
            precios: [
              { tipo: "Normal",  valor: 92.00 },
              { tipo: "Mayoreo", valor: 85.00 },
            ]
          },
        ],
      },
      {
        id: "AB13", name: "Fideos Don Vittorio 500g", short: "Fideos 500g",
        emoji: "", category: "despensa",
        price: 2.50, code: "7750025000013",
        color: "#FEF9C3", accent: "#92400E",
        stock: 55, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",   precio: 2.50 },
          { id: "paquete", label: "Paquete x12", precio: 27.00,
            precios: [
              { tipo: "Normal",  valor: 27.00 },
              { tipo: "Mayoreo", valor: 24.00 },
            ]
          },
        ],
      },
      {
        id: "AB14", name: "Sal 1kg", short: "Sal 1kg",
        emoji: "", category: "despensa",
        price: 1.20, code: "7750025000014",
        color: "#F8FAFC", accent: "#475467",
        stock: 70, status: "normal",
      },
      {
        id: "AB15", name: "Harina Blanca Flor 1kg", short: "Harina 1kg",
        emoji: "", category: "despensa",
        price: 3.50, code: "7750025000015",
        color: "#FEFCE8", accent: "#A16207",
        stock: 0, status: "out",
      },
      {
        id: "AB16", name: "Atún Florida 170g", short: "Atún 170g",
        emoji: "", category: "despensa",
        price: 4.20, code: "7750025000016",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 0, status: "out",
        presentaciones: [
          { id: "unidad",  label: "Unidad",   precio: 4.20 },
          { id: "caja48",  label: "Caja x48", precio: 175.00,
            precios: [
              { tipo: "Normal",  valor: 175.00 },
              { tipo: "Mayoreo", valor: 160.00 },
            ]
          },
        ],
      },
      {
        id: "AB17", name: "Mortadela San Fernando 100g", short: "Mortadela",
        emoji: "", category: "despensa",
        price: 3.90, code: "7750025000017",
        color: "#FEE2E2", accent: "#991B1B",
        stock: 6, status: "expiring",
      },
      // ── BEBIDAS ───────────────────────────────────────────────────
      {
        id: "AB20", name: "Inca Kola 1.5L", short: "Inca 1.5L",
        emoji: "", category: "bebidas",
        price: 5.50, code: "7750025000020",
        color: "#FEFCE8", accent: "#A16207",
        stock: 48, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 5.50 },
          { id: "paquete", label: "Paquete x6", precio: 30.00,
            precios: [
              { tipo: "Normal",  valor: 30.00 },
              { tipo: "Mayoreo", valor: 27.00 },
            ]
          },
        ],
      },
      {
        id: "AB21", name: "Coca-Cola 1.5L", short: "Coca 1.5L",
        emoji: "", category: "bebidas",
        price: 5.50, code: "7750025000021",
        color: "#FEE2E2", accent: "#991B1B",
        stock: 36, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",    precio: 5.50 },
          { id: "paquete", label: "Paquete x6", precio: 30.00,
            precios: [
              { tipo: "Normal",  valor: 30.00 },
              { tipo: "Mayoreo", valor: 27.00 },
            ]
          },
        ],
      },
      {
        id: "AB22", name: "Agua San Luis 625ml", short: "Agua 625ml",
        emoji: "", category: "bebidas",
        price: 1.50, code: "7750025000022",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 60, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",    precio: 1.50 },
          { id: "paquete", label: "Paquete x12", precio: 15.00,
            precios: [
              { tipo: "Normal",  valor: 15.00 },
              { tipo: "Mayoreo", valor: 13.00 },
            ]
          },
        ],
      },
      {
        id: "AB23", name: "Cifrut Naranja 500ml", short: "Cifrut 500ml",
        emoji: "", category: "bebidas",
        price: 2.00, code: "7750025000023",
        color: "#FFF7ED", accent: "#C2410C",
        stock: 5, status: "low",
      },
      // ── LIMPIEZA ──────────────────────────────────────────────────
      {
        id: "AB30", name: "Detergente Ariel 360g", short: "Ariel 360g",
        emoji: "", category: "limpieza",
        price: 6.50, code: "7750025000030",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 30, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 6.50 },
          { id: "caja10", label: "Caja x10", precio: 58.00,
            precios: [
              { tipo: "Normal",  valor: 58.00 },
              { tipo: "Mayoreo", valor: 52.00 },
            ]
          },
        ],
      },
      {
        id: "AB31", name: "Lejía Clorox 1L", short: "Clorox 1L",
        emoji: "", category: "limpieza",
        price: 4.00, code: "7750025000031",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 25, status: "normal",
        presentaciones: [
          { id: "unidad", label: "Unidad",   precio: 4.00 },
          { id: "caja12", label: "Caja x12", precio: 42.00,
            precios: [
              { tipo: "Normal",  valor: 42.00 },
              { tipo: "Mayoreo", valor: 37.00 },
            ]
          },
        ],
      },
      {
        id: "AB32", name: "Jabón Bolivar 200g", short: "Bolivar 200g",
        emoji: "", category: "limpieza",
        price: 2.50, code: "7750025000032",
        color: "#F0F9FF", accent: "#0369A1",
        stock: 48, status: "normal",
        presentaciones: [
          { id: "unidad",  label: "Unidad",   precio: 2.50 },
          { id: "paquete", label: "Paquete x12", precio: 26.00,
            precios: [
              { tipo: "Normal",  valor: 26.00 },
              { tipo: "Mayoreo", valor: 23.00 },
            ]
          },
        ],
      },
      {
        id: "AB33", name: "Papel Higiénico Elite x4", short: "Elite x4",
        emoji: "", category: "limpieza",
        price: 4.50, code: "7750025000033",
        color: "#F8FAFC", accent: "#475467",
        stock: 20, status: "normal",
        presentaciones: [
          { id: "paquete4",  label: "Paquete x4",  precio: 4.50 },
          { id: "paquete12", label: "Paquete x12", precio: 12.00,
            precios: [
              { tipo: "Normal",  valor: 12.00 },
              { tipo: "Mayoreo", valor: 10.50 },
            ]
          },
        ],
      },
      // ── SNACKS ────────────────────────────────────────────────────
      {
        id: "AB40", name: "Galletas Oreo 117g", short: "Oreo 117g",
        emoji: "", category: "snacks",
        price: 3.50, code: "7750025000040",
        color: "#1f2937", accent: "#f9fafb",
        stock: 30, status: "normal",
      },
      {
        id: "AB41", name: "Chifles Frito Lay 80g", short: "Chifles 80g",
        emoji: "", category: "snacks",
        price: 2.50, code: "7750025000041",
        color: "#FEF9C3", accent: "#92400E",
        stock: 20, status: "normal",
      },
      {
        id: "AB42", name: "Caramelos Halls", short: "Halls",
        emoji: "", category: "snacks",
        price: 0.50, code: "7750025000042",
        color: "#EFF6FF", accent: "#1D4ED8",
        stock: 80, status: "normal",
      },
      {
        id: "AB43", name: "Galleta Soda 6pack", short: "Soda x6",
        emoji: "", category: "snacks",
        price: 1.50, code: "7750025000043",
        color: "#FEF9C3", accent: "#92400E",
        stock: 40, status: "normal",
        presentaciones: [
          { id: "paquete",  label: "Paquete x6",  precio: 1.50 },
          { id: "caja24",   label: "Caja x24",    precio: 32.00,
            precios: [
              { tipo: "Normal",  valor: 32.00 },
              { tipo: "Mayoreo", valor: 28.00 },
            ]
          },
        ],
      },
    ],
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
};
