"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomeRoute } from "@/lib/auth-routes";
import type { UserRole } from "@/types";
import { useAuth } from "./auth-provider";

type RoleGuardProps = {
  role: UserRole;
  children: ReactNode;
};

export const RoleGuard = ({ role, children }: RoleGuardProps) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      router.replace(getRoleHomeRoute(user.role));
    }
  }, [isAuthenticated, isLoading, role, router, user]);

  if (isLoading || !isAuthenticated || !user || user.role !== role) {
    return null;
  }

  return children;
};
