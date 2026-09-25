import { PrismaClient } from "@prisma/client";

/**
 * Process-wide Prisma client. In development, Next.js hot-reloads would
 * otherwise create a new connection pool per reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
