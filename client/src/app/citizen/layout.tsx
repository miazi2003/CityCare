import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/features/auth/role-guard";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="CITIZEN">
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
