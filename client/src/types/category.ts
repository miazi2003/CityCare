import type { IsoDateTime } from "./api";
import type { DepartmentReference } from "./department";

export type Category = {
  id: string;
  name: string;
  description: string | null;
  slaHours: number;
  isActive: boolean;
  departmentId: string;
  department: DepartmentReference;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type CategoryReference = Pick<Category, "id" | "name" | "slaHours">;

export type CreateCategoryInput = {
  name: string;
  description?: string;
  slaHours: number;
  departmentId: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
