import type { DecimalString, IsoDateTime } from "./api";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type Payment = {
  id: string;
  amount: DecimalString;
  currency: string;
  provider: string;
  transactionId: string | null;
  status: PaymentStatus;
  createdAt: IsoDateTime;
};

export type PaymentSession = {
  checkoutUrl: string;
  sessionId: string;
};
