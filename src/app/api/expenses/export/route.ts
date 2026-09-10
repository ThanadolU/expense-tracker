import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { exportExpensesForUser } from "@/lib/actions/expenses";
import { formatExpensesAsCsv } from "@/lib/csv";
import { resolveExpenseMonthParam, toMonthInputValueFrom } from "@/lib/dates";
import { parsePaymentMethod } from "@/lib/payment-methods";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const monthParam = searchParams.get("month");
  const categoryIdParam = searchParams.get("categoryId");
  const paymentMethodParam = searchParams.get("paymentMethod");

  const yearMonth = resolveExpenseMonthParam(monthParam);
  const categoryId = categoryIdParam?.trim() || null;
  const paymentMethod = parsePaymentMethod(paymentMethodParam);

  const expenses = await exportExpensesForUser(userId, {
    yearMonth,
    categoryId,
    paymentMethod,
  });

  const csv = formatExpensesAsCsv(expenses);

  const filename = yearMonth
    ? `expenses-${toMonthInputValueFrom(yearMonth)}.csv`
    : "expenses-all.csv";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
