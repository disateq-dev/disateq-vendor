export interface LineaPreVenta {
  lineaId:       string;
  hovId:         string;
  descripcion:   string;
  codigoBarras?: string;
  nota?:         string;
  cantidad:      number;
  valorUnitario: number;
  subtotal:      number;
  presentacion?: string;   // "Blíster", "Caja x10", "1/4 Pollo"
  tipoPrecio?:   string;   // "Normal", "Mayoreo", "Promoción", "Libre"
  flags?: {
    esPrecioManual?: boolean;
    esRecuperada?:   boolean;
  };
}
