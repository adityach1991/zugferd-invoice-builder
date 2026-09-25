import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { InvoiceService } from "@/src/services/invoice/invoice-service";
import { db } from "@/src/repositories/db";

describe("InvoiceService", () => {
  let service: InvoiceService;
  let testOrgId: string;

  beforeAll(async () => {
    service = new InvoiceService();
    // Create a test organization for our tests
    testOrgId = "test-org-" + Date.now();
    try {
      await db.$executeRaw`INSERT INTO "Organization" (id, name, "createdAt", "updatedAt") VALUES (${testOrgId}, 'Test Org', NOW(), NOW()) ON CONFLICT DO NOTHING`;
    } catch {
      // Organization might already exist, that's fine
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.$executeRaw`DELETE FROM "Invoice" WHERE "organizationId" LIKE 'test-org-%'`;
    } catch {
      // Cleanup failed, that's ok
    }
  });

  it("creates a new invoice draft", async () => {
    const input = {
      organizationId: testOrgId,
      number: "SERVICE-001",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const result = await service.createDraft(input);

    expect(result.id).toBeDefined();
    expect(result.number).toBe("SERVICE-001");
    expect(result.status).toBe("DRAFT");
  });

  it("gets an invoice draft by ID", async () => {
    // First create a draft
    const createInput = {
      organizationId: testOrgId,
      number: "SERVICE-002",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const created = await service.createDraft(createInput);
    
    // Then get it
    const result = await service.getDraft(created.id);

    expect(result.id).toBe(created.id);
    expect(result.number).toBe("SERVICE-002");
  });

  it("throws error when getting non-existent draft", async () => {
    await expect(service.getDraft("non-existent-id"))
      .rejects
      .toThrow("Invoice with id non-existent-id not found");
  });

  it("updates an invoice draft", async () => {
    // First create a draft
    const createInput = {
      organizationId: testOrgId,
      number: "SERVICE-003",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const created = await service.createDraft(createInput);
    
    // Then update it
    const updateInput = {
      id: created.id,
      number: "SERVICE-003-UPDATED",
    };

    const result = await service.updateDraft(updateInput);

    expect(result.number).toBe("SERVICE-003-UPDATED");
  });

  it("adds a line item to a draft", async () => {
    // First create a draft
    const createInput = {
      organizationId: testOrgId,
      number: "SERVICE-004",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const created = await service.createDraft(createInput);
    
    // Then add a line item
    const lineItem = {
      description: "Test Product",
      quantity: 2,
      unit: "PCE" as const,
      unitPriceMinor: 10000, // 100.00 EUR in minor units
      vatRatePercent: 19,
    };

    const result = await service.addLineItem({
      draftId: created.id,
      line: lineItem,
    });

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].description).toBe("Test Product");
  });

  it("lists invoices for an organization", async () => {
    // Create a couple of invoices
    const createInput1 = {
      organizationId: testOrgId,
      number: "SERVICE-005",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    const createInput2 = {
      organizationId: testOrgId,
      number: "SERVICE-006",
      issueDate: "2026-09-25",
      dueDate: "2026-10-25",
      currency: "EUR" as const,
      seller: { name: "Test Seller" },
      buyer: { name: "Test Buyer" },
      payment: { means: "SEPA_CREDIT_TRANSFER" },
      lines: [],
    };

    await service.createDraft(createInput1);
    await service.createDraft(createInput2);

    const result = await service.listByOrganization(testOrgId);

    expect(result.length).toBeGreaterThanOrEqual(2);
    const numbers = result.map(invoice => invoice.number);
    expect(numbers).toContain("SERVICE-005");
    expect(numbers).toContain("SERVICE-006");
  });
});