"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { HouseholdRole, HouseholdSplitType } from "@/generated/prisma/client";
import { deleteReceiptFromR2, uploadReceiptToR2 } from "@/lib/r2";

export type HouseholdFormState = {
  error?: string;
  ok?: boolean;
  householdId?: string;
  inviteUrl?: string;
} | null;

async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return { userId, userEmail, userName };
}

async function getBaseUrl(): Promise<string> {
  let host: string | null = null;
  let proto = "http";
  try {
    const headersList = await headers();
    host = headersList.get("x-forwarded-host") || headersList.get("host");
    proto =
      headersList.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
  } catch {
    // Outside request context
  }

  return (
    process.env.AUTH_URL ||
    (host ? `${proto}://${host}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

/**
 * Create a new household space.
 */
export async function createHouseholdAction(
  _prev: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const { userId } = await requireUser();
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

  if (!name || name.length === 0) {
    return { error: "Household name is required." };
  }

  if (name.length > 50) {
    return { error: "Household name must be 50 characters or less." };
  }

  const household = await prisma.$transaction(async (tx) => {
    const h = await tx.household.create({
      data: {
        name,
        currency: "THB",
        createdById: userId,
      },
    });

    await tx.householdMember.create({
      data: {
        householdId: h.id,
        userId,
        role: "OWNER",
      },
    });

    return h;
  });

  revalidatePath("/households");
  redirect(`/households/${household.id}`);
}

/**
 * Update household details (Owner only).
 */
export async function updateHouseholdAction(
  _prev: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";

  if (!householdId) {
    return { error: "Household ID missing." };
  }

  if (!name || name.length === 0) {
    return { error: "Household name cannot be empty." };
  }

  if (name.length > 50) {
    return { error: "Household name must be 50 characters or less." };
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    return { error: "Only household owners can update settings." };
  }

  await prisma.household.update({
    where: { id: householdId },
    data: { name },
  });

  revalidatePath("/households");
  revalidatePath(`/households/${householdId}`);

  return { ok: true };
}

/**
 * Delete household (Owner only).
 */
export async function deleteHouseholdAction(formData: FormData) {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");

  if (!householdId) {
    throw new Error("Household ID missing.");
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only household owners can delete this household.");
  }

  await prisma.household.delete({
    where: { id: householdId },
  });

  revalidatePath("/households");
  redirect("/households");
}

/**
 * Invite a member to a household via email.
 */
export async function inviteMemberAction(
  _prev: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const { userId, userName, userEmail } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const emailRaw = formData.get("email");
  const roleRaw = formData.get("role");

  const email = typeof emailRaw === "string" ? emailRaw.toLowerCase().trim() : "";
  const role: HouseholdRole = roleRaw === "OWNER" ? "OWNER" : "MEMBER";

  if (!householdId) {
    return { error: "Household ID missing." };
  }

  if (!email || !email.includes("@") || email.length < 3) {
    return { error: "Enter a valid email address." };
  }

  // Verify caller membership and role
  const callerMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    include: {
      household: { select: { name: true } },
    },
  });

  if (!callerMembership) {
    return { error: "You are not a member of this household." };
  }

  // Check if target is already a member
  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (targetUser) {
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      return { error: "This user is already a member of this household." };
    }
  }

  // Remove any stale pending invite for this email in this household
  await prisma.householdInvite.deleteMany({
    where: {
      householdId,
      email,
      status: "PENDING",
    },
  });

  // Generate 7-day invite token
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.householdInvite.create({
    data: {
      householdId,
      email,
      role,
      token,
      invitedById: userId,
      expiresAt,
    },
  });

  const baseUrl = await getBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${token}`;

  // Log in dev / dispatch in production
  console.log("\n========================================================");
  console.log("🏠 [HOUSEHOLD INVITE]");
  console.log(`To: ${email}`);
  console.log(`Household: ${callerMembership.household.name}`);
  console.log(`Invited By: ${userName || userEmail}`);
  console.log(`Role: ${role}`);
  console.log(`🔗 Link: ${inviteUrl}`);
  console.log("========================================================\n");

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail =
        process.env.EMAIL_FROM || "Expense Tracker <onboarding@resend.dev>";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `You've been invited to join "${callerMembership.household.name}" on Expense Tracker`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Household Invitation</h2>
              <p style="font-size: 14px; line-height: 24px; color: #52525b; margin-bottom: 24px;">
                <strong>${userName || userEmail}</strong> has invited you to join the household <strong>"${callerMembership.household.name}"</strong> as a ${role.toLowerCase()}.
              </p>
              <div style="margin-bottom: 28px;">
                <a href="${inviteUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 12px; line-height: 20px; color: #71717a;">
                This invitation link will expire in 7 days.
              </p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Failed to send invite email:", e);
    }
  }

  revalidatePath(`/households/${householdId}`);
  return { ok: true, inviteUrl };
}

/**
 * Cancel a pending invitation (Owner only).
 */
export async function cancelInviteAction(formData: FormData) {
  const { userId } = await requireUser();
  const inviteId = String(formData.get("inviteId") || "");
  const householdId = String(formData.get("householdId") || "");

  if (!inviteId || !householdId) {
    throw new Error("Missing parameters.");
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only owners can cancel invitations.");
  }

  await prisma.householdInvite.delete({
    where: { id: inviteId },
  });

  revalidatePath(`/households/${householdId}`);
}

/**
 * Accept an invitation using the invite token.
 */
export async function acceptInviteAction(token: string): Promise<{ error?: string }> {
  const { userId } = await requireUser();

  if (!token || typeof token !== "string") {
    return { error: "Invalid invite token." };
  }

  const invite = await prisma.householdInvite.findUnique({
    where: { token: token.trim() },
    include: { household: true },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return { error: "This invitation is invalid or has expired." };
  }

  // Check if user is already a member
  const existingMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: invite.householdId,
        userId,
      },
    },
  });

  if (existingMembership) {
    await prisma.householdInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
    revalidatePath("/households");
    redirect(`/households/${invite.householdId}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId,
        role: invite.role,
      },
    });

    await tx.householdInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
  });

  revalidatePath("/households");
  redirect(`/households/${invite.householdId}`);
}

/**
 * Decline an invitation.
 */
export async function declineInviteAction(token: string): Promise<void> {
  await requireUser();

  if (!token || typeof token !== "string") return;

  await prisma.householdInvite.updateMany({
    where: { token: token.trim(), status: "PENDING" },
    data: { status: "DECLINED" },
  });

  revalidatePath("/households");
}

/**
 * Remove a member from a household (Owner only).
 */
export async function removeMemberAction(formData: FormData) {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const targetUserId = String(formData.get("targetUserId") || "");

  if (!householdId || !targetUserId) {
    throw new Error("Missing parameters.");
  }

  const callerMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only owners can remove members.");
  }

  // Prevent removing self via removeMember (should use leaveHousehold instead)
  if (targetUserId === userId) {
    throw new Error("Cannot remove yourself with this action. Use leave household instead.");
  }

  await prisma.householdMember.delete({
    where: {
      householdId_userId: {
        householdId,
        userId: targetUserId,
      },
    },
  });

  revalidatePath(`/households/${householdId}`);
  revalidatePath("/households");
}

/**
 * Leave a household.
 */
export async function leaveHouseholdAction(formData: FormData) {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");

  if (!householdId) {
    throw new Error("Missing household ID.");
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this household.");
  }

  // If owner, check if other owners exist
  if (membership.role === "OWNER") {
    const ownerCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: "OWNER",
      },
    });

    const totalMemberCount = await prisma.householdMember.count({
      where: { householdId },
    });

    if (ownerCount <= 1 && totalMemberCount > 1) {
      throw new Error(
        "You are the sole owner of this household. Please assign another owner before leaving, or delete the household.",
      );
    }
  }

  await prisma.householdMember.delete({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  revalidatePath("/households");
  redirect("/households");
}

function parseAmount(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Amount is required." };
  }
  const normalized = raw.replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      ok: false,
      error: "Enter a valid amount with up to 2 decimal places.",
    };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (n >= 1_000_000_000_000) {
    return { ok: false, error: "Amount is too large." };
  }
  return { ok: true, value: normalized };
}

function parseSpentAt(raw: string): { ok: true; value: Date } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Date is required." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: "Enter a valid date (YYYY-MM-DD)." };
  }
  const value = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime())) {
    return { ok: false, error: "Enter a valid date." };
  }
  return { ok: true, value };
}

/**
 * Log a shared expense for a household and optionally split between members.
 */
export async function createHouseholdExpenseAction(
  _prev: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const descriptionRaw = formData.get("description");
  const amountRaw = String(formData.get("amount") || "");
  const spentAtRaw = String(formData.get("spentAt") || "");
  const categoryRaw = formData.get("category");
  const paidByIdRaw = formData.get("paidById");
  const splitTypeRaw = formData.get("splitType");

  if (!householdId) {
    return { error: "Household ID is required." };
  }

  // Verify caller is a member of this household
  const callerMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!callerMembership) {
    return { error: "You are not a member of this household." };
  }

  const description = typeof descriptionRaw === "string" ? descriptionRaw.trim() : "";
  if (!description) {
    return { error: "Description is required." };
  }
  if (description.length > 200) {
    return { error: "Description must be 200 characters or less." };
  }

  const amountRes = parseAmount(amountRaw);
  if (!amountRes.ok) {
    return { error: amountRes.error };
  }

  const spentAtRes = parseSpentAt(spentAtRaw);
  if (!spentAtRes.ok) {
    return { error: spentAtRes.error };
  }

  const category = typeof categoryRaw === "string" && categoryRaw.trim().length > 0
    ? categoryRaw.trim()
    : null;

  // Determine who paid
  let paidById = userId;
  if (typeof paidByIdRaw === "string" && paidByIdRaw.trim().length > 0) {
    const targetPayer = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: paidByIdRaw.trim(),
        },
      },
    });
    if (!targetPayer) {
      return { error: "Selected payer is not a member of this household." };
    }
    paidById = targetPayer.userId;
  }

  const splitType: HouseholdSplitType =
    splitTypeRaw === "FULL" ? "FULL" : "EQUAL";

  // Get selected split members
  const splitUserIdsRaw = formData.getAll("splitUserIds");
  let selectedUserIds = splitUserIdsRaw
    .map((v) => String(v).trim())
    .filter((id) => id.length > 0);

  // If no members explicitly selected or empty, default to all household members
  const allMembers = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  });
  const allMemberIdSet = new Set(allMembers.map((m) => m.userId));

  if (selectedUserIds.length === 0) {
    selectedUserIds = Array.from(allMemberIdSet);
  } else {
    // Validate that all selected are members
    selectedUserIds = selectedUserIds.filter((id) => allMemberIdSet.has(id));
  }

  if (selectedUserIds.length === 0) {
    return { error: "At least one member must be selected for the expense." };
  }

  // Handle optional receipt upload
  let receiptKey: string | null = null;
  let receiptUrl: string | null = null;
  const receiptEntry = formData.get("receipt");
  if (receiptEntry instanceof File && receiptEntry.size > 0) {
    const uploadRes = await uploadReceiptToR2(receiptEntry, userId);
    if (!uploadRes.ok) {
      return { error: uploadRes.error };
    }
    receiptKey = uploadRes.key;
    receiptUrl = uploadRes.url || null;
  }

  // Calculate split allocations
  const totalCents = Math.round(Number(amountRes.value) * 100);
  const splitsData: { userId: string; amount: string }[] = [];

  if (splitType === "FULL") {
    // Single payer bears 100% of expense, no debt to other members
    splitsData.push({
      userId: paidById,
      amount: amountRes.value,
    });
  } else {
    // Split equally among selected members with exact penny distribution
    const count = selectedUserIds.length;
    const baseCents = Math.floor(totalCents / count);
    const remainder = totalCents % count;

    selectedUserIds.forEach((uid, index) => {
      const shareCents = baseCents + (index < remainder ? 1 : 0);
      splitsData.push({
        userId: uid,
        amount: (shareCents / 100).toFixed(2),
      });
    });
  }

  await prisma.$transaction(async (tx) => {
    const expense = await tx.householdExpense.create({
      data: {
        householdId,
        paidById,
        amount: amountRes.value,
        currency: "THB",
        description,
        category,
        spentAt: spentAtRes.value,
        splitType,
        receiptKey,
        receiptUrl,
      },
    });

    await tx.householdExpenseSplit.createMany({
      data: splitsData.map((s) => ({
        householdExpenseId: expense.id,
        userId: s.userId,
        amount: s.amount,
        isSettled: false,
      })),
    });
  });

  revalidatePath(`/households/${householdId}`);
  return { ok: true };
}

/**
 * Delete a shared household expense.
 */
export async function deleteHouseholdExpenseAction(formData: FormData) {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const expenseId = String(formData.get("expenseId") || "");

  if (!householdId || !expenseId) {
    throw new Error("Missing parameters.");
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this household.");
  }

  const expense = await prisma.householdExpense.findUnique({
    where: { id: expenseId },
  });

  if (!expense || expense.householdId !== householdId) {
    throw new Error("Expense not found.");
  }

  // Only payer or household OWNER can delete
  if (expense.paidById !== userId && membership.role !== "OWNER") {
    throw new Error("Only the payer or household owner can delete this expense.");
  }

  if (expense.receiptKey) {
    await deleteReceiptFromR2(expense.receiptKey);
  }

  await prisma.householdExpense.delete({
    where: { id: expenseId },
  });

  revalidatePath(`/households/${householdId}`);
}

/**
 * Record a settlement payment between two household members.
 */
export async function createSettlementAction(
  _prev: HouseholdFormState,
  formData: FormData,
): Promise<HouseholdFormState> {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const fromUserId = String(formData.get("fromUserId") || "");
  const toUserId = String(formData.get("toUserId") || "");
  const amountRaw = String(formData.get("amount") || "");
  const noteRaw = formData.get("note");
  const settledAtRaw = String(formData.get("settledAt") || "");

  if (!householdId) {
    return { error: "Household ID missing." };
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    return { error: "You are not a member of this household." };
  }

  if (!fromUserId || !toUserId) {
    return { error: "Both sender and receiver are required." };
  }

  if (fromUserId === toUserId) {
    return { error: "Sender and recipient cannot be the same person." };
  }

  // Verify both from and to are household members
  const memberCount = await prisma.householdMember.count({
    where: {
      householdId,
      userId: { in: [fromUserId, toUserId] },
    },
  });

  if (memberCount !== 2) {
    return { error: "Both participants must be members of this household." };
  }

  const amountRes = parseAmount(amountRaw);
  if (!amountRes.ok) {
    return { error: amountRes.error };
  }

  let settledAt = new Date();
  if (settledAtRaw) {
    const parsedDate = parseSpentAt(settledAtRaw);
    if (parsedDate.ok) {
      settledAt = parsedDate.value;
    }
  }

  const note = typeof noteRaw === "string" && noteRaw.trim().length > 0
    ? noteRaw.trim().slice(0, 200)
    : null;

  await prisma.householdSettlement.create({
    data: {
      householdId,
      fromUserId,
      toUserId,
      amount: amountRes.value,
      currency: "THB",
      settledAt,
      note,
    },
  });

  revalidatePath(`/households/${householdId}`);
  return { ok: true };
}

/**
 * Delete a recorded settlement.
 */
export async function deleteSettlementAction(formData: FormData) {
  const { userId } = await requireUser();
  const householdId = String(formData.get("householdId") || "");
  const settlementId = String(formData.get("settlementId") || "");

  if (!householdId || !settlementId) {
    throw new Error("Missing parameters.");
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this household.");
  }

  const settlement = await prisma.householdSettlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement || settlement.householdId !== householdId) {
    throw new Error("Settlement not found.");
  }

  if (
    settlement.fromUserId !== userId &&
    settlement.toUserId !== userId &&
    membership.role !== "OWNER"
  ) {
    throw new Error("You can only delete settlements you participated in.");
  }

  await prisma.householdSettlement.delete({
    where: { id: settlementId },
  });

  revalidatePath(`/households/${householdId}`);
}
