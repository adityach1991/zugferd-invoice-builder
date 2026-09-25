import { z } from "zod";
import { invoiceInputSchema } from "./invoice";

/**
 * Application-level contract between the TypeScript application and the
 * C# ZUGFeRD worker (ARCHITECTURE.md section 10, ADR-003).
 *
 * The contract intentionally contains no Balsoft, CII, PDFsharp, or PDF/A
 * types: only the canonical invoice DTO, a profile enum, base64 payloads,
 * and structured results. The worker maps this contract to the compliance
 * library internally.
 */

export const zugferdProfileSchema = z.enum([
  "FACTURX_MINIMUM",
  "FACTURX_BASIC_WL",
  "FACTURX_BASIC",
  "EN16931",
  "FACTURX_EXTENDED",
  "XRECHNUNG",
]);
export type ZugferdProfile = z.infer<typeof zugferdProfileSchema>;

const base64 = z.string().min(1);

// --- POST /zugferd/xml ---
export const generateXmlRequestSchema = z.object({
  profile: zugferdProfileSchema,
  invoice: invoiceInputSchema,
});
export const generateXmlResponseSchema = z.object({
  xmlBase64: base64,
  engine: z.string(),
  engineVersion: z.string(),
});
export type GenerateXmlRequest = z.infer<typeof generateXmlRequestSchema>;
export type GenerateXmlResponse = z.infer<typeof generateXmlResponseSchema>;

// --- POST /zugferd/hybrid-pdf ---
export const generateHybridPdfRequestSchema = z.object({
  profile: zugferdProfileSchema,
  invoice: invoiceInputSchema,
  carrierPdfBase64: base64,
});
export const generateHybridPdfResponseSchema = z.object({
  pdfBase64: base64,
  xmlBase64: base64,
  embeddedFileName: z.string(),
  engine: z.string(),
  engineVersion: z.string(),
});
export type GenerateHybridPdfRequest = z.infer<typeof generateHybridPdfRequestSchema>;
export type GenerateHybridPdfResponse = z.infer<typeof generateHybridPdfResponseSchema>;

// --- POST /zugferd/extract ---
export const extractInvoiceRequestSchema = z.object({
  pdfBase64: base64,
});
export const extractInvoiceResponseSchema = z.object({
  invoice: invoiceInputSchema,
  syntax: z.string(),
  profile: z.string(),
});
export type ExtractInvoiceRequest = z.infer<typeof extractInvoiceRequestSchema>;
export type ExtractInvoiceResponse = z.infer<typeof extractInvoiceResponseSchema>;

// --- POST /zugferd/validate ---
export const validateInvoiceRequestSchema = z.object({
  profile: zugferdProfileSchema,
  invoice: invoiceInputSchema,
});
export const validationIssueSchema = z.object({
  ruleId: z.string().nullable(),
  severity: z.enum(["info", "warning", "error"]),
  message: z.string(),
});
export const validateInvoiceResponseSchema = z.object({
  valid: z.boolean(),
  issues: z.array(validationIssueSchema),
});
export type ValidateInvoiceRequest = z.infer<typeof validateInvoiceRequestSchema>;
export type ValidateInvoiceResponse = z.infer<typeof validateInvoiceResponseSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;

// --- GET /health ---
export const workerHealthSchema = z.object({
  status: z.literal("ok"),
  engine: z.string(),
  engineVersion: z.string(),
});
export type WorkerHealth = z.infer<typeof workerHealthSchema>;
