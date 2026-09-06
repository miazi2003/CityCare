import { Request, Response } from "express";
import { NotificationType } from "@prisma/client";
import {
  getMyNotificationsFromDB,
  getUnreadNotificationsFromDB,
  markNotificationAsReadIntoDB,
  markAllNotificationsAsReadIntoDB,
  getAllNotificationsFromDB,
  checkAndCreateSlaNotifications,
} from "./notification.service";

// 1. Get notifications for the authenticated user
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await getMyNotificationsFromDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 2. Get unread notifications for the authenticated user
export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await getUnreadNotificationsFromDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Unread notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 3. Mark single notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await markNotificationAsReadIntoDB(id, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      data: updated,
    });
  } catch (error: any) {
    if (error.message === "Notification not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    if (error.message === "You do not have permission to perform this action") {
      return res.status(403).json({
        success: false,
        message: error.message,
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 4. Mark all notifications as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await markAllNotificationsAsReadIntoDB(req.user!.id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 5. Admin gets all notifications with optional filters
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as NotificationType | undefined;
    const isReadQuery = req.query.isRead as string | undefined;
    const isRead =
      isReadQuery === "true"
        ? true
        : isReadQuery === "false"
        ? false
        : undefined;

    const notifications = await getAllNotificationsFromDB({ type, isRead });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 6. Admin triggers SLA breach notification auditing
export const checkSlaNotifications = async (req: Request, res: Response) => {
  try {
    const result = await checkAndCreateSlaNotifications();

    return res.status(200).json({
      success: true,
      message: "SLA breach check completed successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

