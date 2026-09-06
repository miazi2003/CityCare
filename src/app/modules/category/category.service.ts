import prisma from "../../lib/prisma";
import { createAuditLog } from "../auditLog/auditLog.service";

// Payload interface for creating a category
export interface ICreateCategoryPayload {
  name: string;
  description?: string;
  slaHours: number;
  departmentId: string;
}

// Payload interface for updating a category
export interface IUpdateCategoryPayload {
  name?: string;
  description?: string;
  slaHours?: number;
  departmentId?: string;
}

// 1. Create a new category under an active department
export const createCategoryIntoDB = async (
  payload: ICreateCategoryPayload,
  adminId?: string
) => {
  // Check if department exists
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Check if department is active
  if (!department.isActive) {
    throw new Error("Department is inactive");
  }

  const category = await prisma.category.create({
    data: payload,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "CREATE",
      entity: "CATEGORY",
      entityId: category.id,
      description: "Admin created category",
    });
  }

  return category;
};

// 2. Get all active categories with their department info, ordered by createdAt descending
export const getAllCategoriesFromDB = async () => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

// 3. Get single category by ID with its department info
export const getSingleCategoryFromDB = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return category;
};

// 4. Update category name, description, slaHours, or departmentId
export const updateCategoryIntoDB = async (
  id: string,
  payload: IUpdateCategoryPayload,
  adminId?: string
) => {
  // If departmentId is provided, validate that department exists and is active
  if (payload.departmentId) {
    const department = await prisma.department.findUnique({
      where: {
        id: payload.departmentId,
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    if (!department.isActive) {
      throw new Error("Department is inactive");
    }
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id,
    },
    data: payload,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (adminId) {
    await createAuditLog({
      userId: adminId,
      action: "UPDATE",
      entity: "CATEGORY",
      entityId: updatedCategory.id,
      description: "Admin updated category",
    });
  }

  return updatedCategory;
};

// 5. Deactivate category (soft delete)
export const deactivateCategoryIntoDB = async (
  id: string,
  adminId?: string
) => {
  const deactivatedCategory = await prisma.category.update({
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
      entity: "CATEGORY",
      entityId: deactivatedCategory.id,
      description: "Admin deactivated category",
    });
  }

  return deactivatedCategory;
};

