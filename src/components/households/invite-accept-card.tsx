"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptInviteAction,
  declineInviteAction,
} from "@/lib/actions/household";

type InviteAcceptCardProps = {
  token: string;
  householdName: string;
  invitedByName: string | null;
  invitedByEmail: string;
  role: string;
  userEmail: string;
};

export function InviteAcceptCard({
  token,
  householdName,
  invitedByName,
  invitedByEmail,
  role,
  userEmail,
}: InviteAcceptCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptInviteAction(token);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  const handleDecline = () => {
    startTransition(async () => {
      await declineInviteAction(token);
      router.push("/households");
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Join &ldquo;{householdName}&rdquo;
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
          <strong>{invitedByName || invitedByEmail}</strong> has invited you to join this household as a{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">{role.toLowerCase()}</strong>.
        </p>

        <div className="mt-4 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">{userEmail}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleAccept}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isPending ? "Joining…" : "Accept Invitation"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleDecline}
            className="flex min-h-10 w-full items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
