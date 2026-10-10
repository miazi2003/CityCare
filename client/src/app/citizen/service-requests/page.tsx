"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type { PaymentStatus, ServiceRequest, ServiceRequestStatus } from "@/types";

const statusOptions: ServiceRequestStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
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

export default function CitizenServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadServiceRequests() {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<ServiceRequest[]>("service-requests/my");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setServiceRequests(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete service requests response."
            : result.message
        );
      }

      setIsLoading(false);
    }

    void loadServiceRequests();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const filteredRequests = useMemo(() => {
    return serviceRequests.filter((request) => {
      if (selectedStatus && request.status !== selectedStatus) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const serviceName = request.service?.name?.toLowerCase() || "";
        const location = request.location?.toLowerCase() || "";
        const id = request.id.toLowerCase();
        const notes = request.notes?.toLowerCase() || "";

        const matches =
          serviceName.includes(query) ||
          location.includes(query) ||
          id.includes(query) ||
          notes.includes(query);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [serviceRequests, selectedStatus, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm.trim() || selectedStatus);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Citizen services
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Municipal Service Requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track your requested city services, quantities, amounts, and progress status.
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
            href="/citizen/service-requests/new"
          >
            + New Service Request
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? <LoadingState message="Loading service requests…" /> : null}

      {/* Error state */}
      {error ? (
        <div className="mt-8">
          <ErrorAlert
            message={error}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      ) : null}

      {!isLoading && !error && (
        <div className="mt-8 space-y-6">
          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Search text filter */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="search-requests">
                  Search Requests
                </label>
                <input
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  id="search-requests"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  placeholder="Search by service name, location, notes, or reference ID…"
                  type="text"
                  value={searchTerm}
                />
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="status-filter">
                  Request Status
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
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Showing {filteredRequests.length} of {serviceRequests.length} requests
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

          {/* Empty state: No requests submitted at all */}
          {serviceRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">No service requests yet</h3>
              <p className="mt-2 text-sm text-slate-600">
                You have not submitted any municipal service requests.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href="/citizen/service-requests/new"
                >
                  Request a Service
                </Link>
                <Link
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  href="/services"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          ) : null}

          {/* Empty state: Filters produced 0 results */}
          {serviceRequests.length > 0 && filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-900">
                No service requests matched your filters.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting or clearing your search term or status filter.
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

          {/* Service Requests Cards / List */}
          {filteredRequests.length > 0 ? (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 sm:p-6"
                  key={request.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRequestStatusBadgeClasses(
                            request.status
                          )}`}
                        >
                          {formatStatus(request.status)}
                        </span>

                        {request.payment ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPaymentStatusBadgeClasses(
                              request.payment.status
                            )}`}
                          >
                            Payment: {formatStatus(request.payment.status)}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="text-lg font-bold text-slate-950">
                        <Link
                          className="hover:underline"
                          href={`/citizen/service-requests/${request.id}`}
                        >
                          {request.service?.name || "Municipal Service"}
                        </Link>
                      </h2>
                      <p className="font-mono text-xs text-slate-400">ID: {request.id}</p>
                    </div>

                    <div className="flex shrink-0 items-baseline gap-1 text-right sm:flex-col sm:items-end">
                      <span className="text-xs text-slate-500">Amount:</span>
                      <span className="text-base font-bold text-slate-950">
                        ${formatServicePrice(request.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata grid */}
                  <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-3">
                    <div>
                      <dt className="font-medium text-slate-400">Location</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">{request.location}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Quantity</dt>
                      <dd className="mt-0.5 font-medium text-slate-800">{request.quantity} unit{request.quantity > 1 ? "s" : ""}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-400">Requested Date</dt>
                      <dd className="mt-0.5 font-medium text-slate-800" title={formatDateTime(request.createdAt)}>
                        {formatDate(request.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  {/* Notes snippet if present */}
                  {request.notes ? (
                    <p className="mt-3 truncate text-xs italic text-slate-500">
                      Note: &ldquo;{request.notes}&rdquo;
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    {request.status === "PENDING_PAYMENT" ? (
                      <Link
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
                        href={`/citizen/service-requests/${request.id}`}
                      >
                        Pay Now (${formatServicePrice(request.amount)}) &rarr;
                      </Link>
                    ) : (
                      <span />
                    )}

                    <Link
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                      href={`/citizen/service-requests/${request.id}`}
                    >
                      View Details &amp; Tracking &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

