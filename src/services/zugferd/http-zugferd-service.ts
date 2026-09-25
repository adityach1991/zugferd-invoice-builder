import { z } from "zod";
import { invoiceInputSchema, type InvoiceInputDto } from "@/src/schemas/invoice";
import {
  extractInvoiceRequestSchema,
  extractInvoiceResponseSchema,
  generateHybridPdfRequestSchema,
  generateHybridPdfResponseSchema,
  generateXmlRequestSchema,
  generateXmlResponseSchema,
  validateInvoiceRequestSchema,
  validateInvoiceResponseSchema,
  type ZugferdProfile,
} from "@/src/schemas/zugferd-worker";
import type { ZugferdService } from "./zugferd-service";
import {
  ZugferdError,
  ZugferdUnavailableError,
  ZugferdValidationError,
  type ExtractedInvoice,
  type HybridPdfResult,
  type ServiceValidationResult,
  type XmlResult,
} from "./types";

const errorResponseSchema = z.object({
  error: z.string(),
  issues: z
    .array(z.object({ ruleId: z.string().nullable(), severity: z.enum(["info", "warning", "error"]), message: z.string() }))
    .nullable()
    .optional(),
});

function decodeXml(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * HTTP adapter to the C# ZUGFeRD worker. Requests and responses are
 * validated with the boundary schemas on both sides of the wire; worker
 * failures map to typed ZugferdError subclasses.
 */
export class HttpZugferdService implements ZugferdService {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  private async post<TReq, TRes>(
    path: string,
    request: TReq,
    responseSchema: z.ZodType<TRes>,
  ): Promise<TRes> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ZugferdUnavailableError(
        `ZUGFeRD worker unreachable at ${this.baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const body: unknown = await response.json().catch(() => null);

    if (response.status === 422) {
      const parsed = errorResponseSchema.safeParse(body);
      throw new ZugferdValidationError(parsed.success ? (parsed.data.issues ?? []) : []);
    }
    if (!response.ok) {
      const parsed = errorResponseSchema.safeParse(body);
      throw new ZugferdError(
        `ZUGFeRD worker error (HTTP ${response.status}): ${parsed.success ? parsed.data.error : "unknown"}`,
      );
    }
    return responseSchema.parse(body);
  }

  async generateXml(invoice: InvoiceInputDto, profile: ZugferdProfile): Promise<XmlResult> {
    const request = generateXmlRequestSchema.parse({ profile, invoice: invoiceInputSchema.parse(invoice) });
    const response = await this.post("/zugferd/xml", request, generateXmlResponseSchema);
    return { xml: decodeXml(response.xmlBase64), engine: response.engine, engineVersion: response.engineVersion };
  }

  async generateHybridPdf(
    invoice: InvoiceInputDto,
    carrierPdf: Uint8Array,
    profile: ZugferdProfile,
  ): Promise<HybridPdfResult> {
    const request = generateHybridPdfRequestSchema.parse({
      profile,
      invoice: invoiceInputSchema.parse(invoice),
      carrierPdfBase64: Buffer.from(carrierPdf).toString("base64"),
    });
    const response = await this.post("/zugferd/hybrid-pdf", request, generateHybridPdfResponseSchema);
    return {
      pdf: new Uint8Array(Buffer.from(response.pdfBase64, "base64")),
      xml: decodeXml(response.xmlBase64),
      embeddedFileName: response.embeddedFileName,
      engine: response.engine,
      engineVersion: response.engineVersion,
    };
  }

  async extractInvoice(pdf: Uint8Array): Promise<ExtractedInvoice> {
    const request = extractInvoiceRequestSchema.parse({ pdfBase64: Buffer.from(pdf).toString("base64") });
    const response = await this.post("/zugferd/extract", request, extractInvoiceResponseSchema);
    return { invoice: response.invoice, syntax: response.syntax, profile: response.profile };
  }

  async validate(invoice: InvoiceInputDto, profile: ZugferdProfile): Promise<ServiceValidationResult> {
    const request = validateInvoiceRequestSchema.parse({ profile, invoice: invoiceInputSchema.parse(invoice) });
    return this.post("/zugferd/validate", request, validateInvoiceResponseSchema);
  }
}
