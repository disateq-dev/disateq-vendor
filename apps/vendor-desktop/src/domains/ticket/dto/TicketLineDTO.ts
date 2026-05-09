export interface TicketLineDTO {
  lineId: string;
  productId: string;

  description: string;
  barcode?: string;

  quantity: number;
  unitPrice: number;

  subtotal: number;

  flags?: {
    isManualPrice?: boolean;
    isRecovered?: boolean;
  };
}