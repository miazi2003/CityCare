"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { getRoleHomeRoute } from "@/lib/auth-routes";

type NavLink = {
  label: string;
  href: string;
};

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Departments", href: "/departments" },
  { label: "Categories", href: "/categories" },
  { label: "Services", href: "/services" },
];

function PublicHeaderContent() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, clearSession } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          className="flex items-center gap-2.5 text-slate-950 transition hover:opacity-90"
          href="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-base font-bold text-white shadow-xs">
            CC
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-950 leading-tight">
              City Care
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight">
              Municipal Services &amp; Complaints
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-100 text-slate-950 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {user.name} ({user.role.toLowerCase()})
              </span>
              <Link
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                href={getRoleHomeRoute(user.role)}
              >
                Dashboard →
              </Link>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                onClick={clearSession}
                type="button"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                href="/register"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            type="button"
          >
            {isMobileMenuOpen ? (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {isMobileMenuOpen ? (
        <div
          className="border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-md md:hidden"
          id="mobile-menu"
        >
          <nav aria-label="Mobile Navigation" className="space-y-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  className={`block rounded-lg px-3.5 py-2.5 text-base font-medium transition ${
                    active
                      ? "bg-slate-100 text-slate-950 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                  href={link.href}
                  key={link.href}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="px-3.5 text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800">{user.name}</span> ({user.role.toLowerCase()})
                </div>
                <Link
                  className="block w-full rounded-lg bg-slate-950 px-4 py-2.5 text-center text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                  href={getRoleHomeRoute(user.role)}
                  onClick={closeMobileMenu}
                >
                  Go to {user.role === "ADMIN" ? "Admin Console" : user.role === "STAFF" ? "Staff SLA Queue" : "Citizen Dashboard"}
                </Link>
                <button
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    clearSession();
                    closeMobileMenu();
                  }}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  href="/login"
                  onClick={closeMobileMenu}
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-lg bg-slate-950 px-4 py-2.5 text-center text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                  href="/register"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function PublicHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <Link className="flex items-center gap-2.5 text-slate-950" href="/">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-base font-bold text-white shadow-xs">
                CC
              </span>
              <span className="text-base font-bold tracking-tight text-slate-950">
                City Care
              </span>
            </Link>
            <div className="h-8 w-48 animate-pulse rounded-md bg-slate-100" />
          </div>
        </header>
      }
    >
      <PublicHeaderContent />
    </Suspense>
  );
}

