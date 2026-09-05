import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";

// Payload interface for creating a staff member
export interface ICreateStaffPayload {
  name: string;
  email: string;
  password: string;
  departmentId: string;
}

// Payload interface for updating a staff member
export interface IUpdateStaffPayload {
  name?: string;
  email?: string;
  password?: string;
  departmentId?: string;
  isActive?: boolean;
}

// Common safe select fields for staff (never returns password)
const staffSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  isActive: true,
  createdAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
};

// 1. Create staff user under a department
export const createStaffIntoDB = async (payload: ICreateStaffPayload) => {
  // Check whether email already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Check whether department exists
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Check whether department is active
  if (!department.isActive) {
    throw new Error("Department is inactive");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Create staff user strictly with role "STAFF"
  const staff = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: "STAFF",
      isActive: true,
      departmentId: payload.departmentId,
    },
    select: staffSelectFields,
  });

  return staff;
};

// 2. Get all staff members
export const getAllStaffFromDB = async () => {
  const staffList = await prisma.user.findMany({
    where: {
      role: "STAFF",
    },
    select: staffSelectFields,
    orderBy: {
      createdAt: "desc",
    },
  });

  return staffList;
};

// 3. Get single staff member by ID
export const getSingleStaffFromDB = async (id: string) => {
  const staff = await prisma.user.findFirst({
    where: {
      id,
      role: "STAFF",
    },
    select: staffSelectFields,
  });

  return staff;
};

// 4. Update staff member
export const updateStaffIntoDB = async (
  id: string,
  payload: IUpdateStaffPayload
) => {
  // Find existing user and make sure role is STAFF
  const existingStaff = await prisma.user.findFirst({
    where: {
      id,
      role: "STAFF",
    },
  });

  if (!existingStaff) {
    throw new Error("Staff not found");
  }

  // If email is being changed, ensure it is not used by another user
  if (payload.email && payload.email !== existingStaff.email) {
    const emailTaken = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (emailTaken) {
      throw new Error("Email already exists");
    }
  }

  // If departmentId is provided, validate department
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

  // Prepare update data (role changes are not permitted)
  const updateData: Record<string, any> = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.departmentId !== undefined)
    updateData.departmentId = payload.departmentId;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

  // If password is provided, hash it before updating
  if (payload.password) {
    updateData.password = await bcrypt.hash(payload.password, 10);
  }

  const updatedStaff = await prisma.user.update({
    where: {
      id,
    },
    data: updateData,
    select: staffSelectFields,
  });

  return updatedStaff;
};

// 5. Deactivate staff member (soft delete)
export const deactivateStaffIntoDB = async (id: string) => {
  const existingStaff = await prisma.user.findFirst({
    where: {
      id,
      role: "STAFF",
    },
  });

  if (!existingStaff) {
    throw new Error("Staff not found");
  }

  const deactivatedStaff = await prisma.user.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
    select: staffSelectFields,
  });

  return deactivatedStaff;
};

// 6. Get all active staff members by department ID
export const getStaffByDepartmentFromDB = async (departmentId: string) => {
  // Verify department exists
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Fetch active STAFF members belonging to that department
  const staffList = await prisma.user.findMany({
    where: {
      departmentId,
      role: "STAFF",
      isActive: true,
    },
    select: staffSelectFields,
    orderBy: {
      createdAt: "desc",
    },
  });

  return staffList;
};
