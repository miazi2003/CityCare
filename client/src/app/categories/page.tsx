"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type { Category, DepartmentReference } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
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
  }, []);

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
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
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

        {!isLoading && !error ? (
          <div className="mb-6 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="department-filter">
              Filter by department
            </label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
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

        {isLoading ? <p className="text-slate-600">Loading categories…</p> : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && filteredCategories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
            No active categories match this department.
          </p>
        ) : null}

        {!isLoading && !error && filteredCategories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={category.id}>
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
