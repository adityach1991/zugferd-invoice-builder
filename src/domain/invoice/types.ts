import type { MinorUnits } from "./money";

/**
 * Canonical invoice domain model (ARCHITECTURE.md section 7, ADR-002).
 * Independent of ZUGFeRD/CII/XML: no business-term numbers, no XML types.
 * All invoice creation paths (manual form, AI draft, future API) converge
 * on this model before any rendering or packaging happens.
 */

/** UN/ECE Recommendation 20 unit codes (subset; extend as needed). */
export type UnitCode = "HUR" | "DAY" | "PCE" | "MON" | "KGM" | "MTR" | "MTK" | "LS";

export type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF";

export interface Address {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2, e.g. "DE". */
  country: string;
}

export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Party {
  name: string;
  legalName?: string;
  address: Address;
  vatId?: string;
  taxNumber?: string;
  contact?: Contact;
}

export type PaymentMeans = "SEPA_CREDIT_TRANSFER" | "SEPA_DIRECT_DEBIT" | "CARD" | "CASH" | "OTHER";

export interface Payment {
  means: PaymentMeans;
  iban?: string;
  bic?: string;
  reference?: string;
  terms?: string;
}

export interface InvoiceLineInput {
  description: string;
  /** Decimal quantity, e.g. 10 or 2.5. */
  quantity: number;
  unit: UnitCode;
  unitPriceMinor: MinorUnits;
  /** VAT rate in percent, e.g. 19 or 7 or 0. */
  vatRatePercent: number;
}

export interface InvoiceLine extends InvoiceLineInput {
  id: string;
  netMinor: MinorUnits;
  vatMinor: MinorUnits;
  grossMinor: MinorUnits;
}

export interface VatBreakdownEntry {
  ratePercent: number;
  netMinor: MinorUnits;
  vatMinor: MinorUnits;
}

export interface InvoiceTotals {
  netMinor: MinorUnits;
  vatMinor: MinorUnits;
  grossMinor: MinorUnits;
  vatBreakdown: VatBreakdownEntry[];
}

export interface InvoiceInput {
  id: string;
  number: string;
  /** ISO 8601 date, e.g. "2026-09-25". */
  issueDate: string;
  /** ISO 8601 date. */
  dueDate: string;
  currency: CurrencyCode;
  seller: Party;
  buyer: Party;
  payment: Payment;
  lines: InvoiceLineInput[];
}

export interface Invoice extends Omit<InvoiceInput, "lines"> {
  lines: InvoiceLine[];
  totals: InvoiceTotals;
}
