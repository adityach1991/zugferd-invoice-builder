# ZUGFeRD Technology POC (C# / Balsoft.Hive.EInvoice)

This directory contains the technology proof-of-concept that validated the
ZUGFeRD/Factur-X generation stack for this product. **It passed.** Do not
delete it; the generated artifacts are the project's first compliance
regression fixture (copied to `tests/fixtures/zugferd/valid/poc-facturx-basic/`).

## What it proves

| Capability | Evidence | Result |
|---|---|---|
| CII XML generation | LOCAL EXECUTION | PASS - `CiiWriter.Write` produced 4,939-byte Factur-X BASIC CII XML |
| Built-in invoice validation | LOCAL EXECUTION | PASS - `InvoiceValidator.Validate` pre-flight passed |
| XML embedding (PDF/A-3 packaging) | LOCAL EXECUTION | PASS - `HybridPdf.Create` embedded `factur-x.xml` (text/xml, AF `/Alternative`) |
| XML extraction | LOCAL EXECUTION | PASS - `HybridPdf.ReadInvoice` round-trip, byte-identical XML |
| PDF/A-3b | EXTERNAL VALIDATION | PASS - veraPDF 1.30.2, flavour 3b, 146/0 rules, 393/0 checks |
| Factur-X BASIC hybrid validation | EXTERNAL VALIDATION | PASS - Mustang-CLI 2.9.0, PDF valid + XML valid |

## Exact dependency versions

| Component | Version |
|---|---|
| .NET SDK | 8.0.121 |
| Balsoft.Hive.EInvoice | 1.0.0 |
| Balsoft.Hive.EInvoice.Pdf | 1.0.0 |
| PDFsharp (transitive) | 6.2.4 |
| veraPDF (external validator) | 1.30.2 (greenfield) |
| Mustang-CLI (external validator) | 2.9.0 |
| Java (for validators) | OpenJDK 17.0.16 (Homebrew) |

## Layout

- `ZugferdGenerator/` - the POC console app. Creates the canonical test
  invoice, validates it, writes CII XML, builds a vector-graphics carrier PDF
  (mirroring Balsoft's own `Carriers.Vector()` test fixture), packages the
  hybrid PDF, and verifies the XML round-trip.
- `ZugferdGenerator/output/` - generated artifacts and external validation
  reports (committed; these are the compliance reference outputs).
- `inspect/` - leftover reflection experiment from API discovery. Historical
  only; not part of the passing POC.
- `tools/` - **not committed** (large binaries). External validators live here
  locally: `Mustang-CLI-2.9.0.jar` and the installed `verapdf/` CLI.

## Run it

```bash
cd ZugferdGenerator
dotnet run
```

Expected output ends with:

```text
SUCCESS: Extracted XML matches generated XML (byte-for-byte)
```

## Re-run external validation (optional)

Requires Java 17+.

```bash
# PDF/A-3b (veraPDF 1.30.2)
tools/verapdf/verapdf --flavour 3b \
  ZugferdGenerator/output/invoice-facturx-basic.pdf

# Factur-X hybrid (Mustang 2.9.0)
java -jar tools/Mustang-CLI-2.9.0.jar --action validate \
  --source ZugferdGenerator/output/invoice-facturx-basic.pdf
```

Both must report the document as compliant/valid.

### Re-obtaining the validators

- veraPDF: <https://software.verapdf.org/releases/1.30/verapdf-greenfield-1.30.2-installer.zip>
  (izpack installer; `tools/auto-install.xml` in the git history shows the
  unattended install answers - install only the "veraPDF CLI" pack)
- Mustang-CLI: <https://repo1.maven.org/maven2/org/mustangproject/Mustang-CLI/2.9.0/Mustang-CLI-2.9.0.jar>

## Known limitations (scope of the POC)

- Validated for **Factur-X BASIC** only. XRechnung 3.0 was not in scope;
  Mustang's notices (BR-DE-2, BR-DE-15, BR-DE-21, PEPPOL-EN16931-R010/R020)
  document what XRechnung additionally requires.
- The carrier PDF is vector graphics only (no fonts). A realistic carrier PDF
  with embedded fonts must be validated before production launch - tracked in
  `docs/COMPLIANCE-TODO.md`.
