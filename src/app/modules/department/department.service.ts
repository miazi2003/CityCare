import prisma from "../../lib/prisma";

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
  payload: ICreateDepartmentPayload
) => {
  const department = await prisma.department.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });

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
  payload: IUpdateDepartmentPayload
) => {
  const updatedDepartment = await prisma.department.update({
    where: {
      id,
    },
    data: payload,
  });

  return updatedDepartment;
};

// 5. Deactivate a department (soft delete by setting isActive to false)
export const deactivateDepartmentIntoDB = async (id: string) => {
  const deactivatedDepartment = await prisma.department.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return deactivatedDepartment;
};

