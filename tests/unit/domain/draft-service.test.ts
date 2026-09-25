import { describe, it, expect } from "vitest";
import { DraftInvoiceService } from "@/src/domain/invoice/draft-service";
import type { InvoiceInput } from "@/src/domain/invoice/types";

describe("DraftInvoiceService", () => {
  const service = new DraftInvoiceService();

  const baseInvoiceInput: InvoiceInput = {
    id: "draft-1",
    number: "INV-2026-001",
    issueDate: "2026-09-25",
    dueDate: "2026-10-25",
    currency: "EUR",
    seller: {
      name: "Test Seller",
      address: {
        line1: "123 Seller St",
        postalCode: "12345",
        city: "Seller City",
        country: "DE",
      },
    },
    buyer: {
      name: "Test Buyer",
      address: {
        line1: "456 Buyer Ave",
        postalCode: "67890",
        city: "Buyer City",
        country: "DE",
      },
    },
    payment: {
      means: "SEPA_CREDIT_TRANSFER",
    },
    lines: [],
  };

  it("creates a new draft invoice", () => {
    const draft = service.createDraft(baseInvoiceInput);
    
    expect(draft.id).toBe(baseInvoiceInput.id);
    expect(draft.number).toBe(baseInvoiceInput.number);
    expect(draft.status).toBe("DRAFT");
    expect(draft.lines).toHaveLength(0);
    expect(draft.totals.netMinor).toBe(0);
    expect(draft.totals.vatMinor).toBe(0);
    expect(draft.totals.grossMinor).toBe(0);
  });

  it("adds a line item to a draft", () => {
    const draft = service.createDraft(baseInvoiceInput);
    
    const updatedDraft = service.addLineItem(draft, {
      description: "Consulting Services",
      quantity: 10,
      unit: "HUR",
      unitPriceMinor: 8500, // 85.00 EUR
      vatRatePercent: 19,
    });

    expect(updatedDraft.lines).toHaveLength(1);
    expect(updatedDraft.lines[0].description).toBe("Consulting Services");
    expect(updatedDraft.lines[0].netMinor).toBe(85000); // 10 * 85.00
    expect(updatedDraft.lines[0].vatMinor).toBe(16150); // 850.00 * 19%
    expect(updatedDraft.lines[0].grossMinor).toBe(101150); // 850.00 + 161.50
    
    expect(updatedDraft.totals.netMinor).toBe(85000);
    expect(updatedDraft.totals.vatMinor).toBe(16150);
    expect(updatedDraft.totals.grossMinor).toBe(101150);
  });

  it("updates a line item in a draft", () => {
    const draft = service.createDraft(baseInvoiceInput);
    const draftWithLine = service.addLineItem(draft, {
      description: "Original Service",
      quantity: 5,
      unit: "HUR",
      unitPriceMinor: 5000, // 50.00 EUR
      vatRatePercent: 19,
    });

    const updatedDraft = service.updateLineItem(draftWithLine, "1", {
      description: "Updated Service",
      quantity: 8,
    });

    expect(updatedDraft.lines[0].description).toBe("Updated Service");
    expect(updatedDraft.lines[0].quantity).toBe(8);
    expect(updatedDraft.lines[0].netMinor).toBe(40000); // 8 * 50.00
    expect(updatedDraft.lines[0].vatMinor).toBe(7600); // 400.00 * 19%
    expect(updatedDraft.lines[0].grossMinor).toBe(47600); // 400.00 + 76.00
  });

  it("removes a line item from a draft", () => {
    const draft = service.createDraft(baseInvoiceInput);
    const draftWithLines = service.addLineItem(draft, {
      description: "Service 1",
      quantity: 1,
      unit: "PCE",
      unitPriceMinor: 10000, // 100.00 EUR
      vatRatePercent: 19,
    });

    const finalDraft = service.removeLineItem(draftWithLines, "1");

    expect(finalDraft.lines).toHaveLength(0);
    expect(finalDraft.totals.netMinor).toBe(0);
    expect(finalDraft.totals.vatMinor).toBe(0);
    expect(finalDraft.totals.grossMinor).toBe(0);
  });

  it("handles multiple line items with different VAT rates", () => {
    const draft = service.createDraft(baseInvoiceInput);
    
    const draftWithFirstLine = service.addLineItem(draft, {
      description: "Standard Rate Service",
      quantity: 1,
      unit: "PCE",
      unitPriceMinor: 10000, // 100.00 EUR
      vatRatePercent: 19,
    });

    const draftWithBothLines = service.addLineItem(draftWithFirstLine, {
      description: "Reduced Rate Service",
      quantity: 1,
      unit: "PCE",
      unitPriceMinor: 5000, // 50.00 EUR
      vatRatePercent: 7,
    });

    expect(draftWithBothLines.lines).toHaveLength(2);
    expect(draftWithBothLines.totals.vatBreakdown).toHaveLength(2);
    
    // Check VAT breakdown entries are sorted by rate
    expect(draftWithBothLines.totals.vatBreakdown[0].ratePercent).toBe(7);
    expect(draftWithBothLines.totals.vatBreakdown[0].netMinor).toBe(5000);
    expect(draftWithBothLines.totals.vatBreakdown[0].vatMinor).toBe(350); // 50.00 * 7%
    
    expect(draftWithBothLines.totals.vatBreakdown[1].ratePercent).toBe(19);
    expect(draftWithBothLines.totals.vatBreakdown[1].netMinor).toBe(10000);
    expect(draftWithBothLines.totals.vatBreakdown[1].vatMinor).toBe(1900); // 100.00 * 19%
    
    expect(draftWithBothLines.totals.netMinor).toBe(15000); // 100.00 + 50.00
    expect(draftWithBothLines.totals.vatMinor).toBe(2250); // 19.00 + 3.50
    expect(draftWithBothLines.totals.grossMinor).toBe(17250); // 150.00 + 22.50
  });

  it("updates draft metadata", () => {
    const draft = service.createDraft(baseInvoiceInput);
    
    const updatedDraft = service.updateDraft(draft, {
      id: "draft-1",
      number: "INV-2026-002",
      seller: {
        name: "Updated Seller Name",
        address: draft.seller.address,
      },
    });

    expect(updatedDraft.number).toBe("INV-2026-002");
    expect(updatedDraft.seller.name).toBe("Updated Seller Name");
  });
});