import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="STAFF">
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
