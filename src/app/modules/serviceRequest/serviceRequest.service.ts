import prisma from "../../lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";

export interface ICreateServiceRequestPayload {
  serviceId: string;
  location: string;
  quantity: number;
  notes?: string;
}

// 1. Citizen creates a service request
export const createServiceRequestIntoDB = async (
  citizenId: string,
  payload: ICreateServiceRequestPayload
) => {
  const service = await prisma.municipalService.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service) {
    throw new Error("Municipal service not found");
  }

  if (!service.isActive) {
    throw new Error("Municipal service is inactive");
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      serviceId: service.id,
      citizenId,
      location: payload.location,
      quantity: payload.quantity,
      notes: payload.notes,
      amount: service.price,
      status: "PENDING_PAYMENT",
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
  });

  return serviceRequest;
};

// 2. Citizen views own service requests
export const getMyServiceRequestsFromDB = async (citizenId: string) => {
  const requests = await prisma.serviceRequest.findMany({
    where: { citizenId },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
};

// 3. Admin views all service requests
export const getAllServiceRequestsFromDB = async () => {
  const requests = await prisma.serviceRequest.findMany({
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
};

// 4. View single service request by ID (CITIZEN own, ADMIN any)
export const getSingleServiceRequestFromDB = async (
  id: string,
  user: { id: string; role: string }
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          provider: true,
          transactionId: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    return null;
  }

  if (user.role === "CITIZEN" && request.citizenId !== user.id) {
    throw new Error("You do not have permission to perform this action");
  }

  return request;
};

// 5. Admin updates service request status
export const updateServiceRequestStatusIntoDB = async (
  id: string,
  newStatus: "PROCESSING" | "COMPLETED" | "CANCELLED"
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new Error("Service request not found");
  }

  // Allowed transitions:
  // PAID -> PROCESSING
  // PROCESSING -> COMPLETED
  // PAID -> CANCELLED
  // PENDING_PAYMENT -> CANCELLED
  const isValidTransition =
    (request.status === "PAID" && newStatus === "PROCESSING") ||
    (request.status === "PROCESSING" && newStatus === "COMPLETED") ||
    (request.status === "PAID" && newStatus === "CANCELLED") ||
    (request.status === "PENDING_PAYMENT" && newStatus === "CANCELLED");

  if (!isValidTransition) {
    throw new Error("Invalid status transition");
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: { status: newStatus },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

