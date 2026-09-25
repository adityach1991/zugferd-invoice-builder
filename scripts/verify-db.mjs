#!/usr/bin/env node
/** Smoke check: database connects and the schema round-trips. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const org = await prisma.organization.create({
  data: {
    name: "Smoke Test Org",
    members: {
      create: {
        role: "OWNER",
        user: { create: { email: `smoke-${Date.now()}@example.test`, name: "Smoke" } },
      },
    },
  },
  include: { members: { include: { user: true } } },
});
console.log("Created organization:", org.id, "with user:", org.members[0].user.email);

const invoice = await prisma.invoice.create({
  data: {
    organizationId: org.id,
    createdById: org.members[0].userId,
    number: "SMOKE-0001",
    issueDate: new Date("2026-09-25"),
    dueDate: new Date("2026-10-25"),
    currency: "EUR",
    status: "DRAFT",
    payload: { note: "schema round-trip" },
  },
});
console.log("Created invoice:", invoice.id, invoice.status);

await prisma.invoice.delete({ where: { id: invoice.id } });
await prisma.organization.delete({ where: { id: org.id } });
console.log("Cleanup done. Database connection OK.");

await prisma.$disconnect();
