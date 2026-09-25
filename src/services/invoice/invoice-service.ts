import { DraftInvoiceService } from "@/src/domain/invoice/draft-service";
import { InvoiceRepository } from "@/src/repositories/invoice-repository";
import { createInvoice } from "@/src/domain/invoice/calculate";
import type { InvoiceInput } from "@/src/domain/invoice/types";
import type { CreateInvoiceInput, UpdateInvoiceInput } from "@/src/repositories/invoice-repository";
import type { InvoiceStatus } from "@prisma/client";
import type { CurrencyCode } from "@/src/domain/invoice/types";

export interface CreateDraftInput {
  organizationId: string;
  createdById?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  seller: any;
  buyer: any;
  payment: any;
  lines: any[];
}

export interface UpdateDraftInput {
  id: string;
  number?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: CurrencyCode;
  seller?: any;
  buyer?: any;
  payment?: any;
  lines?: any[];
  status?: InvoiceStatus;
}

export interface AddLineItemInput {
  draftId: string;
  line: any;
}

export interface UpdateLineItemInput {
  draftId: string;
  lineId: string;
  line: any;
}

export interface RemoveLineItemInput {
  draftId: string;
  lineId: string;
}

/**
 * Application service for invoice operations.
 * Coordinates between domain services and repositories.
 * Provides clean API boundaries with validation.
 */
export class InvoiceService {
  private draftService: DraftInvoiceService;
  private repository: InvoiceRepository;

  constructor() {
    this.draftService = new DraftInvoiceService();
    this.repository = new InvoiceRepository();
  }

  /**
   * Create a new invoice draft
   */
  async createDraft(input: CreateDraftInput) {
    // Validate input using domain validation
    const invoiceInput: InvoiceInput = {
      id: input.number,
      number: input.number,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      seller: input.seller,
      buyer: input.buyer,
      payment: input.payment,
      lines: input.lines,
    };

    const draftInvoice = this.draftService.createDraft({
      ...invoiceInput,
      status: "DRAFT",
    });

    // Persist to database
    const prismaInvoice = await this.repository.create({
      organizationId: input.organizationId,
      createdById: input.createdById,
      number: input.number,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      seller: input.seller,
      buyer: input.buyer,
      payment: input.payment,
      lines: input.lines,
    });

    return {
      ...draftInvoice,
      id: prismaInvoice.id,
    };
  }

  /**
   * Get an invoice draft by ID
   */
  async getDraft(id: string) {
    const prismaInvoice = await this.repository.findById(id);
    if (!prismaInvoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    const domainInvoice = this.repository.toDomainInvoice(prismaInvoice);
    return {
      ...domainInvoice,
      id: prismaInvoice.id,
      status: prismaInvoice.status,
      createdAt: prismaInvoice.createdAt,
      updatedAt: prismaInvoice.updatedAt,
    };
  }

  /**
   * Update an invoice draft
   */
  async updateDraft(input: UpdateDraftInput) {
    const prismaInvoice = await this.repository.update(input);
    const domainInvoice = this.repository.toDomainInvoice(prismaInvoice);

    return {
      ...domainInvoice,
      id: prismaInvoice.id,
      status: prismaInvoice.status,
    };
  }

  /**
   * Add a line item to a draft
   */
  async addLineItem(input: AddLineItemInput) {
    const draft = await this.getDraft(input.draftId);
    const updatedDraft = this.draftService.addLineItem(draft, input.line);
    
    const result = await this.updateDraft({
      id: input.draftId,
      lines: updatedDraft.lines,
    });

    return result;
  }

  /**
   * Update a line item in a draft
   */
  async updateLineItem(input: UpdateLineItemInput) {
    const draft = await this.getDraft(input.draftId);
    const updatedDraft = this.draftService.updateLineItem(draft, input.lineId, input.line);
    
    const result = await this.updateDraft({
      id: input.draftId,
      lines: updatedDraft.lines,
    });

    return result;
  }

  /**
   * Remove a line item from a draft
   */
  async removeLineItem(input: RemoveLineItemInput) {
    const draft = await this.getDraft(input.draftId);
    const updatedDraft = this.draftService.removeLineItem(draft, input.lineId);
    
    const result = await this.updateDraft({
      id: input.draftId,
      lines: updatedDraft.lines,
    });

    return result;
  }

  /**
   * List invoices for an organization
   */
  async listByOrganization(organizationId: string, limit = 10) {
    const prismaInvoices = await this.repository.findByOrganization(organizationId, limit);
    
    return prismaInvoices.map(prismaInvoice => {
      const domainInvoice = this.repository.toDomainInvoice(prismaInvoice);
      return {
        ...domainInvoice,
        id: prismaInvoice.id,
        status: prismaInvoice.status,
        createdAt: prismaInvoice.createdAt,
        updatedAt: prismaInvoice.updatedAt,
      };
    });
  }
}