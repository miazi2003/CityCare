import { Request, Response } from "express";
import {
  getAllAuditLogsFromDB,
  getEntityAuditLogsFromDB,
} from "./auditLog.service";

// 1. Get all audit logs with optional query filters (ADMIN only)
export const getAllAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, entity, action, entityId } = req.query;

    const filters = {
      userId: typeof userId === "string" ? userId : undefined,
      entity: typeof entity === "string" ? entity : undefined,
      action: typeof action === "string" ? action : undefined,
      entityId: typeof entityId === "string" ? entityId : undefined,
    };

    const auditLogs = await getAllAuditLogsFromDB(filters);

    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: auditLogs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};

// 2. Get audit history for a specific entity and entityId (ADMIN only)
export const getEntityAuditLogs = async (req: Request, res: Response) => {
  try {
    const entity = req.params.entity as string;
    const entityId = req.params.entityId as string;

    if (!entity || !entityId) {
      return res.status(400).json({
        success: false,
        message: "Entity and entityId parameters are required",
        data: null,
      });
    }

    const auditLogs = await getEntityAuditLogsFromDB(entity, entityId);

    return res.status(200).json({
      success: true,
      message: "Entity audit logs retrieved successfully",
      data: auditLogs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      data: null,
    });
  }
};
