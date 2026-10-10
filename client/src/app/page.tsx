"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { Department, MunicipalService } from "@/types";

function getServiceImage(service: MunicipalService): string {
  const text = `${service.name} ${service.description || ""}`.toLowerCase();

  if (text.includes("waste") || text.includes("trash") || text.includes("garbage") || text.includes("sanitation")) {
    return "/images/waste-collection.jpg";
  }
  if (text.includes("road") || text.includes("pothole") || text.includes("asphalt") || text.includes("pavement")) {
    return "/images/road-maintenance.jpg";
  }
  if (text.includes("light") || text.includes("lamp") || text.includes("electric") || text.includes("power")) {
    return "/images/street-light-service.jpg";
  }
  if (text.includes("tree") || text.includes("park") || text.includes("garden") || text.includes("landscape") || text.includes("green")) {
    return "/images/tree-maintenance.jpg";
  }
  return "/images/citycare-hero.jpg";
}

function getDepartmentImage(dept: Department): string {
  const text = `${dept.name} ${dept.description || ""}`.toLowerCase();

  if (text.includes("waste") || text.includes("sanitation") || text.includes("clean")) {
    return "/images/waste-collection.jpg";
  }
  if (text.includes("road") || text.includes("work") || text.includes("infrastructure")) {
    return "/images/road-maintenance.jpg";
  }
  if (text.includes("light") || text.includes("electric") || text.includes("utilit")) {
    return "/images/street-light-service.jpg";
  }
  if (text.includes("park") || text.includes("green") || text.includes("recreation")) {
    return "/images/tree-maintenance.jpg";
  }
  return "/images/municipal-workers.jpg";
}

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

    const loadDepartments = async () => {
      setIsDeptsLoading(true);
      setDeptsError(null);
      const result = await apiRequest<Department[]>("departments");
      if (!isMounted) return;
      if (result.success && result.data !== null) {
        setDepartments(result.data.filter((d) => d.isActive).slice(0, 4));
      } else {
        setDeptsError(result.message || "Failed to load departments.");
      }
      setIsDeptsLoading(false);
    };

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

  const getHeroPrimaryAction = () => {
    if (!isAuthenticated || !user) {
      return {
        label: "Report an Issue",
        href: "/login",
      };
    }
    if (user.role === "CITIZEN") {
      return {
        label: "Report an Issue",
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
      label: "Explore Services",
      href: "/services",
    };
  };

  const primaryAction = getHeroPrimaryAction();
  const secondaryAction = getHeroSecondaryAction();

  return (
    <PublicLayout>
      {/* 1. HERO SECTION WITH AUTHENTIC CIVIC PHOTOGRAPHY */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-50 via-white to-white py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Column: Headline & Action CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                SMARTER CITY SERVICES
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl/tight">
                City services, <br />
                <span className="text-slate-700">made simpler.</span>
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                Report local issues, request municipal services, and follow their progress from one simple platform.
              </p>

              <div className="flex flex-col gap-3.5 pt-2 sm:flex-row sm:items-center">
                <Link
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-base font-semibold text-white shadow-xs transition hover:bg-slate-800"
                  href={primaryAction.href}
                >
                  {primaryAction.label} &rarr;
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                  href={secondaryAction.href}
                >
                  {secondaryAction.label}
                </Link>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs font-medium text-slate-500">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected directly with city departments and operational response teams.
              </div>
            </div>

            {/* Right Column: High Quality Real Civic Photography */}
            <div className="relative lg:col-span-6">
              <div className="relative mx-auto aspect-4/3 w-full max-w-lg overflow-hidden rounded-3xl shadow-xl shadow-slate-200/60 lg:max-w-none">
                <Image
                  alt="City Care municipal staff maintaining urban city infrastructure"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src="/images/citycare-hero.jpg"
                />

                {/* Status Overlays */}
                <div className="absolute top-4 right-4 rounded-xl border border-white/60 bg-white/95 p-3 shadow-md backdrop-blur-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-900">Road Repair #104</span>
                  </div>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">In Progress &bull; Public Works</span>
                </div>

                <div className="absolute bottom-4 left-4 rounded-xl border border-white/60 bg-white/95 p-3 shadow-md backdrop-blur-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">Waste Collection</span>
                  </div>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Completed &bull; Citizen Rated 5★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE STRIP */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Report Issues</h3>
                <p className="mt-0.5 text-xs text-slate-500">Fast reporting with category and location.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Request Services</h3>
                <p className="mt-0.5 text-xs text-slate-500">Order municipal services on demand.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Track Progress</h3>
                <p className="mt-0.5 text-xs text-slate-500">Complete status transparency and notes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Stay Updated</h3>
                <p className="mt-0.5 text-xs text-slate-500">Milestone and status notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW CITY CARE WORKS (3-Step Section) */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              SIMPLE WORKFLOW
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              How City Care Works
            </h2>
            <p className="mt-3 text-base text-slate-600">
              A transparent three-step process connecting your request directly to the responsible municipal specialists.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <span className="text-4xl font-extrabold text-slate-300">01</span>
              <h3 className="text-xl font-bold text-slate-950">Report or Request</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Submit a neighborhood issue or select a municipal service with full location and description details.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-4xl font-extrabold text-slate-300">02</span>
              <h3 className="text-xl font-bold text-slate-950">City Team Responds</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                The appropriate department and staff investigate, assign, and take direct action within defined SLA targets.
              </p>
            </div>

            <div className="space-y-4">
              <span className="text-4xl font-extrabold text-slate-300">03</span>
              <h3 className="text-xl font-bold text-slate-950">Track the Progress</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Follow status updates, receive notifications, view official resolution notes, and rate the completed outcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HUMAN-CENTERED STORY SECTION (Editorial 1: Real Citizen Photography) */}
      <section className="border-t border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: Citizen Photography */}
            <div className="lg:col-span-6">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl shadow-lg shadow-slate-200/50">
                <Image
                  alt="Citizen using City Care on smartphone in a neighborhood"
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src="/images/citizen-reporting.jpg"
                />
              </div>
            </div>

            {/* Right: Editorial Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                CONNECTED CIVIC PORTAL
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                One place to connect with your city.
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                City Care connects residents directly with operational municipal services. Whether reporting an infrastructure issue or requesting public waste pickup, every request reaches the right specialists without administrative friction.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    Direct complaint reporting with priority tagging and location
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    Municipal service requests with clear pricing and quantity
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    SLA-driven resolution targets managed by assigned department staff
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    Citizen star ratings and feedback upon issue resolution
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MUNICIPAL SERVICES — IMAGE CARDS */}
      <section className="py-20 sm:py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                OFFICIAL CATALOG
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Municipal Services Preview
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Request standard municipal services directly with clear pricing and quantity.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-slate-950 hover:underline"
              href="/services"
            >
              View All Services &rarr;
            </Link>
          </div>

          <div className="mt-10">
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
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs transition hover:shadow-md hover:border-slate-200"
                    key={service.id}
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                        <Image
                          alt={service.name}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          src={getServiceImage(service)}
                        />
                      </div>

                      <div className="p-5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          Active Service
                        </span>
                        <h3 className="mt-2.5 text-base font-bold text-slate-950">
                          {service.name}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                          {service.description || "Public municipal service provision for registered citizens."}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 p-5 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-slate-950">
                          ${formatServicePrice(service.price)}
                        </span>
                        <span className="text-[11px] text-slate-500"> / unit</span>
                      </div>
                      <Link
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        href={`/services/${service.id}`}
                      >
                        View Service
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. DEPARTMENTS — VISUAL CIVIC CARDS */}
      <section className="py-20 sm:py-24 bg-slate-50/70 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GOVERNANCE
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Municipal Departments
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Operational city departments responding to issues and fulfilling municipal requests.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-slate-950 hover:underline"
              href="/departments"
            >
              View All Departments &rarr;
            </Link>
          </div>

          <div className="mt-10">
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {departments.map((dept) => (
                  <article
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs transition hover:shadow-md hover:border-slate-200"
                    key={dept.id}
                  >
                    <div>
                      {/* Department Photography Banner */}
                      <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100">
                        <Image
                          alt={dept.name}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          src={getDepartmentImage(dept)}
                        />
                      </div>

                      <div className="p-5">
                        <h3 className="text-base font-bold text-slate-950">
                          {dept.name}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-3">
                          {dept.description || "Active municipal department servicing public community needs."}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 p-5 pt-3">
                      <Link
                        className="text-xs font-semibold text-slate-900 hover:underline"
                        href="/categories"
                      >
                        Explore categories &rarr;
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. SECOND EDITORIAL SECTION (Reversed: Team Photography & Request Tracking) */}
      <section className="py-20 sm:py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: Text & Features */}
            <div className="order-2 lg:order-1 lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AUDITABLE TRANSPARENCY
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Know what’s happening with every request.
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Every civic complaint and service request records an auditable timeline with explicit status transitions, resolution notes, and feedback ratings.
              </p>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900 shrink-0" />
                  <span><strong>Explicit status progression:</strong> Follow each step from submission to review, assignment, and closure.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900 shrink-0" />
                  <span><strong>Official resolution notes:</strong> Understand exactly what action was taken by municipal staff.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-900 shrink-0" />
                  <span><strong>Milestone notifications:</strong> Receive direct updates as tasks are assigned and completed.</span>
                </div>
              </div>
            </div>

            {/* Right: Real Municipal Operations Team Photography */}
            <div className="order-1 lg:order-2 lg:col-span-6">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl shadow-lg shadow-slate-200/50">
                <Image
                  alt="Municipal operations specialists working on city maintenance"
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src="/images/municipal-workers.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPLAINT STATUS LIFECYCLE (Timeline) */}
      <section className="py-20 sm:py-24 bg-slate-50/70 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              AUDITED LIFECYCLE
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Complaint Status Lifecycle
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Every complaint moves through standardized operational stages.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Submitted", badge: "bg-slate-100 text-slate-800", desc: "Citizen submits initial issue" },
              { label: "Under Review", badge: "bg-amber-50 text-amber-800", desc: "Admin assesses validity" },
              { label: "Assigned", badge: "bg-blue-50 text-blue-800", desc: "Assigned to department staff" },
              { label: "In Progress", badge: "bg-indigo-50 text-indigo-800", desc: "Active investigation & work" },
              { label: "Resolved", badge: "bg-emerald-50 text-emerald-800", desc: "Resolution note recorded" },
              { label: "Closed", badge: "bg-teal-50 text-teal-800", desc: "Completed & citizen rated" },
            ].map((st) => (
              <div
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-2xs text-center"
                key={st.label}
              >
                <div>
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${st.badge}`}>
                    {st.label}
                  </span>
                  <p className="mt-2.5 text-xs text-slate-600 leading-snug">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. COMMUNITY / CITY IMAGE BAND (Photographic Final CTA) */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white sm:py-32">
        {/* Real Community Photographic Background with Clean Tint */}
        <div className="absolute inset-0">
          <Image
            alt="Vibrant clean community park and urban civic environment"
            className="object-cover opacity-25"
            fill
            sizes="100vw"
            src="/images/city-community.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Need help from your city?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            Report an issue or explore available municipal services in just a few steps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              className="w-full rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-950 shadow-md transition hover:bg-slate-100 sm:w-auto text-center"
              href={primaryAction.href}
            >
              {primaryAction.label} &rarr;
            </Link>
            <Link
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-base font-semibold text-white shadow-xs transition hover:bg-slate-800 sm:w-auto text-center backdrop-blur-xs"
              href="/services"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
