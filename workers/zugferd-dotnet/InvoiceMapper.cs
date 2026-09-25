using System.Globalization;
using Balsoft.Hive.EInvoice;

namespace ZugferdWorker;

/// <summary>
/// Maps the application-level canonical invoice DTO to the Balsoft
/// compliance model and back. This is the only place in the system where
/// the two representations meet (ADR-003).
/// </summary>
public static class InvoiceMapper
{
    public static InvoiceProfile ParseProfile(string profile) => profile switch
    {
        "FACTURX_MINIMUM" => InvoiceProfile.FacturXMinimum,
        "FACTURX_BASIC_WL" => InvoiceProfile.FacturXBasicWL,
        "FACTURX_BASIC" => InvoiceProfile.FacturXBasic,
        "EN16931" => InvoiceProfile.EN16931,
        "FACTURX_EXTENDED" => InvoiceProfile.FacturXExtended,
        "XRECHNUNG" => InvoiceProfile.XRechnung,
        _ => throw new ArgumentException($"Unknown ZUGFeRD profile: {profile}"),
    };

    public static string ProfileToWire(InvoiceProfile profile) => profile switch
    {
        InvoiceProfile.FacturXMinimum => "FACTURX_MINIMUM",
        InvoiceProfile.FacturXBasicWL => "FACTURX_BASIC_WL",
        InvoiceProfile.FacturXBasic => "FACTURX_BASIC",
        InvoiceProfile.EN16931 => "EN16931",
        InvoiceProfile.FacturXExtended => "FACTURX_EXTENDED",
        InvoiceProfile.XRechnung => "XRECHNUNG",
        _ => profile.ToString(),
    };

    private static decimal MinorToMajor(int minor) => minor / 100m;

    private static int MajorToMinor(decimal major) =>
        decimal.ToInt32(decimal.Round(major * 100m, 0, MidpointRounding.AwayFromZero));

    private static DateTime ParseDate(string iso) =>
        DateOnly.ParseExact(iso, "yyyy-MM-dd", CultureInfo.InvariantCulture).ToDateTime(TimeOnly.MinValue);

    private static string FormatDate(DateTime date) => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    public static Invoice ToBalsoft(InvoiceDto dto)
    {
        var invoice = new Invoice
        {
            Number = dto.Number,
            IssueDate = ParseDate(dto.IssueDate),
            DueDate = ParseDate(dto.DueDate),
            Currency = dto.Currency,
            Seller = ToBalsoftParty(dto.Seller),
            Buyer = ToBalsoftParty(dto.Buyer),
            PaymentTerms = dto.Payment.Terms,
        };

        if (dto.Payment.Means == "SEPA_CREDIT_TRANSFER" && dto.Payment.Iban is { Length: > 0 } iban)
        {
            invoice.PaymentInstructions = PaymentInstructions.SepaCreditTransfer(iban, dto.Payment.Bic);
        }

        foreach (var line in dto.Lines)
        {
            invoice.AddLine(new InvoiceLine(
                itemName: line.Description,
                quantity: line.Quantity,
                unitCode: line.Unit,
                netPrice: MinorToMajor(line.UnitPriceMinor),
                vatRate: line.VatRatePercent));
        }

        return invoice;
    }

    private static Party ToBalsoftParty(PartyDto dto) => new()
    {
        Name = dto.Name,
        VatIdentifier = dto.VatId,
        TaxRegistrationIdentifier = dto.TaxNumber,
        Address = new PostalAddress
        {
            Line1 = dto.Address.Line1,
            Line2 = dto.Address.Line2,
            PostCode = dto.Address.PostalCode,
            City = dto.Address.City,
            CountryCode = dto.Address.Country,
        },
        Contact = dto.Contact is null
            ? null
            : new Contact { Name = dto.Contact.Name, Email = dto.Contact.Email, Phone = dto.Contact.Phone },
    };

    public static InvoiceDto ToDto(Invoice invoice)
    {
        var creditTransfer = invoice.PaymentInstructions?.CreditTransfers.FirstOrDefault();
        return new InvoiceDto(
            Id: "extracted",
            Number: invoice.Number,
            IssueDate: FormatDate(invoice.IssueDate),
            DueDate: invoice.DueDate.HasValue ? FormatDate(invoice.DueDate.Value) : "",
            Currency: invoice.Currency,
            Seller: ToDtoParty(invoice.Seller),
            Buyer: ToDtoParty(invoice.Buyer),
            Payment: new PaymentDto(
                Means: creditTransfer is null ? "OTHER" : "SEPA_CREDIT_TRANSFER",
                Iban: creditTransfer?.AccountIdentifier,
                Bic: creditTransfer?.ServiceProviderIdentifier,
                Reference: invoice.PaymentInstructions?.RemittanceInformation,
                Terms: invoice.PaymentTerms),
            Lines: invoice.Lines.Select(line => new InvoiceLineDto(
                Description: line.Item.Name,
                Quantity: line.Quantity,
                Unit: line.UnitCode,
                UnitPriceMinor: MajorToMinor(line.NetPrice),
                VatRatePercent: line.VatRate ?? 0m)).ToList());
    }

    private static PartyDto ToDtoParty(Party party) => new(
        Name: party.Name,
        LegalName: null,
        Address: new AddressDto(
            Line1: party.Address?.Line1 ?? "",
            Line2: party.Address?.Line2,
            PostalCode: party.Address?.PostCode ?? "",
            City: party.Address?.City ?? "",
            Country: party.Address?.CountryCode ?? ""),
        VatId: party.VatIdentifier,
        TaxNumber: party.TaxRegistrationIdentifier,
        Contact: party.Contact is null
            ? null
            : new ContactDto(party.Contact.Name, party.Contact.Email, party.Contact.Phone));
}
