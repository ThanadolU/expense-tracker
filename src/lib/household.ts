import { prisma } from "@/lib/prisma";
import type { HouseholdRole, InviteStatus, HouseholdSplitType } from "@/generated/prisma/client";

export type UserHouseholdSummary = {
  id: string;
  name: string;
  currency: string;
  role: HouseholdRole;
  memberCount: number;
  createdAt: Date;
  createdById: string;
  isOwner: boolean;
};

export type HouseholdMemberItem = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: HouseholdRole;
  joinedAt: Date;
};

export type HouseholdInviteItem = {
  id: string;
  email: string;
  role: HouseholdRole;
  status: InviteStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string | null;
  invitedByEmail: string;
};

export type HouseholdWithDetails = {
  id: string;
  name: string;
  currency: string;
  createdById: string;
  createdAt: Date;
  currentUserRole: HouseholdRole;
  isOwner: boolean;
  members: HouseholdMemberItem[];
  invites: HouseholdInviteItem[];
};

/**
 * Get all households the user is a member of.
 */
export async function getUserHouseholds(
  userId: string,
): Promise<UserHouseholdSummary[]> {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    include: {
      household: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return memberships.map((m) => ({
    id: m.household.id,
    name: m.household.name,
    currency: m.household.currency,
    role: m.role,
    memberCount: m.household._count.members,
    createdAt: m.household.createdAt,
    createdById: m.household.createdById,
    isOwner: m.role === "OWNER",
  }));
}

/**
 * Get full details for a single household, verifying user membership.
 */
export async function getHouseholdDetails(
  householdId: string,
  userId: string,
): Promise<HouseholdWithDetails | null> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          },
          invites: {
            where: {
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
            include: {
              invitedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  const { household } = membership;

  return {
    id: household.id,
    name: household.name,
    currency: household.currency,
    createdById: household.createdById,
    createdAt: household.createdAt,
    currentUserRole: membership.role,
    isOwner: membership.role === "OWNER",
    members: household.members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    invites: household.invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      token: inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      invitedByName: inv.invitedBy.name,
      invitedByEmail: inv.invitedBy.email,
    })),
  };
}

/**
 * Fetch incoming pending invitations for a user's email.
 */
export async function getPendingInvitesForEmail(email: string) {
  return prisma.householdInvite.findMany({
    where: {
      email: email.toLowerCase().trim(),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          currency: true,
          _count: { select: { members: true } },
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get invitation details by token.
 */
export async function getInviteByToken(token: string) {
  if (!token || typeof token !== "string") return null;

  return prisma.householdInvite.findUnique({
    where: { token: token.trim() },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          currency: true,
          _count: { select: { members: true } },
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export { HOUSEHOLD_CATEGORIES, type HouseholdCategory } from "@/lib/constants";

export type HouseholdExpenseSplitItem = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  amount: number;
  isSettled: boolean;
};

export type HouseholdExpenseItem = {
  id: string;
  householdId: string;
  description: string;
  amount: number;
  currency: string;
  category: string | null;
  spentAt: Date;
  splitType: HouseholdSplitType;
  receiptUrl: string | null;
  receiptKey: string | null;
  createdAt: Date;
  paidById: string;
  paidByName: string | null;
  paidByEmail: string;
  splits: HouseholdExpenseSplitItem[];
};

export type HouseholdSettlementItem = {
  id: string;
  householdId: string;
  fromUserId: string;
  fromUserName: string | null;
  fromUserEmail: string;
  toUserId: string;
  toUserName: string | null;
  toUserEmail: string;
  amount: number;
  currency: string;
  settledAt: Date;
  note: string | null;
  createdAt: Date;
};

export type MemberBalance = {
  userId: string;
  name: string | null;
  email: string;
  totalPaid: number;
  totalShare: number;
  settlementsSent: number;
  settlementsReceived: number;
  netBalance: number;
};

export type SuggestedRepayment = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
};

export type HouseholdBalancesSummary = {
  totalHouseholdSpend: number;
  members: MemberBalance[];
  suggestedRepayments: SuggestedRepayment[];
  userNetBalance: number;
  userOwes: SuggestedRepayment[];
  userIsOwed: SuggestedRepayment[];
};

/**
 * Get all shared expenses for a household, verifying membership.
 */
export async function getHouseholdExpenses(
  householdId: string,
  userId: string,
): Promise<HouseholdExpenseItem[]> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    return [];
  }

  const expenses = await prisma.householdExpense.findMany({
    where: { householdId },
    include: {
      paidBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
  });

  return expenses.map((exp) => ({
    id: exp.id,
    householdId: exp.householdId,
    description: exp.description,
    amount: Number(exp.amount),
    currency: exp.currency,
    category: exp.category,
    spentAt: exp.spentAt,
    splitType: exp.splitType,
    receiptUrl: exp.receiptUrl,
    receiptKey: exp.receiptKey,
    createdAt: exp.createdAt,
    paidById: exp.paidBy.id,
    paidByName: exp.paidBy.name,
    paidByEmail: exp.paidBy.email,
    splits: exp.splits.map((s) => ({
      id: s.id,
      userId: s.user.id,
      userName: s.user.name,
      userEmail: s.user.email,
      amount: Number(s.amount),
      isSettled: s.isSettled,
    })),
  }));
}

/**
 * Get all settlements for a household, verifying membership.
 */
export async function getHouseholdSettlements(
  householdId: string,
  userId: string,
): Promise<HouseholdSettlementItem[]> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    return [];
  }

  const settlements = await prisma.householdSettlement.findMany({
    where: { householdId },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ settledAt: "desc" }, { createdAt: "desc" }],
  });

  return settlements.map((s) => ({
    id: s.id,
    householdId: s.householdId,
    fromUserId: s.fromUser.id,
    fromUserName: s.fromUser.name,
    fromUserEmail: s.fromUser.email,
    toUserId: s.toUser.id,
    toUserName: s.toUser.name,
    toUserEmail: s.toUser.email,
    amount: Number(s.amount),
    currency: s.currency,
    settledAt: s.settledAt,
    note: s.note,
    createdAt: s.createdAt,
  }));
}

/**
 * Calculate balances and suggested repayments for a household.
 */
export async function getHouseholdBalances(
  householdId: string,
  currentUserId: string,
): Promise<HouseholdBalancesSummary | null> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId: currentUserId,
      },
    },
  });

  if (!membership) {
    return null;
  }

  // Fetch all members of the household
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Fetch expenses with splits
  const expenses = await prisma.householdExpense.findMany({
    where: { householdId },
    include: {
      splits: true,
    },
  });

  // Fetch settlements
  const settlements = await prisma.householdSettlement.findMany({
    where: { householdId },
  });

  // Total household spend
  let totalHouseholdSpend = 0;

  // Initialize member balances map
  const balancesMap = new Map<
    string,
    {
      name: string | null;
      email: string;
      totalPaid: number;
      totalShare: number;
      settlementsSent: number;
      settlementsReceived: number;
    }
  >();

  for (const m of members) {
    balancesMap.set(m.userId, {
      name: m.user.name,
      email: m.user.email,
      totalPaid: 0,
      totalShare: 0,
      settlementsSent: 0,
      settlementsReceived: 0,
    });
  }

  // Process expenses
  for (const exp of expenses) {
    const amount = Number(exp.amount);
    totalHouseholdSpend += amount;

    const payer = balancesMap.get(exp.paidById);
    if (payer) {
      payer.totalPaid += amount;
    }

    for (const split of exp.splits) {
      const splitUser = balancesMap.get(split.userId);
      if (splitUser) {
        splitUser.totalShare += Number(split.amount);
      }
    }
  }

  // Process settlements
  for (const s of settlements) {
    const amount = Number(s.amount);
    const sender = balancesMap.get(s.fromUserId);
    if (sender) {
      sender.settlementsSent += amount;
    }
    const receiver = balancesMap.get(s.toUserId);
    if (receiver) {
      receiver.settlementsReceived += amount;
    }
  }

  const memberBalances: MemberBalance[] = [];
  for (const [userId, data] of balancesMap.entries()) {
    // Net balance: (totalPaid - totalShare) + (settlementsSent - settlementsReceived)
    const netBalance = Math.round(
      ((data.totalPaid - data.totalShare) + (data.settlementsSent - data.settlementsReceived)) * 100
    ) / 100;

    memberBalances.push({
      userId,
      name: data.name,
      email: data.email,
      totalPaid: Math.round(data.totalPaid * 100) / 100,
      totalShare: Math.round(data.totalShare * 100) / 100,
      settlementsSent: Math.round(data.settlementsSent * 100) / 100,
      settlementsReceived: Math.round(data.settlementsReceived * 100) / 100,
      netBalance,
    });
  }

  // Calculate suggested simplified repayments using greedy matching
  // Debtors have netBalance < -0.01; Creditors have netBalance > 0.01
  const debtors = memberBalances
    .filter((m) => m.netBalance < -0.01)
    .map((m) => ({ ...m, remaining: Math.abs(m.netBalance) }));

  const creditors = memberBalances
    .filter((m) => m.netBalance > 0.01)
    .map((m) => ({ ...m, remaining: m.netBalance }));

  const suggestedRepayments: SuggestedRepayment[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.remaining, creditor.remaining);
    if (settleAmount >= 0.01) {
      suggestedRepayments.push({
        fromUserId: debtor.userId,
        fromName: debtor.name || debtor.email.split("@")[0],
        toUserId: creditor.userId,
        toName: creditor.name || creditor.email.split("@")[0],
        amount: Math.round(settleAmount * 100) / 100,
      });

      debtor.remaining = Math.round((debtor.remaining - settleAmount) * 100) / 100;
      creditor.remaining = Math.round((creditor.remaining - settleAmount) * 100) / 100;
    }

    if (debtor.remaining < 0.01) dIdx++;
    if (creditor.remaining < 0.01) cIdx++;
  }

  const currentUserBalanceObj = memberBalances.find((m) => m.userId === currentUserId);
  const userNetBalance = currentUserBalanceObj?.netBalance ?? 0;

  const userOwes = suggestedRepayments.filter((r) => r.fromUserId === currentUserId);
  const userIsOwed = suggestedRepayments.filter((r) => r.toUserId === currentUserId);

  return {
    totalHouseholdSpend: Math.round(totalHouseholdSpend * 100) / 100,
    members: memberBalances,
    suggestedRepayments,
    userNetBalance,
    userOwes,
    userIsOwed,
  };
}
