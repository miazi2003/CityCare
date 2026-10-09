"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { apiRequest } from "@/lib/api-client";
import type {
  Category,
  Complaint,
  ComplaintPriority,
  CreateComplaintInput,
  Department,
} from "@/types";

type FieldErrors = Partial<
  Record<"title" | "description" | "location" | "departmentId" | "categoryId", string>
>;

const priorities: ComplaintPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function formatSlaStatus(status: NonNullable<Complaint["slaStatus"]>) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDueDate(dueAt: string) {
  const date = new Date(dueAt);

  return Number.isNaN(date.getTime()) ? dueAt : date.toLocaleString();
}

export default function NewComplaintPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("MEDIUM");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const [departmentResult, categoryResult] = await Promise.all([
        apiRequest<Department[]>("departments"),
        apiRequest<Category[]>("categories"),
      ]);

      if (!isMounted) {
        return;
      }

      const errors: string[] = [];

      if (departmentResult.success && departmentResult.data) {
        setDepartments(departmentResult.data);
      } else {
        errors.push(
          departmentResult.success
            ? "Departments could not be loaded."
            : departmentResult.message,
        );
      }

      if (categoryResult.success && categoryResult.data) {
        setCategories(categoryResult.data);
      } else {
        errors.push(
          categoryResult.success
            ? "Categories could not be loaded."
            : categoryResult.message,
        );
      }

      if (errors.length > 0) {
        setLoadError(errors.join(" "));
      }

      setIsLoadingOptions(false);
    }

    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.departmentId === departmentId),
    [categories, departmentId],
  );

  const isFormDisabled = isLoadingOptions || Boolean(loadError) || isSubmitting;

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const remainingErrors = { ...currentErrors };
      delete remainingErrors[field];
      return remainingErrors;
    });
    setFormError(null);
  }

  function handleDepartmentChange(event: ChangeEvent<HTMLSelectElement>) {
    setDepartmentId(event.target.value);
    setCategoryId("");
    clearFieldError("departmentId");
    clearFieldError("categoryId");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: FieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (!trimmedTitle) {
      nextFieldErrors.title = "Title is required.";
    }

    if (!trimmedDescription) {
      nextFieldErrors.description = "Description is required.";
    }

    if (!trimmedLocation) {
      nextFieldErrors.location = "Location is required.";
    }

    if (!departmentId) {
      nextFieldErrors.departmentId = "Select a department to find a category.";
    }

    if (!categoryId) {
      nextFieldErrors.categoryId = "Select a category.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(null);
      return;
    }

    const complaint: CreateComplaintInput = {
      title: trimmedTitle,
      description: trimmedDescription,
      location: trimmedLocation,
      categoryId,
      priority,
    };

    setIsSubmitting(true);
    setFormError(null);

    const result = await apiRequest<Complaint>("complaints", {
      method: "POST",
      body: complaint,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      setCreatedComplaint(result.data);
      return;
    }

    setFormError(
      result.success
        ? "Your complaint was created, but the server returned no complaint details."
        : result.message,
    );
  }

  if (createdComplaint) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Complaint submitted
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            We received your complaint
          </h1>
          <p className="mt-3 text-slate-700">
            Your complaint has been created and is ready for the relevant department to review.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl bg-white p-5 text-sm text-slate-700">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="font-medium text-slate-900">Reference</dt>
              <dd className="break-all">{createdComplaint.id}</dd>
            </div>
            {createdComplaint.dueAt ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="font-medium text-slate-900">Due date</dt>
                <dd>{formatDueDate(createdComplaint.dueAt)}</dd>
              </div>
            ) : null}
            {createdComplaint.slaStatus ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="font-medium text-slate-900">SLA status</dt>
                <dd>{formatSlaStatus(createdComplaint.slaStatus)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/citizen/complaints/${createdComplaint.id}`}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View complaint
            </Link>
            <Link
              href="/citizen/complaints"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              View all complaints
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          Citizen services
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Submit a complaint</h1>
        <p className="mt-3 text-slate-600">
          Tell us what happened and choose the category that best fits your request.
        </p>
      </div>

      {isLoadingOptions ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading departments and categories…
        </div>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {loadError}
        </div>
      ) : null}

      {!isLoadingOptions && !loadError ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-800">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              disabled={isFormDisabled}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {fieldErrors.title ? (
              <p id="title-error" className="mt-1.5 text-sm text-red-700">
                {fieldErrors.title}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-800">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              disabled={isFormDisabled}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "description-error" : undefined}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {fieldErrors.description ? (
              <p id="description-error" className="mt-1.5 text-sm text-red-700">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-800">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                clearFieldError("location");
              }}
              disabled={isFormDisabled}
              aria-invalid={Boolean(fieldErrors.location)}
              aria-describedby={fieldErrors.location ? "location-error" : undefined}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {fieldErrors.location ? (
              <p id="location-error" className="mt-1.5 text-sm text-red-700">
                {fieldErrors.location}
              </p>
            ) : null}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-800">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={departmentId}
                onChange={handleDepartmentChange}
                disabled={isFormDisabled}
                aria-invalid={Boolean(fieldErrors.departmentId)}
                aria-describedby={fieldErrors.departmentId ? "department-error" : undefined}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {fieldErrors.departmentId ? (
                <p id="department-error" className="mt-1.5 text-sm text-red-700">
                  {fieldErrors.departmentId}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-800">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  clearFieldError("categoryId");
                }}
                disabled={isFormDisabled || !departmentId}
                aria-invalid={Boolean(fieldErrors.categoryId)}
                aria-describedby={fieldErrors.categoryId ? "category-error" : undefined}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {departmentId ? "Select a category" : "Select a department first"}
                </option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {departmentId && availableCategories.length === 0 ? (
                <p className="mt-1.5 text-sm text-slate-500">
                  No active categories are available for this department.
                </p>
              ) : null}
              {fieldErrors.categoryId ? (
                <p id="category-error" className="mt-1.5 text-sm text-red-700">
                  {fieldErrors.categoryId}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-slate-800">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as ComplaintPriority)}
              disabled={isFormDisabled}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {priorities.map((priorityOption) => (
                <option key={priorityOption} value={priorityOption}>
                  {priorityOption.charAt(0) + priorityOption.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Submitting complaint…" : "Submit complaint"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
