namespace ZugferdWorker;

/// <summary>
/// Application-level contract shared with the TypeScript application.
/// Mirrors src/schemas/zugferd-worker.ts exactly (camelCase JSON via
/// ASP.NET Core web defaults). No Balsoft/CII/PDF types cross this boundary.
/// </summary>
public record AddressDto(string Line1, string? Line2, string PostalCode, string City, string Country);

public record ContactDto(string? Name, string? Email, string? Phone);

public record PartyDto(
    string Name,
    string? LegalName,
    AddressDto Address,
    string? VatId,
    string? TaxNumber,
    ContactDto? Contact);

public record PaymentDto(string Means, string? Iban, string? Bic, string? Reference, string? Terms);

public record InvoiceLineDto(
    string Description,
    decimal Quantity,
    string Unit,
    int UnitPriceMinor,
    decimal VatRatePercent);

public record InvoiceDto(
    string Id,
    string Number,
    string IssueDate,
    string DueDate,
    string Currency,
    PartyDto Seller,
    PartyDto Buyer,
    PaymentDto Payment,
    List<InvoiceLineDto> Lines);

public record GenerateXmlRequest(string Profile, InvoiceDto Invoice);
public record GenerateXmlResponse(string XmlBase64, string Engine, string EngineVersion);

public record GenerateHybridPdfRequest(string Profile, InvoiceDto Invoice, string CarrierPdfBase64);
public record GenerateHybridPdfResponse(
    string PdfBase64,
    string XmlBase64,
    string EmbeddedFileName,
    string Engine,
    string EngineVersion);

public record ExtractInvoiceRequest(string PdfBase64);
public record ExtractInvoiceResponse(InvoiceDto Invoice, string Syntax, string Profile);

public record ValidateInvoiceRequest(string Profile, InvoiceDto Invoice);
public record ValidationIssueDto(string? RuleId, string Severity, string Message);
public record ValidateInvoiceResponse(bool Valid, List<ValidationIssueDto> Issues);

public record HealthResponse(string Status, string Engine, string EngineVersion);

public record ErrorResponse(string Error, List<ValidationIssueDto>? Issues);
