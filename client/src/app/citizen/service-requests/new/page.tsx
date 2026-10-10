"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ErrorAlert, LoadingState } from "@/components/ui/state-views";
import { apiRequest } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/format-service-price";
import type {
  CreateServiceRequestInput,
  MunicipalService,
  ServiceRequest,
} from "@/types";

type FieldErrors = Partial<
  Record<"serviceId" | "location" | "quantity" | "notes", string>
>;

export default function NewServiceRequestPage() {
  const router = useRouter();

  const [services, setServices] = useState<MunicipalService[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      setIsLoadingServices(true);
      setLoadError(null);

      const result = await apiRequest<MunicipalService[]>("services");

      if (!isMounted) return;

      if (result.success && Array.isArray(result.data)) {
        setServices(result.data);
      } else {
        setLoadError(
          result.success
            ? "Services could not be loaded."
            : result.message || "Failed to load municipal services."
        );
      }

      setIsLoadingServices(false);
    }

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );

  const selectedService = useMemo(
    () => activeServices.find((s) => s.id === serviceId) || null,
    [activeServices, serviceId]
  );

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;
      const remainingErrors = { ...currentErrors };
      delete remainingErrors[field];
      return remainingErrors;
    });
    setFormError(null);
  }

  const handleServiceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setServiceId(e.target.value);
    clearFieldError("serviceId");
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    clearFieldError("location");
  };

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(Number.isNaN(val) ? 1 : val);
    clearFieldError("quantity");
  };

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    clearFieldError("notes");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextFieldErrors: FieldErrors = {};
    const trimmedLocation = location.trim();
    const trimmedNotes = notes.trim();

    if (!serviceId) {
      nextFieldErrors.serviceId = "Please select a municipal service.";
    }

    if (!trimmedLocation) {
      nextFieldErrors.location = "Location is required.";
    } else if (trimmedLocation.length < 5 || trimmedLocation.length > 300) {
      nextFieldErrors.location = "Location must be between 5 and 300 characters.";
    }

    if (!quantity || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      nextFieldErrors.quantity = "Quantity must be an integer between 1 and 20.";
    }

    if (trimmedNotes.length > 500) {
      nextFieldErrors.notes = "Notes cannot exceed 500 characters.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(null);
      return;
    }

    const payload: CreateServiceRequestInput = {
      serviceId,
      location: trimmedLocation,
      quantity,
      ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
    };

    setIsSubmitting(true);
    setFormError(null);

    const result = await apiRequest<ServiceRequest>("service-requests", {
      method: "POST",
      body: payload,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      router.push(`/citizen/service-requests/${result.data.id}`);
      return;
    }

    setFormError(
      result.success
        ? "The service request was created, but no request details were returned."
        : result.message || "Failed to submit service request."
    );
  };

  const isFormDisabled = isLoadingServices || Boolean(loadError) || isSubmitting;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          href="/citizen/service-requests"
        >
          &larr; Back to service requests
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          Citizen services
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Request a Municipal Service</h1>
        <p className="mt-2 text-slate-600">
          Select an available municipal service, provide the service location, and specify the needed quantity.
        </p>
      </div>

      {isLoadingServices ? (
        <LoadingState message="Loading available municipal services…" />
      ) : null}

      {loadError ? (
        <ErrorAlert
          message={loadError}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
      ) : null}

      {!isLoadingServices && !loadError ? (
        <form
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="service-select">
              Municipal Service <span className="text-red-500">*</span>
            </label>
            <select
              aria-describedby={fieldErrors.serviceId ? "service-error" : undefined}
              aria-invalid={Boolean(fieldErrors.serviceId)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={isFormDisabled}
              id="service-select"
              name="serviceId"
              onChange={handleServiceChange}
              value={serviceId}
            >
              <option value="">Select a service</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} (${formatServicePrice(service.price)})
                </option>
              ))}
            </select>
            {fieldErrors.serviceId ? (
              <p className="mt-1.5 text-sm text-red-700" id="service-error">
                {fieldErrors.serviceId}
              </p>
            ) : null}

            {selectedService ? (
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{selectedService.name}</p>
                {selectedService.description ? (
                  <p className="mt-1">{selectedService.description}</p>
                ) : null}
                <p className="mt-1 font-medium text-slate-800">
                  Unit Price: ${formatServicePrice(selectedService.price)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="location-input">
              Service Location <span className="text-red-500">*</span>
            </label>
            <input
              aria-describedby={fieldErrors.location ? "location-error" : undefined}
              aria-invalid={Boolean(fieldErrors.location)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={isFormDisabled}
              id="location-input"
              maxLength={300}
              name="location"
              onChange={handleLocationChange}
              placeholder="e.g. 142 Elm Street, Ward 4, Building B"
              type="text"
              value={location}
            />
            {fieldErrors.location ? (
              <p className="mt-1.5 text-sm text-red-700" id="location-error">
                {fieldErrors.location}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Provide the specific street address or public facility location (5–300 characters).</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="quantity-input">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              aria-describedby={fieldErrors.quantity ? "quantity-error" : undefined}
              aria-invalid={Boolean(fieldErrors.quantity)}
              className="mt-2 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={isFormDisabled}
              id="quantity-input"
              max={20}
              min={1}
              name="quantity"
              onChange={handleQuantityChange}
              type="number"
              value={quantity}
            />
            {fieldErrors.quantity ? (
              <p className="mt-1.5 text-sm text-red-700" id="quantity-error">
                {fieldErrors.quantity}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Enter a quantity between 1 and 20 units.</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800" htmlFor="notes-input">
                Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <span className="text-xs text-slate-400">{notes.length}/500</span>
            </div>
            <textarea
              aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
              aria-invalid={Boolean(fieldErrors.notes)}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={isFormDisabled}
              id="notes-input"
              maxLength={500}
              name="notes"
              onChange={handleNotesChange}
              placeholder="Any special instructions or details regarding the request..."
              rows={4}
              value={notes}
            />
            {fieldErrors.notes ? (
              <p className="mt-1.5 text-sm text-red-700" id="notes-error">
                {fieldErrors.notes}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href="/citizen/service-requests"
            >
              Cancel
            </Link>
            <button
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isFormDisabled}
              type="submit"
            >
              {isSubmitting ? "Submitting Request…" : "Submit Service Request"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

