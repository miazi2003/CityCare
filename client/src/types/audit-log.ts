import type { IsoDateTime, JsonValue } from "./api";
import type { User } from "./auth";

export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  metadata: JsonValue | null;
  createdAt: IsoDateTime;
  user: User;
};

export type AuditLogFilters = {
  userId?: string;
  entity?: string;
  action?: string;
  entityId?: string;
};
