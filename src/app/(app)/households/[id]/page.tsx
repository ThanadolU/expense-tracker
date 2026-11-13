import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getHouseholdDetails,
  getHouseholdExpenses,
  getHouseholdSettlements,
  getHouseholdBalances,
} from "@/lib/household";
import { HouseholdView } from "@/components/households/household-view";

type HouseholdPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: HouseholdPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Household — Expense Tracker" };

  const household = await getHouseholdDetails(id, session.user.id);
  return {
    title: household
      ? `${household.name} — Expense Tracker`
      : "Household — Expense Tracker",
  };
}

export default async function HouseholdDetailPage({
  params,
}: HouseholdPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const [household, expenses, settlements, balances] = await Promise.all([
    getHouseholdDetails(id, userId),
    getHouseholdExpenses(id, userId),
    getHouseholdSettlements(id, userId),
    getHouseholdBalances(id, userId),
  ]);

  if (!household || !balances) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/households"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to all households
        </Link>
      </div>

      <HouseholdView
        household={household}
        expenses={expenses}
        settlements={settlements}
        balances={balances}
        currentUserId={userId}
      />
    </div>
  );
}
