"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import type {
  Payment,
  PaymentSession,
  PaymentStatus,
  ServiceRequest,
  ServiceRequestStatus,
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

function ServiceRequestDetailContent() {
  const { requestId } = useParams<{ requestId: string }>();
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pay Now submission state
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

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

      // Handle payment data safely: prioritize dedicated payment endpoint, fallback to request relation
      if (paymentResult.success && paymentResult.data) {
        setPayment(paymentResult.data);
      } else if (requestResult.success && requestResult.data?.payment) {
        setPayment(requestResult.data.payment);
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

  const isEligibleForPayment = serviceRequest?.status === "PENDING_PAYMENT";

  const handlePayNow = async () => {
    if (!requestId || !isEligibleForPayment || isPaying) return;
    setIsPaying(true);
    setPayError(null);

    const result = await apiRequest<PaymentSession>(
      `service-requests/${encodeURIComponent(requestId)}/payment`,
      { method: "POST" }
    );

    if (result.success && result.data?.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
    } else {
      setIsPaying(false);
      setPayError(
        result.message || "Failed to initiate payment checkout session. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <LoadingState message="Loading service request details…" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">Service request not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested service record does not exist or you do not have permission to view it.
          </p>
          <Link
            className="mt-6 inline-block rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/citizen/service-requests"
          >
            &larr; Back to my service requests
          </Link>
        </div>
      </div>
    );
  }

  if (error || !serviceRequest) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <ErrorAlert
          actionHref="/citizen/service-requests"
          actionLabel="Back to service requests"
          message={error || "Unable to retrieve service request data."}
          onRetry={() => setRefreshKey((k) => k + 1)}
          title="Error loading service request"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/citizen/service-requests"
        >
          &larr; Back to service requests
        </Link>
      </div>

      {/* Payment Feedback Banners (from Stripe Return) */}
      {paymentParam === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              ✓
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950">Payment Submitted Successfully</p>
              <p className="text-xs text-emerald-800">
                Your payment was received. The system is reconciling the transaction with Stripe.
                Your service request and payment status will update automatically once confirmed by the server.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {paymentParam === "cancelled" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              !
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Payment Checkout Cancelled</p>
              <p className="text-xs text-amber-800">
                The Stripe payment session was cancelled. No charges were made. You may review the details and proceed with payment when ready.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Payment error if Pay Now action failed */}
      {payError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-xs">
          <p className="font-semibold text-rose-950">Payment Initiation Failed</p>
          <p className="mt-1 text-xs text-rose-800">{payError}</p>
        </div>
      ) : null}

      {/* Service Request Overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRequestStatusBadgeClasses(
                  serviceRequest.status
                )}`}
              >
                {formatStatus(serviceRequest.status)}
              </span>

              {payment ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPaymentStatusBadgeClasses(
                    payment.status
                  )}`}
                >
                  Payment: {formatStatus(payment.status)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {serviceRequest.service?.name || "Municipal Service Request"}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-400">
              Reference ID: {serviceRequest.id}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="text-xs font-medium text-slate-500">Total Billed Amount:</span>
            <span className="text-2xl font-bold text-slate-950">
              ${formatServicePrice(serviceRequest.amount)}
            </span>

            {/* Pay Now Button in Top Header if pending payment */}
            {isEligibleForPayment ? (
              <button
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPaying}
                onClick={handlePayNow}
                type="button"
              >
                {isPaying ? "Redirecting to Stripe…" : `Pay Now ($${formatServicePrice(serviceRequest.amount)})`}
              </button>
            ) : null}
          </div>
        </div>

        {serviceRequest.service?.description ? (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-900">Service Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {serviceRequest.service.description}
            </p>
          </div>
        ) : null}

        {/* Request Details Grid */}
        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">Service Location</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {serviceRequest.location}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Requested Quantity</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {serviceRequest.quantity} unit{serviceRequest.quantity > 1 ? "s" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Submitted Date</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {formatDateTime(serviceRequest.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {formatDateTime(serviceRequest.updatedAt)}
            </dd>
          </div>
        </dl>

        {/* Additional Notes */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-900">Citizen Notes &amp; Instructions</h2>
          {serviceRequest.notes ? (
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              <p className="whitespace-pre-line">{serviceRequest.notes}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-slate-500">No additional notes provided.</p>
          )}
        </div>
      </section>

      {/* Payment Information Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Payment &amp; Billing Information</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Transaction details and payment settlement status for this municipal request.
            </p>
          </div>

          {payment ? (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPaymentStatusBadgeClasses(
                payment.status
              )}`}
            >
              Status: {formatStatus(payment.status)}
            </span>
          ) : null}
        </div>

        {payment ? (
          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">Payment Amount</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                ${formatServicePrice(payment.amount)} {payment.currency?.toUpperCase() || "USD"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Payment Provider</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {payment.provider || "STRIPE"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Transaction / Session ID</dt>
              <dd className="mt-1 font-mono text-xs text-slate-800 break-all">
                {payment.transactionId || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Payment Date</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {formatDateTime(payment.createdAt)}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700">No finalized payment record</p>
            <p className="mt-1 text-xs text-slate-500">
              {isEligibleForPayment
                ? "This service request is currently pending payment. Click the Pay Now button to complete payment with Stripe."
                : "There is currently no payment session recorded for this service request."}
            </p>

            {isEligibleForPayment ? (
              <div className="mt-4">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPaying}
                  onClick={handlePayNow}
                  type="button"
                >
                  {isPaying ? "Redirecting to Stripe…" : `Pay Now ($${formatServicePrice(serviceRequest.amount)})`}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

export default function CitizenServiceRequestDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-6">
          <p className="text-slate-600">Loading service request…</p>
        </div>
      }
    >
      <ServiceRequestDetailContent />
    </Suspense>
  );
}

