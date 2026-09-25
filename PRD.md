# PRD --- ZUGFeRD Invoice SaaS

## 1. Product overview

### Working name

ZUGFeRD Invoice Builder

### Product type

B2B SaaS / Micro-SaaS

### Primary market

Germany and the broader European e-invoicing market.

### Primary users

-   freelancers
-   consultants
-   agencies
-   small businesses
-   accountants
-   professional-service businesses

### Product promise

> Create, validate, and download ZUGFeRD invoices without dealing with
> XML.

------------------------------------------------------------------------

# 2. Problem

Small businesses often need structured electronic invoices but do not
want to:

-   understand XML
-   implement CII
-   understand EN 16931
-   configure ZUGFeRD profiles
-   implement PDF/A-3
-   build validation pipelines
-   purchase or deploy an accounting/ERP platform

The product hides this complexity behind a familiar invoice builder.

------------------------------------------------------------------------

# 3. Goals

## Primary goals

1.  Make ZUGFeRD invoice creation simple.
2.  Generate technically valid hybrid invoices.
3.  Provide a useful free tier.
4.  Monetize higher usage and AI features.
5.  Provide a high-quality ZUGFeRD validator.
6.  Make repeated invoice creation fast.
7.  Create a foundation for future API, Peppol, and accounting
    integrations.

## Non-goals for MVP

-   full accounting software
-   bookkeeping
-   tax filing
-   payment reconciliation
-   full ERP
-   Peppol access point
-   invoice receiving
-   automated legal/tax advice

------------------------------------------------------------------------

# 4. User personas

## Persona A --- Freelancer

Needs 5--30 invoices/month.

Wants:

-   fast creation
-   professional PDF
-   compliant XML
-   no XML knowledge

## Persona B --- Small business

Needs 25--200 invoices/month.

Wants:

-   company defaults
-   customer reuse
-   history
-   AI import
-   reliable validation

## Persona C --- Accountant

Creates invoices for multiple businesses.

Future needs:

-   multiple companies
-   client workspaces
-   bulk operations
-   API

------------------------------------------------------------------------

# 5. Core user journeys

## Journey A --- Manual invoice

``` text
Landing page
→ Create Invoice
→ Fill builder
→ Select template
→ Preview
→ Click Generate
→ Signup/Login if necessary
→ Return to same builder state
→ Generate
→ Validate
→ Download PDF + XML
```

## Journey B --- AI invoice import

``` text
Dashboard
→ Create from PDF
→ Upload PDF
→ File checks
→ Extract information
→ Review extracted data
→ Correct data
→ Confirm
→ Generate
→ Validate
→ Download
```

## Journey C --- Validator

``` text
Landing/Dashboard
→ Validator
→ Upload ZUGFeRD PDF or XML
→ Extract/inspect XML
→ Validate
→ Display errors/warnings
```

------------------------------------------------------------------------

# 6. Landing page

## Hero

Headline:

> Create ZUGFeRD invoices in minutes.

Subheadline:

> Create, validate and download compliant ZUGFeRD invoices without
> dealing with XML.

Primary CTA:

> Create an invoice

Secondary CTA:

> Validate an invoice

## Sections

1.  How it works
2.  Four invoice templates
3.  AI PDF import
4.  ZUGFeRD/validation explanation
5.  Pricing
6.  FAQ
7.  Privacy/security
8.  CTA

------------------------------------------------------------------------

# 7. Authentication

Supported initially:

-   email/password
-   optional Google login

Requirements:

-   signup
-   login
-   logout
-   email verification
-   password reset
-   session handling

Anonymous users can begin the invoice builder.

When authentication is required, the application must preserve the
current builder state.

------------------------------------------------------------------------

# 8. Dashboard

The dashboard should show:

### Primary actions

-   Create Invoice
-   Create from PDF
-   Validate Invoice

### Usage

Example:

> 73 / 100 invoices used

### Plan

-   current plan
-   price
-   renewal date

### Recent invoices

Show the latest 5.

------------------------------------------------------------------------

# 9. Invoice plans

  Feature               Free   Basic   Standard   Premium
  ------------------- ------ ------- ---------- ---------
  Monthly invoices         5      25        100       200
  Price                   €0     €10        €20       €30
  Invoice builder        Yes     Yes        Yes       Yes
  4 templates            Yes     Yes        Yes       Yes
  ZUGFeRD PDF            Yes     Yes        Yes       Yes
  XML download           Yes     Yes        Yes       Yes
  Validator              Yes     Yes        Yes       Yes
  AI PDF extraction       No      No        Yes       Yes
  Own PDF workflow        No      No        Yes       Yes

The product should use entitlement-based access rather than hard-coding
plan checks throughout the UI.

------------------------------------------------------------------------

# 10. Invoice quota

A successful finalized invoice generation consumes one invoice credit.

Re-downloading an existing generated invoice does not consume another
credit.

A server-side failure before successful generation should not consume a
credit.

Quota consumption must be atomic.

Paid-plan quota should preferably follow the billing period rather than
calendar month.

------------------------------------------------------------------------

# 11. Invoice builder

## Seller

Fields:

-   company/legal name
-   address
-   country
-   VAT ID
-   tax ID where applicable
-   email
-   phone
-   website
-   logo
-   IBAN
-   BIC/SWIFT

## Buyer

Fields:

-   company/customer name
-   address
-   country
-   VAT ID
-   customer reference
-   buyer reference
-   electronic address
-   electronic address scheme
-   email
-   phone

## Invoice information

Fields:

-   invoice number
-   invoice date
-   due date
-   invoice type
-   currency
-   payment terms
-   purchase order number
-   contract number
-   delivery date/period
-   references

## Line items

Each line supports:

-   description
-   quantity
-   unit
-   unit price
-   discount
-   VAT rate
-   VAT category
-   line total

Actions:

-   add
-   delete
-   duplicate
-   reorder

------------------------------------------------------------------------

# 12. Calculation engine

Automatically calculate:

-   line net amount
-   discounts
-   taxable amount
-   VAT
-   gross total
-   amount due

Use exact decimal arithmetic.

Test rounding explicitly.

------------------------------------------------------------------------

# 13. VAT/tax support

The application should support the tax treatments required by the
selected supported invoice profiles, including where applicable:

-   standard VAT
-   zero VAT
-   exempt
-   reverse charge
-   intra-EU supplies
-   exports

Tax logic must be isolated from the UI and versioned/configurable where
rules change.

Do not present the product as a substitute for tax advice.

------------------------------------------------------------------------

# 14. Templates

Initial templates:

1.  Classic
2.  Modern
3.  Professional
4.  Minimal

All templates must consume the same canonical invoice model.

The template layer must not contain business logic.

------------------------------------------------------------------------

# 15. Preview

Preview should reflect the final invoice closely.

Preview must support:

-   line items
-   totals
-   seller/buyer information
-   payment details
-   logo
-   page breaks

Long descriptions and long addresses must not break layout.

------------------------------------------------------------------------

# 16. ZUGFeRD generation

Generation pipeline:

``` text
Canonical Invoice
→ Business validation
→ XML generation
→ XML validation
→ PDF rendering
→ PDF/A-3 processing
→ Embed XML
→ Final validation
→ Store artifacts
→ Download
```

Primary output:

-   ZUGFeRD hybrid PDF/A-3

Secondary output:

-   standalone XML

Optional:

-   ZIP containing PDF + XML

The exact supported ZUGFeRD version/profile must be configurable and
versioned.

------------------------------------------------------------------------

# 17. AI PDF import

Available to Standard and Premium.

Input:

-   PDF

Processing:

``` text
Upload
→ file safety checks
→ text extraction
→ OCR if required
→ AI extraction
→ schema validation
→ business validation
→ review screen
→ user confirmation
```

AI must never directly finalize an invoice.

------------------------------------------------------------------------

# 18. AI extraction fields

Potential fields:

-   seller
-   buyer
-   VAT IDs
-   invoice number
-   dates
-   currency
-   payment terms
-   purchase order
-   line items
-   quantities
-   prices
-   VAT rates
-   totals
-   bank details

Extraction should explicitly represent:

-   extracted
-   uncertain
-   missing
-   conflicting

------------------------------------------------------------------------

# 19. AI edge cases

Handle:

-   scanned PDFs
-   rotated PDFs
-   poor OCR
-   multiple invoices in one PDF
-   credit notes
-   missing invoice number
-   missing VAT ID
-   conflicting totals
-   duplicate line items
-   unsupported document
-   password-protected PDF
-   corrupted PDF
-   oversized PDF

If extraction is unreliable, fall back to manual entry.

------------------------------------------------------------------------

# 20. User-provided PDF workflow

The product should distinguish between:

1.  Extracting data from an uploaded PDF.
2.  Producing a ZUGFeRD-compliant hybrid PDF.

A normal PDF cannot automatically be assumed to be suitable for ZUGFeRD
packaging.

Pipeline:

``` text
Uploaded PDF
→ compatibility inspection
→ PDF/A-3 conversion if feasible
→ embed XML
→ validate
```

If conversion fails, use the extracted invoice data with a supported
product template instead.

Never claim that the original uploaded PDF is compliant if it has not
passed the actual technical validation pipeline.

------------------------------------------------------------------------

# 21. Validator

Inputs:

-   ZUGFeRD PDF
-   XML

Potential future:

-   ZIP

Validation layers:

``` text
File inspection
→ XML extraction
→ XML schema validation
→ ZUGFeRD rules
→ EN 16931 rules
→ result
```

Results:

-   PASS
-   FAIL
-   WARNING
-   INFORMATION

Each issue should contain:

-   human-readable message
-   severity
-   relevant field when possible
-   technical rule/code when useful

Avoid showing only cryptic rule IDs.

------------------------------------------------------------------------

# 22. History

Default display:

Last 10 generated invoices.

Fields:

-   invoice number
-   customer
-   date
-   amount
-   status
-   actions

Actions:

-   view
-   download PDF
-   download XML
-   duplicate
-   delete where supported

------------------------------------------------------------------------

# 23. Invoice detail

Show:

-   invoice number
-   customer
-   amount
-   date
-   generation date
-   ZUGFeRD version
-   profile
-   validation status
-   PDF
-   XML

Actions:

-   Download PDF
-   Download XML
-   Duplicate

------------------------------------------------------------------------

# 24. Duplicate invoice

Duplicate should create a draft with:

-   seller
-   buyer
-   line items
-   payment details
-   template

The user must review invoice number/date before finalization.

------------------------------------------------------------------------

# 25. Profile

Company profile:

-   name
-   address
-   VAT ID
-   tax ID
-   email
-   phone
-   logo
-   IBAN
-   BIC
-   default currency
-   default VAT
-   default payment terms

Personal profile:

-   name
-   email
-   password
-   language
-   timezone
-   notifications

------------------------------------------------------------------------

# 26. Subscription

Show:

-   current plan
-   monthly price
-   invoices used
-   invoice limit
-   billing period
-   renewal date

Actions:

-   upgrade
-   downgrade
-   cancel
-   manage billing

Lifecycle must handle:

-   new subscription
-   upgrade
-   downgrade
-   cancellation
-   failed payment
-   retry
-   refund

------------------------------------------------------------------------

# 27. File storage

Generated PDFs, XML, and uploaded documents should be stored in private
object storage.

Database stores metadata and object locations.

Downloads must be authorized server-side.

Prefer short-lived signed download URLs.

------------------------------------------------------------------------

# 28. Data privacy

The application may process:

-   business addresses
-   VAT IDs
-   customer information
-   invoice amounts
-   bank details
-   uploaded invoice documents

Requirements:

-   privacy policy
-   terms
-   data retention policy
-   account deletion
-   data export where applicable
-   subprocessor disclosure
-   encryption
-   access controls

AI processing must be transparently documented.

------------------------------------------------------------------------

# 29. Security

Required:

-   secure authentication
-   server-side authorization
-   rate limiting
-   secure file uploads
-   malware scanning where appropriate
-   object-level access control
-   webhook signature verification
-   idempotent webhooks
-   secrets management
-   secure headers
-   audit logging for sensitive actions

------------------------------------------------------------------------

# 30. Analytics

Track:

### Acquisition

-   landing views
-   Create Invoice clicks
-   Validator clicks
-   signup

### Activation

-   builder started
-   first invoice created
-   first validated invoice
-   first download

### Conversion

-   plan upgrades
-   downgrades
-   cancellation
-   churn

### AI

-   upload started
-   upload succeeded
-   extraction success
-   extraction failure
-   fields corrected
-   final generation

### Revenue

-   MRR
-   ARPU
-   conversion
-   churn

------------------------------------------------------------------------

# 31. North-star metric

Successfully generated and validated invoices per active customer.

Activation:

> A user who creates their first successfully validated invoice within
> 24 hours of signup.

------------------------------------------------------------------------

# 32. SEO

Potential acquisition pages:

-   ZUGFeRD invoice generator
-   ZUGFeRD validator
-   ZUGFeRD XML generator
-   ZUGFeRD PDF generator
-   ZUGFeRD PDF/A-3
-   ZUGFeRD invoice template
-   ZUGFeRD 2.5
-   Factur-X generator
-   EN 16931 validator

A free validator can act as a top-of-funnel acquisition channel.

------------------------------------------------------------------------

# 33. Future roadmap

## Phase 2

-   recurring invoices
-   customer database
-   automatic invoice numbering
-   more templates
-   annual plans
-   email invoice delivery

## Phase 3

-   API
-   bulk generation
-   accounting integrations
-   team accounts
-   multi-company

## Phase 4

-   invoice sending
-   invoice receiving
-   Peppol
-   e-invoice inbox
-   payment tracking
-   reconciliation

------------------------------------------------------------------------

# 34. MVP acceptance criteria

A user can:

1.  Visit the landing page.
2.  Start an invoice without an account.
3.  Fill seller, buyer, metadata and line items.
4.  Select a template.
5.  Preview.
6.  Signup while preserving the draft.
7.  Generate a ZUGFeRD invoice.
8.  Download PDF.
9.  Download XML.
10. Validate the generated invoice.
11. See the invoice in history.
12. See usage.
13. Upgrade subscription.
14. Continue generating according to the new entitlement.

Standard/Premium users can also:

15. Upload a PDF.
16. Extract invoice information.
17. Review extracted information.
18. Correct it.
19. Generate a final invoice.
20. Validate and download it.
