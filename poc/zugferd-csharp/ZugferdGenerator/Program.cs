using System;
using System.IO;
using System.Text;
using Balsoft.Hive.EInvoice;
using Balsoft.Hive.EInvoice.Cii;
using Balsoft.Hive.EInvoice.Pdf;
using Balsoft.Hive.EInvoice.Reading;
using Balsoft.Hive.EInvoice.Validation;
using PdfSharp.Drawing;
using PdfSharp.Pdf;




namespace ZugferdGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== ZUGFeRD 2.5.2 POC - XML Generation ===");
            var invoice = CreateInvoice();
            Console.WriteLine("\n=== Pre-flight validation ===");
            var validationResult = InvoiceValidator.Validate(invoice, InvoiceProfile.FacturXBasic);
            if (!validationResult.IsValid)
            {
                Console.WriteLine("Validation FAILED:");
                foreach (var issue in validationResult.Issues) Console.WriteLine($"  {issue}");
            }
            else { Console.WriteLine("Pre-flight validation PASSED"); }
            Console.WriteLine("\n=== Generating CII XML ===");
            byte[] xmlBytes = CiiWriter.Write(invoice, InvoiceProfile.FacturXBasic);
            string xml = Encoding.UTF8.GetString(xmlBytes);
            Directory.CreateDirectory("output");
            File.WriteAllText("output/invoice-facturx-basic.xml", xml);
            Console.WriteLine($"XML generated: {xmlBytes.Length} bytes");
            Console.WriteLine("\n=== Validating generated XML ===");
            var xmlValidationResult = InvoiceValidator.Validate(InvoiceReader.Read(xmlBytes).Invoice, InvoiceProfile.FacturXBasic);
            if (!xmlValidationResult.IsValid)
            {
                Console.WriteLine("XML validation FAILED:");
                foreach (var issue in xmlValidationResult.Issues) Console.WriteLine($"  {issue}");
            }
            else { Console.WriteLine("XML validation PASSED"); }
            Console.WriteLine("\n=== Generating Hybrid PDF/A-3 ===");
            try
            {
                byte[] carrierPdf = CreateCarrierPdf();
                File.WriteAllBytes("output/carrier.pdf", carrierPdf);
                byte[] hybridPdf = HybridPdf.Create(carrierPdf, invoice, InvoiceProfile.FacturXBasic);
                File.WriteAllBytes("output/invoice-facturx-basic.pdf", hybridPdf);
                Console.WriteLine($"Hybrid PDF generated: {hybridPdf.Length} bytes");
                Console.WriteLine("\n=== Extracting and verifying embedded XML ===");
                var extracted = HybridPdf.ReadInvoice(hybridPdf);
                Console.WriteLine($"Extracted: {extracted.Syntax} {extracted.Profile}");
                Console.WriteLine($"Invoice Number: {extracted.Invoice.Number}");
                Console.WriteLine($"Seller: {extracted.Invoice.Seller.Name}");
                Console.WriteLine($"Buyer: {extracted.Invoice.Buyer.Name}");
                byte[] extractedXml = CiiWriter.Write(extracted.Invoice, InvoiceProfile.FacturXBasic);
                string extractedXmlStr = Encoding.UTF8.GetString(extractedXml);
                File.WriteAllText("output/invoice-facturx-basic-extracted.xml", extractedXmlStr);
                if (xml.Equals(extractedXmlStr)) Console.WriteLine("SUCCESS: Extracted XML matches generated XML (byte-for-byte)");
                else Console.WriteLine("WARNING: Extracted XML differs from generated XML");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PDF generation error: {ex.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");
            }
        }

        static Invoice CreateInvoice()
        {
            var invoice = new Invoice
            {
                Number = "INV-2026-0001",
                IssueDate = new DateTime(2026, 9, 25),
                DueDate = new DateTime(2026, 10, 25),
                Currency = "EUR",
                Seller = new Party
                {
                    Name = "Muster GmbH",
                    VatIdentifier = "DE123456789",
                    Address = new PostalAddress { Line1 = "Mustergasse 1", PostCode = "10101", City = "Berlin", CountryCode = "DE" },
                    Contact = new Contact { Name = "Muster GmbH", Email = "info@muster.de", Phone = "+49 30 123456" }
                },
                Buyer = new Party
                {
                    Name = "Kunden AG",
                    VatIdentifier = "DE987654321",
                    Address = new PostalAddress { Line1 = "Kundenstraße 5", PostCode = "20095", City = "Hamburg", CountryCode = "DE" },
                    Contact = new Contact { Name = "Kunden AG", Email = "info@kunden.de", Phone = "+49 40 654321" }
                },
                PaymentInstructions = PaymentInstructions.SepaCreditTransfer("DE89 3704 0044 0532 0130 00"),
                PaymentTerms = "Net 30 days"
            };
            invoice.AddLine(new InvoiceLine("Web Development Services", 10m, UnitCode.Hour, 85m, 19m));
            return invoice;
        }

        // Mirrors Balsoft's own test fixture Carriers.Vector() from HybridPdfTests.cs:
        // vector graphics only, no fonts, runs on every platform.
        static byte[] CreateCarrierPdf()
        {
            using var doc = new PdfDocument();
            var page = doc.AddPage();
            using (var g = XGraphics.FromPdfPage(page))
            {
                g.DrawRectangle(new XSolidBrush(XColor.FromArgb(252, 182, 8)), 40, 40, 120, 30);
                g.DrawLine(XPens.Black, 40, 100, 550, 100);
                for (int i = 0; i < 5; i++) g.DrawRectangle(XPens.Gray, 40, 120 + i * 24, 510, 20);
            }
            using var ms = new MemoryStream();
            doc.Save(ms, false);
            return ms.ToArray();
        }
    }
}