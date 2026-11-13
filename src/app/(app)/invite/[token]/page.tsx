import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInviteByToken } from "@/lib/household";
import { InviteAcceptCard } from "@/components/households/invite-accept-card";

export const metadata: Metadata = {
  title: "Household Invitation — Expense Tracker",
  description: "Accept or decline an invitation to join a household.",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const invite = await getInviteByToken(token);

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invitation Expired or Invalid
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-sm">
          This invitation link is invalid, has expired, or has already been accepted.
        </p>

        <div className="mt-6">
          <Link
            href="/households"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Go to Households
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InviteAcceptCard
      token={invite.token}
      householdName={invite.household.name}
      invitedByName={invite.invitedBy.name}
      invitedByEmail={invite.invitedBy.email}
      role={invite.role}
      userEmail={session.user.email ?? ""}
    />
  );
}
