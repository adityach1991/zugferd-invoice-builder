"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PartySection } from "./party-section";
import { LineItemsSection } from "./line-items-section";
import { TotalsSection } from "./totals-section";
import type { Invoice, Party, Payment } from "@/src/domain/invoice/types";
import type { CurrencyCode } from "@/src/domain/invoice/types";
import type { InvoiceLineInput } from "@/src/domain/invoice/types";

interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function InvoiceForm({ initialData, onSubmit, isLoading }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    number: initialData?.number || "",
    issueDate: initialData?.issueDate || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: (initialData?.currency as CurrencyCode) || ("EUR" as CurrencyCode),
  });

  const [seller, setSeller] = useState<Party>(initialData?.seller || {
    name: "",
    address: { line1: "", postalCode: "", city: "", country: "DE" },
  });

  const [buyer, setBuyer] = useState<Party>(initialData?.buyer || {
    name: "",
    address: { line1: "", postalCode: "", city: "", country: "DE" },
  });

  const [payment, setPayment] = useState<Payment>(initialData?.payment || {
    means: "SEPA_CREDIT_TRANSFER",
  });

  const [lines, setLines] = useState<InvoiceLineInput[]>(initialData?.lines || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      seller,
      buyer,
      payment,
      lines,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Invoice Builder</h2>
      
      {/* Invoice Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          label="Invoice Number"
          value={formData.number}
          onChange={(e) => setFormData({...formData, number: e.target.value})}
          required
        />
        <Input
          label="Issue Date"
          type="date"
          value={formData.issueDate}
          onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
          required
        />
        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
          required
        />
        <Select
          label="Currency"
          value={formData.currency}
          onChange={(e) => setFormData({...formData, currency: e.target.value as CurrencyCode})}
        >
          <option value="EUR">EUR - Euro</option>
          <option value="USD">USD - US Dollar</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CHF">CHF - Swiss Franc</option>
        </Select>
      </div>

      {/* Seller Section */}
      <PartySection
        title="Seller Information"
        party={seller}
        onPartyChange={setSeller}
      />

      {/* Buyer Section */}
      <PartySection
        title="Buyer Information"
        party={buyer}
        onPartyChange={setBuyer}
      />

      {/* Payment Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Payment Method"
            value={payment.means}
            onChange={(e) => setPayment({...payment, means: e.target.value as any})}
          >
            <option value="SEPA_CREDIT_TRANSFER">SEPA Credit Transfer</option>
            <option value="SEPA_DIRECT_DEBIT">SEPA Direct Debit</option>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </Select>
          
          {(payment.means === "SEPA_CREDIT_TRANSFER" || payment.means === "SEPA_DIRECT_DEBIT") && (
            <>
              <Input
                label="IBAN"
                value={payment.iban || ""}
                onChange={(e) => setPayment({...payment, iban: e.target.value})}
              />
              <Input
                label="BIC"
                value={payment.bic || ""}
                onChange={(e) => setPayment({...payment, bic: e.target.value})}
              />
            </>
          )}
          
          <Input
            label="Payment Reference"
            value={payment.reference || ""}
            onChange={(e) => setPayment({...payment, reference: e.target.value})}
          />
          
          <div className="md:col-span-2">
            <Input
              label="Payment Terms"
              value={payment.terms || ""}
              onChange={(e) => setPayment({...payment, terms: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <LineItemsSection
        lines={lines}
        onLinesChange={(newLines) => setLines(newLines as InvoiceLineInput[])}
      />

      {/* Totals */}
      <TotalsSection lines={lines} />

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="secondary">
          Save Draft
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Invoice"}
        </Button>
      </div>
    </form>
  );
}