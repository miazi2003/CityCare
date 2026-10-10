"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
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

const slaStatusOptions: NonNullable<SLAStatus>[] = [
  "ON_TIME",
  "BREACHED",
  "COMPLETED_ON_TIME",
  "COMPLETED_LATE",
];

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

function formatDueDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
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
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SUBMITTED":
    case "REOPENED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "UNDER_REVIEW":
      return "bg-sky-50 text-sky-700 border-sky-200";
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
      return "bg-red-50 text-red-700 border-red-200 font-semibold";
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
      return "bg-red-50 text-red-700 border-red-200 font-semibold";
    case "ON_TIME":
    case "COMPLETED_ON_TIME":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadComplaints() {
      const result = await apiRequest<Complaint[]>("complaints");

      if (!isMounted) return;

      if (result.success && Array.isArray(result.data)) {
        setComplaints(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load complaints.");
      }

      setIsLoading(false);
    }

    void loadComplaints();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Extract unique departments & categories for filters
  const { availableDepartments, availableCategories } = useMemo(() => {
    const deptMap = new Map<string, string>();
    const catMap = new Map<string, { id: string; name: string; departmentId: string }>();

    for (const c of complaints) {
      if (c.department?.id && c.department?.name) {
        deptMap.set(c.department.id, c.department.name);
      }
      if (c.category?.id && c.category?.name) {
        catMap.set(c.category.id, {
          id: c.category.id,
          name: c.category.name,
          departmentId: c.departmentId,
        });
      }
    }

    return {
      availableDepartments: Array.from(deptMap.entries()).map(([id, name]) => ({ id, name })),
      availableCategories: Array.from(catMap.values()),
    };
  }, [complaints]);

  const filteredCategories = useMemo(() => {
    if (!selectedDepartmentId) return availableCategories;
    return availableCategories.filter((cat) => cat.departmentId === selectedDepartmentId);
  }, [availableCategories, selectedDepartmentId]);

  // Client-side filtering
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (selectedStatus && complaint.status !== selectedStatus) {
        return false;
      }

      if (selectedPriority && complaint.priority !== selectedPriority) {
        return false;
      }

      if (selectedSlaStatus && complaint.slaStatus !== selectedSlaStatus) {
        return false;
      }

      if (selectedDepartmentId && complaint.departmentId !== selectedDepartmentId) {
        return false;
      }

      if (selectedCategoryId && complaint.categoryId !== selectedCategoryId) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const title = complaint.title?.toLowerCase() || "";
        const description = complaint.description?.toLowerCase() || "";
        const location = complaint.location?.toLowerCase() || "";
        const citizenName = complaint.citizen?.name?.toLowerCase() || "";
        const citizenEmail = complaint.citizen?.email?.toLowerCase() || "";
        const staffName = complaint.assignedStaff?.name?.toLowerCase() || "";
        const departmentName = complaint.department?.name?.toLowerCase() || "";
        const categoryName = complaint.category?.name?.toLowerCase() || "";
        const id = complaint.id.toLowerCase();

        const matches =
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          citizenName.includes(query) ||
          citizenEmail.includes(query) ||
          staffName.includes(query) ||
          departmentName.includes(query) ||
          categoryName.includes(query) ||
          id.includes(query);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [
    complaints,
    selectedStatus,
    selectedPriority,
    selectedSlaStatus,
    selectedDepartmentId,
    selectedCategoryId,
    searchTerm,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedStatus ||
      selectedPriority ||
      selectedSlaStatus ||
      selectedDepartmentId ||
      selectedCategoryId
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedSlaStatus("");
    setSelectedDepartmentId("");
    setSelectedCategoryId("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Platform Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Complaints Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review, inspect, assign, and track municipal complaints across all city departments.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            href="/admin"
          >
            &larr; System Overview
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading complaints list…
        </div>
      ) : null}

      {/* Error state */}
      {error && !isLoading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">Unable to load complaints</p>
          <p className="mt-1">{error}</p>
          <button
            className="mt-4 inline-block font-semibold text-red-800 underline hover:text-red-950"
            onClick={() => setRefreshKey((k) => k + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !error && (
        <>
          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {/* Search text filter */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="search-complaints">
                  Search Complaints
                </label>
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="search-complaints"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  placeholder="Search title, citizen, location, staff, ID…"
                  type="text"
                  value={searchTerm}
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="status-filter">
                  Status
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="status-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                  value={selectedStatus}
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="priority-filter">
                  Priority
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="priority-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedPriority(e.target.value)}
                  value={selectedPriority}
                >
                  <option value="">All Priorities</option>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatStatus(priority)}
                    </option>
                  ))}
                </select>
              </div>

              {/* SLA Status filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="sla-filter">
                  SLA Status
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="sla-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSlaStatus(e.target.value)}
                  value={selectedSlaStatus}
                >
                  <option value="">All SLA Statuses</option>
                  {slaStatusOptions.map((sla) => (
                    <option key={sla} value={sla}>
                      {formatStatus(sla)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="dept-filter">
                  Department
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="dept-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedCategoryId("");
                  }}
                  value={selectedDepartmentId}
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="cat-filter">
                  Category
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="cat-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategoryId(e.target.value)}
                  value={selectedCategoryId}
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Showing {filteredComplaints.length} of {complaints.length} complaints
                </p>
                <button
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                  onClick={resetFilters}
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            ) : null}
          </div>

          {/* Empty state: No complaints found */}
          {complaints.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">No complaints registered</h3>
              <p className="mt-2 text-sm text-slate-600">
                There are currently no complaints submitted on the platform.
              </p>
            </div>
          ) : null}

          {/* Filtered empty state */}
          {complaints.length > 0 && filteredComplaints.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-900">
                No complaints matched your selected filters.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try modifying your search criteria or resetting filters.
              </p>
              <button
                className="mt-4 inline-block rounded-md bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={resetFilters}
                type="button"
              >
                Clear all filters
              </button>
            </div>
          ) : null}

          {/* Complaints List Cards */}
          {filteredComplaints.length > 0 ? (
            <div className="grid gap-4">
              {filteredComplaints.map((complaint) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 sm:p-6"
                  key={complaint.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
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

                      <h2 className="text-lg font-bold text-slate-950">
                        <Link
                          className="hover:underline"
                          href={`/admin/complaints/${complaint.id}`}
                        >
                          {complaint.title}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-slate-400">ID: {complaint.id}</p>
                    </div>

                    <div className="shrink-0 pt-1 sm:pt-0">
                      <Link
                        className="inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        href={`/admin/complaints/${complaint.id}`}
                      >
                        Manage &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-medium text-slate-400">Citizen</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {complaint.citizen ? (
                          <span>
                            {complaint.citizen.name}{" "}
                            <span className="font-normal text-slate-500">
                              ({complaint.citizen.email})
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Department / Category</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">
                        {complaint.department?.name || "—"} &bull; {complaint.category?.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Assignee</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {complaint.assignedStaff ? (
                          <span className="text-slate-900">{complaint.assignedStaff.name}</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Unassigned</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">SLA Due Date</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">
                        {formatDueDate(complaint.dueAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-2">
                    <span>Submitted: {formatDate(complaint.createdAt)}</span>
                    <Link
                      className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                      href={`/admin/complaints/${complaint.id}`}
                    >
                      View details &amp; workflow &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
