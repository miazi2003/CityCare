"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { useAuth } from "@/features/auth/auth-provider";
import { getRoleHomeRoute } from "@/lib/auth-routes";
import { apiRequest } from "@/lib/api-client";
import type { LoginInput, LoginResponse } from "@/types";

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLogin = (input: LoginInput): FieldErrors => {
  const errors: FieldErrors = {};

  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(input.email)) {
    errors.email = "Invalid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
};

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setFieldErrors((errors) => ({ ...errors, email: undefined }));
    setFormError(null);
    setSuccessMessage(null);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setFieldErrors((errors) => ({ ...errors, password: undefined }));
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: LoginInput = {
      email: email.trim(),
      password,
    };
    const errors = validateLogin(input);

    setFieldErrors(errors);
    setFormError(null);
    setSuccessMessage(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const result = await apiRequest<LoginResponse>("auth/login", {
      method: "POST",
      body: input,
    });

    setIsSubmitting(false);

    if (result.success && result.data !== null) {
      setSession(result.data);
      setPassword("");
      setSuccessMessage(result.message);
      router.replace(getRoleHomeRoute(result.data.user.role));
      return;
    }

    if (!result.success) {
      if (result.status === 500) {
        setFormError(
          "Unable to sign in. Please verify your email and password, or try again later."
        );
      } else if (result.status === 401) {
        setFormError(result.message || "Invalid email or password.");
      } else if (result.status === 403) {
        setFormError(
          result.message || "Your account is inactive or access has been restricted."
        );
      } else {
        setFormError(result.message || "Unable to sign in. Please try again.");
      }
      return;
    }

    setFormError("The server returned an incomplete login response.");
  };

  return (
    <PublicLayout>
      <main className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 mb-3">
              Platform Authentication
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Sign in to City Care
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Access your citizen dashboard or operational staff console.
            </p>
          </div>

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-950 outline-hidden transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                disabled={isSubmitting}
                id="password"
                name="password"
                onChange={handlePasswordChange}
                placeholder="••••••••"
                type="password"
                value={password}
              />
              {fieldErrors.password ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" id="password-error">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800" role="status">
                {successMessage}
              </div>
            ) : null}

            <button
              className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 cursor-pointer"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
              Need an account?{" "}
              <Link className="font-semibold text-slate-950 underline hover:text-slate-800" href="/register">
                Register as a citizen
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PublicLayout>
  );
}
