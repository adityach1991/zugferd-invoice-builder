# ARCHITECTURE.md --- ZUGFeRD Invoice SaaS

## 1. Architectural goals

The architecture must prioritize:

1.  Financial correctness.
2.  ZUGFeRD compliance and maintainability.
3.  Security.
4.  Clear domain boundaries.
5.  Testability.
6.  Provider independence where practical.
7.  Ability to evolve into API/Peppol/accounting integrations.
8.  Simple deployment for an early-stage micro-SaaS.

------------------------------------------------------------------------

# 2. Recommended stack

## Application

-   Next.js
-   TypeScript
-   React

## UI

-   Tailwind CSS
-   shadcn/ui

## Database

-   PostgreSQL

## ORM

-   Prisma or an equivalent strongly typed ORM

## Authentication

-   mature managed/authentication solution or Auth.js

## Payments

-   Stripe

## Object storage

-   S3-compatible private object storage

## AI

-   provider abstraction supporting one or more LLM providers

## Validation/PDF

Use established, maintained libraries/tools for:

-   XML parsing
-   XSD validation
-   Schematron/business-rule validation
-   PDF generation
-   PDF/A-3 processing
-   ZUGFeRD packaging

Do not invent a standards implementation when an authoritative
implementation/artifact exists.

------------------------------------------------------------------------

# 3. High-level architecture

``` text
Browser
   |
   v
Next.js Application
   |
   +-------------------+
   |                   |
   v                   v
Domain Services     Authentication
   |
   +---------+---------+----------+----------+
   |         |         |          |          |
 Invoice   Billing   AI       Files      Validation
   |
   +-----------+-------------+
   |                         |
   v                         v
XML Generator             PDF Renderer
   |                         |
   +------------+------------+
                |
                v
         PDF/A-3 + Embedded XML
                |
                v
             Validator
                |
                v
          Object Storage
```

------------------------------------------------------------------------

# 4. Repository structure

Recommended:

``` text
/
├── app/
│   ├── (marketing)/
│   ├── dashboard/
│   ├── invoice/
│   ├── validator/
│   ├── profile/
│   └── subscription/
│
├── components/
│   ├── ui/
│   ├── invoice/
│   └── dashboard/
│
├── src/
│   ├── domain/
│   │   ├── invoice/
│   │   ├── customer/
│   │   ├── billing/
│   │   └── entitlement/
│   │
│   ├── services/
│   │   ├── invoice/
│   │   ├── zugferd/
│   │   ├── pdf/
│   │   ├── validation/
│   │   ├── ai/
│   │   ├── files/
│   │   └── billing/
│   │
│   ├── repositories/
│   ├── schemas/
│   ├── auth/
│   ├── config/
│   └── utils/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│       └── zugferd/
│           ├── valid/
│           ├── invalid/
│           └── edge-cases/
│
├── docs/
│
├── AGENTS.md
├── PRD.md
├── ARCHITECTURE.md
└── DECISIONS.md
```

The exact Next.js routing structure can change, but the domain/service
boundaries should remain.

------------------------------------------------------------------------

# 5. Canonical invoice model

The canonical invoice model is the most important domain abstraction.

It should contain semantic invoice information rather than UI-specific
fields.

Conceptual structure:

``` text
Invoice
├── identity
│   ├── id
│   ├── invoiceNumber
│   ├── invoiceType
│   └── status
│
├── dates
│   ├── issueDate
│   ├── dueDate
│   └── deliveryDate/period
│
├── currency
│
├── seller
│   ├── legalName
│   ├── address
│   ├── identifiers
│   └── contact
│
├── buyer
│   ├── legalName
│   ├── address
│   ├── identifiers
│   └── contact
│
├── references
│   ├── purchaseOrder
│   ├── contract
│   └── buyerReference
│
├── lines[]
│   ├── description
│   ├── quantity
│   ├── unit
│   ├── price
│   ├── discount
│   ├── VAT
│   └── totals
│
├── taxes
│
├── totals
│
├── payment
│
└── notes
```

------------------------------------------------------------------------

# 6. Data flow

## Manual creation

``` text
Form
 ↓
Client validation
 ↓
Server validation
 ↓
Canonical Invoice
 ↓
Business rules
 ↓
XML mapping
 ↓
PDF rendering
 ↓
PDF/A-3 packaging
 ↓
Final validation
 ↓
Store
 ↓
Download
```

## AI creation

``` text
PDF upload
 ↓
File safety checks
 ↓
Text extraction/OCR
 ↓
AI extraction
 ↓
Runtime schema validation
 ↓
Business validation
 ↓
Draft Invoice
 ↓
Human review
 ↓
Canonical Invoice
 ↓
Normal generation pipeline
```

------------------------------------------------------------------------

# 7. Domain services

## InvoiceService

Responsible for:

-   create draft
-   update draft
-   finalize invoice
-   duplicate invoice
-   retrieve invoice

It should not directly contain PDF/A-3 implementation.

## InvoiceCalculationService

Responsible for:

-   line calculations
-   discounts
-   VAT
-   totals
-   rounding

Must use precise decimal arithmetic.

## EntitlementService

Responsible for:

-   current plan
-   invoice limit
-   feature access
-   remaining quota

## UsageService

Responsible for:

-   checking quota
-   atomically reserving/consuming invoice credit
-   recording usage

## BillingService

Responsible for:

-   Stripe customer mapping
-   subscription state
-   checkout
-   billing portal
-   webhook processing

## AIExtractionService

Responsible for:

-   document extraction
-   OCR coordination
-   LLM provider calls
-   structured extraction
-   extraction confidence/uncertainty

It returns a draft, never a finalized invoice.

------------------------------------------------------------------------

# 8. ZUGFeRD subsystem

Keep all standards-specific code isolated.

Recommended:

``` text
src/services/zugferd/
├── profiles/
├── versions/
├── xml/
├── pdfa/
├── packaging/
├── validation/
└── types/
```

Responsibilities:

### Version registry

Knows supported versions.

### Profile registry

Knows supported profiles.

### XML mapper

Maps canonical invoice → required XML representation.

### PDF/A service

Produces or converts the visual invoice to PDF/A-3 as required.

### Packaging service

Embeds the XML into the PDF/A-3 document using the required
metadata/relationships.

### Validator adapter

Runs authoritative validation tooling and normalizes the result for the
application.

------------------------------------------------------------------------

# 9. Versioned compliance

Do not write:

``` typescript
if (zugferdVersion === "2.5") ...
```

throughout the codebase.

Prefer:

``` text
ComplianceProfile
  version
  profile
  schemas
  validationRules
  mappingVersion
```

A generated invoice should retain:

``` text
zugferdVersion
profile
validatorVersion
generatorVersion
```

------------------------------------------------------------------------

# 10. PDF architecture

There are two distinct PDF paths.

## Product-generated PDF

``` text
Invoice model
 ↓
Template renderer
 ↓
PDF
 ↓
PDF/A-3 processing
 ↓
XML embedding
```

## User-uploaded PDF

``` text
Uploaded PDF
 ↓
Safety/compatibility check
 ↓
PDF/A-3 conversion if feasible
 ↓
XML embedding
 ↓
Validation
```

The original uploaded PDF must never be represented as ZUGFeRD compliant
until the resulting document passes the actual validation pipeline.

------------------------------------------------------------------------

# 11. Validator architecture

Validator should expose a normalized internal result:

``` text
ValidationResult
├── status
├── documentInfo
├── errors[]
├── warnings[]
├── information[]
├── standardsVersion
├── profile
└── validatorVersion
```

Each issue:

``` text
ValidationIssue
├── severity
├── code
├── message
├── field
├── location
└── technicalDetails
```

The UI translates technical results into user-friendly messages.

------------------------------------------------------------------------

# 12. Database architecture

Core entities:

``` text
User
Organization
Customer
Invoice
InvoiceLine
GeneratedFile
ValidationResult
Subscription
UsagePeriod
WebhookEvent
AIJob
UploadedDocument
```

Relationships:

``` text
User
 └── Organization
      ├── Customers
      ├── Invoices
      │    └── InvoiceLines
      ├── UploadedDocuments
      └── GeneratedFiles

User
 ├── Subscription
 └── UsagePeriods
```

If the initial product is single-company-per-user, keep the database
model extensible for multiple organizations without building
multi-company UX immediately.

------------------------------------------------------------------------

# 13. Suggested database details

## User

-   id
-   email
-   name
-   auth provider metadata
-   createdAt
-   updatedAt

## Organization

-   id
-   owner/user relationship
-   legal name
-   address
-   VAT ID
-   tax ID
-   contact
-   logo reference
-   defaults

## Customer

-   id
-   organizationId
-   name
-   address
-   VAT ID
-   contact
-   buyer reference
-   electronic address

## Invoice

-   id
-   organizationId
-   invoiceNumber
-   status
-   issueDate
-   dueDate
-   currency
-   totals
-   template
-   ZUGFeRD version
-   profile
-   generation metadata
-   createdAt
-   updatedAt

## GeneratedFile

-   id
-   invoiceId
-   type
-   storageKey
-   checksum
-   createdAt

## ValidationResult

-   id
-   invoiceId/documentId
-   status
-   validatorVersion
-   errors
-   warnings
-   createdAt

## Subscription

-   id
-   userId
-   providerCustomerId
-   providerSubscriptionId
-   plan
-   status
-   periodStart
-   periodEnd

## UsagePeriod

-   id
-   userId
-   periodStart
-   periodEnd
-   invoiceLimit
-   invoicesUsed

## WebhookEvent

-   provider
-   eventId
-   eventType
-   processedAt
-   payload/reference

Unique constraint on provider + eventId is recommended for idempotency.

------------------------------------------------------------------------

# 14. Quota architecture

Never do:

``` text
SELECT usage
if usage < limit:
    INSERT invoice
UPDATE usage
```

without transactional protection.

Prefer a transaction/atomic operation that prevents concurrent requests
from exceeding the quota.

Conceptually:

``` text
BEGIN
  lock usage period
  verify usage < limit
  reserve credit
  create/finalize invoice
COMMIT
```

If generation fails before successful finalization, release/restore the
reserved credit according to the chosen transaction boundary.

------------------------------------------------------------------------

# 15. Authentication architecture

Protected resources must check:

``` text
authenticated user
      ↓
organization ownership
      ↓
resource ownership
```

Never accept an arbitrary invoice ID and return it without checking
ownership.

------------------------------------------------------------------------

# 16. File architecture

Use private object storage.

Suggested key structure:

``` text
users/{userId}/
  uploads/{documentId}/original.pdf
  invoices/{invoiceId}/invoice.pdf
  invoices/{invoiceId}/invoice.xml
```

Do not use user-provided filenames directly as object-storage keys.

Store sanitized display names separately.

------------------------------------------------------------------------

# 17. AI architecture

Provider-neutral interface:

``` text
interface InvoiceExtractionProvider {
  extractInvoice(document): Promise<ExtractedInvoice>
}
```

Pipeline:

``` text
UploadedDocument
 ↓
Security checks
 ↓
PDF analysis
 ↓
Text extraction/OCR
 ↓
AI provider
 ↓
JSON/schema validation
 ↓
Extraction normalization
 ↓
Business validation
 ↓
InvoiceDraft
```

AI output should never directly execute application commands.

------------------------------------------------------------------------

# 18. Prompt-injection defense

Invoice PDFs can contain arbitrary text.

Treat document contents as untrusted data.

The AI prompt must clearly distinguish:

-   system instructions
-   extraction schema
-   document content

Never allow text inside an invoice to override extraction instructions.

Do not execute code, URLs, or commands derived from invoice content.

------------------------------------------------------------------------

# 19. Billing architecture

Browser checkout:

``` text
User
 ↓
Server creates checkout session
 ↓
Stripe
 ↓
Webhook
 ↓
Server updates subscription
 ↓
EntitlementService
```

The browser redirect is UX only.

Webhook state determines actual entitlement.

------------------------------------------------------------------------

# 20. Webhook idempotency

For each webhook:

``` text
provider + eventId
```

must be unique.

If the same event arrives twice:

``` text
first → process
second → no-op
```

Handle out-of-order events using provider timestamps/version information
where available.

------------------------------------------------------------------------

# 21. API boundaries

Even if the initial application uses server actions, maintain service
boundaries that can later support REST/API endpoints.

Future API:

``` text
POST /api/v1/invoices
GET  /api/v1/invoices/:id
POST /api/v1/invoices/:id/validate
GET  /api/v1/invoices/:id/pdf
GET  /api/v1/invoices/:id/xml
```

Do not expose an API publicly in MVP unless required.

------------------------------------------------------------------------

# 22. Error architecture

Use typed error categories.

Examples:

``` text
ValidationError
AuthorizationError
QuotaExceededError
FileProcessingError
InvoiceGenerationError
ZugferdValidationError
PaymentError
AIExtractionError
```

Map these to user-friendly messages.

Do not expose stack traces or provider secrets to users.

------------------------------------------------------------------------

# 23. Observability

Log:

-   request ID
-   user/account ID where appropriate
-   invoice ID
-   operation
-   duration
-   success/failure
-   error category

For AI:

-   job ID
-   provider
-   model
-   duration
-   token/cost metadata if available
-   extraction status

Never log:

-   passwords
-   payment secrets
-   full invoice contents unnecessarily
-   raw sensitive documents
-   API keys

------------------------------------------------------------------------

# 24. Testing architecture

## Unit tests

-   calculations
-   VAT
-   rounding
-   canonical model validation
-   entitlement logic

## Integration tests

-   database
-   invoice generation
-   XML generation
-   validation
-   quota transaction
-   billing webhooks

## E2E tests

Critical journeys:

1.  anonymous builder → signup → generate
2.  free quota exhausted
3.  paid subscription → entitlement
4.  AI upload → review → generate
5.  validator
6.  unauthorized invoice access

## Compliance fixtures

Maintain known-good and known-bad ZUGFeRD documents.

------------------------------------------------------------------------

# 25. Deployment architecture

Initial production:

``` text
CDN/Hosting
     |
Next.js
     |
PostgreSQL
     |
Object Storage
     |
Background worker(s)
```

Heavy operations such as:

-   PDF conversion
-   OCR
-   AI extraction
-   validation

may need background jobs if processing becomes slow.

Start synchronous only where response times are reliable; introduce a
queue when required.

------------------------------------------------------------------------

# 26. Background jobs

Potential jobs:

``` text
PDF_PROCESS
OCR_DOCUMENT
AI_EXTRACT
GENERATE_INVOICE
VALIDATE_INVOICE
SEND_EMAIL
DELETE_EXPIRED_FILE
```

Each job should have:

-   id
-   status
-   attempts
-   createdAt
-   startedAt
-   completedAt
-   error

Jobs should be idempotent where practical.

------------------------------------------------------------------------

# 27. Scalability strategy

Do not prematurely build microservices.

Start with a modular monolith.

Recommended:

``` text
One application
+
clear domain modules
+
background jobs where needed
+
PostgreSQL
+
object storage
```

Split services only when there is a concrete scaling/operational reason.

------------------------------------------------------------------------

# 28. Performance targets

Initial targets:

-   normal dashboard response: \< 1--2 seconds
-   builder interactions: near-instant
-   ordinary invoice generation: target a few seconds
-   validator: target a few seconds
-   AI extraction: asynchronous/progress-aware if it can take longer

Do not promise exact times in product copy until measured.

------------------------------------------------------------------------

# 29. Security boundaries

High-risk operations:

-   file upload
-   file download
-   invoice generation
-   subscription changes
-   quota consumption
-   webhook handling
-   account deletion

All require explicit server-side authorization.

------------------------------------------------------------------------

# 30. Future extensibility

The architecture should permit:

-   multiple companies
-   team members
-   recurring invoices
-   API keys
-   bulk invoice generation
-   accounting integrations
-   Peppol
-   receiving e-invoices
-   payment tracking

without redesigning the canonical invoice model.
