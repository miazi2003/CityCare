"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { MunicipalService } from "@/types";

const ServiceDetailContent = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
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

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        if (result.data.isActive) {
          setService(result.data);
        } else {
          setIsUnavailable(true);
        }
      } else if (!result.success && result.status === 404) {
        setIsUnavailable(true);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete service response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadService();

    return () => {
      isMounted = false;
    };
  }, [serviceId, refreshKey]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-lg font-bold tracking-tight text-slate-950" href="/">
            City Care
          </Link>
          <p className="mt-4 text-sm">
            <Link className="font-medium text-slate-700 underline" href="/services">
              ← Back to municipal services
            </Link>
          </p>
        </header>

        {isLoading ? <LoadingState message="Loading service details…" /> : null}

        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        ) : null}

        {isUnavailable ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs text-center sm:p-10">
            <h1 className="text-xl font-bold text-slate-950">Service Unavailable</h1>
            <p className="mt-2 text-sm text-slate-600">
              This municipal service is not currently active or available to the public.
            </p>
            <Link
              className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
              href="/services"
            >
              Browse Available Services
            </Link>
          </section>
        ) : null}

        {service ? (
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Municipal Service
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {service.name}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              {service.description || "No description is available for this service."}
            </p>
            <div className="border-t border-slate-100 pt-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-950">
                ${formatServicePrice(service.price)}
              </span>
              <span className="text-xs text-slate-500">/ service unit</span>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
};

export default function ServiceDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
          <LoadingState message="Loading service…" />
        </main>
      }
    >
      <ServiceDetailContent />
    </Suspense>
  );
}
