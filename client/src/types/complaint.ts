import type { IsoDateTime } from "./api";
import type { User, UserIdentity } from "./auth";
import type { CategoryReference } from "./category";
import type { DepartmentReference } from "./department";
import type { FeedbackPreview } from "./feedback";
import type { StaffReference } from "./staff";

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED"
  | "CANCELLED"
  | "REOPENED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SLAStatus =
  | "ON_TIME"
  | "BREACHED"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE"
  | null;

export type Complaint = {
  id: string;
  title: string;
  description: string;
  location: string;
  categoryId: string;
  departmentId: string;
  citizenId: string;
  assignedStaffId: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  dueAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  category: CategoryReference;
  department: DepartmentReference;
  assignedStaff: StaffReference | null;
  slaStatus: SLAStatus;
  citizen?: UserIdentity;
  feedback?: FeedbackPreview | null;
};

export type ComplaintHistory = {
  id: string;
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  changedById: string;
  note: string | null;
  createdAt: IsoDateTime;
  changedBy: User;
};

export type CreateComplaintInput = {
  title: string;
  description: string;
  location: string;
  categoryId: string;
  priority?: ComplaintPriority;
};

export type ReviewComplaintInput = {
  status: "UNDER_REVIEW" | "REJECTED";
};

export type AssignComplaintInput = {
  staffId: string;
};

export type UpdateComplaintStatusInput = {
  status: "IN_PROGRESS";
};

export type ResolveComplaintInput = {
  note: string;
};

export type SlaSummary = {
  totalActive: number;
  onTime: number;
  breached: number;
  completedOnTime: number;
  completedLate: number;
};
