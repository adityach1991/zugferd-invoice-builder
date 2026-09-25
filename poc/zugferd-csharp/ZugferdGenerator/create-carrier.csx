// Simple valid PDF using PdfSharp
using System;
using System.IO;
using PdfSharp.Pdf;
using PdfSharp.Drawing;

// Create a new PDF document
using (var doc = new PdfDocument())
{
    // Add a page
    var page = doc.AddPage();
    page.Size = PdfSharp.PageSize.PageSize.A4;
    
    // Draw text
    var gfx = XGraphics.FromPdfPage(page);
    var font = new XFont("Helvetica", 12);
    gfx.DrawString("INVOICE - INV-2026-0001", new XFont("Helvetica", 18, XFontStyle.Bold), XBrushes.Black, new XPoint(50, 50));
    gfx.DrawString("Date: 2026-09-25", font, XBrushes.Black, new XPoint(50, 100));
    gfx.DrawString("Seller: Muster GmbH", font, XBrushes.Black, new XPoint(50, 130));
    gfx.DrawString("Mustergasse 1, 10101 Berlin, DE", font, XBrushes.Black, new XPoint(50, 150));
    gfx.DrawString("VAT ID: DE123456789", font, XBrushes.Black, new XPoint(50, 170));
    gfx.DrawString("Buyer: Kunden AG", font, XBrushes.Black, new XPoint(50, 210));
    gfx.DrawString("Kundenstraße 5, 20095 Hamburg, DE", font, XBrushes.Black, new XPoint(50, 230));
    gfx.DrawString("VAT ID: DE987654321", font, XBrushes.Black, new XPoint(50, 250));
    
    // Save the PDF
    var fs = new FileStream("output/carrier.pdf", FileMode.Create);
    doc.Save(fs);
    fs.Close();
    Console.WriteLine("Carrier PDF created: output/carrier.pdf (size: " + fs.Length + " bytes)");
}
