"use client";

import { useState, useTransition } from "react";
import { cancelInviteAction } from "@/lib/actions/household";
import type { HouseholdInviteItem } from "@/lib/household";

type HouseholdInvitesListProps = {
  householdId: string;
  invites: HouseholdInviteItem[];
  isOwner: boolean;
};

export function HouseholdInvitesList({
  householdId,
  invites,
  isOwner,
}: HouseholdInvitesListProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (invites.length === 0) {
    return null;
  }

  const handleCopyLink = (token: string) => {
    const origin = window.location.origin;
    const url = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCancel = (inviteId: string) => {
    const formData = new FormData();
    formData.set("inviteId", inviteId);
    formData.set("householdId", householdId);

    startTransition(async () => {
      try {
        await cancelInviteAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to cancel invite.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800 sm:px-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Pending Invitations ({invites.length})
        </h3>
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {invites.map((invite) => {
          const isCopied = copiedToken === invite.token;

          return (
            <li
              key={invite.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {invite.email}
                  </p>
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Invited as {invite.role.toLowerCase()} • Expires{" "}
                  {new Date(invite.expiresAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(invite.token)}
                  className="inline-flex min-h-8 items-center justify-center gap-1 rounded border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {isCopied ? "Link Copied!" : "Copy Link"}
                </button>

                {isOwner && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleCancel(invite.id)}
                    className="inline-flex min-h-8 items-center justify-center rounded border border-transparent px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
