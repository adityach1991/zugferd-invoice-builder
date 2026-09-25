# Compliance TODO

Tracked compliance obligations that are **not** blocking Milestone 0 but
**must be completed before production launch**.

## 1. Realistic carrier PDF with embedded fonts (REQUIRED BEFORE LAUNCH)

The POC and the current regression fixture use a vector-graphics-only
carrier PDF (no fonts), mirroring Balsoft's own `Carriers.Vector()` test
fixture. Balsoft's text-carrier tests (`Carriers.Text()`) run on Windows
fonts only and were not exercised on macOS.

**Requirement:** generate a realistic production carrier PDF — the kind
the app's PDF renderer will actually produce, containing embedded and
possibly unembedded TrueType fonts — pass it through `HybridPdf.Create`,
and validate the result with:

- veraPDF (PDF/A-3b)
- Mustang (Factur-X / ZUGFeRD hybrid)

Pay specific attention to:

- `HybridPdfOptions.EmbedMissingFonts` behaviour for TrueType fonts that
  are referenced but not embedded (Balsoft embeds them from system font
  folders by PostScript name; Type 1 fonts cannot be embedded this way)
- XMP metadata correctness with real document metadata (title, author)
- Multi-page carriers

**Done when:** a realistic carrier from the production renderer produces
a hybrid PDF that passes veraPDF 3b and Mustang, and the result is added
to `tests/fixtures/zugferd/valid/` with a manifest entry.

## 2. XRechnung 3.0 validation

The POC validated Factur-X BASIC only. XRechnung 3.0 additionally
requires (per Mustang's notices on the POC artifact):

- buyer reference (BT-10)
- seller contact group (BG-6)
- electronic addresses for seller and buyer
- XRechnung specification identifier (BT-24)

**Done when:** an XRechnung-profile invoice generated through the
`ZugferdService` boundary passes the KoSIT validator (XRechnung 3.0.2
configuration), and the canonical model/schema carry the required fields.

## 3. Additional Factur-X profiles

EN16931 and EXTENDED profiles use the same code path but have not been
externally validated. Run the fixture through Mustang for
`FACTURX_EXTENDED` and KoSIT for `EN16931` before enabling those
profiles in the product.
