import { describe, expect, it } from "vitest";
import { invoiceInputSchema } from "@/src/schemas/invoice";
import {
  generateHybridPdfRequestSchema,
  validateInvoiceResponseSchema,
} from "@/src/schemas/zugferd-worker";
import fixture from "../../fixtures/zugferd/valid/poc-facturx-basic/canonical-invoice.json";

const validInvoice = {
  ...fixture,
  payment: { means: "SEPA_CREDIT_TRANSFER", iban: fixture.payment.iban, terms: fixture.payment.terms },
  lines: fixture.lines.map((l) => ({ ...l, unit: "HUR" })),
};

describe("invoiceInputSchema", () => {
  it("accepts the compliance fixture invoice", () => {
    const result = invoiceInputSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("rejects an invoice without lines", () => {
    const result = invoiceInputSchema.safeParse({ ...validInvoice, lines: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a negative unit price", () => {
    const result = invoiceInputSchema.safeParse({
      ...validInvoice,
      lines: [{ ...validInvoice.lines[0], unitPriceMinor: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = invoiceInputSchema.safeParse({ ...validInvoice, issueDate: "25.09.2026" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid country code", () => {
    const result = invoiceInputSchema.safeParse({
      ...validInvoice,
      seller: { ...validInvoice.seller, address: { ...validInvoice.seller.address, country: "DEU" } },
    });
    expect(result.success).toBe(false);
  });
});

describe("worker contract schemas", () => {
  it("accepts a valid hybrid-pdf request", () => {
    const result = generateHybridPdfRequestSchema.safeParse({
      profile: "FACTURX_BASIC",
      invoice: validInvoice,
      carrierPdfBase64: Buffer.from("pdf").toString("base64"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown profile", () => {
    const result = generateHybridPdfRequestSchema.safeParse({
      profile: "FACTURX_TURBO",
      invoice: validInvoice,
      carrierPdfBase64: Buffer.from("pdf").toString("base64"),
    });
    expect(result.success).toBe(false);
  });

  it("parses a worker validation response", () => {
    const result = validateInvoiceResponseSchema.safeParse({
      valid: false,
      issues: [{ ruleId: "BR-DE-15", severity: "error", message: "Buyer reference required" }],
    });
    expect(result.success).toBe(true);
  });
});
