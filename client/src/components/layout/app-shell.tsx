"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { getRoleHomeRoute } from "@/lib/auth-routes";
import type { UserRole } from "@/types";

type NavigationItem = {
  label: string;
  href: string;
};

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  CITIZEN: [
    { label: "Dashboard", href: "/citizen" },
    { label: "Complaints", href: "/citizen/complaints" },
    { label: "Services & Requests", href: "/citizen/service-requests" },
    { label: "Notifications", href: "/citizen/notifications" },
  ],
  STAFF: [
    { label: "Dashboard", href: "/staff" },
    { label: "Assigned Complaints", href: "/staff/complaints" },
    { label: "SLA Queue", href: "/staff/sla" },
    { label: "Notifications", href: "/staff/notifications" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin" },
    { label: "Complaints", href: "/admin/complaints" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Staff", href: "/admin/staff" },
    { label: "Services", href: "/admin/services" },
    { label: "Service Requests", href: "/admin/service-requests" },
    { label: "Notifications", href: "/admin/notifications" },
    { label: "Feedback", href: "/admin/feedback" },
    { label: "Audit Logs", href: "/admin/audit-logs" },
    { label: "Analytics", href: "/admin/analytics" },
  ],
};

const roleLabels: Record<UserRole, string> = {
  CITIZEN: "Citizen",
  STAFF: "Staff",
  ADMIN: "Administrator",
};

type NavigationLinksProps = {
  items: NavigationItem[];
  pathname: string;
  role: UserRole;
  onNavigate?: () => void;
};

const NavigationLinks = ({
  items,
  pathname,
  role,
  onNavigate,
}: NavigationLinksProps) => {
  const roleHomeRoute = getRoleHomeRoute(role);

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== roleHomeRoute && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

type UserIdentityProps = {
  name: string;
  email: string;
  role: UserRole;
};

const UserIdentity = ({ name, email, role }: UserIdentityProps) => (
  <div className="min-w-0">
    <p className="truncate text-sm font-medium text-slate-950">{name}</p>
    <p className="truncate text-xs text-slate-500">{email}</p>
    <p className="mt-1 text-xs font-medium text-slate-600">{roleLabels[role]}</p>
  </div>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const navigationItems = navigationByRole[user.role];

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
        <Link className="mb-8 text-lg font-bold tracking-tight text-slate-950" href={getRoleHomeRoute(user.role)}>
          City Care
        </Link>

        <NavigationLinks items={navigationItems} pathname={pathname} role={user.role} />

        <div className="mt-auto border-t border-slate-200 pt-4">
          <UserIdentity email={user.email} name={user.name} role={user.role} />
          <button
            className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link className="text-base font-bold tracking-tight text-slate-950" href={getRoleHomeRoute(user.role)}>
            City Care
          </Link>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            Menu
          </button>
        </header>

        {isMobileMenuOpen ? (
          <div className="border-b border-slate-200 bg-white p-4 md:hidden" id="mobile-navigation">
            <NavigationLinks
              items={navigationItems}
              onNavigate={closeMobileMenu}
              pathname={pathname}
              role={user.role}
            />
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <UserIdentity email={user.email} name={user.name} role={user.role} />
              <button
                className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                onClick={handleLogout}
                type="button"
              >
                Log out
              </button>
            </div>
          </div>
        ) : null}

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
