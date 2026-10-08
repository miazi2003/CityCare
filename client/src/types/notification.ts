import type { IsoDateTime } from "./api";
import type { User } from "./auth";

export type NotificationType =
  | "COMPLAINT_CREATED"
  | "COMPLAINT_REVIEWED"
  | "COMPLAINT_ASSIGNED"
  | "COMPLAINT_IN_PROGRESS"
  | "COMPLAINT_RESOLVED"
  | "COMPLAINT_CLOSED"
  | "COMPLAINT_REOPENED"
  | "COMPLAINT_REJECTED"
  | "SLA_BREACHED"
  | "PAYMENT_SUCCESS"
  | "SERVICE_REQUEST_UPDATED";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  complaintId: string | null;
  createdAt: IsoDateTime;
  userId?: string;
  user?: User;
};

export type NotificationFilters = {
  type?: NotificationType;
  isRead?: boolean;
};

export type MarkAllNotificationsReadResponse = {
  updatedCount: number;
};

export type SlaNotificationCheckResponse = {
  breachedCount: number;
  notificationsCreated: number;
};
