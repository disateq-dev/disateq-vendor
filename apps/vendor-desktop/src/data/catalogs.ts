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
    catalog: [],
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
    catalog: [],
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
    catalog: [],
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
    catalog: [],
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
    catalog: [],
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
    catalog: [],
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
    catalog: [],
  },
};
