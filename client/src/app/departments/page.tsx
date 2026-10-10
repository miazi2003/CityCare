"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<Department[]>("departments");

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        setDepartments(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete departments response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadDepartments();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-lg font-bold tracking-tight text-slate-950" href="/">
              City Care
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Departments
            </h1>
            <p className="mt-2 text-slate-600">
              Explore the municipal departments available through City Care.
            </p>
          </div>
          <Link className="text-sm font-medium text-slate-700 underline" href="/categories">
            View complaint categories
          </Link>
        </header>

        {isLoading ? <LoadingState message="Loading departments…" /> : null}

        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        ) : null}

        {!isLoading && !error && departments.length === 0 ? (
          <EmptyState
            description="No active departments are currently available to the public."
            title="No departments available"
          />
        ) : null}

        {!isLoading && !error && departments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs" key={department.id}>
                <h2 className="text-lg font-semibold text-slate-950">{department.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {department.description || "No description is available for this department."}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
