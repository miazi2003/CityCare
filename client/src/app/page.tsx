"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { Department, MunicipalService } from "@/types";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<MunicipalService[]>([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [deptsError, setDeptsError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Fetch Departments Preview
    const loadDepartments = async () => {
      setIsDeptsLoading(true);
      setDeptsError(null);
      const result = await apiRequest<Department[]>("departments");
      if (!isMounted) return;
      if (result.success && result.data !== null) {
        setDepartments(result.data.slice(0, 4));
      } else {
        setDeptsError(result.message || "Failed to load departments.");
      }
      setIsDeptsLoading(false);
    };

    // Fetch Municipal Services Preview
    const loadServices = async () => {
      setIsServicesLoading(true);
      setServicesError(null);
      const result = await apiRequest<MunicipalService[]>("services");
      if (!isMounted) return;
      if (result.success && result.data !== null) {
        const activeOnly = result.data.filter((s) => s.isActive);
        setServices(activeOnly.slice(0, 4));
      } else {
        setServicesError(result.message || "Failed to load services.");
      }
      setIsServicesLoading(false);
    };

    void loadDepartments();
    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Determine Hero Action Links based on Authentication & Role
  const getHeroPrimaryAction = () => {
    if (!isAuthenticated || !user) {
      return {
        label: "Report a Complaint",
        href: "/login",
      };
    }
    if (user.role === "CITIZEN") {
      return {
        label: "Report a Complaint",
        href: "/citizen/complaints/new",
      };
    }
    if (user.role === "STAFF") {
      return {
        label: "Open Staff SLA Queue",
        href: "/staff/sla",
      };
    }
    return {
      label: "Open Admin Dashboard",
      href: "/admin",
    };
  };

  const getHeroSecondaryAction = () => {
    if (user?.role === "STAFF") {
      return {
        label: "Assigned Complaints",
        href: "/staff/complaints",
      };
    }
    if (user?.role === "ADMIN") {
      return {
        label: "Manage All Complaints",
        href: "/admin/complaints",
      };
    }
    return {
      label: "Explore Public Services",
      href: "/services",
    };
  };

  const primaryAction = getHeroPrimaryAction();
  const secondaryAction = getHeroSecondaryAction();

  return (
    <PublicLayout>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-linear-to-b from-white to-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Official City Care Municipal Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Empowering Citizens, Improving Our Municipality
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Report neighborhood issues, request fee-based municipal services, and track resolution timelines with complete departmental accountability.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="w-full rounded-xl bg-slate-950 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 sm:w-auto text-center"
                href={primaryAction.href}
              >
                {primaryAction.label} →
              </Link>
              <Link
                className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 sm:w-auto text-center"
                href={secondaryAction.href}
              >
                {secondaryAction.label}
              </Link>
            </div>

            {/* Value Pillars */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-8 sm:grid-cols-3 text-left">
              <div className="p-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Targeted SLAs
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  Category-Driven Deadlines
                </p>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Direct Assignment
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  Dedicated Department Staff
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Transparency
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  Full Status &amp; Audit Trail
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW CITY CARE WORKS */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Operational Workflow
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              How City Care Works
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              A transparent, structured lifecycle ensuring every reported issue is reviewed, assigned, resolved, and evaluated.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-5">
            {[
              {
                step: "01",
                title: "Submit Issue",
                desc: "Citizens submit detailed reports specifying category, priority, description, and location.",
              },
              {
                step: "02",
                title: "Department Routing",
                desc: "Complaints are automatically routed and reviewed by municipal administrators for assignment.",
              },
              {
                step: "03",
                title: "Staff Action",
                desc: "Designated departmental staff specialists investigate, inspect, and work on resolution.",
              },
              {
                step: "04",
                title: "SLA Accountability",
                desc: "Real-time deadline tracking ensures work is completed within defined category SLA hours.",
              },
              {
                step: "05",
                title: "Review & Feedback",
                desc: "Citizens review the official resolution notes and provide star ratings and service feedback.",
              },
            ].map((item, idx) => (
              <div
                className="relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xs"
                key={item.step}
              >
                <span className="text-3xl font-black text-slate-300">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {item.desc}
                </p>
                {idx < 4 ? (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold z-10">
                    →
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DEPARTMENTS PREVIEW */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Municipal Governance
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Active Departments
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Dedicated municipal departments actively managing civic issues across our community.
              </p>
            </div>
            <Link
              className="inline-flex items-center text-sm font-semibold text-slate-950 hover:underline"
              href="/departments"
            >
              View all departments →
            </Link>
          </div>

          <div className="mt-8">
            {isDeptsLoading ? (
              <LoadingState message="Loading active departments…" />
            ) : deptsError ? (
              <ErrorAlert
                message={deptsError}
                onRetry={() => setRefreshKey((k) => k + 1)}
                retryLabel="Retry loading departments"
              />
            ) : departments.length === 0 ? (
              <EmptyState
                description="No active departments are currently listed."
                title="No departments available"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {departments.map((dept) => (
                  <article
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                    key={dept.id}
                  >
                    <div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 font-bold text-sm mb-4">
                        {dept.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-base font-bold text-slate-950">
                        {dept.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                        {dept.description || "Active municipal department servicing public community needs."}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Link
                        className="text-xs font-semibold text-slate-900 hover:underline"
                        href="/categories"
                      >
                        Explore categories →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. MUNICIPAL SERVICES PREVIEW */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Public Services
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Municipal Services Catalog
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Request standard or fee-based public services directly from city operations.
              </p>
            </div>
            <Link
              className="inline-flex items-center text-sm font-semibold text-slate-950 hover:underline"
              href="/services"
            >
              Browse full catalog →
            </Link>
          </div>

          <div className="mt-8">
            {isServicesLoading ? (
              <LoadingState message="Loading municipal services…" />
            ) : servicesError ? (
              <ErrorAlert
                message={servicesError}
                onRetry={() => setRefreshKey((k) => k + 1)}
                retryLabel="Retry loading services"
              />
            ) : services.length === 0 ? (
              <EmptyState
                description="No public municipal services are currently available."
                title="No services cataloged"
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((service) => (
                  <article
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                    key={service.id}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                          Active Service
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-950">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                        {service.description || "Public municipal service provision for registered citizens."}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-slate-950">
                          ${formatServicePrice(service.price)}
                        </span>
                        <span className="text-[11px] text-slate-500"> / unit</span>
                      </div>
                      <Link
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                        href={`/services/${service.id}`}
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. PLATFORM FEATURES */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Civic Infrastructure
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Comprehensive Platform Features
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              Built with purpose-designed features connecting residents and city administration for faster, accountable outcomes.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "End-to-End Complaint Tracking",
                desc: "Live visibility into status progression, timeline events, assigned department specialists, and resolution notes.",
              },
              {
                title: "Departmental Category Routing",
                desc: "Standardized categories ensure complaints route immediately to specialized departmental teams.",
              },
              {
                title: "SLA Response Monitoring",
                desc: "Strict turnaround targets ensure urgent and standard civic problems are addressed within defined operational hours.",
              },
              {
                title: "Municipal Service Fulfillment",
                desc: "Order fee-based public services like bulk collection or permits with tracked request fulfillment.",
              },
              {
                title: "Real-Time System Alerts",
                desc: "Automated notifications keep citizens and staff informed on status transitions, assignments, and milestones.",
              },
              {
                title: "Citizen Feedback & Accountability",
                desc: "Citizens rate resolved complaints, providing authentic feedback that drives municipal service quality.",
              },
            ].map((feature) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
                key={feature.title}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white font-bold text-sm mb-4">
                  ✓
                </div>
                <h3 className="text-base font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMPLAINT STATUS LIFECYCLE */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Pipeline
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Complaint Status Lifecycle
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              Every complaint follows an audited state machine from submission to resolution.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "SUBMITTED", label: "Submitted", color: "bg-slate-100 text-slate-800 border-slate-200", desc: "Citizen submits initial issue" },
              { name: "UNDER_REVIEW", label: "Under Review", color: "bg-amber-50 text-amber-800 border-amber-200", desc: "Admin assesses validity" },
              { name: "ASSIGNED", label: "Assigned", color: "bg-blue-50 text-blue-800 border-blue-200", desc: "Allocated to department staff" },
              { name: "IN_PROGRESS", label: "In Progress", color: "bg-indigo-50 text-indigo-800 border-indigo-200", desc: "Active investigation & work" },
              { name: "RESOLVED", label: "Resolved", color: "bg-emerald-50 text-emerald-800 border-emerald-200", desc: "Resolution note recorded" },
              { name: "CLOSED", label: "Closed", color: "bg-teal-50 text-teal-800 border-teal-200", desc: "Completed & citizen rated" },
            ].map((status) => (
              <div
                className="flex flex-col rounded-xl border p-4 shadow-2xs text-center justify-between"
                key={status.name}
              >
                <div>
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                  <p className="mt-3 text-xs text-slate-600 leading-snug">
                    {status.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to improve your neighborhood?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
            Sign in or create a citizen account to submit issues, track live department updates, and request municipal services today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="w-full rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-950 shadow-md transition hover:bg-slate-100 sm:w-auto text-center"
              href={primaryAction.href}
            >
              {primaryAction.label} →
            </Link>
            <Link
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-2xs transition hover:bg-slate-800 sm:w-auto text-center"
              href="/departments"
            >
              View Municipal Departments
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
