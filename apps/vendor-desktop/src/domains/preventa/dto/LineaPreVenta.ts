export interface LineaPreVenta {
  lineId:        string;
  productId:     string;
  description:   string;
  barcode?:      string;
  note?:         string;
  quantity:      number;
  unitPrice:     number;
  subtotal:      number;
  presentacion?: string;   // "Blíster", "Caja x10", "1/4 Pollo"
  tipoPrecio?:   string;   // "Normal", "Mayoreo", "Promoción", "Libre"
  flags?: {
    isManualPrice?: boolean;
    isRecovered?:   boolean;
  };
}
