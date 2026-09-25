import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HttpZugferdService } from "@/src/services/zugferd/http-zugferd-service";
import type { InvoiceInputDto } from "@/src/schemas/invoice";
import fixture from "../fixtures/zugferd/valid/poc-facturx-basic/canonical-invoice.json";
import manifest from "../fixtures/zugferd/valid/poc-facturx-basic/manifest.json";

/**
 * Compliance regression fixture (ADR-031): the outputs of the passing
 * technology POC are version-controlled and must remain consistent.
 * - Every fixture file must match its recorded sha256.
 * - The XML extracted from the hybrid PDF must equal the generated XML.
 * - When the worker is running, regenerating from the canonical input
 *   must reproduce the preserved XML byte-for-byte.
 */

const FIXTURE_DIR = "tests/fixtures/zugferd/valid/poc-facturx-basic";
const WORKER_URL = process.env.ZUGFERD_WORKER_URL ?? "http://localhost:5100";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

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
});

describe("compliance regression fixture", () => {
  it("all fixture files match the manifest sha256 checksums", () => {
    for (const [file, expected] of Object.entries(manifest.files)) {
      expect(sha256(join(FIXTURE_DIR, file)), file).toBe(expected);
    }
  });

  it("extracted XML is byte-identical to the generated XML", () => {
    const generated = readFileSync(join(FIXTURE_DIR, "invoice-facturx-basic.xml"));
    const extracted = readFileSync(join(FIXTURE_DIR, "invoice-facturx-basic-extracted.xml"));
    expect(extracted.equals(generated)).toBe(true);
  });

  it("the external validation reports record a passing result", () => {
    const verapdf = readFileSync(join(FIXTURE_DIR, "verapdf-validation.xml"), "utf8");
    expect(verapdf).toContain('isCompliant="true"');
    const mustang = readFileSync(join(FIXTURE_DIR, "mustang-validation.xml"), "utf8");
    expect(mustang).toContain('<summary status="valid"/>');
  });

  it("regenerating from the canonical input reproduces the preserved XML", async () => {
    if (!reachable) {
      console.warn(`worker not reachable at ${WORKER_URL}; regeneration check skipped`);
      return;
    }
    const service = new HttpZugferdService(WORKER_URL, 30000);
    const invoice = {
      ...fixture,
      payment: { means: "SEPA_CREDIT_TRANSFER", iban: fixture.payment.iban, terms: fixture.payment.terms },
    } as InvoiceInputDto;
    const result = await service.generateXml(invoice, "FACTURX_BASIC");
    const preserved = readFileSync(join(FIXTURE_DIR, "invoice-facturx-basic.xml"), "utf8");
    expect(result.xml).toBe(preserved);
  });
});
