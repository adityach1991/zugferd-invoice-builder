# AGENTS.md --- ZUGFeRD Invoice SaaS

## 1. Project mission

This repository contains a production-oriented SaaS for creating,
validating, and managing ZUGFeRD electronic invoices.

Core user journeys:

1.  Create an invoice manually.
2.  Select an invoice design.
3.  Generate a ZUGFeRD-compliant hybrid invoice.
4.  Download the PDF/A-3 invoice and standalone XML.
5.  Validate ZUGFeRD invoices.
6.  For Standard/Premium users, upload an existing invoice PDF and use
    AI to populate the invoice form.
7.  Manage usage, subscription, profile, and recent invoice history.

The product should feel like a simple invoice builder, not a
standards-engineering application.

------------------------------------------------------------------------

## 2. Non-negotiable architectural principles

### 2.1 Canonical invoice model

There must be one canonical invoice domain model.

``` text
Manual Form ───────┐
                    ├──> Canonical Invoice Model ──> XML
AI Extraction ─────┘                              └─> PDF
                                                    └─> ZUGFeRD PDF/A-3
```

Do not create separate invoice representations for manual entry, AI
extraction, PDF rendering, and XML generation.

### 2.2 Server is authoritative

Never trust the browser for:

-   subscription plan
-   invoice quota
-   permissions
-   invoice ownership
-   generated-file access
-   validation status
-   payment status

All authorization and entitlement decisions must be made server-side.

### 2.3 Financial correctness

Use decimal arithmetic for monetary values.

Never rely on JavaScript floating-point arithmetic for financial
calculations.

All monetary calculations must have automated tests.

### 2.4 Compliance correctness

Never invent ZUGFeRD, Factur-X, EN 16931, CII, PDF/A-3, VAT, schema, or
validation rules.

Use authoritative specifications, schemas, validation artefacts, and
well-maintained libraries.

Keep standards/version/profile configuration isolated and versioned.

### 2.5 AI never finalizes financial documents

AI extraction produces a draft.

The user must review and confirm extracted information before
generation.

AI must never silently overwrite user-entered financial information.

### 2.6 Validate before success

A generated invoice must pass the supported validation pipeline before
the system marks it as successfully generated/validated.

### 2.7 Small changes

Prefer small, focused changes.

Do not modify unrelated files.

Do not perform large refactors while implementing an unrelated feature.

------------------------------------------------------------------------

## 3. Product behavior rules

### Authentication

-   Users may begin creating an invoice before signing up.
-   Authentication is required before final generation/download.
-   After signup/login, preserve the anonymous builder state.
-   Never discard user-entered invoice data during authentication.

### Invoice quotas

-   Free: 5 invoices per billing period.
-   Basic: 25.
-   Standard: 100.
-   Premium: 200.
-   Quota enforcement is server-side.
-   Quota consumption must be atomic.
-   A failed generation caused by an internal/server failure should not
    consume a credit.
-   A successfully generated finalized invoice consumes one credit.
-   Re-downloading an existing finalized invoice does not consume
    another credit.

### AI

-   AI invoice import is available only to Standard and Premium.
-   Uploaded PDFs must be treated as untrusted input.
-   AI extraction must result in a reviewable draft.
-   Conflicting or low-confidence extraction should be highlighted.
-   Multiple invoices in one PDF must be detected and handled safely.
-   AI provider failures must be recoverable.

### Files

-   Generated files belong to the user/account that created them.
-   File downloads must be authorized server-side.
-   Prefer short-lived signed URLs or an equivalent secure mechanism.
-   Uploaded documents and generated documents must not be publicly
    accessible.

------------------------------------------------------------------------

## 4. Code quality

Use:

-   strict TypeScript
-   runtime validation at external boundaries
-   clear domain/service/repository separation
-   automated tests
-   meaningful error types
-   structured logging
-   linting
-   formatting
-   type checking

Avoid:

-   `any` unless there is a documented reason
-   duplicated business logic
-   business rules inside React components
-   client-only authorization
-   magic numbers
-   hard-coded plan names throughout the codebase
-   direct database access from UI components
-   secrets in source code

------------------------------------------------------------------------

## 5. Suggested project boundaries

Keep these concerns separate:

``` text
auth/
billing/
entitlements/
invoice/
invoice-builder/
customers/
pdf/
zugferd/
validation/
ai/
files/
notifications/
admin/
```

The exact directory structure may evolve, but domain boundaries must
remain clear.

------------------------------------------------------------------------

## 6. ZUGFeRD implementation rules

ZUGFeRD generation should be treated as a dedicated subsystem.

It should own:

-   supported ZUGFeRD versions
-   profiles
-   XML mapping
-   XML schema handling
-   PDF/A-3 packaging
-   embedded XML metadata
-   validation artefacts
-   validator versioning

Do not scatter ZUGFeRD-specific logic across UI components.

Every generated document should retain internal metadata identifying:

-   ZUGFeRD version
-   profile
-   validator/ruleset version
-   generation engine version

------------------------------------------------------------------------

## 7. Security rules

Protect against:

-   broken object-level authorization
-   insecure direct object references
-   malicious file uploads
-   oversized uploads
-   path traversal
-   XSS
-   CSRF where applicable
-   SQL injection
-   SSRF through document processing
-   prompt injection through uploaded documents
-   abuse of AI endpoints
-   quota bypass
-   webhook forgery
-   replayed payment events

Treat invoice PDFs as untrusted input.

------------------------------------------------------------------------

## 8. AI-specific rules

The AI provider must be behind an abstraction.

Do not couple the product to a single model provider.

AI output must be validated against the canonical invoice schema before
entering the application domain.

Never trust raw model output.

Recommended pipeline:

``` text
PDF
 ↓
File safety checks
 ↓
Text extraction / OCR
 ↓
AI extraction
 ↓
Schema validation
 ↓
Business-rule validation
 ↓
Draft invoice
 ↓
Human review
 ↓
Canonical invoice
```

------------------------------------------------------------------------

## 9. Database rules

-   Use foreign keys.
-   Add appropriate indexes.
-   Use transactions for quota consumption and other multi-step state
    changes.
-   Store monetary values using a precise decimal type.
-   Do not store generated PDFs/XML blobs directly in the relational
    database unless there is a deliberate architectural reason.
-   Store file metadata and object-storage references in the database.
-   Every user-owned resource must have an ownership relationship that
    can be enforced server-side.

------------------------------------------------------------------------

## 10. Billing rules

The payment provider webhook is the source of truth for subscription
lifecycle events.

Never grant Premium access merely because the browser returned from
checkout successfully.

Handle:

-   successful payment
-   failed payment
-   subscription renewal
-   cancellation
-   upgrade
-   downgrade
-   refund
-   webhook retries
-   duplicate webhook delivery
-   out-of-order webhook events

Webhook processing must be idempotent.

------------------------------------------------------------------------

## 11. Testing expectations

Every business-critical feature must include tests.

Minimum areas:

-   invoice calculations
-   VAT calculations
-   rounding
-   invoice validation
-   XML mapping
-   ZUGFeRD packaging
-   quota enforcement
-   authorization
-   subscription entitlements
-   webhook idempotency
-   AI extraction schema validation
-   file access control

Use fixtures for valid and invalid ZUGFeRD documents.

------------------------------------------------------------------------

## 12. Development workflow for agents

Before implementing a non-trivial task:

1.  Read relevant project documentation.
2.  Inspect existing code.
3.  State the proposed approach.
4.  Identify affected files.
5.  Implement the smallest coherent change.
6.  Add/update tests.
7.  Run lint/typecheck/tests.
8.  Report what changed and any remaining risks.

For high-risk areas such as billing, authentication, database
migrations, ZUGFeRD compliance, or file security, explain the approach
before making changes.

------------------------------------------------------------------------

## 13. Definition of done

A task is not complete merely because the code compiles.

A feature is complete when:

-   implementation is finished
-   tests are added/updated
-   typecheck passes
-   lint passes
-   relevant tests pass
-   error handling exists
-   authorization is correct
-   documentation is updated when architecture/behavior changes
