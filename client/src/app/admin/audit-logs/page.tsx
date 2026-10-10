"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type { AuditLog, JsonValue } from "@/types";

const commonEntities = [
  "COMPLAINT",
  "DEPARTMENT",
  "CATEGORY",
  "STAFF",
  "MUNICIPAL_SERVICE",
  "SERVICE_REQUEST",
  "PAYMENT",
];

const commonActions = [
  "CREATE",
  "UPDATE",
  "DEACTIVATE",
  "STATUS_CHANGE",
  "ASSIGN",
  "RESOLVE",
  "REVIEW",
  "PAYMENT",
];

function formatAction(action: string): string {
  return action
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
        second: "2-digit",
      });
}

function getActionBadgeClasses(action: string): string {
  switch (action) {
    case "CREATE":
    case "PAYMENT":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "RESOLVE":
    case "STATUS_CHANGE":
    case "REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "UPDATE":
    case "ASSIGN":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "DEACTIVATE":
    case "DELETE":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function MetadataViewer({ metadata }: { metadata: JsonValue | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata || (typeof metadata === "object" && Object.keys(metadata).length === 0)) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const jsonStr = JSON.stringify(metadata, null, 2);

  return (
    <div className="space-y-1">
      <button
        className="text-xs font-semibold text-slate-700 underline hover:text-slate-950 transition cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? "Hide Metadata" : "View Metadata"}
      </button>

      {isExpanded ? (
        <pre className="max-h-48 overflow-auto rounded-md bg-slate-900 p-2.5 text-[11px] font-mono text-emerald-400 shadow-inner">
          {jsonStr}
        </pre>
      ) : null}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [filterEntityId, setFilterEntityId] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditLogs() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedEntity.trim()) {
        params.set("entity", selectedEntity.trim());
      }
      if (selectedAction.trim()) {
        params.set("action", selectedAction.trim());
      }
      if (filterEntityId.trim()) {
        params.set("entityId", filterEntityId.trim());
      }
      if (filterUserId.trim()) {
        params.set("userId", filterUserId.trim());
      }

      const queryString = params.toString();
      const path = queryString ? `audit-logs?${queryString}` : "audit-logs";

      const result = await apiRequest<AuditLog[]>(path);

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setLogs(result.data);
      } else {
        setError(result.message || "Failed to load audit logs.");
      }

      setIsLoading(false);
    }

    void loadAuditLogs();

    return () => {
      isMounted = false;
    };
  }, [selectedEntity, selectedAction, filterEntityId, filterUserId, refreshKey]);

  // Client-side text search on logs (actor name, actor email, description)
  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter(
      (log) =>
        (log.user?.name && log.user.name.toLowerCase().includes(query)) ||
        (log.user?.email && log.user.email.toLowerCase().includes(query)) ||
        (log.description && log.description.toLowerCase().includes(query)) ||
        (log.entityId && log.entityId.toLowerCase().includes(query))
    );
  }, [logs, searchTerm]);

  const hasActiveFilters =
    Boolean(selectedEntity) ||
    Boolean(selectedAction) ||
    Boolean(filterEntityId) ||
    Boolean(filterUserId) ||
    Boolean(searchTerm);

  const handleClearFilters = () => {
    setSelectedEntity("");
    setSelectedAction("");
    setFilterEntityId("");
    setFilterUserId("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            System Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Immutable log of administrative, operational, and citizen mutations recorded across the city platform.
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

      {/* Query Filters Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="filter-entity">
              Entity Type
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="filter-entity"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedEntity(e.target.value)}
              value={selectedEntity}
            >
              <option value="">All Entities</option>
              {commonEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="filter-action">
              Action
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="filter-action"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAction(e.target.value)}
              value={selectedAction}
            >
              <option value="">All Actions</option>
              {commonActions.map((act) => (
                <option key={act} value={act}>
                  {formatAction(act)} ({act})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="filter-entity-id">
              Entity ID
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="filter-entity-id"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterEntityId(e.target.value)}
              placeholder="e.g. comp_123, dept_456"
              type="text"
              value={filterEntityId}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700" htmlFor="filter-user-id">
              Actor User ID
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="filter-user-id"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterUserId(e.target.value)}
              placeholder="e.g. user_789"
              type="text"
              value={filterUserId}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Filter current results by actor name, email, or description..."
              type="text"
              value={searchTerm}
            />
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters ? (
              <button
                className="text-xs font-medium text-slate-600 underline hover:text-slate-950 transition"
                onClick={handleClearFilters}
                type="button"
              >
                Clear all filters
              </button>
            ) : null}

            <span className="text-xs font-medium text-slate-500">
              {!isLoading && `${filteredLogs.length} event${filteredLogs.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading audit trail…</p>
          </div>
        </div>
      ) : logs.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No audit logs found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit events will appear here automatically when mutations occur.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No audit logs match your specified filter criteria.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={handleClearFilters}
            type="button"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5" scope="col">Timestamp</th>
                  <th className="px-5 py-3.5" scope="col">Actor</th>
                  <th className="px-5 py-3.5" scope="col">Action</th>
                  <th className="px-5 py-3.5" scope="col">Entity</th>
                  <th className="px-5 py-3.5" scope="col">Description</th>
                  <th className="px-5 py-3.5" scope="col">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => (
                  <tr className="hover:bg-slate-50/80 transition" key={log.id}>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950">
                          {log.user?.name || "System"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.user?.email || `ID: ${log.userId}`}
                        </p>
                        {log.user?.role ? (
                          <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {log.user.role}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClasses(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-semibold text-xs text-slate-900">{log.entity}</p>
                      {log.entityId ? (
                        <p className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={log.entityId}>
                          {log.entityId}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-700 max-w-xs leading-relaxed">
                      {log.description || "—"}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <MetadataViewer metadata={log.metadata} />
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

