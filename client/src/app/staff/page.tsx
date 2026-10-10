"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import type { Complaint, ComplaintPriority, ComplaintStatus, Notification, SLAStatus } from "@/types";

type StaffDashboardErrors = {
  assignedComplaints?: string;
  slaComplaints?: string;
  notifications?: string;
};

type SummaryCardProps = {
  label: string;
  value: number | string;
  detail: string;
  variant?: "default" | "alert" | "success" | "warning";
};

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(dateStr: string | null | undefined): string {
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
      return "bg-red-50 text-red-700 border-red-200";
    case "ON_TIME":
    case "COMPLETED_ON_TIME":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function SummaryCard({ label, value, detail, variant = "default" }: SummaryCardProps) {
  let borderStyle = "border-slate-200";
  let textStyle = "text-slate-950";

  if (variant === "alert") {
    borderStyle = "border-red-200 bg-red-50/40";
    textStyle = "text-red-700";
  } else if (variant === "success") {
    borderStyle = "border-emerald-200 bg-emerald-50/40";
    textStyle = "text-emerald-700";
  } else if (variant === "warning") {
    borderStyle = "border-amber-200 bg-amber-50/40";
    textStyle = "text-amber-800";
  }

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-xs transition ${borderStyle}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${textStyle}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [slaComplaints, setSlaComplaints] = useState<Complaint[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [errors, setErrors] = useState<StaffDashboardErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [assignedResult, slaResult, notificationsResult] = await Promise.all([
        apiRequest<Complaint[]>("complaints/assigned"),
        apiRequest<Complaint[]>("complaints/sla/my"),
        apiRequest<Notification[]>("notifications/unread"),
      ]);

      if (!isMounted) return;

      const nextErrors: StaffDashboardErrors = {};

      if (assignedResult.success && Array.isArray(assignedResult.data)) {
        setAssignedComplaints(assignedResult.data);
      } else {
        nextErrors.assignedComplaints =
          assignedResult.message || "Failed to load assigned complaints.";
      }

      if (slaResult.success && Array.isArray(slaResult.data)) {
        setSlaComplaints(slaResult.data);
      } else {
        nextErrors.slaComplaints = slaResult.message || "Failed to load SLA complaints.";
      }

      if (notificationsResult.success && Array.isArray(notificationsResult.data)) {
        setUnreadNotifications(notificationsResult.data);
      } else {
        nextErrors.notifications =
          notificationsResult.message || "Failed to load unread notifications.";
      }

      setErrors(nextErrors);
      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const metrics = useMemo(() => {
    const total = assignedComplaints.length;
    const assigned = assignedComplaints.filter((c) => c.status === "ASSIGNED").length;
    const inProgress = assignedComplaints.filter((c) => c.status === "IN_PROGRESS").length;
    const activeWorkload = assigned + inProgress;
    const resolved = assignedComplaints.filter(
      (c) => c.status === "RESOLVED" || c.status === "CLOSED"
    ).length;
    const breached = assignedComplaints.filter((c) => c.slaStatus === "BREACHED").length;

    return {
      total,
      activeWorkload,
      assigned,
      inProgress,
      resolved,
      breached,
      slaQueueCount: slaComplaints.length,
      unreadCount: unreadNotifications.length,
    };
  }, [assignedComplaints, slaComplaints, unreadNotifications]);

  // Urgent / Near-due / High-priority active complaints
  const urgentComplaints = useMemo(() => {
    return slaComplaints
      .filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
      .slice(0, 4);
  }, [slaComplaints]);

  // Recent assigned complaints
  const recentAssigned = useMemo(() => {
    return assignedComplaints.slice(0, 5);
  }, [assignedComplaints]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Staff Workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Welcome, {user?.name || "Staff Member"}
          </h1>
          <p className="mt-2 text-slate-600">
            Manage your assigned complaints, monitor SLA deadlines, and resolve municipal issues.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
            href="/staff/complaints"
          >
            Assigned Complaints ({metrics.total})
          </Link>
          <Link
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            href="/staff/sla"
          >
            SLA Queue ({metrics.slaQueueCount})
          </Link>
        </div>
      </header>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading staff dashboard…
        </div>
      ) : null}

      {!isLoading && (
        <>
          {/* Summary metrics cards */}
          <section aria-label="Staff metrics summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              detail="Total complaints assigned to you"
              label="Assigned Complaints"
              value={errors.assignedComplaints ? "—" : metrics.total}
            />
            <SummaryCard
              detail={`${metrics.assigned} assigned, ${metrics.inProgress} in progress`}
              label="Active Workload"
              value={errors.assignedComplaints ? "—" : metrics.activeWorkload}
              variant="warning"
            />
            <SummaryCard
              detail={metrics.breached > 0 ? "Requires immediate attention" : "All within SLA window"}
              label="SLA Breached"
              value={errors.assignedComplaints ? "—" : metrics.breached}
              variant={metrics.breached > 0 ? "alert" : "default"}
            />
            <SummaryCard
              detail="Resolved or confirmed closed"
              label="Resolved &amp; Closed"
              value={errors.assignedComplaints ? "—" : metrics.resolved}
              variant="success"
            />
          </section>

          {/* SLA Alerts / Urgent Queue Section */}
          {urgentComplaints.length > 0 ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <span>SLA Priority Queue</span>
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      Active
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Complaints ordered by due date deadline requiring resolution.
                  </p>
                </div>
                <Link
                  className="text-xs font-semibold text-amber-900 underline hover:text-amber-950"
                  href="/staff/sla"
                >
                  View full SLA queue &rarr;
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {urgentComplaints.map((complaint) => (
                  <article
                    className="rounded-lg border border-amber-200/80 bg-white p-4 shadow-2xs"
                    key={complaint.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(
                          complaint.status
                        )}`}
                      >
                        {formatStatus(complaint.status)}
                      </span>
                      {complaint.slaStatus ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getSlaBadgeClasses(
                            complaint.slaStatus
                          )}`}
                        >
                          SLA: {formatStatus(complaint.slaStatus)}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-slate-950 hover:underline">
                      <Link href={`/staff/complaints/${complaint.id}`}>{complaint.title}</Link>
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                      <span>Due: {formatDateTime(complaint.dueAt)}</span>
                      <span className="font-semibold text-slate-700">
                        {complaint.priority} priority
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Main Grid: Recent Assigned Complaints & Workspace Links */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Assigned Complaints (2 Cols) */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Assigned Complaints</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Latest issues assigned to you for inspection and action.
                  </p>
                </div>
                <Link
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900 underline"
                  href="/staff/complaints"
                >
                  View all ({metrics.total})
                </Link>
              </div>

              {errors.assignedComplaints ? (
                <div
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700"
                  role="alert"
                >
                  <p className="font-semibold">Error loading assigned complaints</p>
                  <p className="mt-1">{errors.assignedComplaints}</p>
                  <button
                    className="mt-2 text-xs font-semibold text-red-800 underline"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              {!errors.assignedComplaints && recentAssigned.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium">No complaints currently assigned</p>
                  <p className="mt-1 text-xs text-slate-400">
                    When administrators assign complaints to you, they will appear here.
                  </p>
                </div>
              ) : null}

              {!errors.assignedComplaints && recentAssigned.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {recentAssigned.map((complaint) => (
                    <li className="py-4 first:pt-4" key={complaint.id}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(
                                complaint.status
                              )}`}
                            >
                              {formatStatus(complaint.status)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeClasses(
                                complaint.priority
                              )}`}
                            >
                              {formatStatus(complaint.priority)}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-950 hover:underline">
                            <Link href={`/staff/complaints/${complaint.id}`}>
                              {complaint.title}
                            </Link>
                          </h3>

                          <p className="text-xs text-slate-500">
                            Category:{" "}
                            <span className="font-medium text-slate-700">
                              {complaint.category?.name || "General"}
                            </span>
                            {complaint.citizen?.name ? (
                              <> &bull; Citizen: <span className="font-medium text-slate-700">{complaint.citizen.name}</span></>
                            ) : null}
                          </p>
                        </div>

                        <div className="shrink-0 text-right sm:self-center">
                          <Link
                            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            href={`/staff/complaints/${complaint.id}`}
                          >
                            Details &rarr;
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            {/* Quick Actions & Workspace Info (1 Col) */}
            <div className="space-y-6">
              {/* Quick Navigation Card */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Quick Navigation
                </h2>
                <div className="mt-4 space-y-2.5">
                  <Link
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                    href="/staff/complaints"
                  >
                    <span>Assigned Complaints</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      {metrics.total}
                    </span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                    href="/staff/sla"
                  >
                    <span>SLA Priority Queue</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                      {metrics.slaQueueCount}
                    </span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                    href="/staff/notifications"
                  >
                    <span>Unread Notifications</span>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                      {metrics.unreadCount}
                    </span>
                  </Link>
                </div>
              </section>

              {/* Staff SLA Guidelines Card */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  SLA Response Workflow
                </h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-900">1.</span>
                    <span>Review newly assigned complaints and check location / details.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-900">2.</span>
                    <span>Update status to In Progress when beginning field work or resolution.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-900">3.</span>
                    <span>Provide resolution notes upon completing the complaint to notify the citizen.</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

