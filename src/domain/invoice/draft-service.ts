import { createInvoice, calculateLine, calculateTotals } from "./calculate";
import type { Invoice, InvoiceInput, InvoiceLine, InvoiceLineInput } from "./types";
import type { InvoiceStatus } from "@prisma/client";
import type { CurrencyCode } from "./types";

export interface DraftInvoice extends Invoice {
  status: InvoiceStatus;
}

export interface DraftInvoiceInput extends InvoiceInput {
  status?: InvoiceStatus;
}

export interface DraftLineItemInput extends InvoiceLineInput {
  id?: string;
}

export interface UpdateDraftInput {
  id: string;
  number?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: CurrencyCode;
  seller?: Partial<DraftInvoiceInput["seller"]>;
  buyer?: Partial<DraftInvoiceInput["buyer"]>;
  payment?: Partial<DraftInvoiceInput["payment"]>;
}

export interface AddLineItemInput {
  draftId: string;
  line: DraftLineItemInput;
}

export interface UpdateLineItemInput {
  draftId: string;
  lineId: string;
  line: Partial<DraftLineItemInput>;
}

export interface RemoveLineItemInput {
  draftId: string;
  lineId: string;
}

/**
 * Domain service for managing invoice drafts.
 * Handles business logic for draft creation, updates, and calculations.
 * Keeps business logic separate from UI components.
 */
export class DraftInvoiceService {
  /**
   * Create a new draft invoice with default values
   */
  createDraft(input: DraftInvoiceInput): DraftInvoice {
    const invoice = createInvoice(input);
    return {
      ...invoice,
      status: input.status ?? "DRAFT",
    };
  }

  /**
   * Update draft invoice metadata
   */
  updateDraft(draft: DraftInvoice, updates: UpdateDraftInput): DraftInvoice {
    const updatedDraft: DraftInvoice = {
      ...draft,
      ...updates,
      seller: updates.seller ? { ...draft.seller, ...updates.seller } : draft.seller,
      buyer: updates.buyer ? { ...draft.buyer, ...updates.buyer } : draft.buyer,
      payment: updates.payment ? { ...draft.payment, ...updates.payment } : draft.payment,
    };

    // Recalculate totals if lines might be affected
    if (updates.seller || updates.buyer || updates.payment) {
      return {
        ...updatedDraft,
        totals: calculateTotals(updatedDraft.lines),
      };
    }

    return updatedDraft;
  }

  /**
   * Add a new line item to the draft
   */
  addLineItem(draft: DraftInvoice, line: DraftLineItemInput): DraftInvoice {
    const newLine: InvoiceLine = {
      ...calculateLine(line, line.id ?? String(draft.lines.length + 1)),
    };

    const updatedLines = [...draft.lines, newLine];
    return {
      ...draft,
      lines: updatedLines,
      totals: calculateTotals(updatedLines),
    };
  }

  /**
   * Update an existing line item
   */
  updateLineItem(
    draft: DraftInvoice,
    lineId: string,
    updates: Partial<DraftLineItemInput>
  ): DraftInvoice {
    const lineIndex = draft.lines.findIndex(line => line.id === lineId);
    if (lineIndex === -1) {
      throw new Error(`Line item with id ${lineId} not found`);
    }

    const existingLine = draft.lines[lineIndex];
    const updatedLineInput: InvoiceLineInput = {
      ...existingLine,
      ...updates,
    };

    const updatedLine = calculateLine(updatedLineInput, lineId);
    const updatedLines = [...draft.lines];
    updatedLines[lineIndex] = updatedLine;

    return {
      ...draft,
      lines: updatedLines,
      totals: calculateTotals(updatedLines),
    };
  }

  /**
   * Remove a line item from the draft
   */
  removeLineItem(draft: DraftInvoice, lineId: string): DraftInvoice {
    const updatedLines = draft.lines.filter(line => line.id !== lineId);
    
    // Renumber remaining lines to maintain sequential IDs
    const renumberedLines = updatedLines.map((line, index) => ({
      ...line,
      id: String(index + 1),
    }));

    return {
      ...draft,
      lines: renumberedLines,
      totals: calculateTotals(renumberedLines),
    };
  }

  /**
   * Recalculate invoice totals
   */
  recalculateTotals(draft: DraftInvoice): DraftInvoice {
    return {
      ...draft,
      totals: calculateTotals(draft.lines),
    };
  }
}