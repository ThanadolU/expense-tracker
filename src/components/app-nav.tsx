"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Expense Tracker
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
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

        <div className="flex shrink-0 items-center gap-3">
          {label ? (
            <span
              className="hidden max-w-[12rem] truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400"
              title={userEmail ?? undefined}
            >
              {label}
            </span>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
