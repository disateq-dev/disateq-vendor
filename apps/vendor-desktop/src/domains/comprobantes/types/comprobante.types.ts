export type ComprobanteStatus = "active" | "cancelled";

export type ComprobanteLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
};

export type Comprobante = {
  id: string;
  sessionKey: string;
  docType: string;
  docSeries: string;
  docCorrelative: number;
  dateTime: string;
  operator: string;
  cashBoxCode: string;
  terminal: string;
  lines: ComprobanteLineItem[];
  discountAmount: number;
  grossTotal: number;
  netTotal: number;
  payMethod: string;
  cashComponent: number;
  yapeComponent: number;
  tarjetaComponent: number;
  customer?: { docNumber: string; name: string };
  status: ComprobanteStatus;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledMotivo?: string;
};
