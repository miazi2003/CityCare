import type { IsoDateTime } from "./api";

export type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type DepartmentReference = Pick<Department, "id" | "name">;

export type CreateDepartmentInput = {
  name: string;
  description?: string;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;
