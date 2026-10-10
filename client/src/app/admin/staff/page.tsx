"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  CreateStaffInput,
  Department,
  Staff,
  UpdateStaffInput,
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

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDepartmentId, setCreateDepartmentId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditPending, setIsEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate Modal State
  const [deactivatingStaff, setDeactivatingStaff] = useState<Staff | null>(null);
  const [isDeactivatePending, setIsDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Quick Reactivate State
  const [reactivatingStaff, setReactivatingStaff] = useState<Staff | null>(null);
  const [isReactivatePending, setIsReactivatePending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [staffRes, departmentsRes] = await Promise.all([
        apiRequest<Staff[]>("staff"),
        apiRequest<Department[]>("departments"),
      ]);

      if (!isMounted) return;

      if (!staffRes.success || staffRes.data === null) {
        setError(staffRes.message || "Failed to load staff list.");
        setIsLoading(false);
        return;
      }

      if (!departmentsRes.success || departmentsRes.data === null) {
        setError(departmentsRes.message || "Failed to load departments.");
        setIsLoading(false);
        return;
      }

      setStaffList(staffRes.data);
      setDepartments(departmentsRes.data);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Client-side filtering
  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return staffList.filter((staff) => {
      const matchesDept =
        !selectedDepartmentFilter ||
        staff.departmentId === selectedDepartmentFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && staff.isActive) ||
        (statusFilter === "INACTIVE" && !staff.isActive);

      const matchesQuery =
        !query ||
        staff.name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        (staff.department?.name &&
          staff.department.name.toLowerCase().includes(query));

      return matchesDept && matchesStatus && matchesQuery;
    });
  }, [staffList, selectedDepartmentFilter, statusFilter, searchQuery]);

  // Handle Create
  const handleOpenCreate = () => {
    setCreateDepartmentId(departments[0]?.id || "");
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
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
    const trimmedEmail = createEmail.trim();

    if (!trimmedName) {
      setCreateError("Staff name is required.");
      return;
    }

    if (!trimmedEmail) {
      setCreateError("Email is required.");
      return;
    }

    if (!createDepartmentId) {
      setCreateError("Please select a department.");
      return;
    }

    if (createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    const payload: CreateStaffInput = {
      name: trimmedName,
      email: trimmedEmail,
      password: createPassword,
      departmentId: createDepartmentId,
    };

    setIsCreatePending(true);
    const result = await apiRequest<Staff>("staff", {
      method: "POST",
      body: payload,
    });
    setIsCreatePending(false);

    if (result.success) {
      setIsCreateOpen(false);
      setSuccessMessage(`Staff account for "${trimmedName}" created successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setCreateError(result.message || "Failed to create staff account.");
    }
  };

  // Handle Edit
  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setEditDepartmentId(staff.departmentId || departments[0]?.id || "");
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPassword("");
    setEditIsActive(staff.isActive);
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (isEditPending) return;
    setEditingStaff(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedPassword = editPassword.trim();

    if (!trimmedName) {
      setEditError("Staff name cannot be empty.");
      return;
    }

    if (!trimmedEmail) {
      setEditError("Email cannot be empty.");
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      setEditError("New password must be at least 6 characters.");
      return;
    }

    const payload: UpdateStaffInput = {};

    if (trimmedName !== editingStaff.name) {
      payload.name = trimmedName;
    }
    if (trimmedEmail !== editingStaff.email) {
      payload.email = trimmedEmail;
    }
    if (editDepartmentId !== (editingStaff.departmentId || "")) {
      payload.departmentId = editDepartmentId;
    }
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }
    if (editIsActive !== editingStaff.isActive) {
      payload.isActive = editIsActive;
    }

    if (Object.keys(payload).length === 0) {
      setEditError("No changes were made.");
      return;
    }

    setIsEditPending(true);
    const result = await apiRequest<Staff>(`staff/${editingStaff.id}`, {
      method: "PATCH",
      body: payload,
    });
    setIsEditPending(false);

    if (result.success) {
      setEditingStaff(null);
      setSuccessMessage(`Staff account for "${trimmedName}" updated successfully.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setEditError(result.message || "Failed to update staff account.");
    }
  };

  // Handle Deactivate
  const handleOpenDeactivate = (staff: Staff) => {
    setDeactivatingStaff(staff);
    setDeactivateError(null);
  };

  const handleCloseDeactivate = () => {
    if (isDeactivatePending) return;
    setDeactivatingStaff(null);
    setDeactivateError(null);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivatingStaff) return;
    setDeactivateError(null);

    setIsDeactivatePending(true);
    const result = await apiRequest<Staff>(`staff/${deactivatingStaff.id}/deactivate`, {
      method: "PATCH",
    });
    setIsDeactivatePending(false);

    if (result.success) {
      const staffName = deactivatingStaff.name;
      setDeactivatingStaff(null);
      setSuccessMessage(`Staff account for "${staffName}" has been deactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setDeactivateError(result.message || "Failed to deactivate staff account.");
    }
  };

  // Handle Quick Reactivate
  const handleQuickReactivate = async (staff: Staff) => {
    setReactivatingStaff(staff);
    setIsReactivatePending(true);

    const result = await apiRequest<Staff>(`staff/${staff.id}`, {
      method: "PATCH",
      body: { isActive: true },
    });
    setIsReactivatePending(false);
    setReactivatingStaff(null);

    if (result.success) {
      setSuccessMessage(`Staff account for "${staff.name}" has been reactivated.`);
      setRefreshKey((prev) => prev + 1);
    } else {
      setError(result.message || "Failed to reactivate staff account.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage municipal staff accounts, departmental assignments, and login access.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={departments.length === 0}
          onClick={handleOpenCreate}
          type="button"
        >
          + Add Staff Account
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
            You must create at least one active department before creating staff accounts.
          </p>
        </div>
      ) : null}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, or department..."
              type="text"
              value={searchQuery}
            />
          </div>
          <div className="w-full sm:w-56">
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
          <div className="w-full sm:w-44">
            <select
              aria-label="Filter by status"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
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
            `${filteredStaff.length} staff member${filteredStaff.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Staff Cards / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-600">Loading staff members…</p>
          </div>
        </div>
      ) : staffList.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">No staff accounts found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add staff members to handle citizen complaints and operational workflows.
          </p>
          {departments.length > 0 ? (
            <button
              className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={handleOpenCreate}
              type="button"
            >
              Create Staff Account
            </button>
          ) : null}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            No staff accounts match your current search and filter criteria.
          </p>
          <button
            className="mt-3 text-sm font-medium text-slate-900 underline hover:text-slate-700"
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartmentFilter("");
              setStatusFilter("ALL");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <div
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition ${
                staff.isActive
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-slate-200 bg-slate-50/60 opacity-80"
              }`}
              key={staff.id}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-950">
                      {staff.name}
                    </h2>
                    <p className="truncate text-xs text-slate-500">{staff.email}</p>
                  </div>
                  {staff.isActive ? (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-800">
                      {staff.department?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-medium text-slate-800">Staff Specialist</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Joined {formatDate(staff.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="font-medium text-slate-700 transition hover:text-slate-950"
                      onClick={() => handleOpenEdit(staff)}
                      type="button"
                    >
                      Edit
                    </button>
                    <span className="text-slate-300">|</span>
                    {staff.isActive ? (
                      <button
                        className="font-medium text-red-600 transition hover:text-red-800"
                        onClick={() => handleOpenDeactivate(staff)}
                        type="button"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="font-medium text-emerald-600 transition hover:text-emerald-800 disabled:opacity-50"
                        disabled={isReactivatePending && reactivatingStaff?.id === staff.id}
                        onClick={() => handleQuickReactivate(staff)}
                        type="button"
                      >
                        {isReactivatePending && reactivatingStaff?.id === staff.id
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

      {/* Create Staff Modal */}
      {isCreateOpen ? (
        <div
          aria-labelledby="create-staff-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="create-staff-modal-title">
              Create Staff Account
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a new staff user and assign them to an active municipal department.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-staff-name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-staff-name"
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  type="text"
                  value={createName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-staff-email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-staff-email"
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. sjenkins@citycare.gov"
                  required
                  type="email"
                  value={createEmail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-staff-dept">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-staff-dept"
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
                <label className="block text-sm font-medium text-slate-800" htmlFor="create-staff-pass">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isCreatePending}
                  id="create-staff-pass"
                  minLength={6}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  type="password"
                  value={createPassword}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Temporary password for initial staff login.
                </p>
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
                  {isCreatePending ? "Creating…" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Staff Modal */}
      {editingStaff ? (
        <div
          aria-labelledby="edit-staff-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="edit-staff-modal-title">
              Edit Staff Account
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update information or credentials for &ldquo;{editingStaff.name}&rdquo;.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-staff-name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-staff-name"
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  type="text"
                  value={editName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-staff-email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-staff-email"
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  type="email"
                  value={editEmail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-staff-dept">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-staff-dept"
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
                <label className="block text-sm font-medium text-slate-800" htmlFor="edit-staff-pass">
                  Reset Password <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-xs outline-hidden focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  disabled={isEditPending}
                  id="edit-staff-pass"
                  minLength={6}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  type="password"
                  value={editPassword}
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
                    Account is Active
                  </span>
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Unchecking this disables the staff member from signing in and receiving workload.
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
      {deactivatingStaff ? (
        <div
          aria-labelledby="deactivate-staff-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-950" id="deactivate-staff-modal-title">
              Deactivate Staff Account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to deactivate &ldquo;<span className="font-semibold text-slate-900">{deactivatingStaff.name}</span>&rdquo;?
            </p>
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Deactivating will immediately prevent this user from signing into City Care and receiving new complaint assignments. Existing complaint histories associated with this user will remain preserved.
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
                {isDeactivatePending ? "Deactivating…" : "Deactivate Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

