"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type { CreateDepartmentInput, Department, UpdateDepartmentInput } from "@/types";

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

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditPending, setIsEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate Modal State
  const [deactivatingDepartment, setDeactivatingDepartment] = useState<Department | null>(null);
  const [isDeactivatePending, setIsDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiRequest<Department[]>("departments");

      if (!isMounted) return;

      if (result.success && result.data !== null) {
        setDepartments(result.data);
      } else {
        setError(
          result.success
            ? "The server returned an incomplete departments response."
            : result.message
        );
      }

      setIsLoading(false);
    };

    void loadDepartments();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return departments;

    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        (dept.description && dept.description.toLowerCase().includes(query))
    );
  }, [departments, searchQuery]);

  // Handle Create
  const handleOpenCreate = () => {
    setCreateName("");
    setCreateDescription("");
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
    if (!trimmedName) {
      setCreateError("Department name is required.");
      return;
    }

    const payload: CreateDepartmentInput = {
      name: trimmedName,
      ...(createDescription.trim() ? { description: createDescription.trim() } : {}),
    };

    setIsCreatePending(true);
    const result = await apiRequest<Department>("departments", {
      method: "POST",
      body: payload,
    });
    setIsCreatePending(false);

    if (result.success) {
      setIsCreateOpen(false);
      setSuccessMessage(`Department "${trimmedName}" created successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setCreateError(result.message || "Failed to create department.");
    }
  };

  // Handle Edit
  const handleOpenEdit = (department: Department) => {
    setEditingDepartment(department);
    setEditName(department.name);
    setEditDescription(department.description || "");
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (isEditPending) return;
    setEditingDepartment(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    setEditError(null);

    const trimmedName = editName.trim();
    const trimmedDesc = editDescription.trim();

    if (!trimmedName) {
      setEditError("Department name cannot be empty.");
      return;
    }

    const payload: UpdateDepartmentInput = {};
    if (trimmedName !== editingDepartment.name) {
      payload.name = trimmedName;
    }
    if (trimmedDesc !== (editingDepartment.description || "")) {
      payload.description = trimmedDesc;
    }

    if (Object.keys(payload).length === 0) {
      setEditError("No changes were made.");
      return;
    }

    setIsEditPending(true);
    const result = await apiRequest<Department>(`departments/${editingDepartment.id}`, {
      method: "PATCH",
      body: payload,
    });
    setIsEditPending(false);

    if (result.success) {
      setEditingDepartment(null);
      setSuccessMessage(`Department "${trimmedName}" updated successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setEditError(result.message || "Failed to update department.");
    }
  };

  // Handle Deactivate
  const handleOpenDeactivate = (department: Department) => {
    setDeactivatingDepartment(department);
    setDeactivateError(null);
  };

  const handleCloseDeactivate = () => {
    if (isDeactivatePending) return;
    setDeactivatingDepartment(null);
    setDeactivateError(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingDepartment) return;
    setDeactivateError(null);

    setIsDeactivatePending(true);
    const result = await apiRequest<Department>(
      `departments/${deactivatingDepartment.id}/deactivate`,
      {
        method: "PATCH",
      }
    );
    setIsDeactivatePending(false);

    if (result.success) {
      const deptName = deactivatingDepartment.name;
      setDeactivatingDepartment(null);
      setSuccessMessage(`Department "${deptName}" has been deactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setDeactivateError(result.message || "Failed to deactivate department.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Departments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage municipal departments and organizational units across City Care.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          onClick={handleOpenCreate}
          type="button"
        >
          + Add Department
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

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name or description..."
            type="text"
            value={searchQuery}
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          {!isLoading && `${filteredDepartments.length} active department${filteredDepartments.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Department Cards / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading departments…</p>
          </div>
        </div>
      ) : departments.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No departments found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating the first municipal department.
          </p>
          <button
            className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={handleOpenCreate}
            type="button"
          >
            Create Department
          </button>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No departments match your search query &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => setSearchQuery("")}
            type="button"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <div
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
              key={dept.id}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-950">{dept.name}</h2>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  {dept.description || "No description provided."}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Added {formatDate(dept.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="font-medium text-slate-700 transition hover:text-slate-950"
                      onClick={() => handleOpenEdit(dept)}
                      type="button"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      className="font-medium text-red-600 transition hover:text-red-800"
                      onClick={() => handleOpenDeactivate(dept)}
                      type="button"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      {isCreateOpen ? (
        <div
          aria-labelledby="create-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="create-modal-title">
              Create New Department
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a new municipal department to route citizen complaints and manage services.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-dept-name">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-dept-name"
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Public Works, Sanitation, Transportation"
                  required
                  type="text"
                  value={createName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-dept-desc">
                  Description <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-dept-desc"
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe the scope and responsibilities of this department..."
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
                  {isCreatePending ? "Creating…" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Department Modal */}
      {editingDepartment ? (
        <div
          aria-labelledby="edit-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="edit-modal-title">
              Edit Department
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update details for &ldquo;{editingDepartment.name}&rdquo;.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-dept-name">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-dept-name"
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-dept-desc">
                  Description <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-dept-desc"
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  value={editDescription}
                />
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
      {deactivatingDepartment ? (
        <div
          aria-labelledby="deactivate-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="deactivate-modal-title">
              Deactivate Department
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to deactivate &ldquo;<span className="font-semibold text-slate-900">{deactivatingDepartment.name}</span>&rdquo;?
            </p>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Deactivating this department will hide it from new complaint submissions, category creation, and active lists. Existing complaints linked to this department will be preserved.
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
                {isDeactivatePending ? "Deactivating…" : "Deactivate Department"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

