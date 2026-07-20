"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/lib/actions/categories";

export type CategoryListItem = {
  id: string;
  name: string;
};

const initialState: CategoryFormState = null;

type CategoryRowProps = {
  category: CategoryListItem;
};

export function CategoryRow({ category }: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateCategoryAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategoryAction,
    initialState,
  );

  useEffect(() => {
    if (updateState?.success) {
      setEditing(false);
    }
  }, [updateState?.success]);

  const error = updateState?.error || deleteState?.error;
  const success = updateState?.success || deleteState?.success;
  const pending = updatePending || deletePending;

  return (
    <li className="space-y-2 px-4 py-3">
      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success && !editing ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {editing ? (
        <form action={updateAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="id" value={category.id} />
          <input
            name="name"
            type="text"
            required
            maxLength={50}
            defaultValue={category.name}
            className="w-full flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {updatePending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {category.name}
          </span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex min-h-10 items-center rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (
                  !confirm(
                    `Delete category “${category.name}”? This cannot be undone.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-10 items-center rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {deletePending ? "Deleting…" : "Delete"}
              </button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}
