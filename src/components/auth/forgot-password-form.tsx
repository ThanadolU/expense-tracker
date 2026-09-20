"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/lib/actions/password-reset";

const initialState: RequestResetState = null;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <svg
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Check your email</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            If an account exists with that email address, we’ve sent instructions to reset your password. The link will be active for 1 hour.
          </p>
        </div>

        {state.devResetUrl ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="font-semibold text-amber-800 dark:text-amber-300">
              🛠️ Local Dev Shortcut
            </div>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Since no external email API key is configured, you can click directly to open your reset link:
            </p>
            <div className="mt-2">
              <Link
                href={state.devResetUrl}
                className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
              >
                Open Reset Password Page →
              </Link>
            </div>
          </div>
        ) : null}

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
          >
            ← Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          We’ll send a link to reset your password to this email address.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Sending link…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
