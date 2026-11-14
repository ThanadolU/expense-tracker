"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

const desktopNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/recurring", label: "Recurring" },
  { href: "/budgets", label: "Budgets" },
  { href: "/categories", label: "Categories" },
  { href: "/households", label: "Households" },
] as const;

type AppNavProps = {
  userEmail?: string | null;
  userName?: string | null;
};

export function AppNav({ userEmail, userName }: AppNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the More menu whenever navigation occurs
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMoreOpen(false);
  }

  // Handle ESC key to dismiss More menu
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  const userInitial = (userName?.[0] || userEmail?.[0] || "U").toUpperCase();
  const displayLabel = userName || userEmail || "User";

  const isMoreActive =
    pathname === "/recurring" ||
    pathname.startsWith("/recurring/") ||
    pathname === "/categories" ||
    pathname.startsWith("/categories/");

  return (
    <>
      {/* Top Header: Desktop Web View (md+) & Mobile App Header (< md) */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 safe-area-pt">
        {/* Desktop Web Navigation (Shown on standard web browser view) */}
        <div className="mx-auto hidden h-14 max-w-5xl items-center justify-between px-4 sm:px-6 md:flex">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
              </div>
              Expense Tracker
            </Link>

            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {desktopNavItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "inline-flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
            {displayLabel ? (
              <span
                className="max-w-[12rem] truncate text-xs text-zinc-500 dark:text-zinc-400"
                title={userEmail ?? undefined}
              >
                {displayLabel}
              </span>
            ) : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="min-h-9 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile View Top Bar (Shown when inspected / on mobile viewports) */}
        <div className="flex h-14 items-center justify-between px-4 md:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition active:scale-95"
            aria-label="Expense Tracker Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Expense Tracker
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
              title={userEmail ?? undefined}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {userInitial}
              </span>
              <span className="max-w-[7rem] truncate font-medium sm:max-w-[10rem]">
                {displayLabel}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Log out"
                title="Log out"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (Shown ONLY when inspected or on mobile viewports < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/90 bg-white/95 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-md md:hidden dark:border-zinc-800/90 dark:bg-zinc-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      >
        <div className="grid grid-cols-5 items-center">
          {/* Tab 1: Dashboard */}
          <Link
            href="/dashboard"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-center transition active:scale-95"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                pathname === "/dashboard"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden="true"
              >
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </div>
            <span
              className={[
                "text-[10px] tracking-tight transition-colors",
                pathname === "/dashboard"
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "font-medium text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              Dashboard
            </span>
          </Link>

          {/* Tab 2: Expenses */}
          <Link
            href="/expenses"
            aria-current={
              pathname === "/expenses" || pathname.startsWith("/expenses/")
                ? "page"
                : undefined
            }
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-center transition active:scale-95"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                pathname === "/expenses" || pathname.startsWith("/expenses/")
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden="true"
              >
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M8 8h8" />
                <path d="M8 12h8" />
                <path d="M8 16h4" />
              </svg>
            </div>
            <span
              className={[
                "text-[10px] tracking-tight transition-colors",
                pathname === "/expenses" || pathname.startsWith("/expenses/")
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "font-medium text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              Expenses
            </span>
          </Link>

          {/* Tab 3: Budgets */}
          <Link
            href="/budgets"
            aria-current={
              pathname === "/budgets" || pathname.startsWith("/budgets/")
                ? "page"
                : undefined
            }
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-center transition active:scale-95"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                pathname === "/budgets" || pathname.startsWith("/budgets/")
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <span
              className={[
                "text-[10px] tracking-tight transition-colors",
                pathname === "/budgets" || pathname.startsWith("/budgets/")
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "font-medium text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              Budgets
            </span>
          </Link>

          {/* Tab 4: Households */}
          <Link
            href="/households"
            aria-current={
              pathname === "/households" ||
              pathname.startsWith("/households/")
                ? "page"
                : undefined
            }
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-center transition active:scale-95"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                pathname === "/households" ||
                pathname.startsWith("/households/")
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span
              className={[
                "text-[10px] tracking-tight transition-colors",
                pathname === "/households" ||
                pathname.startsWith("/households/")
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "font-medium text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              Households
            </span>
          </Link>

          {/* Tab 5: More */}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-label="More navigation options"
            className="relative flex flex-col items-center justify-center gap-0.5 py-1 text-center transition active:scale-95"
          >
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                isMoreActive || moreOpen
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            {isMoreActive && (
              <span className="absolute top-1 right-3.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-900" />
            )}
            <span
              className={[
                "text-[10px] tracking-tight transition-colors",
                isMoreActive || moreOpen
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "font-medium text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-up "More" Menu Sheet for Mobile View */}
      {moreOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation options"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-zinc-200 bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl transition-transform dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Grab handle indicator */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                More Features
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/recurring"
                onClick={() => setMoreOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl p-3 transition",
                  pathname === "/recurring" ||
                  pathname.startsWith("/recurring/")
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/60 dark:bg-zinc-700/60">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="m17 2 4 4-4 4" />
                    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                    <path d="m7 22-4-4 4-4" />
                    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Recurring Expenses</p>
                  <p
                    className={[
                      "text-xs",
                      pathname === "/recurring" ||
                      pathname.startsWith("/recurring/")
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    Subscriptions, bills, and repeating costs
                  </p>
                </div>
              </Link>

              <Link
                href="/categories"
                onClick={() => setMoreOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl p-3 transition",
                  pathname === "/categories" ||
                  pathname.startsWith("/categories/")
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/60 dark:bg-zinc-700/60">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828z" />
                    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Categories</p>
                  <p
                    className={[
                      "text-xs",
                      pathname === "/categories" ||
                      pathname.startsWith("/categories/")
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    Organize spending categories & tags
                  </p>
                </div>
              </Link>
            </div>

            <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {displayLabel}
                  </p>
                  {userEmail && (
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {userEmail}
                    </p>
                  )}
                </div>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
