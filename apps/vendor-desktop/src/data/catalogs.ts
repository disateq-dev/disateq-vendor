export type Rubro = "abarrotes" | "food-fast" | "panaderia" | "farmacia";

export type StockStatus = "normal" | "low" | "out" | "promo" | "expiring";

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
}

export interface RubroConfig {
  label:           string;
  description:     string;
  defaultViewMode: "dense" | "visual";
  hasDispatch:     boolean;
  categories:      { id: string; label: string }[];
  catalog:         CatalogProduct[];
}

export const RUBROS: Record<Rubro, RubroConfig> = {
  abarrotes: {
    label:           "Abarrotes",
    description:     "Scanner · Lista · Velocidad extrema",
    defaultViewMode: "dense",
    hasDispatch:     false,
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
      { id: "AB12", name: "Cifrut Naranja 500ml", short: "Cifrut 500ml", emoji: "🍊", category: "bebidas",  price:  2.00, code: "7750025000023", color: "#FFF7ED", accent: "#C2410C", stock:   5, status: "low"    },
    ],
  },

  "food-fast": {
    label:           "Food Fast",
    description:     "Visual · Touch · Notas · Despacho",
    defaultViewMode: "visual",
    hasDispatch:     true,
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
      { id: "FF12", name: "Tequeños 4pzs",        short: "Tequeños",   emoji: "🧀", category: "snacks",  price:  6.00, code: "8800001033", color: "#FFFBEB", accent: "#B45309", stock: 18, status: "normal" },
    ],
  },

  panaderia: {
    label:           "Panadería",
    description:     "Visual híbrido · Notas · Ticket despacho",
    defaultViewMode: "visual",
    hasDispatch:     true,
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
      { id: "OT04", name: "Huevo",          short: "Huevo c/u",      emoji: "🥚", category: "otros",   price:  0.80, code: "7800000024", color: "#FEF9C3", accent: "#92400E", stock:  50, status: "normal" },
    ],
  },

  farmacia: {
    label:           "Farmacia",
    description:     "Control lotes · Vencimientos · Trazabilidad",
    defaultViewMode: "dense",
    hasDispatch:     false,
    categories: [
      { id: "all",         label: "Todo"            },
      { id: "analgesicos", label: "💊 Analgésicos"  },
      { id: "vitaminas",   label: "🌿 Vitaminas"    },
      { id: "topicos",     label: "🩹 Tópicos"      },
    ],
    catalog: [
      { id: "FM01", name: "Paracetamol 500mg x10",  short: "Paracetamol x10", emoji: "💊", category: "analgesicos", price:  1.50, code: "9900001001", color: "#EFF6FF", accent: "#1D4ED8", stock: 200, status: "normal" },
      { id: "FM02", name: "Ibuprofeno 400mg x10",   short: "Ibuprofeno x10",  emoji: "💊", category: "analgesicos", price:  2.50, code: "9900001002", color: "#F0F9FF", accent: "#0369A1", stock: 150, status: "normal" },
      { id: "FM03", name: "Aspirina 100mg x20",     short: "Aspirina x20",    emoji: "💊", category: "analgesicos", price:  3.00, code: "9900001003", color: "#EFF6FF", accent: "#1E40AF", stock:  80, status: "normal" },
      { id: "FM04", name: "Naproxeno 250mg x10",    short: "Naproxeno x10",   emoji: "💊", category: "analgesicos", price:  4.00, code: "9900001004", color: "#F0F9FF", accent: "#0C4A6E", stock:  40, status: "normal" },
      { id: "FM05", name: "Vitamina C 500mg x10",   short: "Vit C x10",       emoji: "🌿", category: "vitaminas",   price:  3.50, code: "9900001010", color: "#FFF7ED", accent: "#C2410C", stock: 100, status: "normal" },
      { id: "FM06", name: "Vitamina D3 1000UI x30", short: "Vit D3 x30",      emoji: "🌿", category: "vitaminas",   price:  8.00, code: "9900001011", color: "#FEFCE8", accent: "#A16207", stock:  60, status: "normal" },
      { id: "FM07", name: "Zinc 10mg x30",          short: "Zinc x30",        emoji: "🌿", category: "vitaminas",   price:  5.50, code: "9900001012", color: "#F0FDF4", accent: "#166534", stock:  45, status: "normal" },
      { id: "FM08", name: "Complejo B x30",         short: "Complejo B x30",  emoji: "🌿", category: "vitaminas",   price:  6.00, code: "9900001013", color: "#ECFDF5", accent: "#065F46", stock:   8, status: "low"    },
      { id: "FM09", name: "Alcohol 70% 250ml",      short: "Alcohol 250ml",   emoji: "🩹", category: "topicos",     price:  4.50, code: "9900001020", color: "#F5F5F4", accent: "#57534E", stock:  30, status: "normal" },
      { id: "FM10", name: "Agua Oxigenada 250ml",   short: "Agua Ox 250ml",   emoji: "🩹", category: "topicos",     price:  3.00, code: "9900001021", color: "#EFF6FF", accent: "#1D4ED8", stock:  25, status: "normal" },
      { id: "FM11", name: "Betadine 30ml",          short: "Betadine 30ml",   emoji: "🩹", category: "topicos",     price:  7.50, code: "9900001022", color: "#FEF9C3", accent: "#92400E", stock:  20, status: "normal" },
      { id: "FM12", name: "Termómetro Digital",     short: "Termómetro",      emoji: "🌡️", category: "topicos",     price: 15.00, code: "9900001023", color: "#F0F9FF", accent: "#0C4A6E", stock:   2, status: "low"    },
    ],
  },
};
