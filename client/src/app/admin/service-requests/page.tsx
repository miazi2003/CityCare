"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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

export default function AdminServiceRequestsPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadServiceRequests() {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<ServiceRequest[]>("service-requests");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setServiceRequests(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete response."
            : result.message || "Failed to load service requests."
        );
      }

      setIsLoading(false);
    }

    void loadServiceRequests();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side filtering
  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return serviceRequests.filter((req) => {
      const matchesStatus = !selectedStatus || req.status === selectedStatus;

      const matchesQuery =
        !query ||
        req.service?.name.toLowerCase().includes(query) ||
        req.location.toLowerCase().includes(query) ||
        (req.notes && req.notes.toLowerCase().includes(query)) ||
        (req.citizen?.name && req.citizen.name.toLowerCase().includes(query)) ||
        (req.citizen?.email && req.citizen.email.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [serviceRequests, selectedStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Municipal Service Requests
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor, review, and manage service applications submitted by citizens across the city.
          </p>
        </div>
      </div>

      {/* Global Error */}
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

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search by citizen, service name, location, or notes..."
              type="text"
              value={searchTerm}
            />
          </div>
          <div className="w-full sm:w-56">
            <select
              aria-label="Filter by request status"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
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
        <div className="text-xs font-medium text-slate-500">
          {!isLoading &&
            `${filteredRequests.length} request${filteredRequests.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading service requests…</p>
          </div>
        </div>
      ) : serviceRequests.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No service requests yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Citizen requests for municipal services will appear here once submitted.
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No service requests match your search and filter criteria.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5" scope="col">Citizen</th>
                  <th className="px-5 py-3.5" scope="col">Service</th>
                  <th className="px-5 py-3.5" scope="col">Qty</th>
                  <th className="px-5 py-3.5" scope="col">Location</th>
                  <th className="px-5 py-3.5" scope="col">Amount</th>
                  <th className="px-5 py-3.5" scope="col">Status</th>
                  <th className="px-5 py-3.5" scope="col">Payment</th>
                  <th className="px-5 py-3.5" scope="col">Submitted</th>
                  <th className="px-5 py-3.5 text-right" scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr className="hover:bg-slate-50/80 transition" key={req.id}>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950">
                          {req.citizen?.name || "Citizen"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {req.citizen?.email || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {req.service?.name || "Municipal Service"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{req.quantity}</td>
                    <td className="px-5 py-4 max-w-xs truncate text-slate-600" title={req.location}>
                      {req.location}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      ${formatServicePrice(req.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRequestStatusBadgeClasses(
                          req.status
                        )}`}
                      >
                        {formatStatus(req.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {req.payment ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPaymentStatusBadgeClasses(
                            req.payment.status
                          )}`}
                        >
                          {formatStatus(req.payment.status)}
                        </span>
                      ) : req.status === "PENDING_PAYMENT" ? (
                        <span className="text-xs text-amber-600">Unpaid</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link
                        className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 transition"
                        href={`/admin/service-requests/${req.id}`}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

