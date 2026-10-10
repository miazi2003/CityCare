"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  Notification,
  OverviewAnalytics,
} from "@/types";

type AdminDashboardErrors = {
  overview?: string;
  breachedSla?: string;
  notifications?: string;
};

type MetricCardProps = {
  label: string;
  value: number | string;
  detail?: string;
  variant?: "default" | "alert" | "success" | "warning" | "info";
  href?: string;
};

function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  const num = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(num)) return `$${amount}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

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

function MetricCard({ label, value, detail, variant = "default", href }: MetricCardProps) {
  let borderStyle = "border-slate-200 bg-white";
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
  } else if (variant === "info") {
    borderStyle = "border-sky-200 bg-sky-50/40";
    textStyle = "text-sky-800";
  }

  const content = (
    <article className={`rounded-xl border p-5 shadow-xs transition ${borderStyle} ${href ? "hover:border-slate-400 hover:shadow-sm" : ""}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${textStyle}`}>{value}</p>
      {detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}
    </article>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function AdminOverviewDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [breachedComplaints, setBreachedComplaints] = useState<Complaint[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [errors, setErrors] = useState<AdminDashboardErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [overviewResult, breachedResult, notificationsResult] = await Promise.all([
        apiRequest<OverviewAnalytics>("analytics/overview"),
        apiRequest<Complaint[]>("complaints/sla/breached"),
        apiRequest<Notification[]>("notifications/unread"),
      ]);

      if (!isMounted) return;

      const nextErrors: AdminDashboardErrors = {};

      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      } else {
        nextErrors.overview = overviewResult.message || "Failed to load overview analytics.";
      }

      if (breachedResult.success && Array.isArray(breachedResult.data)) {
        setBreachedComplaints(breachedResult.data);
      } else {
        nextErrors.breachedSla = breachedResult.message || "Failed to load breached SLA complaints.";
      }

      if (notificationsResult.success && Array.isArray(notificationsResult.data)) {
        setUnreadNotifications(notificationsResult.data);
      } else {
        nextErrors.notifications = notificationsResult.message || "Failed to load notifications.";
      }

      setErrors(nextErrors);
      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Platform Administration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            System Overview{user ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-slate-600">
            Real-time platform metrics, complaint lifecycles, SLA compliance, and municipal revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
            href="/admin/complaints"
          >
            Manage Complaints
          </Link>
          <Link
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            href="/admin/analytics"
          >
            Detailed Analytics &rarr;
          </Link>
        </div>
      </header>

      {/* Loading state */}
      {isLoading ? (
        <LoadingState message="Loading administration overview…" />
      ) : null}

      {/* Overview Load Error */}
      {errors.overview && !isLoading ? (
        <ErrorAlert
          message={errors.overview}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Unable to load platform analytics"
        />
      ) : null}

      {!isLoading && overview && (
        <>
          {/* Top Level Summary Cards */}
          <section aria-label="Key Platform Metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              detail={`${overview.totalCitizens} citizens &bull; ${overview.totalStaff} staff`}
              href="/admin/staff"
              label="Total Users"
              value={overview.totalUsers}
            />
            <MetricCard
              detail={`${overview.totalDepartments} departments &bull; ${overview.totalCategories} categories`}
              href="/admin/complaints"
              label="Total Complaints"
              value={overview.totalComplaints}
            />
            <MetricCard
              detail={`${overview.slaStats?.breached ?? overview.breached ?? 0} breached &bull; ${overview.slaStats?.onTime ?? overview.onTime ?? 0} on time`}
              href="/admin/complaints"
              label="SLA Compliance"
              value={overview.slaStats?.breached ? `${overview.slaStats.breached} Breached` : "Optimal"}
              variant={overview.slaStats?.breached ? "alert" : "success"}
            />
            <MetricCard
              detail={`${overview.totalPaidServiceRequests} paid of ${overview.totalServiceRequests} requests`}
              href="/admin/service-requests"
              label="Platform Revenue"
              value={formatCurrency(overview.totalRevenue)}
              variant="success"
            />
          </section>

          {/* Breached SLA Attention Section */}
          {breachedComplaints.length > 0 ? (
            <section className="rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-red-200/60 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-red-950 flex items-center gap-2">
                    <span>SLA Breached Complaints</span>
                    <span className="rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-bold text-red-900">
                      {breachedComplaints.length} Urgent
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-red-800">
                    Active complaints exceeding resolution SLA deadlines requiring administrative intervention.
                  </p>
                </div>
                <Link
                  className="text-xs font-semibold text-red-900 underline hover:text-red-950"
                  href="/admin/complaints"
                >
                  View in complaints list &rarr;
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {breachedComplaints.slice(0, 6).map((complaint) => (
                  <article
                    className="rounded-lg border border-red-200 bg-white p-4 shadow-2xs"
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
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeClasses(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-slate-950 hover:underline">
                      <Link href={`/admin/complaints/${complaint.id}`}>{complaint.title}</Link>
                    </h3>

                    <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                      <span>Dept: <strong className="text-slate-700">{complaint.department?.name || "General"}</strong></span>
                      <span className="text-red-700 font-medium">Due: {formatDateTime(complaint.dueAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Detailed Metric Breakdowns Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Complaint Lifecycle Breakdown */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Complaint Status Breakdown</h2>
                  <p className="text-xs text-slate-500">Distribution across operational lifecycles</p>
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Total: {overview.totalComplaints}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Submitted</dt>
                  <dd className="mt-1 text-lg font-bold text-slate-950">{overview.submitted ?? overview.statusCounts?.submitted ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Under Review</dt>
                  <dd className="mt-1 text-lg font-bold text-amber-700">{overview.underReview ?? overview.statusCounts?.underReview ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Assigned</dt>
                  <dd className="mt-1 text-lg font-bold text-blue-700">{overview.assigned ?? overview.statusCounts?.assigned ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">In Progress</dt>
                  <dd className="mt-1 text-lg font-bold text-indigo-700">{overview.inProgress ?? overview.statusCounts?.inProgress ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Resolved</dt>
                  <dd className="mt-1 text-lg font-bold text-emerald-700">{overview.resolved ?? overview.statusCounts?.resolved ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Closed</dt>
                  <dd className="mt-1 text-lg font-bold text-emerald-800">{overview.closed ?? overview.statusCounts?.closed ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Reopened</dt>
                  <dd className="mt-1 text-lg font-bold text-amber-800">{overview.reopened ?? overview.statusCounts?.reopened ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Rejected</dt>
                  <dd className="mt-1 text-lg font-bold text-slate-600">{overview.rejected ?? overview.statusCounts?.rejected ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-slate-500 font-medium">Cancelled</dt>
                  <dd className="mt-1 text-lg font-bold text-slate-600">{overview.cancelled ?? overview.statusCounts?.cancelled ?? 0}</dd>
                </div>
              </dl>
            </section>

            {/* SLA & Feedback Performance */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">SLA Performance</h2>
                    <p className="text-xs text-slate-500">Resolution timeliness &amp; compliance</p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                    <dt className="text-emerald-800 font-medium">Active On-Time</dt>
                    <dd className="mt-1 text-lg font-bold text-emerald-900">{overview.slaStats?.onTime ?? overview.onTime ?? 0}</dd>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <dt className="text-red-800 font-medium">Active Breached</dt>
                    <dd className="mt-1 text-lg font-bold text-red-900">{overview.slaStats?.breached ?? overview.breached ?? 0}</dd>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                    <dt className="text-emerald-800 font-medium">Completed On-Time</dt>
                    <dd className="mt-1 text-lg font-bold text-emerald-900">{overview.slaStats?.completedOnTime ?? overview.completedOnTime ?? 0}</dd>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <dt className="text-amber-800 font-medium">Completed Late</dt>
                    <dd className="mt-1 text-lg font-bold text-amber-900">{overview.slaStats?.completedLate ?? overview.completedLate ?? 0}</dd>
                  </div>
                </dl>
              </div>

              {/* Feedback Summary */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Citizen Satisfaction</h3>
                    <p className="text-xs text-slate-500">Aggregated feedback &amp; ratings</p>
                  </div>
                  <Link className="text-xs font-semibold text-sky-700 underline" href="/admin/feedback">
                    View Feedback &rarr;
                  </Link>
                </div>

                <div className="mt-3 flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-amber-500">
                      ★ {overview.averageRating ? overview.averageRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-2xs text-slate-500 uppercase tracking-wider mt-0.5">Average Score</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4 text-xs text-slate-600">
                    <p>
                      <strong>{overview.totalFeedback}</strong> total feedback submission{overview.totalFeedback !== 1 ? "s" : ""} recorded across closed municipal complaints.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Quick Management Areas Hub */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-base font-bold text-slate-950">Administrative Management Hub</h2>
            <p className="mt-0.5 text-xs text-slate-500">Direct navigation to administrative workspaces</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/complaints"
              >
                <p className="font-bold text-sm text-slate-950">Complaints</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalComplaints} total records</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/departments"
              >
                <p className="font-bold text-sm text-slate-950">Departments</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalDepartments} active departments</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/categories"
              >
                <p className="font-bold text-sm text-slate-950">Categories</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalCategories} service categories</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/staff"
              >
                <p className="font-bold text-sm text-slate-950">Staff Directory</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalStaff} staff accounts</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/services"
              >
                <p className="font-bold text-sm text-slate-950">Municipal Services</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalMunicipalServices} service offerings</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/service-requests"
              >
                <p className="font-bold text-sm text-slate-950">Service Requests</p>
                <p className="mt-1 text-xs text-slate-500">{overview.totalServiceRequests} citizen requests</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/audit-logs"
              >
                <p className="font-bold text-sm text-slate-950">Audit Logs</p>
                <p className="mt-1 text-xs text-slate-500">Security &amp; change trail</p>
              </Link>
              <Link
                className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                href="/admin/notifications"
              >
                <p className="font-bold text-sm text-slate-950">Notifications</p>
                <p className="mt-1 text-xs text-slate-500">{unreadNotifications.length} unread notices</p>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
