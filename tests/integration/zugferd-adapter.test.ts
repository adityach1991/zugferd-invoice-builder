import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HttpZugferdService } from "@/src/services/zugferd/http-zugferd-service";
import { ZugferdValidationError } from "@/src/services/zugferd";
import type { InvoiceInputDto } from "@/src/schemas/invoice";
import fixture from "../fixtures/zugferd/valid/poc-facturx-basic/canonical-invoice.json";

/**
 * Proves the boundary end to end:
 * canonical invoice fixture -> ZUGFeRD adapter -> C# worker.
 * Requires the worker (workers/zugferd-dotnet) on ZUGFERD_WORKER_URL
 * (default http://localhost:5100); skips cleanly when it is not running.
 */

const WORKER_URL = process.env.ZUGFERD_WORKER_URL ?? "http://localhost:5100";
const service = new HttpZugferdService(WORKER_URL, 30000);

const invoice = {
  ...fixture,
  payment: { means: "SEPA_CREDIT_TRANSFER", iban: fixture.payment.iban, terms: fixture.payment.terms },
} as InvoiceInputDto;

async function workerReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

let reachable = false;

beforeAll(async () => {
  reachable = await workerReachable();
  if (!reachable) {
    console.warn(`ZUGFeRD worker not reachable at ${WORKER_URL}; integration test skipped.`);
  }
});

describe("ZUGFeRD adapter -> C# worker", () => {
  it("generates CII XML from the canonical fixture", async () => {
    if (!reachable) return;
    const result = await service.generateXml(invoice, "FACTURX_BASIC");
    expect(result.engine).toBe("Balsoft.Hive.EInvoice");
    expect(result.xml).toContain("CrossIndustryInvoice");
    expect(result.xml).toContain("INV-2026-0001");
    expect(result.xml.length).toBeGreaterThan(1000);
  });

  it("generates a hybrid PDF and extracts the same invoice back", async () => {
    if (!reachable) return;
    const carrierPdf = new Uint8Array(
      readFileSync("tests/fixtures/zugferd/valid/poc-facturx-basic/carrier.pdf"),
    );

    const hybrid = await service.generateHybridPdf(invoice, carrierPdf, "FACTURX_BASIC");
    expect(hybrid.embeddedFileName).toBe("factur-x.xml");
    expect(hybrid.pdf.length).toBeGreaterThan(carrierPdf.length);
    expect(hybrid.xml).toContain("INV-2026-0001");

    const extracted = await service.extractInvoice(hybrid.pdf);
    expect(extracted.invoice.number).toBe(fixture.number);
    expect(extracted.invoice.seller.name).toBe(fixture.seller.name);
    expect(extracted.invoice.buyer.name).toBe(fixture.buyer.name);
    expect(extracted.profile).toBe("FACTURX_BASIC");
    expect(extracted.syntax).toBe("Cii");
  });

  it("validates the fixture invoice as valid", async () => {
    if (!reachable) return;
    const result = await service.validate(invoice, "FACTURX_BASIC");
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("maps worker 422 responses to ZugferdValidationError with issues", async () => {
    if (!reachable) return;
    // Passes the local boundary schema but violates XRechnung rules
    // (BR-DE-15: buyer reference is mandatory), so the worker's
    // pre-validation rejects generation with HTTP 422.
    await expect(service.generateXml(invoice, "XRECHNUNG")).rejects.toBeInstanceOf(
      ZugferdValidationError,
    );
    try {
      await service.generateXml(invoice, "XRECHNUNG");
    } catch (error) {
      expect(error).toBeInstanceOf(ZugferdValidationError);
      const issues = (error as ZugferdValidationError).issues;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i) => i.ruleId === "BR-DE-15")).toBe(true);
    }
  });
});
