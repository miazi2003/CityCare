"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { getRoleHomeRoute } from "@/lib/auth-routes";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { MunicipalService } from "@/types";

const ServiceDetailContent = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [service, setService] = useState<MunicipalService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadService = async () => {
      setIsLoading(true);
      setError(null);
      setIsUnavailable(false);

      const result = await apiRequest<MunicipalService>(
        `services/${encodeURIComponent(serviceId)}`
      );

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        if (result.data.isActive) {
          setService(result.data);
        } else {
          setIsUnavailable(true);
        }
      } else if (!result.success && result.status === 404) {
        setIsUnavailable(true);
      } else {
        setError(result.message || "Failed to load service details.");
      }

      setIsLoading(false);
    };

    void loadService();

    return () => {
      isMounted = false;
    };
  }, [serviceId, refreshKey]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950 transition"
          href="/services"
        >
          ← Back to all municipal services
        </Link>
      </div>

        {isLoading ? <LoadingState message="Loading service details…" /> : null}

        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
            retryLabel="Retry loading service"
          />
        ) : null}

        {/* Inactive or Missing Service Card */}
        {isUnavailable ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
              ℹ
            </div>
            <h1 className="text-2xl font-bold text-slate-950">
              Service Unavailable
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              This municipal service is not currently active or available for public request submission.
            </p>
            <div className="mt-6">
              <Link
                className="inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                href="/services"
              >
                Browse Active Services Catalog
              </Link>
            </div>
          </section>
        ) : null}

        {/* Active Service Details */}
        {service ? (
          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
                <div>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Active Municipal Service
                  </span>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    {service.name}
                  </h1>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Service Fee
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-950">
                    ${formatServicePrice(service.price)}
                  </p>
                  <p className="text-[11px] text-slate-500">Per service unit</p>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Service Description &amp; Provisions
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {service.description || "No specific description has been recorded for this municipal service."}
                </p>
              </div>

              {/* Request Actions Area */}
              <div className="border-t border-slate-100 pt-6">
                {isAuthenticated && user?.role === "CITIZEN" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Ready to request this service?
                      </p>
                      <p className="text-xs text-slate-600">
                        Submit location details and notes to initiate municipal fulfillment.
                      </p>
                    </div>
                    <Link
                      className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 text-center"
                      href={`/citizen/service-requests/new?serviceId=${service.id}`}
                    >
                      Request This Service →
                    </Link>
                  </div>
                ) : isAuthenticated && (user?.role === "STAFF" || user?.role === "ADMIN") ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">Staff / Admin Session Active</p>
                      <p className="mt-0.5 text-blue-700">
                        Service requests are submitted through citizen accounts. You are signed in as a municipal operator.
                      </p>
                    </div>
                    <Link
                      className="inline-flex shrink-0 items-center font-semibold text-blue-900 underline"
                      href={getRoleHomeRoute(user.role)}
                    >
                      Open Dashboard →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Citizen Account Required
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Please sign in or register as a citizen to request municipal services and track fulfillment.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50"
                        href="/login"
                      >
                        Sign in
                      </Link>
                      <Link
                        className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                        href="/register"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        ) : null}
      </main>
  );
};

export default function ServiceDetailPage() {
  return (
    <PublicLayout>
      <Suspense
        fallback={
          <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <LoadingState message="Loading service details…" />
          </main>
        }
      >
        <ServiceDetailContent />
      </Suspense>
    </PublicLayout>
  );
}
