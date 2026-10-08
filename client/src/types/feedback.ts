import type { IsoDateTime } from "./api";
import type { UserIdentity } from "./auth";
import type { CategoryReference } from "./category";
import type { DepartmentReference } from "./department";
import type { StaffReference } from "./staff";

export type FeedbackPreview = {
  id: string;
  rating: number;
  comment: string | null;
};

export type Feedback = FeedbackPreview & {
  complaintId: string;
  citizenId: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  citizen: UserIdentity;
  complaint?: {
    id: string;
    title: string;
    status: "SUBMITTED" | "UNDER_REVIEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED" | "CANCELLED" | "REOPENED";
    department: DepartmentReference;
    category: CategoryReference;
    assignedStaff: StaffReference | null;
  };
};

export type CreateFeedbackInput = {
  rating: number;
  comment?: string;
};

export type UpdateFeedbackInput = Partial<CreateFeedbackInput>;
