import prisma from "../../lib/prisma";

export interface ICreateAuditLogPayload {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface IAuditLogFilters {
  userId?: string;
  entity?: string;
  action?: string;
  entityId?: string;
}

const auditLogUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

// 1. Reusable internal helper to create an audit log
export const createAuditLog = async (payload: ICreateAuditLogPayload) => {
  return await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId || null,
      description: payload.description || null,
      metadata: payload.metadata ? JSON.parse(JSON.stringify(payload.metadata)) : undefined,
    },
  });
};

// 2. Get all audit logs with optional query filters (ADMIN only)
export const getAllAuditLogsFromDB = async (filters?: IAuditLogFilters) => {
  const whereClause: any = {};

  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }

  if (filters?.entity) {
    whereClause.entity = filters.entity;
  }

  if (filters?.action) {
    whereClause.action = filters.action;
  }

  if (filters?.entityId) {
    whereClause.entityId = filters.entityId;
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: whereClause,
    select: {
      id: true,
      userId: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      metadata: true,
      createdAt: true,
      user: {
        select: auditLogUserSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return auditLogs;
};

// 3. Get all audit logs for a specific entity and entityId (ADMIN only)
export const getEntityAuditLogsFromDB = async (
  entity: string,
  entityId: string
) => {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    select: {
      id: true,
      userId: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      metadata: true,
      createdAt: true,
      user: {
        select: auditLogUserSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return auditLogs;
};
