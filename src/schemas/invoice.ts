import { z } from "zod";

/**
 * Boundary schema for invoice creation requests (API input) and for the
 * canonical invoice DTO exchanged with the ZUGFeRD worker. The server is
 * authoritative: anything crossing a process or network boundary is parsed
 * with these schemas before entering the domain (AGENTS.md section 4).
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const countryCode = z.string().length(2).toUpperCase();
const minorUnits = z.number().int();

export const addressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  postalCode: z.string().min(1).max(20),
  city: z.string().min(1).max(100),
  country: countryCode,
});

export const contactSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
});

export const partySchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  address: addressSchema,
  vatId: z.string().max(30).optional(),
  taxNumber: z.string().max(30).optional(),
  contact: contactSchema.optional(),
});

export const paymentSchema = z.object({
  means: z.enum(["SEPA_CREDIT_TRANSFER", "SEPA_DIRECT_DEBIT", "CARD", "CASH", "OTHER"]),
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  reference: z.string().max(140).optional(),
  terms: z.string().max(500).optional(),
});

export const invoiceLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.enum(["HUR", "DAY", "PCE", "MON", "KGM", "MTR", "MTK", "LS"]),
  unitPriceMinor: minorUnits.nonnegative(),
  vatRatePercent: z.number().min(0).max(100),
});

export const invoiceInputSchema = z.object({
  id: z.string().min(1).max(64),
  number: z.string().min(1).max(50),
  issueDate: isoDate,
  dueDate: isoDate,
  currency: z.enum(["EUR", "USD", "GBP", "CHF"]),
  seller: partySchema,
  buyer: partySchema,
  payment: paymentSchema,
  lines: z.array(invoiceLineSchema).min(1).max(500),
});

export type InvoiceInputDto = z.infer<typeof invoiceInputSchema>;
