import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — Expense Tracker",
  description: "Request a link to reset your Expense Tracker account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reset password
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email to receive a password reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
