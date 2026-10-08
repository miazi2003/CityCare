import type { DecimalString, IsoDateTime } from "./api";

export type MunicipalService = {
  id: string;
  name: string;
  description: string | null;
  price: DecimalString;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type MunicipalServiceReference = Pick<MunicipalService, "id" | "name" | "price"> & {
  description?: string | null;
};

export type CreateMunicipalServiceInput = {
  name: string;
  description?: string;
  price: number;
};

export type UpdateMunicipalServiceInput = Partial<CreateMunicipalServiceInput> & {
  isActive?: boolean;
};
