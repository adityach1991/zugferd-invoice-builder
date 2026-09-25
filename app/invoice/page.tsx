import { InvoiceForm } from "@/components/invoice/invoice-form";
import type { Invoice } from "@/src/domain/invoice/types";

export default function InvoiceBuilderPage() {
  const handleSubmit = async (data: any) => {
    try {
      // TODO: Implement actual API call
      console.log("Submitting invoice data:", data);
      
      // Example API call:
      // const response = await fetch('/api/invoices', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to create invoice');
      // }
      // 
      // const result = await response.json();
      // console.log('Invoice created:', result);
    } catch (error) {
      console.error("Error submitting invoice:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Invoice Builder</h1>
        <InvoiceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}