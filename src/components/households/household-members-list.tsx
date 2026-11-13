"use client";

import { useTransition } from "react";
import {
  removeMemberAction,
  leaveHouseholdAction,
} from "@/lib/actions/household";
import type { HouseholdMemberItem } from "@/lib/household";

type HouseholdMembersListProps = {
  householdId: string;
  members: HouseholdMemberItem[];
  currentUserId: string;
  isOwner: boolean;
};

export function HouseholdMembersList({
  householdId,
  members,
  currentUserId,
  isOwner,
}: HouseholdMembersListProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (targetUserId: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${name} from this household?`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);
    formData.set("targetUserId", targetUserId);

    startTransition(async () => {
      try {
        await removeMemberAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to remove member.");
      }
    });
  };

  const handleLeave = () => {
    if (
      !confirm(
        "Are you sure you want to leave this household? You will need a new invite to rejoin.",
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);

    startTransition(async () => {
      try {
        await leaveHouseholdAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to leave household.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800 sm:px-6">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Members ({members.length})
        </h3>
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          const displayName = member.name || member.email.split("@")[0];
          const initials = (displayName[0] || "?").toUpperCase();

          return (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 p-4 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {displayName}
                    </p>
                    {isMe && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    member.role === "OWNER"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                  ].join(" ")}
                >
                  {member.role === "OWNER" ? "Owner" : "Member"}
                </span>

                {isOwner && !isMe && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemove(member.userId, displayName)}
                    className="rounded p-1 text-xs text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
                    title="Remove member"
                  >
                    Remove
                  </button>
                )}

                {isMe && members.length > 1 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleLeave}
                    className="rounded p-1 text-xs text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
                    title="Leave household"
                  >
                    Leave
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
