import { prisma } from "@/lib/prisma";
import {
  advanceDate,
  getUtcToday,
} from "@/lib/recurring-utils";

export * from "@/lib/recurring-utils";

/**
 * Process all active recurring expenses that are due for a given user.
 * Generates regular Expense records and advances nextDueDate.
 */
export async function processDueRecurringExpenses(
  userId: string,
): Promise<{ generatedCount: number }> {
  const today = getUtcToday();

  const dueTemplates = await prisma.recurringExpense.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: { lte: today },
    },
    include: {
      category: true,
    },
  });

  if (dueTemplates.length === 0) {
    return { generatedCount: 0 };
  }

  let generatedCount = 0;

  for (const template of dueTemplates) {
    let currentDue = new Date(template.nextDueDate);
    const expensesToCreate: Array<{
      userId: string;
      categoryId: string;
      amount: typeof template.amount;
      currency: string;
      paymentMethod: typeof template.paymentMethod;
      spentAt: Date;
      note: string;
      recurringExpenseId: string;
    }> = [];

    // Safeguard max iterations (e.g. at most 36 missed cycles per template)
    let iterations = 0;
    while (currentDue <= today && iterations < 36) {
      const note = template.note
        ? `${template.title}: ${template.note}`
        : template.title;

      expensesToCreate.push({
        userId,
        categoryId: template.categoryId,
        amount: template.amount,
        currency: template.currency,
        paymentMethod: template.paymentMethod,
        spentAt: currentDue,
        note,
        recurringExpenseId: template.id,
      });

      currentDue = advanceDate(currentDue, template.cadence);
      iterations++;
    }

    if (expensesToCreate.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.expense.createMany({
          data: expensesToCreate,
        });

        await tx.recurringExpense.update({
          where: { id: template.id },
          data: {
            nextDueDate: currentDue,
            lastGeneratedAt: new Date(),
          },
        });
      });

      generatedCount += expensesToCreate.length;
    }
  }

  return { generatedCount };
}
