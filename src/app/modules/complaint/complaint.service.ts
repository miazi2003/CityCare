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

  const complaint = await prisma.$transaction(async (tx) => {
    const createdComplaint = await tx.complaint.create({
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId: createdComplaint.id,
        fromStatus: null,
        toStatus: "SUBMITTED",
        changedById: citizenId,
        note: "Complaint created",
      },
    });

    return createdComplaint;
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
      assignedStaff: {
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
      assignedStaff: {
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
      select: { departmentId: true, isActive: true },
    });

    if (
      !staff ||
      !staff.isActive ||
      !staff.departmentId ||
      staff.departmentId !== complaint.departmentId
    ) {
      throw new Error("You do not have permission to perform this action");
    }

    // If complaint is assigned, only the assigned staff member can access it
    if (complaint.assignedStaffId && complaint.assignedStaffId !== user.id) {
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
      assignedStaff: {
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
  adminId: string,
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

  const note =
    status === "UNDER_REVIEW"
      ? "Complaint reviewed by admin"
      : "Complaint rejected by admin";

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
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
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: status,
        changedById: adminId,
        note,
      },
    });

    return updated;
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

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.complaint.update({
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: "CANCELLED",
        changedById: citizenId,
        note: "Complaint cancelled by citizen",
      },
    });

    return cancelled;
  });

  return updatedComplaint;
};

// 7. Admin assigns or reassigns staff to a complaint
export const assignStaffToComplaintIntoDB = async (
  complaintId: string,
  adminId: string,
  staffId: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.status === "CLOSED") {
    throw new Error("Cannot assign staff to a closed complaint");
  }

  if (complaint.status === "CANCELLED") {
    throw new Error("Cannot assign staff to a cancelled complaint");
  }

  if (complaint.status === "REJECTED") {
    throw new Error("Cannot assign staff to a rejected complaint");
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff.role !== "STAFF") {
    throw new Error("User is not a staff member");
  }

  if (!staff.isActive) {
    throw new Error("Staff is inactive");
  }

  if (!staff.departmentId) {
    throw new Error("Staff is not assigned to a department");
  }

  if (staff.departmentId !== complaint.departmentId) {
    throw new Error("Staff does not belong to the complaint's department");
  }

  let newStatus = complaint.status;
  if (
    complaint.status === "SUBMITTED" ||
    complaint.status === "UNDER_REVIEW"
  ) {
    newStatus = "ASSIGNED";
  }

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        assignedStaffId: staff.id,
        status: newStatus,
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (newStatus !== complaint.status) {
      await tx.complaintStatusHistory.create({
        data: {
          complaintId,
          fromStatus: complaint.status,
          toStatus: newStatus,
          changedById: adminId,
          note: "Complaint assigned to staff by admin",
        },
      });
    }

    return updated;
  });

  return updatedComplaint;
};

// 8. Staff views complaints assigned to them
export const getAssignedComplaintsFromDB = async (staffId: string) => {
  const complaints = await prisma.complaint.findMany({
    where: {
      assignedStaffId: staffId,
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
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedStaff: {
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

// 9. Staff updates complaint status (ASSIGNED -> IN_PROGRESS)
export const updateComplaintStatusIntoDB = async (
  complaintId: string,
  staffId: string,
  status: "IN_PROGRESS"
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.status === "CLOSED") {
    throw new Error("Cannot update a closed complaint");
  }

  if (complaint.status === "CANCELLED") {
    throw new Error("Cannot update a cancelled complaint");
  }

  if (complaint.status === "REJECTED") {
    throw new Error("Cannot update a rejected complaint");
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (!staff.isActive) {
    throw new Error("Staff is inactive");
  }

  if (complaint.assignedStaffId !== staffId) {
    throw new Error("You are not assigned to this complaint");
  }

  if (staff.departmentId !== complaint.departmentId) {
    throw new Error("Staff does not belong to the complaint's department");
  }

  if (complaint.status !== "ASSIGNED") {
    throw new Error("Invalid status transition");
  }

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status,
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: "ASSIGNED",
        toStatus: "IN_PROGRESS",
        changedById: staffId,
        note: "Staff started working on complaint",
      },
    });

    return updated;
  });

  return updatedComplaint;
};

// 10. Staff resolves a complaint (IN_PROGRESS -> RESOLVED)
export const resolveComplaintIntoDB = async (
  complaintId: string,
  staffId: string,
  note: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.status === "CLOSED") {
    throw new Error("Cannot resolve a closed complaint");
  }

  if (complaint.status === "CANCELLED") {
    throw new Error("Cannot resolve a cancelled complaint");
  }

  if (complaint.status === "REJECTED") {
    throw new Error("Cannot resolve a rejected complaint");
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (!staff.isActive) {
    throw new Error("Staff is inactive");
  }

  if (complaint.assignedStaffId !== staffId) {
    throw new Error("You are not assigned to this complaint");
  }

  if (staff.departmentId !== complaint.departmentId) {
    throw new Error("Staff does not belong to the complaint's department");
  }

  if (complaint.status !== "IN_PROGRESS") {
    throw new Error("Complaint must be IN_PROGRESS to be resolved");
  }

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "RESOLVED",
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: "IN_PROGRESS",
        toStatus: "RESOLVED",
        changedById: staffId,
        note,
      },
    });

    return updated;
  });

  return updatedComplaint;
};

// 11. Citizen confirms and closes complaint (RESOLVED -> CLOSED)
export const closeComplaintIntoDB = async (
  complaintId: string,
  citizenId: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  if (complaint.status !== "RESOLVED") {
    throw new Error("Complaint must be in RESOLVED status to be closed");
  }

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "CLOSED",
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: "RESOLVED",
        toStatus: "CLOSED",
        changedById: citizenId,
        note: "Complaint confirmed and closed by citizen",
      },
    });

    return updated;
  });

  return updatedComplaint;
};

// 12. Citizen reopens a closed complaint (CLOSED -> REOPENED)
export const reopenComplaintIntoDB = async (
  complaintId: string,
  citizenId: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  if (complaint.status !== "CLOSED") {
    throw new Error("Only closed complaints can be reopened");
  }

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "REOPENED",
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
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        fromStatus: "CLOSED",
        toStatus: "REOPENED",
        changedById: citizenId,
        note: "Complaint reopened by citizen",
      },
    });

    return updated;
  });

  return updatedComplaint;
};

// 13. Get complaint status history (CITIZEN, STAFF, ADMIN)
export const getComplaintStatusHistoryFromDB = async (
  complaintId: string,
  userId: string,
  userRole: string
) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (userRole === "CITIZEN") {
    if (complaint.citizenId !== userId) {
      throw new Error("You do not have permission to perform this action");
    }
  } else if (userRole === "STAFF") {
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, isActive: true },
    });

    if (!staff || !staff.isActive || !staff.departmentId) {
      throw new Error("You do not have permission to perform this action");
    }

    const isAssignedStaff = complaint.assignedStaffId === userId;
    const isUnassignedDeptComplaint =
      complaint.assignedStaffId === null &&
      complaint.departmentId === staff.departmentId;

    if (!isAssignedStaff && !isUnassignedDeptComplaint) {
      throw new Error("You do not have permission to perform this action");
    }
  }
  // ADMIN is allowed to view any history

  const history = await prisma.complaintStatusHistory.findMany({
    where: {
      complaintId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return history;
};



