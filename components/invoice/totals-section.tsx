import { calculateTotals } from "@/src/domain/invoice/calculate";
import type { InvoiceLineInput } from "@/src/domain/invoice/types";

interface TotalsSectionProps {
  lines: InvoiceLineInput[];
}

export function TotalsSection({ lines }: TotalsSectionProps) {
  const totals = calculateTotals(lines.map((line, index) => ({
    ...line,
    id: String(index + 1),
    netMinor: Math.round(line.quantity * line.unitPriceMinor),
    vatMinor: Math.round((line.quantity * line.unitPriceMinor) * line.vatRatePercent / 100),
    grossMinor: Math.round(line.quantity * line.unitPriceMinor) + Math.round((line.quantity * line.unitPriceMinor) * line.vatRatePercent / 100),
  })));

  const formatAmount = (minorUnits: number) => {
    return (minorUnits / 100).toFixed(2);
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Invoice Totals</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Net Total:</span>
          <span className="font-medium">{formatAmount(totals.netMinor)} EUR</span>
        </div>
        
        {totals.vatBreakdown.map((entry, index) => (
          <div key={index} className="flex justify-between">
            <span>VAT ({entry.ratePercent}%):</span>
            <span>{formatAmount(entry.vatMinor)} EUR</span>
          </div>
        ))}
        
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="font-semibold">Gross Total:</span>
          <span className="font-semibold">{formatAmount(totals.grossMinor)} EUR</span>
        </div>
      </div>
    </div>
  );
}