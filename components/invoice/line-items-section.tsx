import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InvoiceLineInput } from "@/src/domain/invoice/types";

interface LineItemsSectionProps {
  lines: InvoiceLineInput[];
  onLinesChange: (lines: InvoiceLineInput[]) => void;
}

export function LineItemsSection({ lines, onLinesChange }: LineItemsSectionProps) {
  const [newLine, setNewLine] = useState<InvoiceLineInput>({
    description: "",
    quantity: 1,
    unit: "PCE",
    unitPriceMinor: 0,
    vatRatePercent: 19,
  });

  const addLine = () => {
    if (newLine.description && newLine.quantity > 0 && newLine.unitPriceMinor >= 0) {
      onLinesChange([...lines, { ...newLine }]);
      setNewLine({
        description: "",
        quantity: 1,
        unit: "PCE",
        unitPriceMinor: 0,
        vatRatePercent: 19,
      });
    }
  };

  const updateLine = (index: number, field: keyof InvoiceLineInput, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    onLinesChange(updatedLines);
  };

  const removeLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index);
    onLinesChange(updatedLines);
  };

  const formatAmount = (minorUnits: number) => {
    return (minorUnits / 100).toFixed(2);
  };

  const parseAmount = (value: string) => {
    return Math.round(parseFloat(value) * 100) || 0;
  };

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Line Items</h3>
      
      {lines.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(index, "description", e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formatAmount(line.unitPriceMinor)}
                      onChange={(e) => updateLine(index, "unitPriceMinor", parseAmount(e.target.value))}
                      className="w-24 px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeLine(index)}
                      className="px-2 py-1 text-xs"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Line Form */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-3">Add New Line Item</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            label="Description"
            value={newLine.description}
            onChange={(e) => setNewLine({...newLine, description: e.target.value})}
          />
          <Input
            label="Quantity"
            type="number"
            step="0.01"
            min="0"
            value={newLine.quantity}
            onChange={(e) => setNewLine({...newLine, quantity: parseFloat(e.target.value) || 0})}
          />
          <Input
            label="Unit Price"
            type="number"
            step="0.01"
            min="0"
            value={formatAmount(newLine.unitPriceMinor)}
            onChange={(e) => setNewLine({...newLine, unitPriceMinor: parseAmount(e.target.value)})}
          />
          <div className="flex items-end">
            <Button
              type="button"
              onClick={addLine}
              disabled={!newLine.description}
              className="w-full"
            >
              Add Line
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}