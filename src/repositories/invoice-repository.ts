import { db } from "./db";
import type { Invoice, InvoiceInput } from "@/src/domain/invoice/types";
import type { Invoice as PrismaInvoice, InvoiceStatus } from "@prisma/client";

export interface CreateInvoiceInput {
  organizationId: string;
  createdById?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  seller: any;
  buyer: any;
  payment: any;
  lines: any[];
}

export interface UpdateInvoiceInput {
  id: string;
  number?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  seller?: any;
  buyer?: any;
  payment?: any;
  lines?: any[];
  status?: InvoiceStatus;
}

/**
 * Repository for managing invoice persistence.
 * Abstracts Prisma operations and handles JSON serialization.
 */
export class InvoiceRepository {
  /**
   * Create a new invoice draft
   */
  async create(input: CreateInvoiceInput): Promise<PrismaInvoice> {
    const invoiceData: any = {
      organizationId: input.organizationId,
      createdById: input.createdById,
      number: input.number,
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      currency: input.currency,
      payload: {
        id: input.number, // Use number as ID for the draft
        number: input.number,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        currency: input.currency,
        seller: input.seller,
        buyer: input.buyer,
        payment: input.payment,
        lines: input.lines,
      },
      status: "DRAFT",
    };

    return await db.invoice.create({
      data: invoiceData,
    });
  }

  /**
   * Find an invoice by ID
   */
  async findById(id: string): Promise<PrismaInvoice | null> {
    return await db.invoice.findUnique({
      where: { id },
    });
  }

  /**
   * Find invoices by organization
   */
  async findByOrganization(organizationId: string, limit = 10): Promise<PrismaInvoice[]> {
    return await db.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Update an invoice draft
   */
  async update(input: UpdateInvoiceInput): Promise<PrismaInvoice> {
    const updateData: any = {
      ...(input.number !== undefined && { number: input.number }),
      ...(input.issueDate !== undefined && { issueDate: new Date(input.issueDate) }),
      ...(input.dueDate !== undefined && { dueDate: new Date(input.dueDate) }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.status !== undefined && { status: input.status }),
    };

    // Update payload if any invoice data changed
    if (
      input.seller !== undefined ||
      input.buyer !== undefined ||
      input.payment !== undefined ||
      input.lines !== undefined
    ) {
      const existing = await this.findById(input.id);
      if (existing) {
        const existingPayload = existing.payload as any;
        updateData.payload = {
          ...existingPayload,
          ...(input.seller !== undefined && { seller: input.seller }),
          ...(input.buyer !== undefined && { buyer: input.buyer }),
          ...(input.payment !== undefined && { payment: input.payment }),
          ...(input.lines !== undefined && { lines: input.lines }),
        };
      }
    }

    return await db.invoice.update({
      where: { id: input.id },
      data: updateData,
    });
  }

  /**
   * Delete an invoice
   */
  async delete(id: string): Promise<PrismaInvoice> {
    return await db.invoice.delete({
      where: { id },
    });
  }

  /**
   * Convert Prisma invoice to domain invoice
   */
  toDomainInvoice(prismaInvoice: PrismaInvoice): Invoice {
    return prismaInvoice.payload as any;
  }

  /**
   * Convert domain invoice to Prisma payload
   */
  toPrismaPayload(invoice: Invoice): any {
    return invoice;
  }
}