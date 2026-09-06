import { ComplaintPriority, ComplaintStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface ICreateComplaintPayload {
  title: string;
  description: string;
  location: string;
  categoryId: string;
  priority?: ComplaintPriority;
}

// 1. Citizen creates a complaint
export const createComplaintIntoDB = async (
  citizenId: string,
  payload: ICreateComplaintPayload
) => {
  // Check category and its department
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
    include: { department: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (!category.isActive) {
    throw new Error("Category is inactive");
  }

  if (!category.department) {
    throw new Error("Department not found");
  }

  if (!category.department.isActive) {
    throw new Error("Department is inactive");
  }

  // Calculate dueAt from SLA hours
  const dueAt = new Date(Date.now() + category.slaHours * 60 * 60 * 1000);

  const complaint = await prisma.complaint.create({
    data: {
      title: payload.title,
      description: payload.description,
      location: payload.location,
      categoryId: category.id,
      departmentId: category.departmentId,
      citizenId,
      status: "SUBMITTED",
      priority: payload.priority || "MEDIUM",
      dueAt,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return complaint;
};

// 2. Citizen views own complaints
export const getMyComplaintsFromDB = async (citizenId: string) => {
  const complaints = await prisma.complaint.findMany({
    where: {
      citizenId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
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

  return complaints;
};

// 3. View single complaint with role-based ownership enforcement
export const getSingleComplaintFromDB = async (
  id: string,
  user: { id: string; role: string }
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
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

  if (!complaint) {
    return null;
  }

  // Role checks:
  if (user.role === "CITIZEN") {
    if (complaint.citizenId !== user.id) {
      throw new Error("You do not have permission to perform this action");
    }
  } else if (user.role === "STAFF") {
    const staff = await prisma.user.findUnique({
      where: { id: user.id },
      select: { departmentId: true },
    });

    if (!staff || !staff.departmentId || staff.departmentId !== complaint.departmentId) {
      throw new Error("You do not have permission to perform this action");
    }
  }
  // ADMIN is allowed to view any complaint

  return complaint;
};

// 4. Admin views all complaints
export const getAllComplaintsFromDB = async () => {
  const complaints = await prisma.complaint.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
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

  return complaints;
};

// 5. Admin reviews a complaint (SUBMITTED -> UNDER_REVIEW | REJECTED)
export const reviewComplaintIntoDB = async (
  id: string,
  status: "UNDER_REVIEW" | "REJECTED"
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.status !== "SUBMITTED") {
    throw new Error("Invalid status transition");
  }

  const updatedComplaint = await prisma.complaint.update({
    where: { id },
    data: { status },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
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

  return updatedComplaint;
};

// 6. Citizen cancels own complaint (only allowed when SUBMITTED or UNDER_REVIEW)
export const cancelComplaintIntoDB = async (
  id: string,
  citizenId: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  if (complaint.status !== "SUBMITTED" && complaint.status !== "UNDER_REVIEW") {
    throw new Error("Cannot cancel complaint at this stage");
  }

  const cancelledComplaint = await prisma.complaint.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slaHours: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return cancelledComplaint;
};

