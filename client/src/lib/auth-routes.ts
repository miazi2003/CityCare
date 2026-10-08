import type { UserRole } from "@/types";

const roleHomeRoutes: Record<UserRole, string> = {
  CITIZEN: "/citizen",
  STAFF: "/staff",
  ADMIN: "/admin",
};

export const getRoleHomeRoute = (role: UserRole): string => roleHomeRoutes[role];
