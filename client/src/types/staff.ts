import type { IsoDateTime } from "./api";
import type { UserRole } from "./auth";
import type { DepartmentReference } from "./department";

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
  createdAt: IsoDateTime;
  department: DepartmentReference | null;
};

export type StaffReference = Pick<Staff, "id" | "name" | "email">;

export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  departmentId: string;
};

export type UpdateStaffInput = Partial<CreateStaffInput> & {
  isActive?: boolean;
};
