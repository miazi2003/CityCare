import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/role-guard";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="STAFF">{children}</RoleGuard>;
}
