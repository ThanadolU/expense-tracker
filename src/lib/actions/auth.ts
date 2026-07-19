"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { ensureDefaultCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  error?: string;
} | null;

function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

function readPassword(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function validateCredentials(
  email: string,
  password: string,
): string | null {
  if (!email || !password) {
    return "Email and password are required.";
  }
  if (!email.includes("@") || email.length < 3) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));
  const nameRaw = formData.get("name");
  const name =
    typeof nameRaw === "string" && nameRaw.trim().length > 0
      ? nameRaw.trim()
      : null;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return { error: validationError };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  await ensureDefaultCategories(user.id);

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created, but sign-in failed. Please log in.",
      };
    }
    throw error;
  }

  return null;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
