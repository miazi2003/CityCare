"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  CategoryAnalytics,
  DepartmentAnalytics,
  OverviewAnalytics,
  ServiceAndPaymentAnalytics,
  StaffAnalytics,
  TimeBasedComplaintAnalytics,
} from "@/types";

type AnalyticsTab =
  | "OVERVIEW"
  | "DEPARTMENTS"
  | "CATEGORIES"
  | "STAFF"
  | "COMPLAINTS"
  | "SERVICES";

function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  const num = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(num)) return `$${amount}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-500 font-semibold text-xs">★</span>
      <span className="font-semibold text-slate-800 text-xs">
        {rating > 0 ? rating.toFixed(1) : "—"}
      </span>
      {rating > 0 ? <span className="text-[10px] text-slate-400">/ 5.0</span> : null}
    </div>
  );
}

function PercentageBar({
  value,
  max,
  colorClass = "bg-slate-900",
}: {
  value: number;
  max: number;
  colorClass?: string;
}) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full max-w-[120px] rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 w-8 text-right">{percentage}%</span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("OVERVIEW");

  // Overview Data
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Departments Data
  const [departmentsData, setDepartmentsData] = useState<DepartmentAnalytics[]>([]);
  const [isDeptsLoading, setIsDeptsLoading] = useState(false);
  const [deptsError, setDeptsError] = useState<string | null>(null);

  // Categories Data
  const [categoriesData, setCategoriesData] = useState<CategoryAnalytics[]>([]);
  const [isCatsLoading, setIsCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  // Staff Data
  const [staffData, setStaffData] = useState<StaffAnalytics[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Complaints Report Data
  const [complaintsReport, setComplaintsReport] = useState<TimeBasedComplaintAnalytics | null>(null);
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedDates, setAppliedDates] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Services Data
  const [servicesData, setServicesData] = useState<ServiceAndPaymentAnalytics | null>(null);
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Fetch Overview
  useEffect(() => {
    if (activeTab !== "OVERVIEW") return;
    let isMounted = true;

    async function loadOverview() {
      setIsOverviewLoading(true);
      setOverviewError(null);

      const result = await apiRequest<OverviewAnalytics>("analytics/overview");

      if (!isMounted) return;

      if (result.success && result.data) {
        setOverview(result.data);
      } else {
        setOverviewError(result.message || "Failed to load overview analytics.");
      }
      setIsOverviewLoading(false);
    }

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  // 2. Fetch Departments
  useEffect(() => {
    if (activeTab !== "DEPARTMENTS") return;
    let isMounted = true;

    async function loadDepartments() {
      setIsDeptsLoading(true);
      setDeptsError(null);

      const result = await apiRequest<DepartmentAnalytics[]>("analytics/departments");

      if (!isMounted) return;

      if (result.success && result.data) {
        setDepartmentsData(result.data);
      } else {
        setDeptsError(result.message || "Failed to load department analytics.");
      }
      setIsDeptsLoading(false);
    }

    void loadDepartments();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  // 3. Fetch Categories
  useEffect(() => {
    if (activeTab !== "CATEGORIES") return;
    let isMounted = true;

    async function loadCategories() {
      setIsCatsLoading(true);
      setCatsError(null);

      const result = await apiRequest<CategoryAnalytics[]>("analytics/categories");

      if (!isMounted) return;

      if (result.success && result.data) {
        setCategoriesData(result.data);
      } else {
        setCatsError(result.message || "Failed to load category analytics.");
      }
      setIsCatsLoading(false);
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  // 4. Fetch Staff
  useEffect(() => {
    if (activeTab !== "STAFF") return;
    let isMounted = true;

    async function loadStaff() {
      setIsStaffLoading(true);
      setStaffError(null);

      const result = await apiRequest<StaffAnalytics[]>("analytics/staff");

      if (!isMounted) return;

      if (result.success && result.data) {
        setStaffData(result.data);
      } else {
        setStaffError(result.message || "Failed to load staff analytics.");
      }
      setIsStaffLoading(false);
    }

    void loadStaff();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  // 5. Fetch Complaints Report
  useEffect(() => {
    if (activeTab !== "COMPLAINTS") return;
    let isMounted = true;

    async function loadComplaints() {
      setIsComplaintsLoading(true);
      setComplaintsError(null);

      const params = new URLSearchParams();
      if (appliedDates.from) params.set("from", appliedDates.from);
      if (appliedDates.to) params.set("to", appliedDates.to);

      const queryString = params.toString();
      const path = queryString ? `analytics/complaints?${queryString}` : "analytics/complaints";

      const result = await apiRequest<TimeBasedComplaintAnalytics>(path);

      if (!isMounted) return;

      if (result.success && result.data) {
        setComplaintsReport(result.data);
      } else {
        setComplaintsError(result.message || "Failed to load complaints report.");
      }
      setIsComplaintsLoading(false);
    }

    void loadComplaints();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey, appliedDates]);

  const handleDateFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDateValidationError(null);

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setDateValidationError("The 'From' date cannot be later than the 'To' date.");
      return;
    }

    setAppliedDates({ from: fromDate, to: toDate });
  };

  const handleClearDates = () => {
    setFromDate("");
    setToDate("");
    setDateValidationError(null);
    setAppliedDates({ from: "", to: "" });
  };

  // 6. Fetch Services & Revenue
  useEffect(() => {
    if (activeTab !== "SERVICES") return;
    let isMounted = true;

    async function loadServices() {
      setIsServicesLoading(true);
      setServicesError(null);

      const result = await apiRequest<ServiceAndPaymentAnalytics>("analytics/services");

      if (!isMounted) return;

      if (result.success && result.data) {
        setServicesData(result.data);
      } else {
        setServicesError(result.message || "Failed to load service and revenue analytics.");
      }
      setIsServicesLoading(false);
    }

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  // Helpers for visuals
  const maxDeptComplaints = useMemo(
    () => Math.max(...departmentsData.map((d) => d.totalComplaints), 1),
    [departmentsData]
  );

  const maxCatComplaints = useMemo(
    () => Math.max(...categoriesData.map((c) => c.totalComplaints), 1),
    [categoriesData]
  );

  const maxServiceRevenue = useMemo(
    () => Math.max(...(servicesData?.serviceWise.map((s) => s.revenue) || [1]), 1),
    [servicesData]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            In-depth municipal performance intelligence across departments, categories, staff, and revenue.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-hidden"
          onClick={() => setRefreshKey((k) => k + 1)}
          type="button"
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav aria-label="Analytics sections" className="-mb-px flex space-x-6 overflow-x-auto pb-1">
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "OVERVIEW"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("OVERVIEW")}
            type="button"
          >
            Overview
          </button>
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "DEPARTMENTS"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("DEPARTMENTS")}
            type="button"
          >
            Departments
          </button>
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "CATEGORIES"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("CATEGORIES")}
            type="button"
          >
            Categories
          </button>
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "STAFF"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("STAFF")}
            type="button"
          >
            Staff Performance
          </button>
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "COMPLAINTS"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("COMPLAINTS")}
            type="button"
          >
            Complaint Report
          </button>
          <button
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "SERVICES"
                ? "border-slate-900 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("SERVICES")}
            type="button"
          >
            Services & Revenue
          </button>
        </nav>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeTab === "OVERVIEW" ? (
        <div className="space-y-6">
          {overviewError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{overviewError}</p>
            </div>
          ) : null}

          {isOverviewLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading overview intelligence…</p>
              </div>
            </div>
          ) : overview ? (
            <>
              {/* Summary KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Complaints Handled
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {overview.totalComplaints}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Across {overview.totalDepartments} departments
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Citizen Feedback
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-slate-950">
                      {overview.averageRating > 0 ? overview.averageRating.toFixed(1) : "—"}
                    </span>
                    <span className="text-sm font-medium text-slate-500">/ 5.0</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.totalFeedback} citizen reviews
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Service Revenue
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {formatCurrency(overview.totalRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.totalPaidServiceRequests} paid requests
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Platform Users
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {overview.totalUsers}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.totalCitizens} Citizens • {overview.totalStaff} Staff
                  </p>
                </div>
              </div>

              {/* Status Breakdown Visual Meter */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    Complaint Status Distribution
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Submitted", count: overview.submitted, color: "bg-amber-500" },
                      { label: "Under Review", count: overview.underReview, color: "bg-sky-500" },
                      { label: "Assigned", count: overview.assigned, color: "bg-blue-500" },
                      { label: "In Progress", count: overview.inProgress, color: "bg-indigo-500" },
                      { label: "Resolved", count: overview.resolved, color: "bg-emerald-500" },
                      { label: "Closed", count: overview.closed, color: "bg-teal-600" },
                      { label: "Reopened", count: overview.reopened, color: "bg-orange-500" },
                      { label: "Rejected", count: overview.rejected, color: "bg-slate-400" },
                      { label: "Cancelled", count: overview.cancelled, color: "bg-slate-300" },
                    ].map((item) => (
                      <div className="flex items-center justify-between gap-4" key={item.label}>
                        <span className="text-xs font-medium text-slate-700 w-28">{item.label}</span>
                        <div className="flex-1">
                          <PercentageBar
                            colorClass={item.color}
                            max={overview.totalComplaints}
                            value={item.count}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLA Compliance Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    SLA Compliance Profile
                  </h2>
                  <div className="space-y-4 text-sm">
                    <div className="rounded-lg bg-emerald-50/70 p-4 border border-emerald-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                          Active & On-Time
                        </p>
                        <p className="text-sm text-emerald-700">Within expected SLA resolution window</p>
                      </div>
                      <span className="text-2xl font-bold text-emerald-900">{overview.onTime}</span>
                    </div>

                    <div className="rounded-lg bg-red-50/70 p-4 border border-red-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                          Active SLA Breached
                        </p>
                        <p className="text-sm text-red-700">Currently past due deadline</p>
                      </div>
                      <span className="text-2xl font-bold text-red-900">{overview.breached}</span>
                    </div>

                    <div className="rounded-lg bg-blue-50/70 p-4 border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                          Completed On Time
                        </p>
                        <p className="text-sm text-blue-700">Resolved before deadline</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-900">{overview.completedOnTime}</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                          Completed Late
                        </p>
                        <p className="text-sm text-slate-600">Resolved after SLA expired</p>
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{overview.completedLate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* SECTION 2: DEPARTMENTS */}
      {activeTab === "DEPARTMENTS" ? (
        <div className="space-y-6">
          {deptsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{deptsError}</p>
            </div>
          ) : null}

          {isDeptsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading department analytics…</p>
              </div>
            </div>
          ) : departmentsData.length === 0 && !deptsError ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No active departments found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparative Visual Bars */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                  Department Workload Comparison
                </h2>
                <div className="space-y-3">
                  {departmentsData.map((d) => (
                    <div className="flex items-center justify-between gap-4" key={d.departmentId}>
                      <span className="text-xs font-semibold text-slate-900 w-44 truncate" title={d.departmentName}>
                        {d.departmentName}
                      </span>
                      <div className="flex-1">
                        <PercentageBar
                          colorClass="bg-blue-600"
                          max={maxDeptComplaints}
                          value={d.totalComplaints}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-16 text-right">
                        {d.totalComplaints} total
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Detailed Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left text-sm text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5" scope="col">Department</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Total</th>
                        <th className="px-5 py-3.5 text-center" scope="col">In Progress</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Resolved</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Closed</th>
                        <th className="px-5 py-3.5 text-center" scope="col">On-Time</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Breached</th>
                        <th className="px-5 py-3.5 text-right" scope="col">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentsData.map((d) => (
                        <tr className="hover:bg-slate-50/80 transition" key={d.departmentId}>
                          <td className="px-5 py-4 font-semibold text-slate-950 whitespace-nowrap">
                            {d.departmentName}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-900">
                            {d.totalComplaints}
                          </td>
                          <td className="px-5 py-4 text-center text-slate-700">{d.inProgress}</td>
                          <td className="px-5 py-4 text-center text-emerald-600 font-medium">
                            {d.resolved}
                          </td>
                          <td className="px-5 py-4 text-center text-teal-700">{d.closed}</td>
                          <td className="px-5 py-4 text-center text-blue-600">
                            {d.completedOnTime}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {d.breached > 0 ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                {d.breached}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <StarDisplay rating={d.averageRating} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* SECTION 3: CATEGORIES */}
      {activeTab === "CATEGORIES" ? (
        <div className="space-y-6">
          {catsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{catsError}</p>
            </div>
          ) : null}

          {isCatsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading category statistics…</p>
              </div>
            </div>
          ) : categoriesData.length === 0 && !catsError ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No category statistics recorded.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Volume Visual Bars */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                  Top Complaint Categories by Volume
                </h2>
                <div className="space-y-3">
                  {categoriesData.slice(0, 10).map((cat) => (
                    <div className="flex items-center justify-between gap-4" key={cat.categoryId}>
                      <div className="w-56 min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{cat.categoryName}</p>
                        <p className="truncate text-[10px] text-slate-500">{cat.departmentName}</p>
                      </div>
                      <div className="flex-1">
                        <PercentageBar
                          colorClass="bg-indigo-600"
                          max={maxCatComplaints}
                          value={cat.totalComplaints}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-16 text-right">
                        {cat.totalComplaints}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left text-sm text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5" scope="col">Category</th>
                        <th className="px-5 py-3.5" scope="col">Department</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Total</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Resolved</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Closed</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Rejected</th>
                        <th className="px-5 py-3.5 text-center" scope="col">SLA Breached</th>
                        <th className="px-5 py-3.5 text-right" scope="col">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoriesData.map((cat) => (
                        <tr className="hover:bg-slate-50/80 transition" key={cat.categoryId}>
                          <td className="px-5 py-4 font-semibold text-slate-950 whitespace-nowrap">
                            {cat.categoryName}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {cat.departmentName}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-900">
                            {cat.totalComplaints}
                          </td>
                          <td className="px-5 py-4 text-center text-emerald-600">{cat.resolved}</td>
                          <td className="px-5 py-4 text-center text-teal-700">{cat.closed}</td>
                          <td className="px-5 py-4 text-center text-slate-500">{cat.rejected}</td>
                          <td className="px-5 py-4 text-center">
                            {cat.breached > 0 ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                {cat.breached}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <StarDisplay rating={cat.averageRating} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* SECTION 4: STAFF PERFORMANCE */}
      {activeTab === "STAFF" ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50/70 p-4 border border-blue-200 text-xs text-blue-900">
            <p className="font-semibold">Workload Context:</p>
            <p className="mt-0.5">
              Workload and SLA statistics reflect complaints currently assigned to each staff specialist.
            </p>
          </div>

          {staffError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{staffError}</p>
            </div>
          ) : null}

          {isStaffLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading staff intelligence…</p>
              </div>
            </div>
          ) : staffData.length === 0 && !staffError ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <p className="text-sm text-slate-500">No active staff analytics recorded.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-[750px] w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5" scope="col">Staff Specialist</th>
                      <th className="px-5 py-3.5" scope="col">Department</th>
                      <th className="px-5 py-3.5 text-center" scope="col">Active Workload</th>
                      <th className="px-5 py-3.5 text-center" scope="col">In Progress</th>
                      <th className="px-5 py-3.5 text-center" scope="col">Resolved</th>
                      <th className="px-5 py-3.5 text-center" scope="col">Closed</th>
                      <th className="px-5 py-3.5 text-center" scope="col">On-Time</th>
                      <th className="px-5 py-3.5 text-center" scope="col">Breached</th>
                      <th className="px-5 py-3.5 text-right" scope="col">Feedback Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffData.map((staff) => (
                      <tr className="hover:bg-slate-50/80 transition" key={staff.staffId}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-950">{staff.name}</p>
                          <p className="text-xs text-slate-500">{staff.email}</p>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {staff.departmentName || "Unassigned"}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-900">
                          {staff.assignedComplaints}
                        </td>
                        <td className="px-5 py-4 text-center text-indigo-700 font-medium">
                          {staff.inProgress}
                        </td>
                        <td className="px-5 py-4 text-center text-emerald-600 font-medium">
                          {staff.resolved}
                        </td>
                        <td className="px-5 py-4 text-center text-teal-700">{staff.closed}</td>
                        <td className="px-5 py-4 text-center text-blue-600">
                          {staff.completedOnTime}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {staff.breached > 0 ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              {staff.breached}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <StarDisplay rating={staff.averageRating} />
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

      {/* SECTION 5: COMPLAINT REPORT */}
      {activeTab === "COMPLAINTS" ? (
        <div className="space-y-6">
          {/* Date Filter Bar */}
          <form
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-end"
            onSubmit={handleDateFilterSubmit}
          >
            <div>
              <label className="block text-xs font-medium text-slate-700" htmlFor="filter-from-date">
                From Date
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                id="filter-from-date"
                onChange={(e) => setFromDate(e.target.value)}
                type="date"
                value={fromDate}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700" htmlFor="filter-to-date">
                To Date
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                id="filter-to-date"
                onChange={(e) => setToDate(e.target.value)}
                type="date"
                value={toDate}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800"
                type="submit"
              >
                Apply Date Range
              </button>
              {(fromDate || toDate) ? (
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={handleClearDates}
                  type="button"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </form>

          {dateValidationError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="alert">
              {dateValidationError}
            </div>
          ) : null}

          {complaintsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{complaintsError}</p>
            </div>
          ) : null}

          {isComplaintsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Generating complaints report…</p>
              </div>
            </div>
          ) : complaintsReport ? (
            <div className="space-y-6">
              {/* Total Complaints Banner */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Complaints Registered
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                    {complaintsReport.totalComplaints}
                  </p>
                </div>
                {fromDate || toDate ? (
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Range: {fromDate || "Start"} → {toDate || "Present"}
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    All Time History
                  </span>
                )}
              </div>

              {/* Status & Priority Breakdowns */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Priority Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    Priority Breakdown
                  </h2>
                  <div className="space-y-3">
                    {[
                      { key: "URGENT", label: "Urgent Priority", color: "bg-red-600" },
                      { key: "HIGH", label: "High Priority", color: "bg-orange-500" },
                      { key: "MEDIUM", label: "Medium Priority", color: "bg-yellow-500" },
                      { key: "LOW", label: "Low Priority", color: "bg-slate-400" },
                    ].map((p) => {
                      const count = complaintsReport.priorityCounts[p.key as keyof typeof complaintsReport.priorityCounts] || 0;
                      return (
                        <div className="flex items-center justify-between gap-4" key={p.key}>
                          <span className="text-xs font-medium text-slate-700 w-28">{p.label}</span>
                          <div className="flex-1">
                            <PercentageBar
                              colorClass={p.color}
                              max={complaintsReport.totalComplaints}
                              value={count}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-900 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    Status Breakdown
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(complaintsReport.statusCounts).map(([statusKey, count]) => (
                      <div className="flex items-center justify-between gap-4" key={statusKey}>
                        <span className="text-xs font-medium text-slate-700 w-28 truncate">
                          {formatStatus(statusKey)}
                        </span>
                        <div className="flex-1">
                          <PercentageBar
                            colorClass="bg-slate-800"
                            max={complaintsReport.totalComplaints}
                            value={count}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department & Category Top Lists */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    Complaints by Department
                  </h2>
                  {complaintsReport.complaintsByDepartment.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">No department records found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {complaintsReport.complaintsByDepartment.map((d) => (
                        <div className="flex items-center justify-between text-xs" key={d.departmentId}>
                          <span className="font-medium text-slate-800">{d.departmentName}</span>
                          <span className="font-bold text-slate-950">{d.count} complaints</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                    Complaints by Category
                  </h2>
                  {complaintsReport.complaintsByCategory.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4">No category records found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {complaintsReport.complaintsByCategory.slice(0, 8).map((c) => (
                        <div className="flex items-center justify-between text-xs" key={c.categoryId}>
                          <span className="font-medium text-slate-800">{c.categoryName}</span>
                          <span className="font-bold text-slate-950">{c.count} complaints</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* SECTION 6: SERVICES & REVENUE */}
      {activeTab === "SERVICES" ? (
        <div className="space-y-6">
          {servicesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              <p>{servicesError}</p>
            </div>
          ) : null}

          {isServicesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
                <p className="mt-3 text-sm text-slate-600">Loading revenue intelligence…</p>
              </div>
            </div>
          ) : servicesData ? (
            <div className="space-y-6">
              {/* Revenue & Service KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total Revenue Generated
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {formatCurrency(servicesData.totalRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">From paid municipal requests</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total Service Requests
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {servicesData.totalServiceRequests}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {servicesData.paid} paid • {servicesData.pendingPayment} pending
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Fulfillment Rate
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {servicesData.completed}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Completed service operations</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Active Catalog
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {servicesData.activeServices}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    of {servicesData.totalServices} total services
                  </p>
                </div>
              </div>

              {/* Service Revenue Distribution Visual */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-base font-semibold text-slate-950 border-b border-slate-100 pb-3">
                  Service Revenue Generation
                </h2>
                <div className="space-y-3">
                  {servicesData.serviceWise.map((s) => (
                    <div className="flex items-center justify-between gap-4" key={s.serviceId}>
                      <span className="text-xs font-semibold text-slate-900 w-48 truncate" title={s.serviceName}>
                        {s.serviceName}
                      </span>
                      <div className="flex-1">
                        <PercentageBar
                          colorClass="bg-emerald-600"
                          max={maxServiceRevenue}
                          value={s.revenue}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-900 w-24 text-right">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Service Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-left text-sm text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5" scope="col">Municipal Service</th>
                        <th className="px-5 py-3.5" scope="col">Unit Fee</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Total Requests</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Paid</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Completed</th>
                        <th className="px-5 py-3.5 text-center" scope="col">Cancelled</th>
                        <th className="px-5 py-3.5 text-right" scope="col">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {servicesData.serviceWise.map((s) => (
                        <tr className="hover:bg-slate-50/80 transition" key={s.serviceId}>
                          <td className="px-5 py-4 font-semibold text-slate-950 whitespace-nowrap">
                            {s.serviceName}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                            {formatCurrency(s.price)}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-900">
                            {s.totalRequests}
                          </td>
                          <td className="px-5 py-4 text-center text-emerald-600 font-medium">
                            {s.paidRequests}
                          </td>
                          <td className="px-5 py-4 text-center text-blue-600">{s.completedRequests}</td>
                          <td className="px-5 py-4 text-center text-slate-400">{s.cancelledRequests}</td>
                          <td className="px-5 py-4 text-right font-bold text-slate-950">
                            {formatCurrency(s.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
