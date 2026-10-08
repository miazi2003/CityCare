import prisma from "../../lib/prisma";
import { createAuditLog } from "../auditLog/auditLog.service";

export interface ICreateServicePayload {
  name: string;
  description?: string;
  price: number;
}

export interface IUpdateServicePayload {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}

// 1. Admin creates a municipal service
export const createServiceIntoDB = async (
  payload: ICreateServicePayload,
  adminId?: string
) => {
  const service = await prisma.municipalService.create({
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price,
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "CREATE",
      entity: "MUNICIPAL_SERVICE",
      entityId: service.id,
      description: "Admin created municipal service",
    });
  }

  return service;
};

// 2. Get all municipal services (public)
export const getAllServicesFromDB = async () => {
  const services = await prisma.municipalService.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return services;
};

// 3. Get single municipal service by ID (public)
export const getSingleServiceFromDB = async (id: string) => {
  const service = await prisma.municipalService.findUnique({
    where: { id },
  });

  return service;
};

// 4. Admin updates a municipal service
export const updateServiceIntoDB = async (
  id: string,
  payload: IUpdateServicePayload,
  adminId?: string
) => {
  const existingService = await prisma.municipalService.findUnique({
    where: { id },
  });

  if (!existingService) {
    throw new Error("Municipal service not found");
  }

  const updatedService = await prisma.municipalService.update({
    where: { id },
    data: payload,
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "UPDATE",
      entity: "MUNICIPAL_SERVICE",
      entityId: updatedService.id,
      description: "Admin updated municipal service",
    });
  }

  return updatedService;
};

// 5. Admin deactivates a municipal service
export const deactivateServiceIntoDB = async (
  id: string,
  adminId?: string
) => {
  const existingService = await prisma.municipalService.findUnique({
    where: { id },
  });

  if (!existingService) {
    throw new Error("Municipal service not found");
  }

  const deactivated = await prisma.municipalService.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "DEACTIVATE",
      entity: "MUNICIPAL_SERVICE",
      entityId: deactivated.id,
      description: "Admin deactivated municipal service",
    });
  }

  return deactivated;
};

