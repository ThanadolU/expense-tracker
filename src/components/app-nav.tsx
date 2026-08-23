"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/budgets", label: "Budgets" },
  { href: "/categories", label: "Categories" },
] as const;

type AppNavProps = {
  userEmail?: string | null;
  userName?: string | null;
};

export function AppNav({ userEmail, userName }: AppNavProps) {
  const pathname = usePathname();
  const label = userName || userEmail;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-0 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Expense Tracker
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              {label ? (
                <span
                  className="max-w-[8rem] truncate text-xs text-zinc-500 dark:text-zinc-400"
                  title={userEmail ?? undefined}
                >
                  {label}
                </span>
              ) : null}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="min-h-10 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>

          <nav
            className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 sm:mx-0 sm:overflow-visible"
            aria-label="Main"
          >
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-10 inline-flex items-center",
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {label ? (
            <span
              className="max-w-[12rem] truncate text-xs text-zinc-500 dark:text-zinc-400"
              title={userEmail ?? undefined}
            >
              {label}
            </span>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-10 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
