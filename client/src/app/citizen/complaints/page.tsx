"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import type {
  CategoryReference,
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  DepartmentReference,
  SLAStatus,
} from "@/types";

const statusOptions: ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
  "REOPENED",
];

const priorityOptions: ComplaintPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getStatusBadgeClasses(status: ComplaintStatus): string {
  switch (status) {
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
    case "ASSIGNED":
    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SUBMITTED":
    case "REOPENED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "REJECTED":
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getPriorityBadgeClasses(priority: ComplaintPriority): string {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "LOW":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getSlaBadgeClasses(slaStatus: NonNullable<SLAStatus>): string {
  switch (slaStatus) {
    case "BREACHED":
    case "COMPLETED_LATE":
      return "bg-red-50 text-red-700 border-red-200";
    case "ON_TIME":
    case "COMPLETED_ON_TIME":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function CitizenComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadComplaints() {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<Complaint[]>("complaints/my");

      if (!isMounted) {
        return;
      }

      if (result.success && result.data !== null) {
        setComplaints(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete complaints response."
            : result.message
        );
      }

      setIsLoading(false);
    }

    void loadComplaints();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Extract unique departments from complaints
  const departments = useMemo(() => {
    const map = new Map<string, DepartmentReference>();
    for (const complaint of complaints) {
      if (complaint.department && !map.has(complaint.department.id)) {
        map.set(complaint.department.id, complaint.department);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [complaints]);

  // Extract unique categories from complaints (optionally constrained by selected department)
  const categories = useMemo(() => {
    const map = new Map<string, CategoryReference>();
    for (const complaint of complaints) {
      if (
        complaint.category &&
        (!selectedDepartmentId || complaint.departmentId === selectedDepartmentId) &&
        !map.has(complaint.category.id)
      ) {
        map.set(complaint.category.id, complaint.category);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [complaints, selectedDepartmentId]);

  // Filter complaints client-side
  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      // Status filter
      if (selectedStatus && complaint.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority && complaint.priority !== selectedPriority) {
        return false;
      }

      // Department filter
      if (selectedDepartmentId && complaint.departmentId !== selectedDepartmentId) {
        return false;
      }

      // Category filter
      if (selectedCategoryId && complaint.categoryId !== selectedCategoryId) {
        return false;
      }

      // Text search
      if (normalizedSearch) {
        const matchesTitle = complaint.title.toLowerCase().includes(normalizedSearch);
        const matchesDescription = complaint.description.toLowerCase().includes(normalizedSearch);
        const matchesLocation = complaint.location.toLowerCase().includes(normalizedSearch);
        const matchesId = complaint.id.toLowerCase().includes(normalizedSearch);

        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [
    complaints,
    searchTerm,
    selectedStatus,
    selectedPriority,
    selectedDepartmentId,
    selectedCategoryId,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedStatus ||
      selectedPriority ||
      selectedDepartmentId ||
      selectedCategoryId
  );

  function resetFilters() {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedDepartmentId("");
    setSelectedCategoryId("");
  }

  function handleDepartmentChange(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedDepartmentId(e.target.value);
    setSelectedCategoryId("");
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Citizen portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            My complaints
          </h1>
          <p className="mt-2 text-slate-600">
            Track and review all municipal complaints you have submitted.
          </p>
        </div>
        <Link
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/citizen/complaints/new"
        >
          Submit a complaint
        </Link>
      </header>

      {/* Loading state */}
      {isLoading ? <LoadingState message="Loading your complaints…" /> : null}

      {/* Error state */}
      {error ? (
        <ErrorAlert
          message={error}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
      ) : null}

      {/* Main Content */}
      {!isLoading && !error ? (
        <>
          {/* Empty state (no complaints created yet) */}
          {complaints.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">No complaints found</h2>
              <p className="mt-2 text-sm text-slate-600">
                You have not submitted any complaints yet.
              </p>
              <Link
                className="mt-5 inline-block rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/citizen/complaints/new"
              >
                Submit your first complaint
              </Link>
            </div>
          ) : (
            <>
              {/* Filters toolbar */}
              <section
                aria-label="Filter complaints"
                className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {/* Search input */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="search">
                      Search
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      id="search"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Title, description, location…"
                      type="text"
                      value={searchTerm}
                    />
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="status-filter">
                      Status
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      id="status-filter"
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      value={selectedStatus}
                    >
                      <option value="">All statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority filter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="priority-filter">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      id="priority-filter"
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      value={selectedPriority}
                    >
                      <option value="">All priorities</option>
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {formatStatus(priority)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department filter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="department-filter">
                      Department
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      id="department-filter"
                      onChange={handleDepartmentChange}
                      value={selectedDepartmentId}
                    >
                      <option value="">All departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category filter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="category-filter">
                      Category
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      id="category-filter"
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      value={selectedCategoryId}
                    >
                      <option value="">All categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter counts & Reset */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span>
                    Showing {filteredComplaints.length} of {complaints.length} complaints
                  </span>
                  {hasActiveFilters ? (
                    <button
                      className="font-medium text-slate-900 underline transition hover:text-slate-700"
                      onClick={resetFilters}
                      type="button"
                    >
                      Reset filters
                    </button>
                  ) : null}
                </div>
              </section>

              {/* No search results */}
              {filteredComplaints.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-slate-600">
                    No complaints match your current filter criteria.
                  </p>
                  <button
                    className="mt-3 text-sm font-medium text-slate-900 underline transition hover:text-slate-700"
                    onClick={resetFilters}
                    type="button"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                /* Complaints list */
                <ul className="space-y-4">
                  {filteredComplaints.map((complaint) => (
                    <li
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6"
                      key={complaint.id}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(
                                complaint.status
                              )}`}
                            >
                              {formatStatus(complaint.status)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadgeClasses(
                                complaint.priority
                              )}`}
                            >
                              {formatStatus(complaint.priority)} priority
                            </span>
                            {complaint.slaStatus ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSlaBadgeClasses(
                                  complaint.slaStatus
                                )}`}
                              >
                                SLA: {formatStatus(complaint.slaStatus)}
                              </span>
                            ) : null}
                          </div>

                          <h2 className="mt-2 text-lg font-semibold text-slate-950">
                            <Link
                              className="transition hover:underline"
                              href={`/citizen/complaints/${complaint.id}`}
                            >
                              {complaint.title}
                            </Link>
                          </h2>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {complaint.description}
                          </p>

                          {/* Metadata row */}
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                            <div>
                              <span className="font-medium text-slate-700">Department:</span>{" "}
                              {complaint.department?.name || "—"}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Category:</span>{" "}
                              {complaint.category?.name || "—"}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Location:</span>{" "}
                              {complaint.location}
                            </div>
                            {complaint.assignedStaff ? (
                              <div>
                                <span className="font-medium text-slate-700">Assigned staff:</span>{" "}
                                {complaint.assignedStaff.name}
                              </div>
                            ) : null}
                            <div>
                              <span className="font-medium text-slate-700">Submitted:</span>{" "}
                              {formatDate(complaint.createdAt)}
                            </div>
                            {complaint.dueAt ? (
                              <div>
                                <span className="font-medium text-slate-700">Due date:</span>{" "}
                                {formatDueDate(complaint.dueAt)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0 sm:self-center">
                          <Link
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            href={`/citizen/complaints/${complaint.id}`}
                          >
                            View details &rarr;
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

