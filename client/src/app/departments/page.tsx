"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
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
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
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

        {isLoading ? <p className="text-slate-600">Loading departments…</p> : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && departments.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
            No active departments are available right now.
          </p>
        ) : null}

        {!isLoading && !error && departments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={department.id}>
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
