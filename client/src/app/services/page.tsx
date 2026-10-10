"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { MunicipalService } from "@/types";

export default function ServicesPage() {
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

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        setServices(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete services response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-lg font-bold tracking-tight text-slate-950" href="/">
              City Care
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Municipal services
            </h1>
            <p className="mt-2 text-slate-600">
              Browse available municipal services and their current prices.
            </p>
          </div>
          <Link className="text-sm font-medium text-slate-700 underline" href="/departments">
            View departments
          </Link>
        </header>

        {isLoading ? <LoadingState message="Loading services…" /> : null}

        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        ) : null}

        {!isLoading && !error && activeServices.length === 0 ? (
          <EmptyState
            description="No municipal services are currently available to the public."
            title="No services available"
          />
        ) : null}

        {!isLoading && !error && activeServices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => (
              <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs" key={service.id}>
                <h2 className="text-lg font-semibold text-slate-950">{service.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {service.description || "No description is available for this service."}
                </p>
                <p className="mt-4 text-sm font-medium text-slate-800">
                  Price: {formatServicePrice(service.price)}
                </p>
                <Link
                  className="mt-5 text-sm font-medium text-slate-950 underline hover:text-slate-800"
                  href={`/services/${service.id}`}
                >
                  View service details →
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
