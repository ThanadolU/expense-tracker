import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getUserHouseholds,
  getPendingInvitesForEmail,
} from "@/lib/household";
import { CreateHouseholdModal } from "@/components/households/create-household-modal";
import { IncomingInvitesBanner } from "@/components/households/incoming-invites-banner";

export const metadata: Metadata = {
  title: "Households — Expense Tracker",
  description: "Manage shared households and members.",
};

export default async function HouseholdsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    redirect("/login");
  }

  const [households, incomingInvites] = await Promise.all([
    getUserHouseholds(userId),
    userEmail ? getPendingInvitesForEmail(userEmail) : [],
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Households
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            Shared spaces to log expenses, split bills, and track balances together.
          </p>
        </div>
        <CreateHouseholdModal />
      </div>

      {/* Incoming Invitations Banner */}
      {incomingInvites.length > 0 && (
        <IncomingInvitesBanner invites={incomingInvites} />
      )}

      {/* Households List */}
      {households.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {households.map((household) => (
            <Link
              key={household.id}
              href={`/households/${household.id}`}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
                    {household.name}
                  </h2>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                      household.isOwner
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                    ].join(" ")}
                  >
                    {household.isOwner ? "Owner" : "Member"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>
                    {household.memberCount}{" "}
                    {household.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
                <span>
                  Created{" "}
                  {new Date(household.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="font-medium text-zinc-600 transition group-hover:translate-x-0.5 dark:text-zinc-300">
                  Open space →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : incomingInvites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-7 w-7 text-zinc-500 dark:text-zinc-400"
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
          <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            No households yet
          </h2>
          <p className="mt-1 max-w-sm text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
            Create a household space to share and divide expenses with roommates, partners, or friends.
          </p>
          <div className="mt-5">
            <CreateHouseholdModal />
          </div>
        </div>
      ) : null}
    </div>
  );
}
