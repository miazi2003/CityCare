import prisma from "../../lib/prisma";

export interface ICreateFeedbackPayload {
  rating: number;
  comment?: string;
}

export interface IUpdateFeedbackPayload {
  rating?: number;
  comment?: string;
}

// 1. Citizen creates feedback for a closed complaint
export const createFeedbackIntoDB = async (
  complaintId: string,
  citizenId: string,
  payload: ICreateFeedbackPayload
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
    throw new Error("Feedback can only be submitted for closed complaints");
  }

  const existingFeedback = await prisma.feedback.findUnique({
    where: { complaintId },
  });

  if (existingFeedback) {
    throw new Error("Feedback already exists for this complaint");
  }

  const feedback = await prisma.feedback.create({
    data: {
      complaintId,
      citizenId,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return feedback;
};

// 2. Get feedback for a specific complaint (CITIZEN, STAFF, ADMIN)
export const getFeedbackByComplaintFromDB = async (
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

    if (complaint.departmentId !== staff.departmentId) {
      throw new Error("You do not have permission to perform this action");
    }

    if (complaint.assignedStaffId && complaint.assignedStaffId !== userId) {
      throw new Error("You do not have permission to perform this action");
    }
  }
  // ADMIN is allowed to view any complaint feedback

  const feedback = await prisma.feedback.findUnique({
    where: { complaintId },
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  return feedback;
};

// 3. Admin views all feedback
export const getAllFeedbackFromDB = async () => {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      complaint: {
        select: {
          id: true,
          title: true,
          status: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
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

  return feedbacks;
};

// 4. Citizen updates their feedback
export const updateFeedbackIntoDB = async (
  complaintId: string,
  citizenId: string,
  payload: IUpdateFeedbackPayload
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
    throw new Error("Complaint must be closed to update feedback");
  }

  const feedback = await prisma.feedback.findUnique({
    where: { complaintId },
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  if (feedback.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  const updatedFeedback = await prisma.feedback.update({
    where: { complaintId },
    data: {
      ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
      ...(payload.comment !== undefined ? { comment: payload.comment } : {}),
    },
    include: {
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedFeedback;
};

// 5. Citizen deletes their feedback
export const deleteFeedbackIntoDB = async (
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

  const feedback = await prisma.feedback.findUnique({
    where: { complaintId },
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  if (feedback.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  await prisma.feedback.delete({
    where: { complaintId },
  });

  return null;
};

