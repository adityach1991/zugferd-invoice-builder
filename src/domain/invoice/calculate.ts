import { applyRatePercent, multiplyMinor } from "./money";
import type {
  Invoice,
  InvoiceInput,
  InvoiceLine,
  InvoiceLineInput,
  InvoiceTotals,
  VatBreakdownEntry,
} from "./types";

/**
 * Invoice calculation following the EN 16931 aggregation model:
 * line net = quantity x unit price (rounded per line),
 * VAT is aggregated per rate and rounded per rate group,
 * gross = net + VAT.
 */

export function calculateLine(line: InvoiceLineInput, id: string): InvoiceLine {
  const netMinor = multiplyMinor(line.unitPriceMinor, line.quantity);
  const vatMinor = applyRatePercent(netMinor, line.vatRatePercent);
  return {
    ...line,
    id,
    netMinor,
    vatMinor,
    grossMinor: netMinor + vatMinor,
  };
}

export function calculateTotals(lines: InvoiceLine[]): InvoiceTotals {
  const netMinor = lines.reduce((sum, l) => sum + l.netMinor, 0);

  const byRate = new Map<number, VatBreakdownEntry>();
  for (const line of lines) {
    const entry = byRate.get(line.vatRatePercent) ?? {
      ratePercent: line.vatRatePercent,
      netMinor: 0,
      vatMinor: 0,
    };
    entry.netMinor += line.netMinor;
    entry.vatMinor += line.vatMinor;
    byRate.set(line.vatRatePercent, entry);
  }

  const vatBreakdown = [...byRate.values()].sort((a, b) => a.ratePercent - b.ratePercent);
  const vatMinor = vatBreakdown.reduce((sum, e) => sum + e.vatMinor, 0);

  return { netMinor, vatMinor, grossMinor: netMinor + vatMinor, vatBreakdown };
}

/** Build a canonical invoice from input, calculating all derived values. */
export function createInvoice(input: InvoiceInput): Invoice {
  const lines = input.lines.map((line, index) => calculateLine(line, String(index + 1)));
  return { ...input, lines, totals: calculateTotals(lines) };
}
