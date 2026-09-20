import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getReceiptFromR2 } from "@/lib/r2";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return new Response("Not found", { status: 404 });
  }

  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    select: { receiptKey: true },
  });

  if (!expense?.receiptKey) {
    return new Response("Receipt not found", { status: 404 });
  }

  const r2Object = await getReceiptFromR2(expense.receiptKey);
  if (!r2Object?.Body) {
    return new Response("Receipt file not found in storage", { status: 404 });
  }

  const stream = r2Object.Body.transformToWebStream();

  const headers = new Headers();
  if (r2Object.ContentType) {
    headers.set("Content-Type", r2Object.ContentType);
  }
  if (r2Object.ContentLength != null) {
    headers.set("Content-Length", r2Object.ContentLength.toString());
  }
  headers.set("Cache-Control", "private, max-age=3600");

  return new Response(stream, {
    status: 200,
    headers,
  });
}
