"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import type { Category, DepartmentReference } from "@/types";

export default function CategoriesPage() {
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

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        setCategories(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete categories response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const departments = useMemo(
    () =>
      categories.reduce<DepartmentReference[]>((uniqueDepartments, category) => {
        if (!uniqueDepartments.some((department) => department.id === category.department.id)) {
          uniqueDepartments.push(category.department);
        }

        return uniqueDepartments;
      }, []).sort((first, second) => first.name.localeCompare(second.name)),
    [categories]
  );

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-lg font-bold tracking-tight text-slate-950" href="/">
              City Care
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Complaint categories
            </h1>
            <p className="mt-2 text-slate-600">
              Choose a category that best matches a municipal issue.
            </p>
          </div>
          <Link className="text-sm font-medium text-slate-700 underline" href="/departments">
            View departments
          </Link>
        </header>

        {!isLoading && !error && categories.length > 0 ? (
          <div className="max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="department-filter">
              Filter by department
            </label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="department-filter"
              onChange={handleDepartmentChange}
              value={selectedDepartmentId}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {isLoading ? <LoadingState message="Loading categories…" /> : null}

        {error ? (
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        ) : null}

        {!isLoading && !error && categories.length === 0 ? (
          <EmptyState
            description="No complaint categories are currently available."
            title="No categories available"
          />
        ) : null}

        {!isLoading && !error && categories.length > 0 && filteredCategories.length === 0 ? (
          <EmptyState
            action={
              <button
                className="text-sm font-medium text-slate-900 underline hover:text-slate-700"
                onClick={() => setSelectedDepartmentId("")}
                type="button"
              >
                Clear filter
              </button>
            }
            description="No categories match the selected department."
            title="No matching categories"
          />
        ) : null}

        {!isLoading && !error && filteredCategories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs" key={category.id}>
                <p className="text-sm font-medium text-slate-500">{category.department.name}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{category.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {category.description || "No description is available for this category."}
                </p>
                <p className="mt-4 text-sm font-medium text-slate-800">
                  SLA: {category.slaHours} {category.slaHours === 1 ? "hour" : "hours"}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
