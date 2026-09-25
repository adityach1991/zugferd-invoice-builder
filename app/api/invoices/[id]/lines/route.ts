import { NextResponse } from "next/server";
import { InvoiceService } from "@/src/services/invoice/invoice-service";
import { invoiceLineSchema } from "@/src/schemas/invoice";
import type { AddLineItemInput, UpdateLineItemInput, RemoveLineItemInput } from "@/src/services/invoice/invoice-service";
import type { InvoiceLineInput } from "@/src/domain/invoice/types";
import type { ZodError } from "zod";

const invoiceService = new InvoiceService();

/**
 * POST /api/invoices/[id]/lines - Add a line item to an invoice
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body: { line: InvoiceLineInput } = await request.json();
    
    // Validate line item input
    const validatedLine = invoiceLineSchema.parse(body.line);

    const addInput: AddLineItemInput = {
      draftId: resolvedParams.id,
      line: validatedLine,
    };

    const updatedDraft = await invoiceService.addLineItem(addInput);

    return NextResponse.json(updatedDraft);
  } catch (error: any) {
    console.error("Error adding line item:", error);
    
    if (error.name === "ZodError") {
      const zodError = error as ZodError;
      return NextResponse.json(
        { error: "Validation failed", issues: zodError.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add line item" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id]/lines/[lineId] - Update a line item
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body: { line: Partial<InvoiceLineInput> } = await request.json();
    
    const updateInput: UpdateLineItemInput = {
      draftId: resolvedParams.id,
      lineId: resolvedParams.lineId,
      line: body.line,
    };

    const updatedDraft = await invoiceService.updateLineItem(updateInput);

    return NextResponse.json(updatedDraft);
  } catch (error: any) {
    console.error("Error updating line item:", error);
    
    if (error.name === "ZodError") {
      const zodError = error as ZodError;
      return NextResponse.json(
        { error: "Validation failed", issues: zodError.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update line item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]/lines/[lineId] - Remove a line item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const resolvedParams = await params;
    const removeInput: RemoveLineItemInput = {
      draftId: resolvedParams.id,
      lineId: resolvedParams.lineId,
    };

    const updatedDraft = await invoiceService.removeLineItem(removeInput);

    return NextResponse.json(updatedDraft);
  } catch (error: any) {
    console.error("Error removing line item:", error);
    return NextResponse.json(
      { error: "Failed to remove line item" },
      { status: 500 }
    );
  }
}