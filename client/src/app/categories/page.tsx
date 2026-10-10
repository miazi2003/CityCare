"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import type { Category, DepartmentReference } from "@/types";

export default function CategoriesPage() {
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<Category[]>("categories");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setCategories(result.data);
      } else {
        setError(result.message || "Failed to load complaint categories.");
      }

      setIsLoading(false);
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Extract unique departments for client-side filtering
  const departments = useMemo(
    () =>
      categories.reduce<DepartmentReference[]>((uniqueDepartments, category) => {
        if (!uniqueDepartments.some((dept) => dept.id === category.department.id)) {
          uniqueDepartments.push(category.department);
        }
        return uniqueDepartments;
      }, []).sort((first, second) => first.name.localeCompare(second.name)),
    [categories]
  );

  // Filter categories client-side by department
  const filteredCategories = useMemo(
    () =>
      selectedDepartmentId
        ? categories.filter((category) => category.departmentId === selectedDepartmentId)
        : categories,
    [categories, selectedDepartmentId]
  );

  const handleDepartmentChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartmentId(event.target.value);
  };

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
                Service Level Standards
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Complaint Categories
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Browse official municipal issue categories, responsible departments, and target Service Level Agreement (SLA) turnaround hours.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/departments"
              >
                View Departments
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

        {/* Filter Bar */}
        {!isLoading && !error && categories.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-slate-700 shrink-0"
                htmlFor="department-filter"
              >
                Filter by Department:
              </label>
              <select
                className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                id="department-filter"
                onChange={handleDepartmentChange}
                value={selectedDepartmentId}
              >
                <option value="">All Departments ({categories.length})</option>
                {departments.map((dept) => {
                  const count = categories.filter((c) => c.departmentId === dept.id).length;
                  return (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Showing {filteredCategories.length} of {categories.length} categories</span>
              {selectedDepartmentId ? (
                <button
                  className="font-semibold text-slate-900 underline hover:text-slate-700 ml-2 cursor-pointer"
                  onClick={() => setSelectedDepartmentId("")}
                  type="button"
                >
                  Reset filter
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Loading State */}
        {isLoading ? <LoadingState message="Loading complaint categories…" /> : null}

        {/* Error State */}
        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
            retryLabel="Retry loading categories"
          />
        ) : null}

        {/* Empty State */}
        {!isLoading && !error && categories.length === 0 ? (
          <EmptyState
            description="No complaint categories are currently registered on the platform."
            title="No categories found"
          />
        ) : null}

        {/* Filtered Empty State */}
        {!isLoading && !error && categories.length > 0 && filteredCategories.length === 0 ? (
          <EmptyState
            actionLabel="Show All Categories"
            description="No categories match the selected municipal department."
            onAction={() => setSelectedDepartmentId("")}
            title="No matching categories"
          />
        ) : null}

        {/* Categories Cards Grid */}
        {!isLoading && !error && filteredCategories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <article
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-md"
                key={category.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {category.department.name}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      SLA: {category.slaHours} {category.slaHours === 1 ? "hr" : "hrs"}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-950">
                    {category.name}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {category.description || "Public civic category for municipal complaint routing and inspection."}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium">
                  <span className="text-slate-500">
                    Target Resolution: <strong className="text-slate-800">{category.slaHours} hours</strong>
                  </span>
                  <Link
                    className="text-slate-950 underline hover:text-slate-700 font-semibold"
                    href={getComplaintActionUrl()}
                  >
                    Report this issue →
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
