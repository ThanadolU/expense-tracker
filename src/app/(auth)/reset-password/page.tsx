import type { Metadata } from "next";
import Link from "next/link";
import { validateResetToken } from "@/lib/actions/password-reset";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — Expense Tracker",
  description: "Set a new password for your Expense Tracker account.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Invalid or missing link
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No reset token was provided. Please request a new password reset link.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tokenValidation = await validateResetToken(token);

  if (!tokenValidation.valid) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Link expired or invalid
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tokenValidation.error ||
                "This password reset link is invalid or has already expired."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create new password
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your new password below
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
