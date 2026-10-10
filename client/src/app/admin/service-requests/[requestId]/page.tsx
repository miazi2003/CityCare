"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  Payment,
  PaymentStatus,
  ServiceRequest,
  ServiceRequestStatus,
  UpdateServiceRequestStatusInput,
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

function getRequestStatusBadgeClasses(status: ServiceRequestStatus): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PAID":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getPaymentStatusBadgeClasses(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

type StatusModalConfig = {
  newStatus: "PROCESSING" | "COMPLETED" | "CANCELLED";
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  warningNote?: string;
};

function ServiceRequestDetailContent() {
  const { requestId } = useParams<{ requestId: string }>();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status Action Modal State
  const [activeModal, setActiveModal] = useState<StatusModalConfig | null>(null);
  const [isStatusPending, setIsStatusPending] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!requestId) return;
      setIsLoading(true);
      setError(null);

      const [requestResult, paymentResult] = await Promise.all([
        apiRequest<ServiceRequest>(`service-requests/${encodeURIComponent(requestId)}`),
        apiRequest<Payment>(`service-requests/${encodeURIComponent(requestId)}/payment`),
      ]);

      if (!isMounted) return;

      if (requestResult.success && requestResult.data) {
        setServiceRequest(requestResult.data);
        setIsNotFound(false);
        setError(null);
      } else if (
        !requestResult.success &&
        (requestResult.status === 404 || requestResult.status === 403)
      ) {
        setIsNotFound(true);
      } else {
        setError(requestResult.message || "Failed to load service request details.");
      }

      if (paymentResult.success && paymentResult.data) {
        setPayment(paymentResult.data);
      } else {
        setPayment(null);
      }

      setIsLoading(false);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [requestId, refreshKey]);

  const handleOpenStatusModal = (config: StatusModalConfig) => {
    setStatusActionError(null);
    setActiveModal(config);
  };

  const handleCloseStatusModal = () => {
    if (isStatusPending) return;
    setActiveModal(null);
    setStatusActionError(null);
  };

  const handleStatusSubmit = async () => {
    if (!activeModal || !requestId) return;
    setStatusActionError(null);
    setIsStatusPending(true);

    const payload: UpdateServiceRequestStatusInput = {
      status: activeModal.newStatus,
    };

    const result = await apiRequest<ServiceRequest>(
      `service-requests/${encodeURIComponent(requestId)}/status`,
      {
        method: "PATCH",
        body: payload,
      }
    );

    setIsStatusPending(false);

    if (result.success) {
      setActiveModal(null);
      setSuccessMessage(`Service request status updated to ${formatStatus(activeModal.newStatus)}.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setStatusActionError(result.message || "Failed to update service request status.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState message="Loading service request details…" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Service Request Not Found
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          The requested municipal service application could not be found or has been removed.
        </p>
        <Link
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
          href="/admin/service-requests"
        >
          &larr; Back to Service Requests
        </Link>
      </div>
    );
  }

  if (error || !serviceRequest) {
    return (
      <div className="py-6">
        <ErrorAlert
          actionHref="/admin/service-requests"
          actionLabel="Back to Service Requests"
          message={error || "Unable to retrieve service request details."}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Error loading service request"
        />
      </div>
    );
  }

  const effectivePayment = payment || serviceRequest.payment || null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            className="text-xs font-semibold text-slate-600 hover:text-slate-950 transition"
            href="/admin/service-requests"
          >
            ← Back to Service Requests
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {serviceRequest.service?.name || "Service Request"}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${getRequestStatusBadgeClasses(
                serviceRequest.status
              )}`}
            >
              {formatStatus(serviceRequest.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            Request Reference: {serviceRequest.id}
          </p>
        </div>

        {/* Action Controls based on Status */}
        <div className="flex flex-wrap items-center gap-3">
          {serviceRequest.status === "PENDING_PAYMENT" ? (
            <button
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() =>
                handleOpenStatusModal({
                  newStatus: "CANCELLED",
                  title: "Cancel Service Request",
                  description:
                    "Are you sure you want to cancel this unpaid service request? The citizen will no longer be able to complete payment.",
                  confirmLabel: "Cancel Request",
                  isDestructive: true,
                })
              }
              type="button"
            >
              Cancel Request
            </button>
          ) : null}

          {serviceRequest.status === "PAID" ? (
            <>
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                onClick={() =>
                  handleOpenStatusModal({
                    newStatus: "PROCESSING",
                    title: "Start Processing Request",
                    description:
                      "Mark this paid service request as actively in progress. The operational team will commence fulfillment.",
                    confirmLabel: "Start Processing",
                    isDestructive: false,
                  })
                }
                type="button"
              >
                Start Processing
              </button>
              <button
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={() =>
                  handleOpenStatusModal({
                    newStatus: "CANCELLED",
                    title: "Cancel Paid Service Request",
                    description:
                      "Are you sure you want to cancel this service request?",
                    confirmLabel: "Cancel Request",
                    isDestructive: true,
                    warningNote:
                      "Cancelling a request that has already been paid will NOT issue an automatic refund. Any refund must be coordinated through municipal finance or payment provider tools directly.",
                  })
                }
                type="button"
              >
                Cancel Request
              </button>
            </>
          ) : null}

          {serviceRequest.status === "PROCESSING" ? (
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-emerald-700"
              onClick={() =>
                handleOpenStatusModal({
                  newStatus: "COMPLETED",
                  title: "Complete Service Request",
                  description:
                    "Mark this service request as fully fulfilled and completed.",
                  confirmLabel: "Mark as Completed",
                  isDestructive: false,
                })
              }
              type="button"
            >
              Mark Completed
            </button>
          ) : null}
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

      {/* Error Banner */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <div className="flex items-center justify-between">
            <p>{error}</p>
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

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Request & Citizen Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Request Information Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
              Request Information
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Municipal Service
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {serviceRequest.service?.name}
                </dd>
                {serviceRequest.service?.description ? (
                  <dd className="mt-0.5 text-xs text-slate-600">
                    {serviceRequest.service.description}
                  </dd>
                ) : null}
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Quantity
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {serviceRequest.quantity} unit{serviceRequest.quantity === 1 ? "" : "s"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location / Address
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {serviceRequest.location}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stored Amount
                </dt>
                <dd className="mt-1 text-base font-bold text-slate-950">
                  ${formatServicePrice(serviceRequest.amount)}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Citizen Notes / Instructions
                </dt>
                <dd className="mt-1 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                  {serviceRequest.notes || "No additional notes provided by citizen."}
                </dd>
              </div>
            </dl>
          </div>

          {/* Citizen Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
              Applicant Details
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Full Name
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {serviceRequest.citizen?.name || "Citizen User"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email Address
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {serviceRequest.citizen?.email || "—"}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User ID
                </dt>
                <dd className="mt-1 font-mono text-xs text-slate-600">
                  {serviceRequest.citizenId}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Payment & History */}
        <div className="space-y-6">
          {/* Payment Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-950">Payment Status</h2>
              {effectivePayment ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusBadgeClasses(
                    effectivePayment.status
                  )}`}
                >
                  {formatStatus(effectivePayment.status)}
                </span>
              ) : null}
            </div>

            {effectivePayment ? (
              <dl className="mt-4 space-y-3.5 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Paid Amount</dt>
                  <dd className="font-semibold text-slate-950">
                    ${formatServicePrice(effectivePayment.amount)}{" "}
                    <span className="text-xs uppercase text-slate-500">
                      {effectivePayment.currency}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Payment Provider</dt>
                  <dd className="font-medium text-slate-900 uppercase">
                    {effectivePayment.provider}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Transaction ID</dt>
                  <dd className="font-mono text-xs text-slate-700 truncate" title={effectivePayment.transactionId || ""}>
                    {effectivePayment.transactionId || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Processed At</dt>
                  <dd className="text-xs text-slate-700">
                    {formatDateTime(effectivePayment.createdAt)}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center border border-slate-100">
                <p className="text-sm font-medium text-slate-700">No Payment Recorded</p>
                <p className="mt-1 text-xs text-slate-500">
                  {serviceRequest.status === "PENDING_PAYMENT"
                    ? "Citizen has not completed checkout for this request."
                    : "No payment transaction found."}
                </p>
              </div>
            )}
          </div>

          {/* Timestamps Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
              Application Timestamps
            </h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <dt className="text-slate-400">Created</dt>
                <dd className="font-medium text-slate-800">
                  {formatDateTime(serviceRequest.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <dt className="text-slate-400">Last Updated</dt>
                <dd className="font-medium text-slate-800">
                  {formatDateTime(serviceRequest.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Status Action Confirmation Modal */}
      {activeModal ? (
        <div
          aria-labelledby="status-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="status-modal-title">
              {activeModal.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{activeModal.description}</p>

            {activeModal.warningNote ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                <p className="font-semibold">Important Notice:</p>
                <p className="mt-1">{activeModal.warningNote}</p>
              </div>
            ) : null}

            {statusActionError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                {statusActionError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isStatusPending}
                onClick={handleCloseStatusModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  activeModal.isDestructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
                disabled={isStatusPending}
                onClick={handleStatusSubmit}
                type="button"
              >
                {isStatusPending ? "Updating…" : activeModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminServiceRequestDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading service request details…</p>
          </div>
        </div>
      }
    >
      <ServiceRequestDetailContent />
    </Suspense>
  );
}

