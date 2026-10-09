import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="ADMIN">
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
