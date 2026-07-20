"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createCategoryAction,
  type CategoryFormState,
} from "@/lib/actions/categories";

const initialState: CategoryFormState = null;

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Add category
      </h2>

      {state?.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          type="text"
          required
          maxLength={50}
          placeholder="e.g. Coffee"
          className="min-h-11 w-full flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
