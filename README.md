# ZUGFeRD Invoice Builder

B2B SaaS for creating, validating, and downloading ZUGFeRD/Factur-X
electronic invoices. See `PRD.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and
`AGENTS.md` for the product and architecture documentation.

## Stack

- Next.js 15 + TypeScript + React 19 (application)
- PostgreSQL + Prisma (persistence)
- C# .NET 8 worker + Balsoft.Hive.EInvoice (ZUGFeRD compliance, isolated
  behind `src/services/zugferd/` per ADR-003)
- Zod (boundary validation), Vitest (tests)

## Repository layout

```text
app/                  Next.js app router (placeholder UI until later milestones)
src/domain/invoice/   canonical invoice model (integer minor units, no floats)
src/schemas/          zod boundary schemas (API input, worker contract)
src/services/zugferd/ ZugferdService interface + HTTP adapter
src/repositories/     Prisma client
src/config/           typed, zod-validated configuration
prisma/               schema + migrations
workers/zugferd-dotnet/  C# ZUGFeRD worker (Balsoft.Hive.EInvoice 1.0.0)
tests/                unit, integration, and compliance fixtures
poc/zugferd-csharp/   preserved, passing technology POC (do not delete)
docs/                 compliance TODOs and operational notes
```

## Development setup

Requires Node.js 22+, .NET 8 SDK.

```bash
npm install

# 1. Start PostgreSQL (embedded dev server; no system install needed)
node scripts/dev-db.mjs start          # keeps running; Ctrl+C to stop

# 2. Apply migrations (first run)
npm run db:migrate
node scripts/verify-db.mjs             # optional smoke check

# 3. Start the ZUGFeRD worker (separate terminal)
cd workers/zugferd-dotnet && dotnet run   # http://localhost:5100

# 4. Run the app / checks
npm run dev
npm run typecheck && npm run lint && npm test
```

Copy `.env.example` to `.env` for local configuration (a working
development `.env` uses the defaults; never commit real secrets).

## Compliance

The ZUGFeRD technology POC passed external validation (veraPDF 1.30.2
PDF/A-3b, Mustang 2.9.0 Factur-X BASIC). Its artifacts are preserved as a
regression fixture in `tests/fixtures/zugferd/valid/poc-facturx-basic/`
with sha256 checksums; `tests/integration/compliance-regression.test.ts`
verifies them and regenerates the XML through the live worker.

Outstanding pre-launch compliance work is tracked in
`docs/COMPLIANCE-TODO.md` (realistic carrier PDF with fonts, XRechnung
3.0, additional profiles).
