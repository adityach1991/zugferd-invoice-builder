import { NextResponse } from "next/server";
import { InvoiceService } from "@/src/services/invoice/invoice-service";
import { invoiceInputSchema } from "@/src/schemas/invoice";
import type { CreateDraftInput } from "@/src/services/invoice/invoice-service";
import type { InvoiceInputDto } from "@/src/schemas/invoice";
import type { ZodError } from "zod";

const invoiceService = new InvoiceService();

/**
 * POST /api/invoices - Create a new invoice draft
 */
export async function POST(request: Request) {
  try {
    const body: InvoiceInputDto = await request.json();
    
    // Validate input
    const validatedData = invoiceInputSchema.parse({
      id: body.number,
      number: body.number,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      currency: body.currency,
      seller: body.seller,
      buyer: body.buyer,
      payment: body.payment,
      lines: body.lines,
    });

    const createInput: CreateDraftInput = {
      organizationId: "org-placeholder", // TODO: Get from auth
      createdById: undefined,
      number: validatedData.number,
      issueDate: validatedData.issueDate,
      dueDate: validatedData.dueDate,
      currency: validatedData.currency,
      seller: validatedData.seller,
      buyer: validatedData.buyer,
      payment: validatedData.payment,
      lines: validatedData.lines,
    };

    const draft = await invoiceService.createDraft(createInput);

    return NextResponse.json(draft, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice draft:", error);
    
    if (error.name === "ZodError") {
      const zodError = error as ZodError;
      return NextResponse.json(
        { error: "Validation failed", issues: zodError.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invoice draft" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices - List invoices (placeholder)
 */
export async function GET() {
  try {
    // TODO: Implement proper listing with authentication
    return NextResponse.json({ invoices: [] });
  } catch (error: any) {
    console.error("Error listing invoices:", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}