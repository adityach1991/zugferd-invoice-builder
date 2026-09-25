import { NextResponse } from "next/server";
import { InvoiceService } from "@/src/services/invoice/invoice-service";
import type { UpdateDraftInput } from "@/src/services/invoice/invoice-service";
import type { InvoiceInputDto } from "@/src/schemas/invoice";
import type { ZodError } from "zod";

const invoiceService = new InvoiceService();

/**
 * GET /api/invoices/[id] - Get an invoice draft
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const draft = await invoiceService.getDraft(resolvedParams.id);
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error("Error fetching invoice draft:", error);
    
    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch invoice draft" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id] - Update an invoice draft
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body: Partial<InvoiceInputDto> = await request.json();
    
    const updateInput: UpdateDraftInput = {
      id: resolvedParams.id,
      ...body,
    };

    const updatedDraft = await invoiceService.updateDraft(updateInput);

    return NextResponse.json(updatedDraft);
  } catch (error: any) {
    console.error("Error updating invoice draft:", error);
    
    if (error.name === "ZodError") {
      const zodError = error as ZodError;
      return NextResponse.json(
        { error: "Validation failed", issues: zodError.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invoice draft" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id] - Delete an invoice draft
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // TODO: Implement actual deletion with proper authorization
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error: any) {
    console.error("Error deleting invoice draft:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice draft" },
      { status: 500 }
    );
  }
}