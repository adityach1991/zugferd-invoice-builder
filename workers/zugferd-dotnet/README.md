# ZUGFeRD worker (C# / .NET 8)

HTTP worker that owns all ZUGFeRD/Factur-X compliance behaviour, per
ADR-003: the TypeScript application never touches Balsoft, CII, PDFsharp,
or PDF/A types directly. It talks to this worker over the application-level
contract defined in `src/schemas/zugferd-worker.ts` (mirrored in
`Contract.cs`).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + engine version |
| POST | `/zugferd/xml` | Canonical invoice -> CII XML (base64) |
| POST | `/zugferd/hybrid-pdf` | Canonical invoice + carrier PDF -> PDF/A-3 hybrid |
| POST | `/zugferd/extract` | Hybrid PDF -> canonical invoice |
| POST | `/zugferd/validate` | Pre-flight validation with structured issues |

Requests are validated against the profile rules *before* writing; invalid
invoices return HTTP 422 with structured issues (`ruleId`, `severity`,
`message`) instead of an exception.

## Run

```bash
dotnet run              # listens on http://localhost:5100
# or
ZUGFERD_WORKER_URL=http://localhost:5200 dotnet run
```

## Dependencies (pinned; validated by the POC in `poc/zugferd-csharp/`)

- Balsoft.Hive.EInvoice 1.0.0
- Balsoft.Hive.EInvoice.Pdf 1.0.0 (pulls PDFsharp 6.2.4 transitively)
- .NET 8

## Scope notes

- `SEPA_CREDIT_TRANSFER` is fully mapped; other payment means pass through
  as `OTHER` without bank details (extend `InvoiceMapper` when needed).
- External compliance validation (veraPDF/Mustang) is **not** part of this
  worker; see `poc/zugferd-csharp/README.md` for how those were run and
  `docs/COMPLIANCE-TODO.md` for the outstanding realistic-carrier test.
