"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { EmptyState, ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  MarkAllNotificationsReadResponse,
  Notification,
  NotificationType,
} from "@/types";

const POLL_INTERVAL_MS = 30000;

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
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
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

export default function CitizenNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  // Mutation states
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadNotifications() {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      const [allResult, unreadResult] = await Promise.all([
        apiRequest<Notification[]>("notifications/my"),
        apiRequest<Notification[]>("notifications/unread"),
      ]);

      if (!isMountedRef.current) {
        isFetchingRef.current = false;
        return;
      }

      if (allResult.success && Array.isArray(allResult.data)) {
        setNotifications(allResult.data);
        setError(null);
      } else if (!allResult.success) {
        setError(allResult.message || "Failed to load notifications.");
      }

      if (!allResult.success && unreadResult.success && Array.isArray(unreadResult.data)) {
        setNotifications(unreadResult.data);
        setError(null);
      }

      setIsLoading(false);
      isFetchingRef.current = false;
    }

    void loadNotifications();

    const intervalId = setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [refreshKey]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const handleMarkAsRead = async (id: string) => {
    if (pendingReadIds.has(id)) return;

    setPendingReadIds((prev) => new Set(prev).add(id));
    setActionError(null);

    const result = await apiRequest<Notification>(`notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    });

    if (isMountedRef.current) {
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (result.success) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
      } else {
        setActionError(result.message || "Failed to mark notification as read.");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAllRead || unreadCount === 0) return;

    setIsMarkingAllRead(true);
    setActionError(null);
    setActionSuccessMessage(null);

    const result = await apiRequest<MarkAllNotificationsReadResponse>("notifications/read-all", {
      method: "PATCH",
    });

    if (isMountedRef.current) {
      setIsMarkingAllRead(false);

      if (result.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setActionSuccessMessage(
          result.data?.updatedCount
            ? `Marked ${result.data.updatedCount} notification${
                result.data.updatedCount > 1 ? "s" : ""
              } as read.`
            : "All notifications marked as read."
        );
      } else {
        setActionError(result.message || "Failed to mark all notifications as read.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Citizen services
          </p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Notifications</h1>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                {unreadCount} unread
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Stay updated on your complaints, status changes, SLA updates, and municipal notices.
          </p>
        </div>

        {unreadCount > 0 ? (
          <div className="flex shrink-0">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isMarkingAllRead}
              onClick={handleMarkAllAsRead}
              type="button"
            >
              {isMarkingAllRead ? "Marking all…" : "Mark all as read"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Action feedback banners */}
      {actionSuccessMessage ? (
        <div
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          <span>{actionSuccessMessage}</span>
          <button
            className="text-xs font-semibold uppercase tracking-wider text-emerald-700 hover:text-emerald-900"
            onClick={() => setActionSuccessMessage(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div
          className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <span>{actionError}</span>
          <button
            className="text-xs font-semibold uppercase tracking-wider text-red-700 hover:text-red-900"
            onClick={() => setActionError(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Loading state */}
      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : null}

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorAlert
          message={error}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Unable to load notifications"
        />
      ) : null}

      {!isLoading && !error && (
        <>
          {/* Tabs Filter */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setFilter("ALL")}
              type="button"
            >
              All ({notifications.length})
            </button>
            <button
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === "UNREAD"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setFilter("UNREAD")}
              type="button"
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Empty state: No notifications at all */}
          {notifications.length === 0 ? (
            <EmptyState
              description="You will receive updates here whenever there are status changes or notices."
              title="No notifications yet"
            />
          ) : null}

          {/* Empty state: Filter returned 0 */}
          {notifications.length > 0 && filteredNotifications.length === 0 ? (
            <EmptyState
              actionLabel={filter === "UNREAD" ? "View all notifications" : undefined}
              description={filter === "UNREAD" ? "You have caught up with all notifications!" : "No notifications match the selected filter."}
              onAction={filter === "UNREAD" ? () => setFilter("ALL") : undefined}
              title="No notifications found"
            />
          ) : null}

          {/* Notification List */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
                const isItemPending = pendingReadIds.has(item.id);

                return (
                  <article
                    className={`relative rounded-xl border p-5 transition shadow-xs ${
                      item.isRead
                        ? "border-slate-200 bg-white text-slate-700"
                        : "border-sky-200 bg-sky-50/50 text-slate-900 ring-1 ring-sky-100"
                    }`}
                    key={item.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Unread indicator dot */}
                          {!item.isRead ? (
                            <span
                              aria-label="Unread notification"
                              className="h-2 w-2 rounded-full bg-sky-600"
                              title="Unread"
                            />
                          ) : null}

                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getNotificationTypeBadgeClasses(
                              item.type
                            )}`}
                          >
                            {formatNotificationType(item.type)}
                          </span>

                          <time className="text-xs text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </time>
                        </div>

                        <h2 className="text-base font-bold text-slate-950">{item.title}</h2>
                        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                          {item.message}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1 sm:pt-0">
                        {item.complaintId ? (
                          <Link
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-slate-800"
                            href={`/citizen/complaints/${item.complaintId}`}
                          >
                            View Complaint &rarr;
                          </Link>
                        ) : null}

                        {!item.isRead ? (
                          <button
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isItemPending}
                            onClick={() => handleMarkAsRead(item.id)}
                            type="button"
                          >
                            {isItemPending ? "Marking…" : "Mark as read"}
                          </button>
                        ) : null}
                      </div>
                    </div>
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
