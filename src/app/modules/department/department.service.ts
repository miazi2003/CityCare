import prisma from "../../lib/prisma";
import { createAuditLog } from "../auditLog/auditLog.service";

// Payload interface for creating a department
export interface ICreateDepartmentPayload {
  name: string;
  description?: string;
}

// Payload interface for updating a department
export interface IUpdateDepartmentPayload {
  name?: string;
  description?: string;
}

// 1. Create a new department
export const createDepartmentIntoDB = async (
  payload: ICreateDepartmentPayload,
  adminId?: string
) => {
  const department = await prisma.department.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "CREATE",
      entity: "DEPARTMENT",
      entityId: department.id,
      description: "Admin created department",
    });
  }

  return department;
};

// 2. Get all active departments ordered by createdAt descending
export const getAllDepartmentsFromDB = async () => {
  const departments = await prisma.department.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return departments;
};

// 3. Get a single department by ID
export const getSingleDepartmentFromDB = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: {
      id,
    },
  });

  return department;
};

// 4. Update department name and/or description
export const updateDepartmentIntoDB = async (
  id: string,
  payload: IUpdateDepartmentPayload,
  adminId?: string
) => {
  const updatedDepartment = await prisma.department.update({
    where: {
      id,
    },
    data: payload,
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "UPDATE",
      entity: "DEPARTMENT",
      entityId: updatedDepartment.id,
      description: "Admin updated department",
    });
  }

  return updatedDepartment;
};

// 5. Deactivate a department (soft delete by setting isActive to false)
export const deactivateDepartmentIntoDB = async (
  id: string,
  adminId?: string
) => {
  const deactivatedDepartment = await prisma.department.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "DEACTIVATE",
      entity: "DEPARTMENT",
      entityId: deactivatedDepartment.id,
      description: "Admin deactivated department",
    });
  }

  return deactivatedDepartment;
};

