"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { apiRequest } from "@/lib/api-client";
import type { RegisterInput, RegisteredUser } from "@/types";

type RegisterFormInput = RegisterInput & {
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof RegisterFormInput, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegistration = (input: RegisterFormInput): FieldErrors => {
  const errors: FieldErrors = {};

  if (!input.name) {
    errors.name = "Name is required.";
  }

  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(input.email)) {
    errors.email = "Invalid email format.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = (field: keyof RegisterFormInput) => {
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
    setFormError(null);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    clearErrors("name");
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    clearErrors("email");
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    clearErrors("password");
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    clearErrors("confirmPassword");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formInput: RegisterFormInput = {
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    };
    const errors = validateRegistration(formInput);

    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const input: RegisterInput = {
      name: formInput.name,
      email: formInput.email,
      password: formInput.password,
    };
    setIsSubmitting(true);

    const result = await apiRequest<RegisteredUser>("auth/register", {
      method: "POST",
      body: input,
    });

    setIsSubmitting(false);

    if (result.success && result.data !== null) {
      router.push("/login");
      return;
    }

    if (!result.success) {
      if (
        result.status === 400 &&
        result.message.toLowerCase().includes("email already exists")
      ) {
        setFormError("An account with this email address already exists.");
      } else {
        setFormError(result.message || "Registration failed. Please try again.");
      }
      return;
    }

    setFormError("The server returned an incomplete registration response.");
  };

  return (
    <PublicLayout>
      <main className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 mb-3">
              Citizen Registration
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Create a Citizen Account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Register as a City Care citizen to submit issues, track department SLAs, and request municipal services.
            </p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="name">
                Full Name
              </label>
              <input
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                aria-invalid={Boolean(fieldErrors.name)}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-950 outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
                id="name"
                name="name"
                onChange={handleNameChange}
                placeholder="Sarah Jenkins"
                type="text"
                value={name}
              />
              {fieldErrors.name ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" id="name-error">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="email">
                Email Address
              </label>
              <input
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-950 outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
                id="email"
                name="email"
                onChange={handleEmailChange}
                placeholder="name@example.com"
                type="email"
                value={email}
              />
              {fieldErrors.email ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" id="email-error">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="password">
                Password
              </label>
              <input
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-950 outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
                id="password"
                name="password"
                onChange={handlePasswordChange}
                placeholder="Minimum 6 characters"
                type="password"
                value={password}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" id="password-error">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-950 outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
                id="confirm-password"
                name="confirmPassword"
                onChange={handleConfirmPasswordChange}
                placeholder="Repeat password"
                type="password"
                value={confirmPassword}
              />
              {fieldErrors.confirmPassword ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" id="confirm-password-error">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                {formError}
              </div>
            ) : null}

            <button
              className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 cursor-pointer"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating citizen account…" : "Create citizen account"}
            </button>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
              Already have an account?{" "}
              <Link className="font-semibold text-slate-950 underline hover:text-slate-800" href="/login">
                Sign in
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PublicLayout>
  );
}
