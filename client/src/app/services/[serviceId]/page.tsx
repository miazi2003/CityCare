"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { MunicipalService } from "@/types";

const ServiceDetailContent = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<MunicipalService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadService = async () => {
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
  }, [serviceId]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-slate-200 pb-6">
          <Link className="text-lg font-bold tracking-tight text-slate-950" href="/">
            City Care
          </Link>
          <p className="mt-4 text-sm">
            <Link className="font-medium text-slate-700 underline" href="/services">
              Back to municipal services
            </Link>
          </p>
        </header>

        {isLoading ? <p className="text-slate-600">Loading service…</p> : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {isUnavailable ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-950">Service unavailable</h1>
            <p className="mt-2 text-slate-600">
              This municipal service is not currently available to the public.
            </p>
          </section>
        ) : null}

        {service ? (
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-slate-500">Municipal service</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {service.name}
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600">
              {service.description || "No description is available for this service."}
            </p>
            <p className="mt-6 text-lg font-semibold text-slate-950">
              Price: {formatServicePrice(service.price)}
            </p>
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
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-600 sm:px-6 lg:px-8">
          Loading service…
        </main>
      }
    >
      <ServiceDetailContent />
    </Suspense>
  );
}
