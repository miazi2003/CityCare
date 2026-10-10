"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import type { Complaint, Notification, ServiceRequest } from "@/types";

type DashboardErrors = {
  complaints?: string;
  serviceRequests?: string;
  notifications?: string;
};

type SummaryCardProps = {
  label: string;
  value: number | string;
  detail: string;
};

const activeComplaintStatuses = new Set<Complaint["status"]>([
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
]);

const formatStatus = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const SummaryCard = ({ label, value, detail }: SummaryCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
    <p className="text-sm font-medium text-slate-600">{label}</p>
    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{detail}</p>
  </article>
);

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrors({});

      const [complaintsResult, serviceRequestsResult, notificationsResult] = await Promise.all([
        apiRequest<Complaint[]>("complaints/my"),
        apiRequest<ServiceRequest[]>("service-requests/my"),
        apiRequest<Notification[]>("notifications/unread"),
      ]);

      if (!isMounted) {
        return;
      }

      const nextErrors: DashboardErrors = {};

      if (complaintsResult.success && complaintsResult.data !== null) {
        setComplaints(complaintsResult.data);
      } else {
        nextErrors.complaints = complaintsResult.success
          ? "The server returned an incomplete complaints response."
          : complaintsResult.message;
      }

      if (serviceRequestsResult.success && serviceRequestsResult.data !== null) {
        setServiceRequests(serviceRequestsResult.data);
      } else {
        nextErrors.serviceRequests = serviceRequestsResult.success
          ? "The server returned an incomplete service requests response."
          : serviceRequestsResult.message;
      }

      if (notificationsResult.success && notificationsResult.data !== null) {
        setNotifications(notificationsResult.data);
      } else {
        nextErrors.notifications = notificationsResult.success
          ? "The server returned an incomplete notifications response."
          : notificationsResult.message;
      }

      setErrors(nextErrors);
      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const complaintSummary = useMemo(() => {
    if (errors.complaints) {
      return null;
    }

    return {
      total: complaints.length,
      active: complaints.filter((complaint) => activeComplaintStatuses.has(complaint.status))
        .length,
      breached: complaints.filter((complaint) => complaint.slaStatus === "BREACHED").length,
    };
  }, [complaints, errors.complaints]);

  const recentComplaints = complaints.slice(0, 4);
  const recentServiceRequests = serviceRequests.slice(0, 4);
  const hasErrors = Boolean(errors.complaints || errors.serviceRequests || errors.notifications);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Citizen dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome back{user ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-slate-600">
            Review your municipal complaints, service requests, and notifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/citizen/complaints/new"
          >
            Submit a complaint
          </Link>
          <Link
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            href="/services"
          >
            Browse services
          </Link>
        </div>
      </header>

      {hasErrors ? (
        <ErrorAlert
          message={
            errors.complaints ||
            errors.serviceRequests ||
            errors.notifications ||
            "Failed to load some dashboard sections."
          }
          onRetry={() => setRefreshKey((k) => k + 1)}
          retryLabel="Retry loading dashboard"
        />
      ) : null}

      {isLoading ? <LoadingState message="Loading your dashboard…" /> : null}

      {!isLoading ? (
        <>
          <section aria-label="Dashboard summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              detail={errors.complaints ? "Unavailable" : "All submitted complaints"}
              label="Total complaints"
              value={complaintSummary?.total ?? "—"}
            />
            <SummaryCard
              detail={errors.complaints ? "Unavailable" : "Currently in progress"}
              label="Active complaints"
              value={complaintSummary?.active ?? "—"}
            />
            <SummaryCard
              detail={errors.complaints ? "Unavailable" : "Based on reported SLA status"}
              label="SLA breached"
              value={complaintSummary?.breached ?? "—"}
            />
            <SummaryCard
              detail={errors.serviceRequests ? "Unavailable" : "All submitted requests"}
              label="Service requests"
              value={errors.serviceRequests ? "—" : serviceRequests.length}
            />
            <SummaryCard
              detail={errors.notifications ? "Unavailable" : "Notifications awaiting review"}
              label="Unread notifications"
              value={errors.notifications ? "—" : notifications.length}
            />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-950">Recent complaints</h2>
                <Link className="text-xs font-semibold text-slate-700 underline hover:text-slate-950" href="/citizen/complaints">
                  View all →
                </Link>
              </div>

              {!errors.complaints && recentComplaints.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">You have not submitted any complaints yet.</p>
              ) : null}

              {!errors.complaints && recentComplaints.length > 0 ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {recentComplaints.map((complaint) => (
                    <li className="py-3 first:pt-0" key={complaint.id}>
                      <Link
                        className="font-medium text-slate-950 underline hover:text-slate-800 text-sm"
                        href={`/citizen/complaints/${complaint.id}`}
                      >
                        {complaint.title}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {formatStatus(complaint.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {formatStatus(complaint.priority)} priority
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-950">Recent service requests</h2>
                <Link className="text-xs font-semibold text-slate-700 underline hover:text-slate-950" href="/citizen/service-requests">
                  View all →
                </Link>
              </div>

              {!errors.serviceRequests && recentServiceRequests.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">You have not submitted any service requests yet.</p>
              ) : null}

              {!errors.serviceRequests && recentServiceRequests.length > 0 ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {recentServiceRequests.map((serviceRequest) => (
                    <li className="py-3 first:pt-0" key={serviceRequest.id}>
                      <Link
                        className="font-medium text-slate-950 underline hover:text-slate-800 text-sm"
                        href={`/citizen/service-requests/${serviceRequest.id}`}
                      >
                        {serviceRequest.service.name}
                      </Link>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Status: <span className="font-semibold text-slate-800">{formatStatus(serviceRequest.status)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
