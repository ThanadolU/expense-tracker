"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export type RequestResetState = {
  error?: string;
  success?: boolean;
  devResetUrl?: string;
} | null;

export type ResetPasswordState = {
  error?: string;
} | null;

function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/**
 * Request a password reset email for an account.
 */
export async function requestPasswordResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email || !email.includes("@") || email.length < 3) {
    return { error: "Please enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // If user does not exist, return success to prevent account enumeration
  if (!user) {
    return { success: true };
  }

  // Invalidate any previously issued tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Generate a secure 32-byte hex token and its SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Determine site base URL dynamically
  let host: string | null = null;
  let proto = "http";
  try {
    const headersList = await headers();
    host = headersList.get("x-forwarded-host") || headersList.get("host");
    proto =
      headersList.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
  } catch {
    // Called outside an active HTTP request context (e.g. CLI/scripts)
  }

  const baseUrl =
    process.env.AUTH_URL ||
    (host ? `${proto}://${host}` : "http://localhost:3000");

  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

  const sendResult = await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
  });

  return {
    success: true,
    devResetUrl: sendResult.devResetUrl,
  };
}

/**
 * Check if a raw token is valid and not yet expired.
 */
export async function validateResetToken(
  rawToken: string,
): Promise<{ valid: boolean; error?: string }> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return { valid: false, error: "Missing or invalid reset token." };
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken.trim())
    .digest("hex");

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!tokenRecord) {
    return {
      valid: false,
      error: "This password reset link is invalid or has already been used.",
    };
  }

  if (tokenRecord.expiresAt < new Date()) {
    // Delete expired token
    await prisma.passwordResetToken
      .delete({ where: { id: tokenRecord.id } })
      .catch(() => {});

    return {
      valid: false,
      error: "This password reset link has expired. Please request a new one.",
    };
  }

  return { valid: true };
}

/**
 * Reset password using a valid token.
 */
export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = readString(formData.get("token")).trim();
  const password = readString(formData.get("password"));
  const confirmPassword = readString(formData.get("confirmPassword"));

  if (!token) {
    return { error: "Reset token is missing. Please use the link from your email." };
  }

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    if (tokenRecord) {
      await prisma.passwordResetToken
        .delete({ where: { id: tokenRecord.id } })
        .catch(() => {});
    }
    return {
      error:
        "This password reset link is invalid or has expired. Please request a new one.",
    };
  }

  // Hash new password with bcrypt salt 12
  const passwordHash = await hash(password, 12);

  // In a transaction, update password and delete the used token (single-use)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({
      where: { id: tokenRecord.id },
    }),
  ]);

  redirect("/login?reset=success");
}
