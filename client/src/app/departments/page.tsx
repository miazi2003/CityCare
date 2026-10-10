"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import type { Category, Department } from "@/types";

export default function DepartmentsPage() {
  const { isAuthenticated, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [deptResult, catResult] = await Promise.all([
        apiRequest<Department[]>("departments"),
        apiRequest<Category[]>("categories"),
      ]);

      if (!isMounted) return;

      if (deptResult.success && deptResult.data !== null) {
        setDepartments(deptResult.data);
      } else {
        setError(deptResult.message || "Failed to load municipal departments.");
      }

      if (catResult.success && catResult.data !== null) {
        setCategories(catResult.data);
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Group categories by department ID for rich context
  const categoriesByDept = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const cat of categories) {
      const list = map.get(cat.departmentId) || [];
      list.push(cat);
      map.set(cat.departmentId, list);
    }
    return map;
  }, [categories]);

  const getComplaintActionUrl = () => {
    if (isAuthenticated && user?.role === "CITIZEN") {
      return "/citizen/complaints/new";
    }
    return "/login";
  };

  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Page Hero Header */}
        <div className="border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs mb-3">
                Municipal Governance
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Municipal Departments
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Explore the active operational departments responsible for managing public infrastructure, civic inquiries, and municipal complaint resolution.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/categories"
              >
                View Complaint Categories
              </Link>
              <Link
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                href={getComplaintActionUrl()}
              >
                Submit a Complaint
              </Link>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? <LoadingState message="Loading municipal departments…" /> : null}

        {/* Error State */}
        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
            retryLabel="Retry loading departments"
          />
        ) : null}

        {/* Empty State */}
        {!isLoading && !error && departments.length === 0 ? (
          <EmptyState
            description="No active departments are currently listed on the public portal."
            title="No departments found"
          />
        ) : null}

        {/* Department Cards Grid */}
        {!isLoading && !error && departments.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const deptCategories = categoriesByDept.get(department.id) || [];

              return (
                <article
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                  key={department.id}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-bold text-base">
                        {department.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {deptCategories.length} {deptCategories.length === 1 ? "category" : "categories"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-950">
                      {department.name}
                    </h2>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {department.description || "Active municipal department providing public community administration and civic oversight."}
                    </p>

                    {/* Associated Category Pills */}
                    {deptCategories.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Handled Categories:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {deptCategories.slice(0, 4).map((cat) => (
                            <span
                              className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 border border-slate-200/80"
                              key={cat.id}
                            >
                              {cat.name}
                            </span>
                          ))}
                          {deptCategories.length > 4 ? (
                            <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500 border border-slate-200/80">
                              +{deptCategories.length - 4} more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium">
                    <Link
                      className="text-slate-900 hover:underline"
                      href="/categories"
                    >
                      Browse categories →
                    </Link>
                    <Link
                      className="text-slate-700 hover:text-slate-950 underline"
                      href={getComplaintActionUrl()}
                    >
                      Report issue
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </PublicLayout>
  );
}
