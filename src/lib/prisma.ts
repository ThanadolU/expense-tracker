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
 * In dev, Next.js keeps a global Prisma client across hot reloads.
 * After schema changes (e.g. adding Category), that cached instance can be
 * missing new model delegates (`prisma.category === undefined`).
 * Drop and recreate the client when expected models are missing.
 */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  if (
    cached &&
    typeof cached === "object" &&
    "category" in cached &&
    cached.category != null &&
    "expense" in cached &&
    cached.expense != null &&
    "user" in cached &&
    cached.user != null
  ) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
