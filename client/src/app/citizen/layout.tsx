import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/role-guard";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return <RoleGuard role="CITIZEN">{children}</RoleGuard>;
}
