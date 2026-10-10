import Link from "next/link";
import type { ReactNode } from "react";

export function LoadingState({
  message = "Loading…",
  className = "py-16",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em]" />
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
  className = "p-12",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white text-center shadow-xs ${className}`}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {!action && actionLabel && actionHref ? (
        <div className="mt-4">
          <Link
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
      {!action && actionLabel && onAction ? (
        <div className="mt-4">
          <button
            className="inline-block rounded-md bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorAlert({
  title,
  message,
  onRetry,
  retryLabel = "Retry",
  actionHref,
  actionLabel,
  className = "p-4",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 ${className}`}
      role="alert"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <p className="font-semibold">{title}</p> : null}
          <p className={title ? "mt-0.5" : ""}>{message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {onRetry ? (
            <button
              className="font-medium underline hover:text-red-900 cursor-pointer"
              onClick={onRetry}
              type="button"
            >
              {retryLabel}
            </button>
          ) : null}
          {actionHref && actionLabel ? (
            <Link
              className="font-medium underline hover:text-red-900"
              href={actionHref}
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
