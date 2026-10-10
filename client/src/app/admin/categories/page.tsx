"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  Category,
  CreateCategoryInput,
  Department,
  UpdateCategoryInput,
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDepartmentId, setCreateDepartmentId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSlaHours, setCreateSlaHours] = useState("24");
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlaHours, setEditSlaHours] = useState("");
  const [isEditPending, setIsEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate Modal State
  const [deactivatingCategory, setDeactivatingCategory] = useState<Category | null>(null);
  const [isDeactivatePending, setIsDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [categoriesRes, departmentsRes] = await Promise.all([
        apiRequest<Category[]>("categories"),
        apiRequest<Department[]>("departments"),
      ]);

      if (!isMounted) return;

      if (!categoriesRes.success || categoriesRes.data === null) {
        setError(categoriesRes.message || "Failed to load categories.");
        setIsLoading(false);
        return;
      }

      if (!departmentsRes.success || departmentsRes.data === null) {
        setError(departmentsRes.message || "Failed to load departments.");
        setIsLoading(false);
        return;
      }

      setCategories(categoriesRes.data);
      setDepartments(departmentsRes.data);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side filtering
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesDept =
        !selectedDepartmentFilter ||
        category.departmentId === selectedDepartmentFilter;

      const matchesQuery =
        !query ||
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query)) ||
        (category.department?.name &&
          category.department.name.toLowerCase().includes(query));

      return matchesDept && matchesQuery;
    });
  }, [categories, selectedDepartmentFilter, searchQuery]);

  // Handle Create
  const handleOpenCreate = () => {
    setCreateDepartmentId(departments[0]?.id || "");
    setCreateName("");
    setCreateDescription("");
    setCreateSlaHours("24");
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
      setCreateError("Category name is required.");
      return;
    }

    if (!createDepartmentId) {
      setCreateError("Please select a department.");
      return;
    }

    const slaNumber = Number(createSlaHours);
    if (!Number.isInteger(slaNumber) || slaNumber <= 0) {
      setCreateError("SLA hours must be a positive whole number.");
      return;
    }

    const payload: CreateCategoryInput = {
      name: trimmedName,
      departmentId: createDepartmentId,
      slaHours: slaNumber,
      ...(createDescription.trim() ? { description: createDescription.trim() } : {}),
    };

    setIsCreatePending(true);
    const result = await apiRequest<Category>("categories", {
      method: "POST",
      body: payload,
    });
    setIsCreatePending(false);

    if (result.success) {
      setIsCreateOpen(false);
      setSuccessMessage(`Category "${trimmedName}" created successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setCreateError(result.message || "Failed to create category.");
    }
  };

  // Handle Edit
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setEditDepartmentId(category.departmentId);
    setEditName(category.name);
    setEditDescription(category.description || "");
    setEditSlaHours(String(category.slaHours));
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (isEditPending) return;
    setEditingCategory(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setEditError(null);

    const trimmedName = editName.trim();
    const trimmedDesc = editDescription.trim();
    const slaNumber = Number(editSlaHours);

    if (!trimmedName) {
      setEditError("Category name cannot be empty.");
      return;
    }

    if (!Number.isInteger(slaNumber) || slaNumber <= 0) {
      setEditError("SLA hours must be a positive whole number.");
      return;
    }

    const payload: UpdateCategoryInput = {};

    if (trimmedName !== editingCategory.name) {
      payload.name = trimmedName;
    }
    if (trimmedDesc !== (editingCategory.description || "")) {
      payload.description = trimmedDesc;
    }
    if (editDepartmentId !== editingCategory.departmentId) {
      payload.departmentId = editDepartmentId;
    }
    if (slaNumber !== editingCategory.slaHours) {
      payload.slaHours = slaNumber;
    }

    if (Object.keys(payload).length === 0) {
      setEditError("No changes were made.");
      return;
    }

    setIsEditPending(true);
    const result = await apiRequest<Category>(`categories/${editingCategory.id}`, {
      method: "PATCH",
      body: payload,
    });
    setIsEditPending(false);

    if (result.success) {
      setEditingCategory(null);
      setSuccessMessage(`Category "${trimmedName}" updated successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setEditError(result.message || "Failed to update category.");
    }
  };

  // Handle Deactivate
  const handleOpenDeactivate = (category: Category) => {
    setDeactivatingCategory(category);
    setDeactivateError(null);
  };

  const handleCloseDeactivate = () => {
    if (isDeactivatePending) return;
    setDeactivatingCategory(null);
    setDeactivateError(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingCategory) return;
    setDeactivateError(null);

    setIsDeactivatePending(true);
    const result = await apiRequest<Category>(
      `categories/${deactivatingCategory.id}/deactivate`,
      {
        method: "PATCH",
      }
    );
    setIsDeactivatePending(false);

    if (result.success) {
      const catName = deactivatingCategory.name;
      setDeactivatingCategory(null);
      setSuccessMessage(`Category "${catName}" has been deactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setDeactivateError(result.message || "Failed to deactivate category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Complaint Categories
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage complaint categories, department associations, and SLA turnaround expectations.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={departments.length === 0}
          onClick={handleOpenCreate}
          type="button"
        >
          + Add Category
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

      {/* Warning if no departments exist */}
      {!isLoading && departments.length === 0 && !error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">No active departments found.</p>
          <p className="mt-1 text-xs text-amber-700">
            You must create at least one active department before adding complaint categories.
          </p>
        </div>
      ) : null}

      {/* Search & Department Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search by category name or description..."
              type="text"
              value={searchQuery}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              aria-label="Filter by department"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDepartmentFilter(e.target.value)}
              value={selectedDepartmentFilter}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {!isLoading &&
            `${filteredCategories.length} category${filteredCategories.length === 1 ? "" : "ies"}`}
        </div>
      </div>

      {/* Categories Cards / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading categories…</p>
          </div>
        </div>
      ) : categories.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No categories found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create complaint categories to structure citizen reports with targeted SLAs.
          </p>
          {departments.length > 0 ? (
            <button
              className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={handleOpenCreate}
              type="button"
            >
              Create Category
            </button>
          ) : null}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No categories match your search filters.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartmentFilter("");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
              key={cat.id}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {cat.department?.name || "Unassigned Department"}
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    SLA: {cat.slaHours} {cat.slaHours === 1 ? "hr" : "hrs"}
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold text-slate-950">{cat.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {cat.description || "No description provided."}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Added {formatDate(cat.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="font-medium text-slate-700 transition hover:text-slate-950"
                      onClick={() => handleOpenEdit(cat)}
                      type="button"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      className="font-medium text-red-600 transition hover:text-red-800"
                      onClick={() => handleOpenDeactivate(cat)}
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

      {/* Create Category Modal */}
      {isCreateOpen ? (
        <div
          aria-labelledby="create-cat-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="create-cat-modal-title">
              Create New Category
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Define a complaint category, link it to a department, and specify the SLA target.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-cat-dept">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-cat-dept"
                  onChange={(e) => setCreateDepartmentId(e.target.value)}
                  required
                  value={createDepartmentId}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-cat-name">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-cat-name"
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Pothole Repair, Streetlight Outage"
                  required
                  type="text"
                  value={createName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-cat-sla">
                  SLA Target (Hours) <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-cat-sla"
                  min="1"
                  onChange={(e) => setCreateSlaHours(e.target.value)}
                  placeholder="24"
                  required
                  step="1"
                  type="number"
                  value={createSlaHours}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Maximum expected turnaround time in hours (positive integer).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-cat-desc">
                  Description <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-cat-desc"
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Provide guidance for when citizens or staff should use this category..."
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
                  {isCreatePending ? "Creating…" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Category Modal */}
      {editingCategory ? (
        <div
          aria-labelledby="edit-cat-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="edit-cat-modal-title">
              Edit Category
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update configuration for &ldquo;{editingCategory.name}&rdquo;.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-cat-dept">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-cat-dept"
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  required
                  value={editDepartmentId}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-cat-name">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-cat-name"
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-cat-sla">
                  SLA Target (Hours) <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-cat-sla"
                  min="1"
                  onChange={(e) => setEditSlaHours(e.target.value)}
                  required
                  step="1"
                  type="number"
                  value={editSlaHours}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-cat-desc">
                  Description <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-cat-desc"
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
      {deactivatingCategory ? (
        <div
          aria-labelledby="deactivate-cat-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="deactivate-cat-modal-title">
              Deactivate Category
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to deactivate &ldquo;<span className="font-semibold text-slate-900">{deactivatingCategory.name}</span>&rdquo;?
            </p>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Deactivating this category will hide it from future complaint submissions and category selection. Existing complaints filed under this category will remain intact.
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
                {isDeactivatePending ? "Deactivating…" : "Deactivate Category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

