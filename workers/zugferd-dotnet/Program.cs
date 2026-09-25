using System.Text.Json.Serialization;
using Balsoft.Hive.EInvoice;
using Balsoft.Hive.EInvoice.Cii;
using Balsoft.Hive.EInvoice.Pdf;
using Balsoft.Hive.EInvoice.Validation;
using ZugferdWorker;

const string Engine = "Balsoft.Hive.EInvoice";
const string EngineVersion = "1.0.0";

var builder = WebApplication.CreateBuilder(args);
// The TypeScript contract treats absent fields as optional; omit nulls
// instead of emitting them explicitly.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
var app = builder.Build();

static List<ValidationIssueDto> MapIssues(ValidationResult result) =>
    result.Issues.Select(issue => new ValidationIssueDto(
        RuleId: issue.RuleId,
        Severity: issue.Severity == Severity.Error ? "error" : "warning",
        Message: issue.Message)).ToList();

// Validates before writing so callers get structured issues instead of an
// exception; CiiWriter would otherwise throw InvoiceValidationException.
static IResult? PreValidate(Invoice invoice, InvoiceProfile profile, out ValidationResult result)
{
    result = InvoiceValidator.Validate(invoice, profile);
    if (result.IsValid) return null;
    return Results.UnprocessableEntity(new ErrorResponse("validation_failed", MapIssues(result)));
}

app.MapGet("/health", () => new HealthResponse("ok", Engine, EngineVersion));

app.MapPost("/zugferd/xml", (GenerateXmlRequest request) =>
{
    try
    {
        var profile = InvoiceMapper.ParseProfile(request.Profile);
        var invoice = InvoiceMapper.ToBalsoft(request.Invoice);
        if (PreValidate(invoice, profile, out _) is { } failure) return failure;
        var xml = CiiWriter.Write(invoice, profile);
        return Results.Ok(new GenerateXmlResponse(Convert.ToBase64String(xml), Engine, EngineVersion));
    }
    catch (ArgumentException ex) { return Results.BadRequest(new ErrorResponse(ex.Message, null)); }
});

app.MapPost("/zugferd/hybrid-pdf", (GenerateHybridPdfRequest request) =>
{
    try
    {
        var profile = InvoiceMapper.ParseProfile(request.Profile);
        var invoice = InvoiceMapper.ToBalsoft(request.Invoice);
        if (PreValidate(invoice, profile, out _) is { } failure) return failure;
        var carrier = Convert.FromBase64String(request.CarrierPdfBase64);
        var pdf = HybridPdf.Create(carrier, invoice, profile);
        var xml = CiiWriter.Write(invoice, profile);
        return Results.Ok(new GenerateHybridPdfResponse(
            Convert.ToBase64String(pdf),
            Convert.ToBase64String(xml),
            profile.EmbeddedFileName(),
            Engine,
            EngineVersion));
    }
    catch (ArgumentException ex) { return Results.BadRequest(new ErrorResponse(ex.Message, null)); }
    catch (FormatException) { return Results.BadRequest(new ErrorResponse("carrier_pdf_invalid", null)); }
});

app.MapPost("/zugferd/extract", (ExtractInvoiceRequest request) =>
{
    try
    {
        var pdf = Convert.FromBase64String(request.PdfBase64);
        var read = HybridPdf.ReadInvoice(pdf);
        if (read.Invoice is null) return Results.BadRequest(new ErrorResponse("no_invoice_found", null));
        return Results.Ok(new ExtractInvoiceResponse(
            InvoiceMapper.ToDto(read.Invoice),
            read.Syntax.ToString(),
            read.Profile.HasValue ? InvoiceMapper.ProfileToWire(read.Profile.Value) : "UNKNOWN"));
    }
    catch (FormatException ex) { return Results.BadRequest(new ErrorResponse(ex.Message, null)); }
    catch (Exception ex) { return Results.BadRequest(new ErrorResponse($"extract_failed: {ex.Message}", null)); }
});

app.MapPost("/zugferd/validate", (ValidateInvoiceRequest request) =>
{
    try
    {
        var profile = InvoiceMapper.ParseProfile(request.Profile);
        var invoice = InvoiceMapper.ToBalsoft(request.Invoice);
        var result = InvoiceValidator.Validate(invoice, profile);
        return Results.Ok(new ValidateInvoiceResponse(result.IsValid, MapIssues(result)));
    }
    catch (ArgumentException ex) { return Results.BadRequest(new ErrorResponse(ex.Message, null)); }
});

var url = Environment.GetEnvironmentVariable("ZUGFERD_WORKER_URL") ?? "http://localhost:5100";
app.Run(url);
