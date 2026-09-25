import type { InvoiceInputDto } from "@/src/schemas/invoice";
import type {
  ExtractedInvoice,
  HybridPdfResult,
  ServiceValidationResult,
  XmlResult,
  ZugferdProfile,
} from "./types";

/**
 * Application-level boundary to the ZUGFeRD implementation (ADR-003).
 * The rest of the application depends only on this interface; the
 * compliance engine (currently the C# worker over HTTP) can be replaced
 * or versioned independently (ARCHITECTURE.md section 10).
 */
export interface ZugferdService {
  generateXml(invoice: InvoiceInputDto, profile: ZugferdProfile): Promise<XmlResult>;

  generateHybridPdf(
    invoice: InvoiceInputDto,
    carrierPdf: Uint8Array,
    profile: ZugferdProfile,
  ): Promise<HybridPdfResult>;

  extractInvoice(pdf: Uint8Array): Promise<ExtractedInvoice>;

  validate(invoice: InvoiceInputDto, profile: ZugferdProfile): Promise<ServiceValidationResult>;
}
