import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { InvoiceRepository } from "@/src/repositories/invoice-repository";
import { db } from "@/src/repositories/db";

describe("InvoiceRepository", () => {
  let repository: InvoiceRepository;
  let testOrgId: string;

  beforeAll(async () => {
    repository = new InvoiceRepository();
    testOrgId = "test-org-repo-" + Date.now();
    try {
      await db.$executeRaw`INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") VALUES (${testOrgId}, 'Test Repo Org', NOW(), NOW()) ON CONFLICT DO NOTHING`;
    } catch {
      // Organization might already exist, that's fine
    }
  });

  afterAll(async () => {
    try {
      await db.$executeRaw`DELETE FROM "Invoice" WHERE "organizationId" LIKE 'test-org-repo-%'`;
    } catch {
      // Cleanup best effort
    }
  });

  it("creates a new invoice", async () => {
    const input = {
      organizationId: testOrgId,
      number: "REPO-001",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR",
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const result = await repository.create(input);

    expect(result.id).toBeDefined();
    expect(result.number).toBe("REPO-001");
    expect(result.organizationId).toBe(testOrgId);
    expect(result.status).toBe("DRAFT");
  });

  it("finds an invoice by ID", async () => {
    const input = {
      organizationId: testOrgId,
      number: "REPO-002",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR",
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const created = await repository.create(input);
    const result = await repository.findById(created.id);

    expect(result).toBeDefined();
    expect(result!.id).toBe(created.id);
    expect(result!.number).toBe("REPO-002");
  });

  it("returns null when invoice not found", async () => {
    const result = await repository.findById("non-existent-id");
    expect(result).toBeNull();
  });

  it("updates an invoice and synchronizes number in the payload", async () => {
    const input = {
      organizationId: testOrgId,
      number: "REPO-003",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR",
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const created = await repository.create(input);

    const updateInput = {
      id: created.id,
      number: "REPO-003-UPDATED",
      status: "FINALIZED" as const,
    };

    const result = await repository.update(updateInput);

    expect(result.number).toBe("REPO-003-UPDATED");
    expect(result.status).toBe("FINALIZED");
    const domainInvoice = repository.toDomainInvoice(result);
    expect(domainInvoice.number).toBe("REPO-003-UPDATED");
  });

  it("converts Prisma invoice to domain invoice", () => {
    const mockPrismaInvoice = {
      id: "test-id",
      payload: {
        id: "draft-1",
        number: "INV-2026-001",
        seller: { name: "Test Seller" },
        buyer: { name: "Test Buyer" },
        lines: [],
      },
      status: "DRAFT",
    } as any;

    const result = repository.toDomainInvoice(mockPrismaInvoice);

    expect(result).toEqual({
      id: "draft-1",
      number: "INV-2026-001",
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      lines: [],
    });
  });
});