"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-950">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Register as a City Care citizen to submit and track complaints.
          </p>
        </div>

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="name">
              Name
            </label>
            <input
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              autoComplete="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="name"
              name="name"
              onChange={handleNameChange}
              type="text"
              value={name}
            />
            {fieldErrors.name ? (
              <p className="mt-2 text-sm text-red-700" id="name-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

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
              autoComplete="new-password"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              disabled={isSubmitting}
              id="confirm-password"
              name="confirmPassword"
              onChange={handleConfirmPasswordChange}
              type="password"
              value={confirmPassword}
            />
            {fieldErrors.confirmPassword ? (
              <p className="mt-2 text-sm text-red-700" id="confirm-password-error">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-medium text-slate-950 underline" href="/login">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
