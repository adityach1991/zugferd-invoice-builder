#!/usr/bin/env node
/** Smoke check: exercise every worker endpoint with the compliance fixture. */
import fs from "node:fs";

const fixture = JSON.parse(
  fs.readFileSync("tests/fixtures/zugferd/valid/poc-facturx-basic/canonical-invoice.json", "utf8"),
);
const invoice = {
  ...fixture,
  payment: { means: "SEPA_CREDIT_TRANSFER", iban: fixture.payment.iban, terms: fixture.payment.terms },
};

const base = process.env.ZUGFERD_WORKER_URL ?? "http://localhost:5100";

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const xml = await post("/zugferd/xml", { profile: "FACTURX_BASIC", invoice });
console.log("XML:", xml.status, "bytes:", xml.body.xmlBase64?.length, "engine:", xml.body.engine);

const carrierPdfBase64 = fs
  .readFileSync("tests/fixtures/zugferd/valid/poc-facturx-basic/carrier.pdf")
  .toString("base64");
const pdf = await post("/zugferd/hybrid-pdf", { profile: "FACTURX_BASIC", invoice, carrierPdfBase64 });
console.log("PDF:", pdf.status, "bytes:", pdf.body.pdfBase64?.length, "embedded:", pdf.body.embeddedFileName);

const extract = await post("/zugferd/extract", { pdfBase64: pdf.body.pdfBase64 });
console.log(
  "Extract:",
  extract.status,
  "number:", extract.body.invoice?.number,
  "seller:", extract.body.invoice?.seller?.name,
  "buyer:", extract.body.invoice?.buyer?.name,
  "profile:", extract.body.profile,
  "syntax:", extract.body.syntax,
);

const validate = await post("/zugferd/validate", { profile: "FACTURX_BASIC", invoice });
console.log("Validate:", validate.status, JSON.stringify(validate.body));

if (xml.status !== 200 || pdf.status !== 200 || extract.status !== 200 || validate.status !== 200) {
  console.error("SMOKE FAILED");
  process.exit(1);
}
console.log("SMOKE OK");
