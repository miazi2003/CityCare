"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ComplaintStatus, Feedback } from "@/types";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-base leading-none ${
            star <= rating ? "text-amber-400" : "text-slate-200"
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-700">{rating}.0</span>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadFeedback() {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<Feedback[]>("feedback");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setFeedbackList(result.data);
      } else {
        setError(result.message || "Failed to load citizen feedback.");
      }

      setIsLoading(false);
    }

    void loadFeedback();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Analytics summary
  const { averageRating, positivePercentage } = useMemo(() => {
    if (feedbackList.length === 0) {
      return { averageRating: 0, positivePercentage: 0 };
    }
    const sum = feedbackList.reduce((acc, f) => acc + f.rating, 0);
    const avg = sum / feedbackList.length;
    const positiveCount = feedbackList.filter((f) => f.rating >= 4).length;
    const pct = Math.round((positiveCount / feedbackList.length) * 100);
    return { averageRating: Number(avg.toFixed(1)), positivePercentage: pct };
  }, [feedbackList]);

  // Client-side filtering
  const filteredFeedback = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return feedbackList.filter((f) => {
      const matchesRating =
        !ratingFilter || f.rating === Number(ratingFilter);

      const matchesQuery =
        !query ||
        f.citizen?.name.toLowerCase().includes(query) ||
        f.citizen?.email.toLowerCase().includes(query) ||
        (f.comment && f.comment.toLowerCase().includes(query)) ||
        (f.complaint?.title && f.complaint.title.toLowerCase().includes(query)) ||
        (f.complaint?.department?.name &&
          f.complaint.department.name.toLowerCase().includes(query)) ||
        (f.complaint?.category?.name &&
          f.complaint.category.name.toLowerCase().includes(query)) ||
        (f.complaint?.assignedStaff?.name &&
          f.complaint.assignedStaff.name.toLowerCase().includes(query));

      return matchesRating && matchesQuery;
    });
  }, [feedbackList, ratingFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Citizen Feedback & Ratings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Read-only evaluation of citizen satisfaction on resolved and closed municipal complaints.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      {!isLoading && !error && feedbackList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Reviews
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {feedbackList.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Submissions across all departments
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Average Rating
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-950">
                {averageRating}
              </span>
              <span className="text-sm font-medium text-slate-500">/ 5.0</span>
            </div>
            <div className="mt-1">
              <StarRating rating={Math.round(averageRating)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Citizen Satisfaction
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {positivePercentage}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Rated 4 or 5 stars on resolution
            </p>
          </div>
        </div>
      ) : null}

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

      {/* Search & Rating Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search feedback by citizen, comment, complaint, department, or staff..."
              type="text"
              value={searchTerm}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              aria-label="Filter by rating"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setRatingFilter(e.target.value)}
              value={ratingFilter}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
              <option value="2">2 Stars (Poor)</option>
              <option value="1">1 Star (Very Poor)</option>
            </select>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {!isLoading &&
            `${filteredFeedback.length} review${filteredFeedback.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Feedback Feed / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading citizen feedback…</p>
          </div>
        </div>
      ) : feedbackList.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No feedback submitted yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Citizen ratings and comments on closed complaints will be gathered here.
          </p>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No citizen feedback matches your search and rating filters.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => {
              setSearchTerm("");
              setRatingFilter("");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((f) => (
            <div
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
              key={f.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={f.rating} />
                    <span className="text-xs text-slate-400">
                      Submitted {formatDate(f.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2.5 text-sm text-slate-800 leading-relaxed">
                    {f.comment ? (
                      `“${f.comment}”`
                    ) : (
                      <span className="italic text-slate-400">
                        No written comment provided with this rating.
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 sm:w-64">
                  <p className="font-semibold text-slate-900">
                    {f.citizen?.name || "Citizen"}
                  </p>
                  <p className="text-slate-500 truncate">{f.citizen?.email || "—"}</p>
                </div>
              </div>

              {/* Related Complaint Context Bar */}
              {f.complaint ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-700">Complaint:</span>
                    <Link
                      className="font-medium text-slate-900 underline hover:text-slate-700 max-w-xs truncate"
                      href={`/admin/complaints/${f.complaint.id || f.complaintId}`}
                    >
                      {f.complaint.title || "View Complaint Details"}
                    </Link>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusBadgeClasses(
                        f.complaint.status
                      )}`}
                    >
                      {formatStatus(f.complaint.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    <span>
                      Dept:{" "}
                      <strong className="font-medium text-slate-700">
                        {f.complaint.department?.name || "—"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Category:{" "}
                      <strong className="font-medium text-slate-700">
                        {f.complaint.category?.name || "—"}
                      </strong>
                    </span>
                    {f.complaint.assignedStaff ? (
                      <>
                        <span>•</span>
                        <span>
                          Staff:{" "}
                          <strong className="font-medium text-slate-700">
                            {f.complaint.assignedStaff.name}
                          </strong>
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <Link
                    className="font-medium text-slate-900 underline hover:text-slate-700"
                    href={`/admin/complaints/${f.complaintId}`}
                  >
                    View Associated Complaint →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

