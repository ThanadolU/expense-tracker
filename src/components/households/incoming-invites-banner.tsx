"use client";

import { useTransition } from "react";
import {
  acceptInviteAction,
  declineInviteAction,
} from "@/lib/actions/household";

type PendingInvite = {
  id: string;
  token: string;
  role: string;
  household: {
    id: string;
    name: string;
    _count: { members: number };
  };
  invitedBy: {
    name: string | null;
    email: string;
  };
};

type IncomingInvitesBannerProps = {
  invites: PendingInvite[];
};

export function IncomingInvitesBanner({ invites }: IncomingInvitesBannerProps) {
  const [isPending, startTransition] = useTransition();

  if (invites.length === 0) return null;

  const handleAccept = (token: string) => {
    startTransition(async () => {
      const res = await acceptInviteAction(token);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleDecline = (token: string) => {
    startTransition(async () => {
      await declineInviteAction(token);
    });
  };

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                You’re invited to join &ldquo;{invite.household.name}&rdquo;
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Invited by {invite.invitedBy.name || invite.invitedBy.email} as{" "}
                {invite.role.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDecline(invite.token)}
              className="min-h-9 flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-200 dark:hover:bg-zinc-800 sm:flex-none"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAccept(invite.token)}
              className="min-h-9 flex-1 rounded-md bg-amber-700 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-800 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500 sm:flex-none"
            >
              {isPending ? "Joining…" : "Accept & Join"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
