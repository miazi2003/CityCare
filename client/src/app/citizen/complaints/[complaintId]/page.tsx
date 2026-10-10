"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import type {
  Complaint,
  ComplaintHistory,
  ComplaintPriority,
  ComplaintStatus,
  CreateFeedbackInput,
  Feedback,
  SLAStatus,
  UpdateFeedbackInput,
} from "@/types";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg leading-none ${
            star <= rating ? "text-amber-400" : "text-slate-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-700">{rating} / 5</span>
    </div>
  );
}

function InteractiveStarRating({
  rating,
  onChange,
  disabled = false,
}: {
  rating: number;
  onChange: (r: number) => void;
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;
  const ratingLabels: Record<number, string> = {
    1: "1 - Poor",
    2: "2 - Fair",
    3: "3 - Good",
    4: "4 - Very Good",
    5: "5 - Excellent",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverRating(null)}
        role="group"
        aria-label="Star rating selector"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              className={`p-1 text-2xl leading-none transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 rounded ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-110"
              } ${isFilled ? "text-amber-400" : "text-slate-300"}`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          );
        })}
      </div>
      <span className="text-xs font-medium text-slate-600">
        {ratingLabels[displayRating] || `${displayRating} / 5`}
      </span>
    </div>
  );
}

type ConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary";
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h3 className="text-lg font-bold text-slate-950" id="modal-title">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Go back
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintDetailContent() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mutation action state (Cancel / Close)
  const [activeAction, setActiveAction] = useState<"cancel" | "close" | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Feedback management state
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);
  const [isFeedbackPending, setIsFeedbackPending] = useState(false);
  const [feedbackFormRating, setFeedbackFormRating] = useState<number>(5);
  const [feedbackFormComment, setFeedbackFormComment] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!complaintId) return;

      const [complaintResult, historyResult, feedbackResult] = await Promise.all([
        apiRequest<Complaint>(`complaints/${encodeURIComponent(complaintId)}`),
        apiRequest<ComplaintHistory[]>(`complaints/${encodeURIComponent(complaintId)}/history`),
        apiRequest<Feedback>(`complaints/${encodeURIComponent(complaintId)}/feedback`),
      ]);

      if (!isMounted) return;

      if (complaintResult.success && complaintResult.data) {
        setComplaint(complaintResult.data);
        setIsNotFound(false);
        setError(null);
      } else if (
        !complaintResult.success &&
        (complaintResult.status === 404 || complaintResult.status === 403)
      ) {
        setIsNotFound(true);
      } else {
        setError(complaintResult.message || "Failed to load complaint details.");
      }

      if (historyResult.success && Array.isArray(historyResult.data)) {
        // Backend returns newest first; sort oldest-to-newest for chronological timeline progression
        const chronologicalHistory = [...historyResult.data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setHistory(chronologicalHistory);
      }

      if (feedbackResult.success && feedbackResult.data) {
        setFeedback(feedbackResult.data);
        setFeedbackFormRating(feedbackResult.data.rating);
        setFeedbackFormComment(feedbackResult.data.comment || "");
      } else {
        setFeedback(null);
        setFeedbackFormRating(5);
        setFeedbackFormComment("");
      }

      setIsLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [complaintId, refreshKey]);

  const handleCancelAction = async () => {
    if (!complaintId || isActionPending) return;

    setIsActionPending(true);
    setActionError(null);

    const result = await apiRequest<Complaint>(
      `complaints/${encodeURIComponent(complaintId)}/cancel`,
      {
        method: "PATCH",
      }
    );

    setIsActionPending(false);

    if (result.success) {
      setActionSuccessMessage(result.message || "Complaint cancelled successfully.");
      setActiveAction(null);
      setRefreshKey((k) => k + 1);
    } else {
      setActionError(result.message || "Failed to cancel complaint.");
    }
  };

  const handleCloseAction = async () => {
    if (!complaintId || isActionPending) return;

    setIsActionPending(true);
    setActionError(null);

    const result = await apiRequest<Complaint>(
      `complaints/${encodeURIComponent(complaintId)}/close`,
      {
        method: "PATCH",
      }
    );

    setIsActionPending(false);

    if (result.success) {
      setActionSuccessMessage(result.message || "Complaint confirmed and closed successfully.");
      setActiveAction(null);
      setRefreshKey((k) => k + 1);
    } else {
      setActionError(result.message || "Failed to close complaint.");
    }
  };

  const handleStartEditFeedback = () => {
    if (feedback) {
      setFeedbackFormRating(feedback.rating);
      setFeedbackFormComment(feedback.comment || "");
    }
    setFeedbackError(null);
    setFeedbackSuccessMessage(null);
    setIsEditingFeedback(true);
  };

  const handleCancelEditFeedback = () => {
    if (feedback) {
      setFeedbackFormRating(feedback.rating);
      setFeedbackFormComment(feedback.comment || "");
    }
    setFeedbackError(null);
    setIsEditingFeedback(false);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId || isFeedbackPending) return;

    // Validation
    if (
      !feedbackFormRating ||
      feedbackFormRating < 1 ||
      feedbackFormRating > 5 ||
      !Number.isInteger(feedbackFormRating)
    ) {
      setFeedbackError("Rating must be an integer between 1 and 5.");
      return;
    }

    const trimmedComment = feedbackFormComment.trim();
    if (trimmedComment.length > 0 && (trimmedComment.length < 3 || trimmedComment.length > 500)) {
      setFeedbackError("Comment must be between 3 and 500 characters.");
      return;
    }

    setIsFeedbackPending(true);
    setFeedbackError(null);

    if (feedback) {
      // Update existing feedback
      const payload: UpdateFeedbackInput = {
        rating: feedbackFormRating,
        ...(trimmedComment.length > 0 ? { comment: trimmedComment } : {}),
      };

      const result = await apiRequest<Feedback>(
        `complaints/${encodeURIComponent(complaintId)}/feedback`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setIsFeedbackPending(false);

      if (result.success && result.data) {
        setFeedback(result.data);
        setIsEditingFeedback(false);
        setFeedbackSuccessMessage(result.message || "Feedback updated successfully.");
      } else {
        setFeedbackError(result.message || "Failed to update feedback.");
      }
    } else {
      // Create new feedback
      const payload: CreateFeedbackInput = {
        rating: feedbackFormRating,
        ...(trimmedComment.length > 0 ? { comment: trimmedComment } : {}),
      };

      const result = await apiRequest<Feedback>(
        `complaints/${encodeURIComponent(complaintId)}/feedback`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setIsFeedbackPending(false);

      if (result.success && result.data) {
        setFeedback(result.data);
        setIsEditingFeedback(false);
        setFeedbackSuccessMessage(result.message || "Feedback submitted successfully.");
      } else {
        setFeedbackError(result.message || "Failed to submit feedback.");
      }
    }
  };

  const handleDeleteFeedback = async () => {
    if (!complaintId || isFeedbackPending) return;

    setIsFeedbackPending(true);
    setFeedbackError(null);

    const result = await apiRequest<null>(
      `complaints/${encodeURIComponent(complaintId)}/feedback`,
      {
        method: "DELETE",
      }
    );

    setIsFeedbackPending(false);

    if (result.success) {
      setFeedback(null);
      setIsDeletingFeedback(false);
      setIsEditingFeedback(false);
      setFeedbackFormRating(5);
      setFeedbackFormComment("");
      setFeedbackSuccessMessage(result.message || "Feedback deleted successfully.");
    } else {
      setFeedbackError(result.message || "Failed to delete feedback.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <LoadingState message="Loading complaint details…" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">Complaint not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested complaint does not exist or you do not have permission to view it.
          </p>
          <Link
            className="mt-6 inline-block rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/citizen/complaints"
          >
            &larr; Back to my complaints
          </Link>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-4xl py-6 space-y-4">
        <ErrorAlert
          message={error || "Unable to retrieve complaint data."}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
        <div className="text-center">
          <Link
            className="text-sm font-medium text-slate-700 underline hover:text-slate-950"
            href="/citizen/complaints"
          >
            &larr; Return to my complaints
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = complaint.status === "SUBMITTED" || complaint.status === "UNDER_REVIEW";
  const canClose = complaint.status === "RESOLVED";
  const isComplaintClosed = complaint.status === "CLOSED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/citizen/complaints"
        >
          &larr; Back to my complaints
        </Link>
      </div>

      {/* Action success alert */}
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

      {/* Complaint Overview Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
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

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {complaint.title}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-400">Reference ID: {complaint.id}</p>
          </div>

          {/* Action buttons in header */}
          <div className="flex shrink-0 flex-wrap gap-2">
            {canCancel ? (
              <button
                className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-medium text-red-700 shadow-xs transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isActionPending}
                onClick={() => {
                  setActionError(null);
                  setActiveAction("cancel");
                }}
                type="button"
              >
                Cancel Complaint
              </button>
            ) : null}

            {canClose ? (
              <button
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isActionPending}
                onClick={() => {
                  setActionError(null);
                  setActiveAction("close");
                }}
                type="button"
              >
                Confirm &amp; Close
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-900">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {complaint.description}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Department</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {complaint.department?.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Category</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {complaint.category?.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Location</dt>
            <dd className="mt-1 text-sm text-slate-800">{complaint.location}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Assigned Staff</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {complaint.assignedStaff ? (
                <span>
                  {complaint.assignedStaff.name}{" "}
                  <span className="text-xs text-slate-500">({complaint.assignedStaff.email})</span>
                </span>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Submitted Date</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDateTime(complaint.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">SLA Due Date</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {complaint.dueAt ? formatDateTime(complaint.dueAt) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Status History Timeline */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-950">Status Timeline</h2>
        <p className="mt-1 text-xs text-slate-500">
          Chronological progress of actions and status changes on this complaint.
        </p>

        {history.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No status transitions recorded yet.</p>
        ) : (
          <div className="relative mt-8 pl-6 sm:pl-8">
            {/* Timeline vertical bar */}
            <div className="absolute bottom-3 left-2.5 top-3 w-0.5 bg-slate-200 sm:left-3.5" />

            <ol className="space-y-8">
              {history.map((entry, index) => {
                const isLast = index === history.length - 1;
                return (
                  <li className="relative" key={entry.id}>
                    {/* Bullet marker */}
                    <div
                      className={`absolute -left-6 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 sm:-left-8 ${
                        isLast
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-400 bg-white"
                      }`}
                    />

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.fromStatus ? (
                          <span className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              {formatStatus(entry.fromStatus)}
                            </span>{" "}
                            &rarr;
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClasses(
                            entry.toStatus
                          )}`}
                        >
                          {formatStatus(entry.toStatus)}
                        </span>
                      </div>

                      <time className="text-xs text-slate-400">
                        {formatDateTime(entry.createdAt)}
                      </time>
                    </div>

                    {/* Actor information */}
                    {entry.changedBy ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Updated by{" "}
                        <span className="font-medium text-slate-700">
                          {entry.changedBy.name}
                        </span>{" "}
                        <span className="text-slate-400">
                          ({formatStatus(entry.changedBy.role)})
                        </span>
                      </p>
                    ) : null}

                    {/* Note / Resolution note */}
                    {entry.note ? (
                      <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-100">
                        <span className="font-semibold text-slate-900">Note: </span>
                        {entry.note}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* Citizen Feedback Section */}
      {isComplaintClosed || feedback ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Citizen Feedback</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {feedback
                  ? `Submitted on ${formatDateTime(feedback.createdAt)}${
                      feedback.updatedAt && feedback.updatedAt !== feedback.createdAt
                        ? ` (Updated ${formatDateTime(feedback.updatedAt)})`
                        : ""
                    }`
                  : "Share your experience regarding the resolution of this complaint."}
              </p>
            </div>

            {/* Read-only star rating badge when viewing existing feedback */}
            {feedback && !isEditingFeedback ? (
              <StarRating rating={feedback.rating} />
            ) : null}
          </div>

          {/* Feedback Success banner */}
          {feedbackSuccessMessage ? (
            <div
              className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
              role="status"
            >
              <span>{feedbackSuccessMessage}</span>
              <button
                className="text-xs font-semibold uppercase tracking-wider text-emerald-700 hover:text-emerald-900"
                onClick={() => setFeedbackSuccessMessage(null)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Feedback Error banner */}
          {feedbackError && !isDeletingFeedback ? (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              role="alert"
            >
              {feedbackError}
            </div>
          ) : null}

          {/* Display Mode: Existing Feedback */}
          {feedback && !isEditingFeedback ? (
            <div className="mt-4 space-y-4">
              {feedback.comment ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="italic">&ldquo;{feedback.comment}&rdquo;</p>
                </div>
              ) : (
                <p className="text-xs italic text-slate-500">No written comment provided.</p>
              )}

              {/* Action buttons (only when closed) */}
              {isComplaintClosed ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isFeedbackPending}
                    onClick={handleStartEditFeedback}
                    type="button"
                  >
                    Edit Feedback
                  </button>
                  <button
                    className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 shadow-xs transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isFeedbackPending}
                    onClick={() => {
                      setFeedbackError(null);
                      setIsDeletingFeedback(true);
                    }}
                    type="button"
                  >
                    Delete Feedback
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Form Mode: Create new feedback OR Edit existing feedback (only when closed) */}
          {isComplaintClosed && (!feedback || isEditingFeedback) ? (
            <form className="mt-6 space-y-4" onSubmit={handleSubmitFeedback}>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5">
                  <InteractiveStarRating
                    disabled={isFeedbackPending}
                    onChange={setFeedbackFormRating}
                    rating={feedbackFormRating}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="feedback-comment" className="block text-xs font-semibold text-slate-700">
                    Comment <span className="text-slate-400 font-normal">(optional, 3–500 characters)</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {feedbackFormComment.length}/500
                  </span>
                </div>
                <textarea
                  id="feedback-comment"
                  rows={3}
                  maxLength={500}
                  disabled={isFeedbackPending}
                  value={feedbackFormComment}
                  onChange={(e) => setFeedbackFormComment(e.target.value)}
                  placeholder="Tell us about the resolution quality, responsiveness, or municipal service..."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isFeedbackPending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFeedbackPending
                    ? "Saving…"
                    : feedback
                    ? "Save Changes"
                    : "Submit Feedback"}
                </button>

                {isEditingFeedback ? (
                  <button
                    type="button"
                    disabled={isFeedbackPending}
                    onClick={handleCancelEditFeedback}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {/* Cancel confirmation modal */}
      {activeAction === "cancel" ? (
        <ConfirmModal
          confirmLabel="Yes, cancel complaint"
          confirmVariant="danger"
          description="Are you sure you want to cancel this complaint? This will permanently mark the complaint as cancelled and prevent further review or work by municipal staff."
          error={actionError}
          isPending={isActionPending}
          onCancel={() => {
            if (!isActionPending) {
              setActiveAction(null);
              setActionError(null);
            }
          }}
          onConfirm={handleCancelAction}
          title="Cancel Complaint"
        />
      ) : null}

      {/* Close confirmation modal */}
      {activeAction === "close" ? (
        <ConfirmModal
          confirmLabel="Yes, confirm & close"
          confirmVariant="primary"
          description="Are you satisfied with the staff resolution and ready to close this complaint? Once closed, this complaint will be finalized."
          error={actionError}
          isPending={isActionPending}
          onCancel={() => {
            if (!isActionPending) {
              setActiveAction(null);
              setActionError(null);
            }
          }}
          onConfirm={handleCloseAction}
          title="Confirm Resolution & Close Complaint"
        />
      ) : null}

      {/* Delete feedback confirmation modal */}
      {isDeletingFeedback ? (
        <ConfirmModal
          confirmLabel="Yes, delete feedback"
          confirmVariant="danger"
          description="Are you sure you want to delete your feedback for this complaint? This action cannot be undone."
          error={feedbackError}
          isPending={isFeedbackPending}
          onCancel={() => {
            if (!isFeedbackPending) {
              setIsDeletingFeedback(false);
              setFeedbackError(null);
            }
          }}
          onConfirm={handleDeleteFeedback}
          title="Delete Feedback"
        />
      ) : null}
    </div>
  );
}

export default function CitizenComplaintDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-6">
          <p className="text-slate-600">Loading complaint…</p>
        </div>
      }
    >
      <ComplaintDetailContent />
    </Suspense>
  );
}

