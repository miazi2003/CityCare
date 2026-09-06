import prisma from "../../lib/prisma";

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
export const createServiceIntoDB = async (payload: ICreateServicePayload) => {
  const service = await prisma.municipalService.create({
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price,
    },
  });

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
  payload: IUpdateServicePayload
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

  return updatedService;
};

// 5. Admin deactivates a municipal service
export const deactivateServiceIntoDB = async (id: string) => {
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

  return deactivated;
};

