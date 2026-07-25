import type { TipoValorOperacional } from '../../catalog/valor-operacional.types'

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
  tipoPrecio?:   TipoValorOperacional;
  flags?: {
    esPrecioManual?: boolean;
    esRecuperada?:   boolean;
    requirioReceta?: boolean;
  };
}
