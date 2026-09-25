import { describe, expect, it } from "vitest";
import { createInvoice } from "@/src/domain/invoice";
import type { InvoiceInput } from "@/src/domain/invoice";
import fixture from "../../fixtures/zugferd/valid/poc-facturx-basic/canonical-invoice.json";

function fixtureInput(): InvoiceInput {
  return {
    id: fixture.id,
    number: fixture.number,
    issueDate: fixture.issueDate,
    dueDate: fixture.dueDate,
    currency: fixture.currency as InvoiceInput["currency"],
    seller: fixture.seller,
    buyer: fixture.buyer,
    payment: {
      means: fixture.payment.means as InvoiceInput["payment"]["means"],
      iban: fixture.payment.iban,
      terms: fixture.payment.terms,
    },
    lines: fixture.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unit: l.unit as InvoiceInput["lines"][number]["unit"],
      unitPriceMinor: l.unitPriceMinor,
      vatRatePercent: l.vatRatePercent,
    })),
  };
}

describe("createInvoice", () => {
  it("calculates line and document totals for the compliance fixture", () => {
    const invoice = createInvoice(fixtureInput());

    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lines[0].id).toBe("1");
    expect(invoice.lines[0].netMinor).toBe(85000);
    expect(invoice.lines[0].vatMinor).toBe(16150);
    expect(invoice.lines[0].grossMinor).toBe(101150);

    expect(invoice.totals.netMinor).toBe(fixture.totals.netMinor);
    expect(invoice.totals.vatMinor).toBe(fixture.totals.vatMinor);
    expect(invoice.totals.grossMinor).toBe(fixture.totals.grossMinor);
  });

  it("aggregates the VAT breakdown per rate", () => {
    const input = fixtureInput();
    input.lines.push({
      description: "Hosting",
      quantity: 12,
      unit: "MON",
      unitPriceMinor: 1000,
      vatRatePercent: 19,
    });
    input.lines.push({
      description: "Reduced-rate item",
      quantity: 2,
      unit: "PCE",
      unitPriceMinor: 500,
      vatRatePercent: 7,
    });

    const invoice = createInvoice(input);

    expect(invoice.totals.vatBreakdown).toEqual([
      { ratePercent: 7, netMinor: 1000, vatMinor: 70 },
      { ratePercent: 19, netMinor: 97000, vatMinor: 18430 },
    ]);
    expect(invoice.totals.netMinor).toBe(98000);
    expect(invoice.totals.vatMinor).toBe(18500);
    expect(invoice.totals.grossMinor).toBe(116500);
  });

  it("assigns sequential line ids", () => {
    const input = fixtureInput();
    input.lines.push({
      description: "Second line",
      quantity: 1,
      unit: "PCE",
      unitPriceMinor: 100,
      vatRatePercent: 0,
    });
    const invoice = createInvoice(input);
    expect(invoice.lines.map((l) => l.id)).toEqual(["1", "2"]);
  });
});
