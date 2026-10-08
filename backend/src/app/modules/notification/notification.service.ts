import { NotificationType } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface ICreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  complaintId?: string | null;
}

// 1. Reusable helper to create a single notification
export const createNotification = async (
  payload: ICreateNotificationPayload
) => {
  return await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      complaintId: payload.complaintId || null,
    },
  });
};

// 2. Get notifications for the authenticated user
export const getMyNotificationsFromDB = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      complaintId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

// 3. Get unread notifications for the authenticated user
export const getUnreadNotificationsFromDB = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      complaintId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

// 4. Mark a single notification as read (ownership enforced)
export const markNotificationAsReadIntoDB = async (
  notificationId: string,
  userId: string
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("You do not have permission to perform this action");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
    },
  });

  return updated;
};

// 5. Mark all unread notifications as read for the user
export const markAllNotificationsAsReadIntoDB = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    updatedCount: result.count,
  };
};

// 6. Admin gets all notifications with optional filters
export const getAllNotificationsFromDB = async (filters?: {
  type?: NotificationType;
  isRead?: boolean;
}) => {
  const whereClause: any = {};

  if (filters?.type) {
    whereClause.type = filters.type;
  }

  if (filters?.isRead !== undefined) {
    whereClause.isRead = filters.isRead;
  }

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

// 7. Check active complaints for SLA breaches and notify without duplicates
export const checkAndCreateSlaNotifications = async () => {
  const now = new Date();

  // Find active overdue complaints
  const breachedComplaints = await prisma.complaint.findMany({
    where: {
      status: {
        in: [
          "SUBMITTED",
          "UNDER_REVIEW",
          "ASSIGNED",
          "IN_PROGRESS",
          "REOPENED",
        ],
      },
      dueAt: { lt: now },
    },
    select: {
      id: true,
      title: true,
      assignedStaffId: true,
    },
  });

  // Find all active admins
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  let notificationsCreated = 0;

  for (const complaint of breachedComplaints) {
    // Check if an SLA_BREACHED notification for this complaint already exists (deduplication)
    const existingNotification = await prisma.notification.findFirst({
      where: {
        complaintId: complaint.id,
        type: "SLA_BREACHED",
      },
    });

    if (existingNotification) {
      continue;
    }

    // 1. Notify assigned staff, if assigned
    if (complaint.assignedStaffId) {
      await prisma.notification.create({
        data: {
          userId: complaint.assignedStaffId,
          title: "SLA Deadline Breached",
          message: `Complaint "${complaint.title}" has breached its SLA deadline.`,
          type: "SLA_BREACHED",
          complaintId: complaint.id,
        },
      });
      notificationsCreated++;
    }

    // 2. Notify all active admins
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "SLA Deadline Breached",
          message: `Complaint "${complaint.title}" has breached its SLA deadline.`,
          type: "SLA_BREACHED",
          complaintId: complaint.id,
        },
      });
      notificationsCreated++;
    }
  }

  return {
    breachedCount: breachedComplaints.length,
    notificationsCreated,
  };
};

