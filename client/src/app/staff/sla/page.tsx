"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  SLAStatus,
} from "@/types";

const priorityOptions: ComplaintPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const complaintStatusOptions: ComplaintStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
];

const slaStatusOptions: NonNullable<SLAStatus>[] = [
  "ON_TIME",
  "BREACHED",
];

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    case "UNDER_REVIEW":
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

function formatTimeRemaining(dueAtStr: string | null | undefined): {
  label: string;
  isOverdue: boolean;
  badgeClasses: string;
} {
  if (!dueAtStr) {
    return {
      label: "No deadline set",
      isOverdue: false,
      badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const dueDate = new Date(dueAtStr);
  if (Number.isNaN(dueDate.getTime())) {
    return {
      label: "Invalid date",
      isOverdue: false,
      badgeClasses: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const now = Date.now();
  const diffMs = dueDate.getTime() - now;
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const totalMinutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let timeString = "";
  if (days > 0) {
    timeString = `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    timeString = `${hours}h ${minutes}m`;
  } else {
    timeString = `${minutes}m`;
  }

  if (isOverdue) {
    return {
      label: `Overdue by ${timeString}`,
      isOverdue: true,
      badgeClasses: "bg-red-100 text-red-800 border-red-300 font-bold",
    };
  }

  // Under 4 hours remaining: warning
  if (totalMinutes <= 240) {
    return {
      label: `${timeString} remaining (Urgent)`,
      isOverdue: false,
      badgeClasses: "bg-amber-100 text-amber-900 border-amber-300 font-semibold",
    };
  }

  return {
    label: `${timeString} remaining`,
    isOverdue: false,
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
  };
}

export default function StaffSlaQueuePage() {
  const [slaComplaints, setSlaComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadSlaQueue() {
      const result = await apiRequest<Complaint[]>("complaints/sla/my");

      if (!isMounted) return;

      if (result.success && Array.isArray(result.data)) {
        setSlaComplaints(result.data);
        setError(null);
      } else {
        setError(result.message || "Failed to load SLA work queue.");
      }

      setIsLoading(false);
    }

    void loadSlaQueue();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side filtering preserving the backend dueAt asc order
  const filteredComplaints = useMemo(() => {
    return slaComplaints.filter((complaint) => {
      if (selectedSlaStatus && complaint.slaStatus !== selectedSlaStatus) {
        return false;
      }

      if (selectedPriority && complaint.priority !== selectedPriority) {
        return false;
      }

      if (selectedStatus && complaint.status !== selectedStatus) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const title = complaint.title?.toLowerCase() || "";
        const description = complaint.description?.toLowerCase() || "";
        const location = complaint.location?.toLowerCase() || "";
        const citizenName = complaint.citizen?.name?.toLowerCase() || "";
        const categoryName = complaint.category?.name?.toLowerCase() || "";
        const departmentName = complaint.department?.name?.toLowerCase() || "";
        const id = complaint.id.toLowerCase();

        const matches =
          title.includes(query) ||
          description.includes(query) ||
          location.includes(query) ||
          citizenName.includes(query) ||
          categoryName.includes(query) ||
          departmentName.includes(query) ||
          id.includes(query);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [slaComplaints, selectedSlaStatus, selectedPriority, selectedStatus, searchTerm]);

  const summary = useMemo(() => {
    const total = slaComplaints.length;
    const breached = slaComplaints.filter((c) => c.slaStatus === "BREACHED").length;
    const onTime = slaComplaints.filter((c) => c.slaStatus === "ON_TIME").length;
    const urgent = slaComplaints.filter((c) => c.priority === "URGENT").length;

    return { total, breached, onTime, urgent };
  }, [slaComplaints]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedSlaStatus || selectedPriority || selectedStatus
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSlaStatus("");
    setSelectedPriority("");
    setSelectedStatus("");
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
            SLA Work Queue
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Active complaints ordered strictly by due date deadline. Resolve urgent and overdue issues promptly.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            href="/staff/complaints"
          >
            &larr; All Assigned Complaints
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <LoadingState message="Loading SLA work queue…" />
      ) : null}

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorAlert
          message={error}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Unable to load SLA work queue"
        />
      ) : null}

      {!isLoading && !error && (
        <>
          {/* SLA Quick Status Cards */}
          <section aria-label="SLA Queue Highlights" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Total Active in Queue</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-950">{summary.total}</p>
              <p className="mt-1 text-xs text-slate-400">Assigned or In Progress</p>
            </article>

            <article
              className={`rounded-xl border p-4 shadow-xs ${
                summary.breached > 0
                  ? "border-red-200 bg-red-50/40 text-red-950"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">SLA Breached</p>
              <p className={`mt-1.5 text-2xl font-bold ${summary.breached > 0 ? "text-red-700" : "text-slate-950"}`}>
                {summary.breached}
              </p>
              <p className="mt-1 text-xs text-slate-400">Past target resolution window</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">On Time Target</p>
              <p className="mt-1.5 text-2xl font-bold text-emerald-700">{summary.onTime}</p>
              <p className="mt-1 text-xs text-slate-400">Within allowed resolution time</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Urgent Priority</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-950">{summary.urgent}</p>
              <p className="mt-1 text-xs text-slate-400">Highest priority workload</p>
            </article>
          </section>

          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="search-sla">
                  Search Queue
                </label>
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="search-sla"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  placeholder="Search title, citizen, location…"
                  type="text"
                  value={searchTerm}
                />
              </div>

              {/* SLA Status filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="sla-status-filter">
                  SLA Status
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="sla-status-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSlaStatus(e.target.value)}
                  value={selectedSlaStatus}
                >
                  <option value="">All SLA Statuses</option>
                  {slaStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="priority-sla-filter">
                  Priority
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="priority-sla-filter"
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

              {/* Complaint Status filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="complaint-status-filter">
                  Complaint Status
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="complaint-status-filter"
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                  value={selectedStatus}
                >
                  <option value="">All Active Statuses</option>
                  {complaintStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Showing {filteredComplaints.length} of {slaComplaints.length} complaints in queue
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

          {/* Empty state: No active SLA complaints */}
          {slaComplaints.length === 0 ? (
            <EmptyState
              actionHref="/staff/complaints"
              actionLabel="View all assigned complaints"
              description="You have no active complaints with pending SLA deadlines at this moment."
              title="SLA work queue is empty"
            />
          ) : null}

          {/* Empty state: Filter returned 0 */}
          {slaComplaints.length > 0 && filteredComplaints.length === 0 ? (
            <EmptyState
              actionLabel="Clear all filters"
              description="Try modifying your filter selections."
              onAction={resetFilters}
              title="No complaints in the SLA queue match your selected filters"
            />
          ) : null}

          {/* Queue Items */}
          {filteredComplaints.length > 0 ? (
            <div className="space-y-4">
              {filteredComplaints.map((complaint, index) => {
                const timeInfo = formatTimeRemaining(complaint.dueAt);
                const isBreached = complaint.slaStatus === "BREACHED" || timeInfo.isOverdue;

                return (
                  <article
                    className={`rounded-xl border p-5 shadow-xs transition sm:p-6 ${
                      isBreached
                        ? "border-red-300 bg-red-50/30 ring-1 ring-red-200"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    key={complaint.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
                            #{index + 1}
                          </span>

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

                          {/* Remaining / Overdue countdown badge */}
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${timeInfo.badgeClasses}`}
                          >
                            {timeInfo.label}
                          </span>
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
                          className={`inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition ${
                            isBreached
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-slate-900 hover:bg-slate-800"
                          }`}
                          href={`/staff/complaints/${complaint.id}`}
                        >
                          Work on Complaint &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-3">
                      <div>
                        <dt className="font-medium text-slate-400">Category / Department</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
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
                        <dd
                          className={`mt-0.5 font-semibold ${
                            isBreached ? "text-red-700" : "text-slate-900"
                          }`}
                        >
                          {formatDueDate(complaint.dueAt)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

