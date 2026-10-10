"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  MarkAllNotificationsReadResponse,
  Notification,
  NotificationType,
  SlaNotificationCheckResponse,
} from "@/types";

const notificationTypes: NotificationType[] = [
  "COMPLAINT_CREATED",
  "COMPLAINT_REVIEWED",
  "COMPLAINT_ASSIGNED",
  "COMPLAINT_IN_PROGRESS",
  "COMPLAINT_RESOLVED",
  "COMPLAINT_CLOSED",
  "COMPLAINT_REOPENED",
  "COMPLAINT_REJECTED",
  "SLA_BREACHED",
  "PAYMENT_SUCCESS",
  "SERVICE_REQUEST_UPDATED",
];

function formatNotificationType(type: NotificationType): string {
  switch (type) {
    case "COMPLAINT_CREATED":
      return "Complaint Created";
    case "COMPLAINT_REVIEWED":
      return "Complaint Reviewed";
    case "COMPLAINT_ASSIGNED":
      return "Staff Assigned";
    case "COMPLAINT_IN_PROGRESS":
      return "In Progress";
    case "COMPLAINT_RESOLVED":
      return "Complaint Resolved";
    case "COMPLAINT_CLOSED":
      return "Complaint Closed";
    case "COMPLAINT_REOPENED":
      return "Complaint Reopened";
    case "COMPLAINT_REJECTED":
      return "Complaint Rejected";
    case "SLA_BREACHED":
      return "SLA Breached";
    case "PAYMENT_SUCCESS":
      return "Payment Successful";
    case "SERVICE_REQUEST_UPDATED":
      return "Service Request Updated";
    default: {
      const fallback = String(type);
      return fallback
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
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

function getNotificationTypeBadgeClasses(type: NotificationType): string {
  switch (type) {
    case "COMPLAINT_RESOLVED":
    case "COMPLAINT_CLOSED":
    case "PAYMENT_SUCCESS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "COMPLAINT_ASSIGNED":
    case "COMPLAINT_IN_PROGRESS":
    case "COMPLAINT_REVIEWED":
    case "SERVICE_REQUEST_UPDATED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "COMPLAINT_CREATED":
    case "COMPLAINT_REOPENED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SLA_BREACHED":
    case "COMPLAINT_REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"MY" | "SYSTEM">("MY");

  // My Notifications State
  const [myNotifications, setMyNotifications] = useState<Notification[]>([]);
  const [isMyLoading, setIsMyLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);
  const [myFilter, setMyFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // System Notifications State
  const [systemNotifications, setSystemNotifications] = useState<Notification[]>([]);
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemTypeFilter, setSystemTypeFilter] = useState<string>("");
  const [systemReadFilter, setSystemReadFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");
  const [systemSearchTerm, setSystemSearchTerm] = useState("");

  // SLA Check Modal State
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [isSlaPending, setIsSlaPending] = useState(false);

  // Refresh & Feedback
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load My Notifications
  useEffect(() => {
    let isMounted = true;

    async function loadMy() {
      setIsMyLoading(true);
      setMyError(null);

      const result = await apiRequest<Notification[]>("notifications/my");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setMyNotifications(result.data);
      } else {
        setMyError(result.message || "Failed to load notifications.");
      }

      setIsMyLoading(false);
    }

    void loadMy();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Load System Notifications with query parameters
  useEffect(() => {
    let isMounted = true;

    async function loadSystem() {
      setIsSystemLoading(true);
      setSystemError(null);

      const params = new URLSearchParams();
      if (systemTypeFilter) {
        params.set("type", systemTypeFilter);
      }
      if (systemReadFilter === "READ") {
        params.set("isRead", "true");
      } else if (systemReadFilter === "UNREAD") {
        params.set("isRead", "false");
      }

      const queryString = params.toString();
      const path = queryString ? `notifications?${queryString}` : "notifications";

      const result = await apiRequest<Notification[]>(path);

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setSystemNotifications(result.data);
      } else {
        setSystemError(result.message || "Failed to load system notifications.");
      }

      setIsSystemLoading(false);
    }

    void loadSystem();

    return () => {
      isMounted = false;
    };
  }, [systemTypeFilter, systemReadFilter, refreshKey]);

  // My Notifications Filtering
  const filteredMyNotifications = useMemo(() => {
    if (myFilter === "UNREAD") {
      return myNotifications.filter((n) => !n.isRead);
    }
    return myNotifications;
  }, [myNotifications, myFilter]);

  const myUnreadCount = useMemo(
    () => myNotifications.filter((n) => !n.isRead).length,
    [myNotifications]
  );

  // System Notifications Client-side Search
  const filteredSystemNotifications = useMemo(() => {
    const query = systemSearchTerm.trim().toLowerCase();
    if (!query) return systemNotifications;

    return systemNotifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        (n.user?.name && n.user.name.toLowerCase().includes(query)) ||
        (n.user?.email && n.user.email.toLowerCase().includes(query))
    );
  }, [systemNotifications, systemSearchTerm]);

  // Handle Mark Single Read
  const handleMarkOneRead = async (notificationId: string) => {
    setPendingReadIds((prev) => new Set(prev).add(notificationId));

    const result = await apiRequest<Notification>(`notifications/${notificationId}/read`, {
      method: "PATCH",
    });

    setPendingReadIds((prev) => {
      const next = new Set(prev);
      next.delete(notificationId);
      return next;
    });

    if (result.success) {
      setMyNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setRefreshKey((prev) => prev + 1);
    } else {
      setMyError(result.message || "Failed to mark notification as read.");
    }
  };

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);

    const result = await apiRequest<MarkAllNotificationsReadResponse>("notifications/read-all", {
      method: "PATCH",
    });

    setIsMarkingAllRead(false);

    if (result.success) {
      setMyNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSuccessMessage("All notifications marked as read.");
      setRefreshKey((prev) => prev + 1);
    } else {
      setMyError(result.message || "Failed to mark all notifications as read.");
    }
  };

  // Handle SLA Check
  const handleRunSlaCheck = async () => {
    setIsSlaPending(true);

    const result = await apiRequest<SlaNotificationCheckResponse>("notifications/check-sla", {
      method: "POST",
      body: {},
    });

    setIsSlaPending(false);
    setIsSlaModalOpen(false);

    if (result.success && result.data) {
      setSuccessMessage(
        `SLA Scan Complete: ${result.data.breachedCount} breached complaints evaluated, ${result.data.notificationsCreated} new alerts created.`
      );
      setRefreshKey((prev) => prev + 1);
    } else {
      setSystemError(result.message || "Failed to execute SLA breach check.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Notifications Center
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review administrator notifications and audit all system-wide alerts across users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-hidden"
            onClick={() => setIsSlaModalOpen(true)}
            type="button"
          >
            ⚡ Run SLA Check
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage ? (
        <div
          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <p>{successMessage}</p>
          <button
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            onClick={() => setSuccessMessage(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "MY"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("MY")}
            type="button"
          >
            My Notifications
            {myUnreadCount > 0 ? (
              <span className="ml-2.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                {myUnreadCount}
              </span>
            ) : null}
          </button>

          <button
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "SYSTEM"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("SYSTEM")}
            type="button"
          >
            System-Wide Audit Feed
          </button>
        </nav>
      </div>

      {/* TAB 1: MY NOTIFICATIONS */}
      {activeTab === "MY" ? (
        <div className="space-y-4">
          {/* Top Bar for My Notifications */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  myFilter === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setMyFilter("ALL")}
                type="button"
              >
                All ({myNotifications.length})
              </button>
              <button
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  myFilter === "UNREAD"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setMyFilter("UNREAD")}
                type="button"
              >
                Unread ({myUnreadCount})
              </button>
            </div>

            {myUnreadCount > 0 ? (
              <button
                className="text-xs font-semibold text-slate-700 underline hover:text-slate-950 disabled:opacity-50"
                disabled={isMarkingAllRead}
                onClick={handleMarkAllRead}
                type="button"
              >
                {isMarkingAllRead ? "Marking all read…" : "Mark all as read"}
              </button>
            ) : null}
          </div>

          {/* My Notifications Error */}
          {myError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <div className="flex items-center justify-between">
                <p>{myError}</p>
                <button
                  className="font-medium underline hover:text-red-900"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  type="button"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {/* My Notifications List */}
          {isMyLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading your notifications…</p>
              </div>
            </div>
          ) : myNotifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">You have no notifications at this time.</p>
            </div>
          ) : filteredMyNotifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No unread notifications.</p>
              <button
                className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
                onClick={() => setMyFilter("ALL")}
                type="button"
              >
                Show all notifications
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyNotifications.map((notif) => (
                <div
                  className={`flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs transition sm:flex-row sm:items-start ${
                    notif.isRead
                      ? "border-slate-200 bg-white"
                      : "border-slate-300 bg-slate-50/70"
                  }`}
                  key={notif.id}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getNotificationTypeBadgeClasses(
                          notif.type
                        )}`}
                      >
                        {formatNotificationType(notif.type)}
                      </span>
                      {!notif.isRead ? (
                        <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          New
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-400">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-slate-950">
                      {notif.title}
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.complaintId ? (
                      <div className="pt-1">
                        <Link
                          className="text-xs font-semibold text-slate-900 underline hover:text-slate-700"
                          href={`/admin/complaints/${notif.complaintId}`}
                        >
                          View Related Complaint →
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  {!notif.isRead ? (
                    <div className="shrink-0 pt-1">
                      <button
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-50"
                        disabled={pendingReadIds.has(notif.id)}
                        onClick={() => handleMarkOneRead(notif.id)}
                        type="button"
                      >
                        {pendingReadIds.has(notif.id) ? "Marking…" : "Mark as read"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* TAB 2: SYSTEM NOTIFICATIONS */}
      {activeTab === "SYSTEM" ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSystemSearchTerm(e.target.value)}
                  placeholder="Search by recipient name, email, title, or message..."
                  type="text"
                  value={systemSearchTerm}
                />
              </div>
              <div className="w-full sm:w-56">
                <select
                  aria-label="Filter by notification type"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  onChange={(e) => setSystemTypeFilter(e.target.value)}
                  value={systemTypeFilter}
                >
                  <option value="">All Alert Types</option>
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatNotificationType(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-44">
                <select
                  aria-label="Filter by read state"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  onChange={(e) =>
                    setSystemReadFilter(e.target.value as "ALL" | "READ" | "UNREAD")
                  }
                  value={systemReadFilter}
                >
                  <option value="ALL">All States</option>
                  <option value="UNREAD">Unread Only</option>
                  <option value="READ">Read Only</option>
                </select>
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {!isSystemLoading &&
                `${filteredSystemNotifications.length} notification${filteredSystemNotifications.length === 1 ? "" : "s"}`}
            </div>
          </div>

          {/* System Notifications Error */}
          {systemError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <div className="flex items-center justify-between">
                <p>{systemError}</p>
                <button
                  className="font-medium underline hover:text-red-900"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  type="button"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {/* System Notifications Table */}
          {isSystemLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading system notifications…</p>
              </div>
            </div>
          ) : systemNotifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No system notifications found matching filters.</p>
            </div>
          ) : filteredSystemNotifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No system notifications match &ldquo;{systemSearchTerm}&rdquo;.</p>
              <button
                className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
                onClick={() => setSystemSearchTerm("")}
                type="button"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5" scope="col">Recipient</th>
                      <th className="px-5 py-3.5" scope="col">Type</th>
                      <th className="px-5 py-3.5" scope="col">Title & Message</th>
                      <th className="px-5 py-3.5" scope="col">Status</th>
                      <th className="px-5 py-3.5" scope="col">Created</th>
                      <th className="px-5 py-3.5 text-right" scope="col">Related</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSystemNotifications.map((notif) => (
                      <tr className="hover:bg-slate-50/80 transition" key={notif.id}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-950">
                              {notif.user?.name || "User"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {notif.user?.email || "—"}
                            </p>
                            {notif.user?.role ? (
                              <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {notif.user.role}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getNotificationTypeBadgeClasses(
                              notif.type
                            )}`}
                          >
                            {formatNotificationType(notif.type)}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-md">
                          <p className="font-medium text-slate-900">{notif.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                            {notif.message}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {notif.isRead ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Unread
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                          {formatDateTime(notif.createdAt)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {notif.complaintId ? (
                            <Link
                              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 transition"
                              href={`/admin/complaints/${notif.complaintId}`}
                            >
                              Complaint
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* SLA Check Confirmation Modal */}
      {isSlaModalOpen ? (
        <div
          aria-labelledby="sla-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="sla-modal-title">
              Execute SLA Breach Scan
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This action scans all active complaints against their SLA deadlines. If overdue complaints are found that haven&rsquo;t triggered an alert yet, new breach notifications will be automatically created for assigned staff and administrators.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSlaPending}
                onClick={() => setIsSlaModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSlaPending}
                onClick={handleRunSlaCheck}
                type="button"
              >
                {isSlaPending ? "Scanning…" : "Run SLA Scan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
