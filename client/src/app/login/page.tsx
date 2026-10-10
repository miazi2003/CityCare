"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access the City Care municipal service platform.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="email">
              Email
            </label>
            <input
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="email"
              name="email"
              onChange={handleEmailChange}
              type="email"
              value={email}
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-sm text-red-700" id="email-error">
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="password"
              name="password"
              onChange={handlePasswordChange}
              type="password"
              value={password}
            />
            {fieldErrors.password ? (
              <p className="mt-2 text-sm text-red-700" id="password-error">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
              {successMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Need an account?{" "}
            <Link className="font-medium text-slate-950 underline" href="/register">
              Register as a citizen
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
