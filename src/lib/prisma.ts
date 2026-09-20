import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/**
 * In dev, Next.js keeps a global Prisma client in globalThis across hot reloads.
 * After schema changes (e.g. adding PasswordResetToken, Budget, RecurringExpense),
 * that cached instance can be missing new model delegates (`prisma.passwordResetToken === undefined`).
 * We invalidate the cached client if any model delegate is missing.
 */
function getPrismaClient(requiredProp?: string | symbol): PrismaClient {
  let cached = globalForPrisma.prisma;

  const isMissingProp =
    Boolean(cached) &&
    Boolean(requiredProp) &&
    typeof requiredProp === "string" &&
    !requiredProp.startsWith("$") &&
    !(requiredProp in (cached as unknown as Record<string, unknown>));

  const isMissingKnownModels =
    Boolean(cached) &&
    (
      !("category" in cached!) ||
      !("expense" in cached!) ||
      !("user" in cached!) ||
      !("budget" in cached!) ||
      !("recurringExpense" in cached!) ||
      !("passwordResetToken" in cached!)
    );

  if (cached && (isMissingProp || isMissingKnownModels)) {
    cached = undefined;
    globalForPrisma.prisma = undefined;
  }

  if (!cached) {
    cached = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = cached;
    }
  }

  return cached;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient(prop);
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

