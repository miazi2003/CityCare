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
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "CANCELLED",
  "REJECTED",
  "SUBMITTED",
  "UNDER_REVIEW",
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
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "UNDER_REVIEW":
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

export default function StaffComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadAssignedComplaints() {
      const result = await apiRequest<Complaint[]>("complaints/assigned");

      if (!isMounted) return;

      if (result.success && Array.isArray(result.data)) {
        setComplaints(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load assigned complaints.");
      }

      setIsLoading(false);
    }

    void loadAssignedComplaints();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Extract unique categories from assigned complaints
  const availableCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of complaints) {
      if (c.category?.id && c.category?.name) {
        map.set(c.category.id, c.category.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [complaints]);

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
        const departmentName = complaint.department?.name?.toLowerCase() || "";
        const categoryName = complaint.category?.name?.toLowerCase() || "";
        const id = complaint.id.toLowerCase();

        const matches =
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          citizenName.includes(query) ||
          citizenEmail.includes(query) ||
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
    selectedCategoryId,
    searchTerm,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedStatus ||
      selectedPriority ||
      selectedSlaStatus ||
      selectedCategoryId
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedSlaStatus("");
    setSelectedCategoryId("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Staff Workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Assigned Complaints
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and track all complaints assigned to you across departments and categories.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            href="/staff/sla-queue"
          >
            View SLA Queue &rarr;
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading assigned complaints…
        </div>
      ) : null}

      {/* Error state */}
      {error && !isLoading ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">Unable to load assigned complaints</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Search text filter */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="search-complaints">
                  Search Complaints
                </label>
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="search-complaints"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  placeholder="Search title, citizen, location, category…"
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

              {/* Category filter */}
              {availableCategories.length > 0 ? (
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700" htmlFor="category-filter">
                    Category
                  </label>
                  <select
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    id="category-filter"
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategoryId(e.target.value)}
                    value={selectedCategoryId}
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Showing {filteredComplaints.length} of {complaints.length} assigned complaints
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

          {/* Empty state: No complaints assigned */}
          {complaints.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">No complaints assigned</h3>
              <p className="mt-2 text-sm text-slate-600">
                You currently have no municipal complaints assigned to your account.
              </p>
            </div>
          ) : null}

          {/* Empty state: Filters yielded 0 results */}
          {complaints.length > 0 && filteredComplaints.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-900">
                No assigned complaints matched your filters.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search criteria or resetting filters.
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
                          href={`/staff/complaints/${complaint.id}`}
                        >
                          {complaint.title}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-slate-400">ID: {complaint.id}</p>
                    </div>

                    <div className="shrink-0 pt-1 sm:pt-0">
                      <Link
                        className="inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        href={`/staff/complaints/${complaint.id}`}
                      >
                        Inspect Details &rarr;
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
                      <dt className="font-medium text-slate-400">Category / Dept</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">
                        {complaint.category?.name || "General"} &bull;{" "}
                        {complaint.department?.name || "Municipal"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Location</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">{complaint.location}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">SLA Due Date</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">
                        {complaint.dueAt ? formatDueDate(complaint.dueAt) : "—"}
                      </dd>
                    </div>
                  </dl>

                  {/* Citizen Feedback Summary when available */}
                  {complaint.feedback ? (
                    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">Citizen Rating:</span>
                        <span className="text-amber-500">
                          {"★".repeat(complaint.feedback.rating)}
                          {"☆".repeat(5 - complaint.feedback.rating)}
                        </span>
                        <span className="text-slate-500">({complaint.feedback.rating}/5)</span>
                      </div>
                      {complaint.feedback.comment ? (
                        <p className="mt-1 italic text-slate-600">
                          &ldquo;{complaint.feedback.comment}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-2">
                    <span>Submitted: {formatDate(complaint.createdAt)}</span>
                    <Link
                      className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
                      href={`/staff/complaints/${complaint.id}`}
                    >
                      View history &amp; actions &rarr;
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

