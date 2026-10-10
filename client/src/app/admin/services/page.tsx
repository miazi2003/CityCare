"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type {
  CreateMunicipalServiceInput,
  MunicipalService,
  UpdateMunicipalServiceInput,
} from "@/types";

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

export default function AdminServicesPage() {
  const [services, setServices] = useState<MunicipalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingService, setEditingService] = useState<MunicipalService | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditPending, setIsEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate Modal State
  const [deactivatingService, setDeactivatingService] = useState<MunicipalService | null>(null);
  const [isDeactivatePending, setIsDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Quick Reactivate State
  const [reactivatingService, setReactivatingService] = useState<MunicipalService | null>(null);
  const [isReactivatePending, setIsReactivatePending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<MunicipalService[]>("services");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setServices(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete services response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side filtering
  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return services.filter((service) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && service.isActive) ||
        (statusFilter === "INACTIVE" && !service.isActive);

      const matchesQuery =
        !query ||
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [services, statusFilter, searchQuery]);

  // Handle Create
  const handleOpenCreate = () => {
    setCreateName("");
    setCreateDescription("");
    setCreatePrice("");
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (isCreatePending) return;
    setIsCreateOpen(false);
    setCreateError(null);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedName = createName.trim();
    const trimmedDesc = createDescription.trim();
    const parsedPrice = Number(createPrice);

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setCreateError("Service name must be between 3 and 100 characters.");
      return;
    }

    if (trimmedDesc.length > 500) {
      setCreateError("Description cannot exceed 500 characters.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setCreateError("Price must be a positive number.");
      return;
    }

    const payload: CreateMunicipalServiceInput = {
      name: trimmedName,
      price: parsedPrice,
      ...(trimmedDesc ? { description: trimmedDesc } : {}),
    };

    setIsCreatePending(true);
    const result = await apiRequest<MunicipalService>("services", {
      method: "POST",
      body: payload,
    });
    setIsCreatePending(false);

    if (result.success) {
      setIsCreateOpen(false);
      setSuccessMessage(`Municipal service "${trimmedName}" created successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setCreateError(result.message || "Failed to create municipal service.");
    }
  };

  // Handle Edit
  const handleOpenEdit = (service: MunicipalService) => {
    setEditingService(service);
    setEditName(service.name);
    setEditDescription(service.description || "");
    setEditPrice(String(service.price));
    setEditIsActive(service.isActive);
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (isEditPending) return;
    setEditingService(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setEditError(null);

    const trimmedName = editName.trim();
    const trimmedDesc = editDescription.trim();
    const parsedPrice = Number(editPrice);

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setEditError("Service name must be between 3 and 100 characters.");
      return;
    }

    if (trimmedDesc.length > 500) {
      setEditError("Description cannot exceed 500 characters.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setEditError("Price must be a positive number.");
      return;
    }

    const payload: UpdateMunicipalServiceInput = {};

    if (trimmedName !== editingService.name) {
      payload.name = trimmedName;
    }
    if (trimmedDesc !== (editingService.description || "")) {
      payload.description = trimmedDesc;
    }
    if (parsedPrice !== Number(editingService.price)) {
      payload.price = parsedPrice;
    }
    if (editIsActive !== editingService.isActive) {
      payload.isActive = editIsActive;
    }

    if (Object.keys(payload).length === 0) {
      setEditError("No changes were made.");
      return;
    }

    setIsEditPending(true);
    const result = await apiRequest<MunicipalService>(`services/${editingService.id}`, {
      method: "PATCH",
      body: payload,
    });
    setIsEditPending(false);

    if (result.success) {
      setEditingService(null);
      setSuccessMessage(`Municipal service "${trimmedName}" updated successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setEditError(result.message || "Failed to update municipal service.");
    }
  };

  // Handle Deactivate
  const handleOpenDeactivate = (service: MunicipalService) => {
    setDeactivatingService(service);
    setDeactivateError(null);
  };

  const handleCloseDeactivate = () => {
    if (isDeactivatePending) return;
    setDeactivatingService(null);
    setDeactivateError(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingService) return;
    setDeactivateError(null);

    setIsDeactivatePending(true);
    const result = await apiRequest<MunicipalService>(
      `services/${deactivatingService.id}/deactivate`,
      {
        method: "PATCH",
      }
    );
    setIsDeactivatePending(false);

    if (result.success) {
      const sName = deactivatingService.name;
      setDeactivatingService(null);
      setSuccessMessage(`Municipal service "${sName}" has been deactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setDeactivateError(result.message || "Failed to deactivate service.");
    }
  };

  // Handle Quick Reactivate
  const handleQuickReactivate = async (service: MunicipalService) => {
    setReactivatingService(service);
    setIsReactivatePending(true);

    const result = await apiRequest<MunicipalService>(`services/${service.id}`, {
      method: "PATCH",
      body: { isActive: true },
    });
    setIsReactivatePending(false);
    setReactivatingService(null);

    if (result.success) {
      setSuccessMessage(`Municipal service "${service.name}" has been reactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setError(result.message || "Failed to reactivate municipal service.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Municipal Services
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure catalog of municipal services, standard service fees, and availability.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          onClick={handleOpenCreate}
          type="button"
        >
          + Add Service
        </button>
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

      {/* Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search services by name or description..."
              type="text"
              value={searchQuery}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              aria-label="Filter by status"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              value={statusFilter}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {!isLoading &&
            `${filteredServices.length} service${filteredServices.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Service Cards / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading municipal services…</p>
          </div>
        </div>
      ) : services.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No municipal services found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Publish municipal services to allow citizens to request city permits, utilities, and support.
          </p>
          <button
            className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={handleOpenCreate}
            type="button"
          >
            Create Municipal Service
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No services match your search query and status filter.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <div
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition ${
                service.isActive
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-slate-200 bg-slate-50/60 opacity-80"
              }`}
              key={service.id}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-950">{service.name}</h2>
                  {service.isActive ? (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-slate-950">
                    ${formatServicePrice(service.price)}
                  </span>
                  <span className="text-xs text-slate-500">/ request</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {service.description || "No description provided for this municipal service."}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Created {formatDate(service.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="font-medium text-slate-700 transition hover:text-slate-950"
                      onClick={() => handleOpenEdit(service)}
                      type="button"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    {service.isActive ? (
                      <button
                        className="font-medium text-red-600 transition hover:text-red-800"
                        onClick={() => handleOpenDeactivate(service)}
                        type="button"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="font-medium text-emerald-600 transition hover:text-emerald-800 disabled:opacity-50"
                        disabled={isReactivatePending && reactivatingService?.id === service.id}
                        onClick={() => handleQuickReactivate(service)}
                        type="button"
                      >
                        {isReactivatePending && reactivatingService?.id === service.id
                          ? "Reactivating…"
                          : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Service Modal */}
      {isCreateOpen ? (
        <div
          aria-labelledby="create-service-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="create-service-modal-title">
              Create Municipal Service
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a new fee-based or standard public service available to city residents.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-service-name">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-service-name"
                  maxLength={100}
                  minLength={3}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Tree Removal Permit, Bulky Waste Collection"
                  required
                  type="text"
                  value={createName}
                />
                <p className="mt-1 text-xs text-slate-500">Between 3 and 100 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-service-price">
                  Base Fee / Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-service-price"
                  min="0.01"
                  onChange={(e) => setCreatePrice(e.target.value)}
                  placeholder="50.00"
                  required
                  step="0.01"
                  type="number"
                  value={createPrice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-service-desc">
                  Description <span className="text-xs text-slate-500">(optional, max 500 chars)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-service-desc"
                  maxLength={500}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe eligibility, deliverables, and service provisions..."
                  rows={3}
                  value={createDescription}
                />
              </div>

              {createError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                  {createError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCreatePending}
                  onClick={handleCloseCreate}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCreatePending}
                  type="submit"
                >
                  {isCreatePending ? "Creating…" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Service Modal */}
      {editingService ? (
        <div
          aria-labelledby="edit-service-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="edit-service-modal-title">
              Edit Municipal Service
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update pricing or details for &ldquo;{editingService.name}&rdquo;.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-service-name">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-service-name"
                  maxLength={100}
                  minLength={3}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-service-price">
                  Base Fee / Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-service-price"
                  min="0.01"
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={editPrice}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-service-desc">
                  Description <span className="text-xs text-slate-500">(optional, max 500 chars)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-service-desc"
                  maxLength={500}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  value={editDescription}
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    checked={editIsActive}
                    className="h-4 w-4 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-950"
                    disabled={isEditPending}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Service is Active
                  </span>
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Inactive services will not be visible on the public portal or available for new citizen requests.
                </p>
              </div>

              {editError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                  {editError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isEditPending}
                  onClick={handleCloseEdit}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isEditPending}
                  type="submit"
                >
                  {isEditPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Deactivate Confirmation Modal */}
      {deactivatingService ? (
        <div
          aria-labelledby="deactivate-service-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="deactivate-service-modal-title">
              Deactivate Municipal Service
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to deactivate &ldquo;<span className="font-semibold text-slate-900">{deactivatingService.name}</span>&rdquo;?
            </p>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Deactivating this service will remove it from the public services catalog and citizen service request forms. Existing service requests and payment histories will remain intact.
            </p>

            {deactivateError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                {deactivateError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeactivatePending}
                onClick={handleCloseDeactivate}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeactivatePending}
                onClick={handleDeactivateConfirm}
                type="button"
              >
                {isDeactivatePending ? "Deactivating…" : "Deactivate Service"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

