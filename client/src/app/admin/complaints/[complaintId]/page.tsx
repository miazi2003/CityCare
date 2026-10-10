"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  AssignComplaintInput,
  Complaint,
  ComplaintHistory,
  ComplaintPriority,
  ComplaintStatus,
  Feedback,
  ReviewComplaintInput,
  SLAStatus,
  Staff,
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

type ModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

function ActionModal({
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  isPending,
  error,
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h3 className="text-lg font-bold text-slate-950" id="modal-title">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        {children}

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
            Cancel
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-900 hover:bg-slate-800"
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

function AdminComplaintDetailContent() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Admin Actions State
  const [activeModal, setActiveModal] = useState<"under_review" | "reject" | "assign" | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Staff Assignment State
  const [eligibleStaff, setEligibleStaff] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffError, setStaffError] = useState<string | null>(null);

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
        const chronologicalHistory = [...historyResult.data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setHistory(chronologicalHistory);
      }

      if (feedbackResult.success && feedbackResult.data) {
        setFeedback(feedbackResult.data);
      } else {
        setFeedback(null);
      }

      setIsLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [complaintId, refreshKey]);

  // Fetch eligible staff when opening assignment modal
  const handleOpenAssignModal = async () => {
    if (!complaint?.departmentId) return;

    setActionError(null);
    setStaffError(null);
    setSelectedStaffId(complaint.assignedStaffId || "");
    setActiveModal("assign");
    setIsLoadingStaff(true);

    const result = await apiRequest<Staff[]>(`staff/department/${encodeURIComponent(complaint.departmentId)}`);

    setIsLoadingStaff(false);

    if (result.success && Array.isArray(result.data)) {
      setEligibleStaff(result.data);
      if (result.data.length > 0 && !complaint.assignedStaffId) {
        setSelectedStaffId(result.data[0].id);
      }
    } else {
      setStaffError(result.message || "Failed to load staff for this department.");
    }
  };

  // Review: Mark Under Review
  const handleMarkUnderReview = async () => {
    if (!complaintId || isActionPending) return;

    setIsActionPending(true);
    setActionError(null);

    const payload: ReviewComplaintInput = {
      status: "UNDER_REVIEW",
    };

    const result = await apiRequest<Complaint>(`complaints/${encodeURIComponent(complaintId)}/review`, {
      method: "PATCH",
      body: payload,
    });

    setIsActionPending(false);

    if (result.success) {
      setActionSuccessMessage(result.message || "Complaint marked as under review.");
      setActiveModal(null);
      setRefreshKey((k) => k + 1);
    } else {
      setActionError(result.message || "Failed to review complaint.");
    }
  };

  // Review: Reject
  const handleRejectComplaint = async () => {
    if (!complaintId || isActionPending) return;

    setIsActionPending(true);
    setActionError(null);

    const payload: ReviewComplaintInput = {
      status: "REJECTED",
    };

    const result = await apiRequest<Complaint>(`complaints/${encodeURIComponent(complaintId)}/review`, {
      method: "PATCH",
      body: payload,
    });

    setIsActionPending(false);

    if (result.success) {
      setActionSuccessMessage(result.message || "Complaint rejected.");
      setActiveModal(null);
      setRefreshKey((k) => k + 1);
    } else {
      setActionError(result.message || "Failed to reject complaint.");
    }
  };

  // Assign / Reassign Staff
  const handleAssignStaff = async () => {
    if (!complaintId || isActionPending || !selectedStaffId) return;

    setIsActionPending(true);
    setActionError(null);

    const payload: AssignComplaintInput = {
      staffId: selectedStaffId,
    };

    const result = await apiRequest<Complaint>(`complaints/${encodeURIComponent(complaintId)}/assign`, {
      method: "PATCH",
      body: payload,
    });

    setIsActionPending(false);

    if (result.success) {
      setActionSuccessMessage(
        result.message ||
          (complaint?.assignedStaffId ? "Complaint reassigned successfully." : "Staff assigned successfully.")
      );
      setActiveModal(null);
      setRefreshKey((k) => k + 1);
    } else {
      setActionError(result.message || "Failed to assign staff.");
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
            The requested complaint does not exist or has been removed.
          </p>
          <Link
            className="mt-6 inline-block rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/admin/complaints"
          >
            &larr; Back to complaints
          </Link>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <ErrorAlert
          actionHref="/admin/complaints"
          actionLabel="Return to complaints list"
          message={error || "Unable to retrieve complaint data."}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Error loading complaint"
        />
      </div>
    );
  }

  const isSubmitted = complaint.status === "SUBMITTED";
  const isUnderReview = complaint.status === "UNDER_REVIEW";
  const isAssignedOrInProgress = complaint.status === "ASSIGNED" || complaint.status === "IN_PROGRESS";
  const canAssignOrReassign = isSubmitted || isUnderReview || isAssignedOrInProgress;
  const isReassign = Boolean(complaint.assignedStaffId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/admin/complaints"
        >
          &larr; Back to complaints
        </Link>
      </div>

      {/* Action success alert banner */}
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

          {/* Administrative Actions */}
          <div className="flex shrink-0 flex-wrap gap-2">
            {isSubmitted ? (
              <>
                <button
                  className="rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isActionPending}
                  onClick={() => {
                    setActionError(null);
                    setActiveModal("under_review");
                  }}
                  type="button"
                >
                  Mark Under Review
                </button>
                <button
                  className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 shadow-xs transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isActionPending}
                  onClick={() => {
                    setActionError(null);
                    setActiveModal("reject");
                  }}
                  type="button"
                >
                  Reject
                </button>
              </>
            ) : null}

            {canAssignOrReassign ? (
              <button
                className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isActionPending}
                onClick={handleOpenAssignModal}
                type="button"
              >
                {isReassign ? "Reassign Staff" : "Assign Staff"}
              </button>
            ) : null}
          </div>
        </div>

        {/* Citizen Information Banner */}
        {complaint.citizen ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Submitted by Citizen:</span>
            <span>{complaint.citizen.name}</span>
            <span className="text-slate-400">({complaint.citizen.email})</span>
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-900">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {complaint.description}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <span className="font-semibold text-slate-900">
                  {complaint.assignedStaff.name}{" "}
                  <span className="font-normal text-xs text-slate-500">({complaint.assignedStaff.email})</span>
                </span>
              ) : (
                <span className="text-amber-700 font-medium">Unassigned</span>
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

      {/* Citizen Feedback (Read-Only) */}
      {feedback ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Citizen Feedback</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Submitted on {formatDateTime(feedback.createdAt)}
                {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt
                  ? ` (Updated ${formatDateTime(feedback.updatedAt)})`
                  : ""}
              </p>
            </div>
            <StarRating rating={feedback.rating} />
          </div>

          {feedback.comment ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 border border-slate-100">
              <p className="italic">&ldquo;{feedback.comment}&rdquo;</p>
            </div>
          ) : (
            <p className="mt-4 text-xs italic text-slate-500">No written comment provided.</p>
          )}
        </section>
      ) : null}

      {/* Review: Mark Under Review Modal */}
      {activeModal === "under_review" ? (
        <ActionModal
          confirmLabel="Mark Under Review"
          confirmVariant="primary"
          description="Are you sure you want to mark this complaint as under review? This confirms administrative intake."
          error={actionError}
          isPending={isActionPending}
          onCancel={() => {
            if (!isActionPending) {
              setActiveModal(null);
              setActionError(null);
            }
          }}
          onConfirm={handleMarkUnderReview}
          title="Review Complaint"
        />
      ) : null}

      {/* Review: Reject Modal */}
      {activeModal === "reject" ? (
        <ActionModal
          confirmLabel="Reject Complaint"
          confirmVariant="danger"
          description="Are you sure you want to reject this complaint? This will terminate the complaint workflow and record a rejection in the status timeline."
          error={actionError}
          isPending={isActionPending}
          onCancel={() => {
            if (!isActionPending) {
              setActiveModal(null);
              setActionError(null);
            }
          }}
          onConfirm={handleRejectComplaint}
          title="Reject Complaint"
        />
      ) : null}

      {/* Assign / Reassign Staff Modal */}
      {activeModal === "assign" ? (
        <ActionModal
          confirmLabel={isReassign ? "Reassign Staff" : "Assign Staff"}
          confirmVariant="primary"
          description={
            isReassign
              ? `Select a new staff member from ${complaint.department?.name || "this department"} to reassign this complaint.`
              : `Assign a staff member from ${complaint.department?.name || "this department"} to handle and resolve this complaint.`
          }
          error={actionError || staffError}
          isPending={isActionPending || isLoadingStaff}
          onCancel={() => {
            if (!isActionPending) {
              setActiveModal(null);
              setActionError(null);
              setStaffError(null);
            }
          }}
          onConfirm={handleAssignStaff}
          title={isReassign ? "Reassign Complaint" : "Assign Staff Member"}
        >
          <div className="mt-4 space-y-3">
            {isLoadingStaff ? (
              <p className="text-xs text-slate-500">Loading department staff…</p>
            ) : eligibleStaff.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                No active staff members are registered in {complaint.department?.name || "this department"}.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="staff-select">
                  Select Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={isActionPending || isLoadingStaff}
                  id="staff-select"
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  value={selectedStaffId}
                >
                  {eligibleStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </ActionModal>
      ) : null}
    </div>
  );
}

export default function AdminComplaintDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-6">
          <p className="text-slate-600">Loading complaint details…</p>
        </div>
      }
    >
      <AdminComplaintDetailContent />
    </Suspense>
  );
}

