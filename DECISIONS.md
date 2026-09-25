# DECISIONS.md --- Architecture Decision Record

This document records important decisions so future coding agents do not
accidentally reverse them.

------------------------------------------------------------------------

# ADR-001 --- Use a modular monolith initially

## Decision

Build the first production version as a modular monolith rather than
multiple microservices.

## Reason

The product is initially a micro-SaaS with a relatively small
engineering team.

A modular monolith provides:

-   simpler deployment
-   simpler local development
-   easier transactions
-   lower infrastructure cost
-   fewer operational failure modes

The codebase must still maintain clear domain boundaries so services can
be extracted later if necessary.

------------------------------------------------------------------------

# ADR-002 --- Canonical invoice model is the single source of truth

## Decision

All invoice creation paths must converge on one canonical invoice domain
model.

## Required flows

``` text
Manual form → Canonical Invoice
AI extraction → Invoice Draft → Canonical Invoice
Future API → Canonical Invoice
```

Then:

``` text
Canonical Invoice → XML
Canonical Invoice → PDF
Canonical Invoice → ZUGFeRD
```

## Reason

Prevents inconsistencies between manual invoices, AI invoices, API
invoices, PDF output, and XML output.

------------------------------------------------------------------------

# ADR-003 --- Keep ZUGFeRD implementation isolated

## Decision

ZUGFeRD-specific logic belongs in a dedicated subsystem.

## Reason

ZUGFeRD, Factur-X, EN 16931, XML schemas, Schematron rules, and PDF/A-3
requirements can evolve independently from the application UI.

Keeping them isolated allows the compliance implementation to be
upgraded without rewriting the application.

------------------------------------------------------------------------

# ADR-004 --- Version compliance artifacts

## Decision

The application must explicitly record the ZUGFeRD version, profile,
validator/ruleset version, and generation engine version for each
generated invoice.

## Reason

Compliance standards evolve.

When a customer reports that an invoice generated six months ago behaves
differently under a newer validator, the system must be able to
determine exactly which ruleset produced it.

------------------------------------------------------------------------

# ADR-005 --- Never invent standards rules

## Decision

ZUGFeRD, Factur-X, EN 16931, XML schema, Schematron, and PDF/A-3
behavior must be based on authoritative specifications, schemas,
validation artefacts, or established libraries.

## Reason

A superficially plausible XML file is not sufficient.

The product's value depends on producing technically valid documents.

------------------------------------------------------------------------

# ADR-006 --- Server-side quota enforcement

## Decision

Invoice limits are enforced entirely server-side.

## Reason

Client-side quotas can be bypassed.

The client can display quota information, but only the server may
authorize generation.

------------------------------------------------------------------------

# ADR-007 --- Atomic invoice quota consumption

## Decision

Quota consumption must be concurrency-safe.

## Example

If a user has one remaining credit and sends two simultaneous generation
requests, only one can consume the final credit.

## Reason

Without transactional/atomic enforcement, concurrent requests can bypass
limits.

------------------------------------------------------------------------

# ADR-008 --- Failed internal generation does not consume a credit

## Decision

A server-side generation failure before a usable invoice is successfully
finalized should not consume an invoice credit.

## Reason

Customers should not lose quota because of an application failure.

If the invoice was successfully finalized, the credit is consumed even
if the customer chooses not to download it.

------------------------------------------------------------------------

# ADR-009 --- Re-download does not consume quota

## Decision

Downloading an already-created invoice multiple times does not consume
additional credits.

## Reason

The quota measures invoice creation, not file downloads.

------------------------------------------------------------------------

# ADR-010 --- AI produces drafts, never final invoices

## Decision

AI extraction must always produce a reviewable draft.

## Reason

Invoice data is financially significant.

AI can misread:

-   VAT IDs
-   invoice numbers
-   totals
-   dates
-   quantities
-   tax rates

The user must confirm the final values.

------------------------------------------------------------------------

# ADR-011 --- AI provider abstraction

## Decision

AI functionality must be accessed through a provider abstraction.

## Reason

This prevents the application from becoming dependent on a single model
provider and allows changes based on:

-   price
-   quality
-   latency
-   privacy
-   availability

------------------------------------------------------------------------

# ADR-012 --- Uploaded documents are untrusted

## Decision

All uploaded PDFs are treated as untrusted files.

## Requirements

-   file type verification
-   size limits
-   malware/security scanning where appropriate
-   isolated processing
-   no execution of document content
-   no public file URLs
-   protection against malicious PDFs

## Reason

PDFs can contain malicious or unexpected content.

------------------------------------------------------------------------

# ADR-013 --- AI document text is untrusted input

## Decision

Invoice contents supplied to the AI are data, not instructions.

## Reason

A malicious PDF could contain prompt-injection text.

The extraction pipeline must ensure document text cannot override
system/developer instructions or trigger application actions.

------------------------------------------------------------------------

# ADR-014 --- Use precise decimal arithmetic

## Decision

All invoice monetary calculations use decimal arithmetic.

## Reason

Binary floating-point numbers can produce incorrect monetary results.

Example:

``` text
0.1 + 0.2
```

must be represented as exactly 0.30 for invoice purposes.

------------------------------------------------------------------------

# ADR-015 --- PDF and XML are separate artifacts

## Decision

Store the generated PDF and XML as separate artifacts, while also
producing the hybrid ZUGFeRD PDF/A-3.

## Reason

Users may need:

-   hybrid PDF
-   standalone XML
-   both in a ZIP

Separate artifact tracking also simplifies regeneration and auditing.

------------------------------------------------------------------------

# ADR-016 --- Uploaded PDF is not automatically considered ZUGFeRD compliant

## Decision

Uploading a PDF and extracting data from it does not make that PDF a
compliant ZUGFeRD invoice.

## Reason

The hybrid invoice must satisfy the relevant PDF/A-3, XML embedding,
metadata, and validation requirements.

If the user's original PDF cannot safely be converted/packaged and
validated, the application must use a product template instead.

------------------------------------------------------------------------

# ADR-017 --- Validator is a first-class product feature

## Decision

The validator is not merely an internal generation check.

It is a first-class product feature and potential acquisition channel.

## Reason

A free or accessible validator can attract users who are actively
searching for ZUGFeRD tooling and introduce them to the
invoice-generation product.

------------------------------------------------------------------------

# ADR-018 --- Validation errors must be human-readable

## Decision

Technical rule identifiers may be shown, but every important validation
failure should have a plain-language explanation.

Example:

Bad:

``` text
BR-CO-10
```

Better:

``` text
The invoice total does not match the sum of the invoice components.
Technical rule: BR-CO-10
```

## Reason

The target customer should not need to understand EN 16931 rule
identifiers.

------------------------------------------------------------------------

# ADR-019 --- Stripe webhooks are authoritative for billing

## Decision

Subscription entitlement is updated from verified payment-provider
webhook events.

## Reason

Browser redirects are not authoritative.

Users can close tabs, payment can fail asynchronously, and webhook
events can arrive after checkout.

Webhook processing must be idempotent.

------------------------------------------------------------------------

# ADR-020 --- Private object storage

## Decision

Uploaded and generated files live in private object storage.

## Reason

Invoices can contain confidential business and financial information.

Downloads must be authorized and preferably use short-lived signed URLs.

------------------------------------------------------------------------

# ADR-021 --- No secrets in frontend

## Decision

Secrets, payment keys, AI keys, storage credentials, and database
credentials must never be exposed to browser code.

## Reason

Frontend code is observable by users.

------------------------------------------------------------------------

# ADR-022 --- Keep business logic out of React components

## Decision

React components handle presentation and user interaction.

Business rules belong in domain/services.

## Reason

This allows:

-   unit testing
-   API reuse
-   AI reuse
-   future mobile clients
-   future API clients

------------------------------------------------------------------------

# ADR-023 --- Build compliance pipeline before AI

## Decision

The development order prioritizes:

``` text
Canonical model
→ XML
→ PDF
→ PDF/A-3
→ ZUGFeRD packaging
→ validation
```

before advanced AI extraction.

## Reason

AI is valuable only if the resulting invoice can reliably become a valid
document.

Once the normal generation pipeline is stable, AI becomes another input
mechanism rather than another invoice-generation system.

------------------------------------------------------------------------

# ADR-024 --- Delay full billing implementation

## Decision

Build invoice generation and entitlement architecture before
implementing full payment flows.

## Reason

Billing introduces additional complexity.

The application should first prove that users can successfully create
and validate invoices.

However, entitlement interfaces should exist early so billing can later
plug into them cleanly.

------------------------------------------------------------------------

# ADR-025 --- Entitlements instead of scattered plan checks

## Decision

Features are controlled through an entitlement system.

Prefer:

``` text
entitlements.can("AI_INVOICE_IMPORT")
```

over repeated checks such as:

``` text
if plan === "STANDARD" || plan === "PREMIUM"
```

## Reason

Pricing and packaging will change.

Entitlements make plan changes easier.

------------------------------------------------------------------------

# ADR-026 --- History initially stores last 10 invoices in product UX

## Decision

The initial history interface displays the latest 10 generated invoices.

## Reason

This matches the initial product requirement and keeps MVP scope small.

The underlying data model should not prevent a future full archive.

------------------------------------------------------------------------

# ADR-027 --- Duplicate invoice creates a draft

## Decision

Duplicating an invoice creates a new draft rather than immediately
generating a finalized invoice.

## Reason

Invoice numbers, dates, quantities, and customer details may need to
change.

The user must review the duplicated data before final generation.

------------------------------------------------------------------------

# ADR-028 --- Support future multi-company architecture

## Decision

The initial UX may support one organization per user, but the database
model should use an Organization concept.

## Reason

Accountants and businesses may eventually need multiple companies.

This avoids a costly data-model migration later.

------------------------------------------------------------------------

# ADR-029 --- Modular AI extraction pipeline

## Decision

AI extraction is a pipeline rather than a single LLM call.

``` text
file safety
→ text extraction/OCR
→ AI extraction
→ schema validation
→ business validation
→ user review
```

## Reason

This improves reliability, debuggability, provider independence, and
safety.

------------------------------------------------------------------------

# ADR-030 --- No premature microservices

## Decision

Do not split the application into independent microservices during MVP.

## Reason

The operational cost is not justified initially.

Use modular boundaries and background jobs where necessary.

Extract a service only when there is a concrete reason such as:

-   independent scaling
-   separate deployment requirements
-   processing isolation
-   operational ownership

------------------------------------------------------------------------

# ADR-031 --- Maintain compliance test fixtures

## Decision

Maintain a version-controlled test corpus of valid, invalid, and
edge-case ZUGFeRD documents.

## Reason

Compliance regressions can be subtle.

Every change to the XML/PDF/validation pipeline should be tested against
known documents.

------------------------------------------------------------------------

# ADR-032 --- Generated invoice metadata is immutable

## Decision

Once an invoice has been finalized/generated, its generation metadata
should not be silently rewritten.

Record:

-   generation time
-   ZUGFeRD version
-   profile
-   validator version
-   generator version
-   artifact checksums

## Reason

This provides traceability and helps diagnose future validation
differences.
