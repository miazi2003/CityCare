"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { MunicipalService } from "@/types";

export default function ServicesPage() {
  const { isAuthenticated, user } = useAuth();
  const [services, setServices] = useState<MunicipalService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<MunicipalService[]>("services");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setServices(result.data);
      } else {
        setError(result.message || "Failed to load municipal services.");
      }

      setIsLoading(false);
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Public catalog displays only active services
  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );

  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Page Hero Header */}
        <div className="border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs mb-3">
                Public Services Catalog
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Municipal Services
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Browse official municipal services available to city residents. Request provisions, schedule special collections, and track request fulfillment.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/departments"
              >
                View Departments
              </Link>
              {isAuthenticated && user?.role === "CITIZEN" ? (
                <Link
                  className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                  href="/citizen/service-requests"
                >
                  My Service Requests
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? <LoadingState message="Loading municipal services catalog…" /> : null}

        {/* Error State */}
        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
            retryLabel="Retry loading services"
          />
        ) : null}

        {/* Empty State */}
        {!isLoading && !error && activeServices.length === 0 ? (
          <EmptyState
            description="No municipal services are currently available to the public."
            title="No services cataloged"
          />
        ) : null}

        {/* Services Cards Grid */}
        {!isLoading && !error && activeServices.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => (
              <article
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                key={service.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      Active Public Service
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-950">
                    {service.name}
                  </h2>

                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {service.description || "Official municipal service provision available to registered city residents."}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold tracking-tight text-slate-950">
                      ${formatServicePrice(service.price)}
                    </span>
                    <span className="text-xs text-slate-500"> / unit</span>
                  </div>
                  <Link
                    className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                    href={`/services/${service.id}`}
                  >
                    View Details →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </PublicLayout>
  );
}
