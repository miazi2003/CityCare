import type { DecimalString, IsoDateTime } from "./api";
import type { UserIdentity } from "./auth";
import type { Payment } from "./payment";
import type { MunicipalServiceReference } from "./service";

export type ServiceRequestStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type ServiceRequest = {
  id: string;
  serviceId: string;
  citizenId: string;
  location: string;
  quantity: number;
  notes: string | null;
  amount: DecimalString;
  status: ServiceRequestStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  service: MunicipalServiceReference;
  citizen?: UserIdentity;
  payment?: Payment | null;
};

export type CreateServiceRequestInput = {
  serviceId: string;
  location: string;
  quantity: number;
  notes?: string;
};

export type UpdateServiceRequestStatusInput = {
  status: "PROCESSING" | "COMPLETED" | "CANCELLED";
};
