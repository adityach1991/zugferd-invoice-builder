import type { ValidationIssue, ZugferdProfile } from "@/src/schemas/zugferd-worker";
import type { InvoiceInputDto } from "@/src/schemas/invoice";

export interface XmlResult {
  /** CII XML as UTF-8 text. */
  xml: string;
  engine: string;
  engineVersion: string;
}

export interface HybridPdfResult {
  pdf: Uint8Array;
  /** The CII XML embedded in the PDF, as UTF-8 text. */
  xml: string;
  embeddedFileName: string;
  engine: string;
  engineVersion: string;
}

export interface ExtractedInvoice {
  invoice: InvoiceInputDto;
  syntax: string;
  profile: string;
}

export interface ServiceValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export class ZugferdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZugferdError";
  }
}

/** The worker is unreachable or timed out. */
export class ZugferdUnavailableError extends ZugferdError {
  constructor(message: string) {
    super(message);
    this.name = "ZugferdUnavailableError";
  }
}

/** The worker rejected the invoice: HTTP 422 with structured issues. */
export class ZugferdValidationError extends ZugferdError {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(`ZUGFeRD validation failed: ${issues.map((i) => i.message).join("; ")}`);
    this.name = "ZugferdValidationError";
    this.issues = issues;
  }
}

export type { ZugferdProfile };
