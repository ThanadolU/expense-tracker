"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/lib/actions/password-reset";

const initialState: ResetPasswordState = null;

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || password.length < 8) {
      e.preventDefault();
      setClientError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
      return;
    }
  };

  const errorMessage = clientError || state?.error;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {errorMessage ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Re-enter your password"
          className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Updating password…" : "Save new password"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          Cancel and return to sign in
        </Link>
      </p>
    </form>
  );
}
