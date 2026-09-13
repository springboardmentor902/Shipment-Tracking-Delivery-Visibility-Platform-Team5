package com.shiptrack.shiptrack_pro.reports;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * One small, generic table-to-PDF writer shared by every report type in
 * ReportBuildingServiceImpl - avoids writing near-identical PDF-layout boilerplate four
 * times (once per report) times two (PDF + Excel). Uses OpenPDF 1.3.30's classic
 * com.lowagie.text API (the LGPL/MPL fork of iText 4) - landscape A4 since report tables
 * tend to be wide.
 */
public final class PdfTableWriter {

    private PdfTableWriter() {
    }

    public static byte[] write(String title, List<String> headers, List<List<String>> rows) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 36, 24);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            document.add(new Paragraph(title, titleFont));

            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.ITALIC);
            document.add(new Paragraph("Generated " + java.time.LocalDateTime.now(), metaFont));
            document.add(Chunk.NEWLINE);

            if (rows.isEmpty()) {
                Font emptyFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
                document.add(new Paragraph("No data available for this report.", emptyFont));
            } else {
                PdfPTable table = new PdfPTable(headers.size());
                table.setWidthPercentage(100);

                Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, Color.WHITE);
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                    cell.setBackgroundColor(new Color(0x16, 0x20, 0x2E)); // ink, matching the app's palette
                    cell.setPadding(5);
                    table.addCell(cell);
                }

                Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
                boolean shade = false;
                for (List<String> row : rows) {
                    for (String value : row) {
                        PdfPCell cell = new PdfPCell(new Phrase(value == null ? "" : value, cellFont));
                        cell.setPadding(4);
                        if (shade) {
                            cell.setBackgroundColor(new Color(0xEF, 0xEA, 0xDC)); // papershade
                        }
                        table.addCell(cell);
                    }
                    shade = !shade;
                }

                document.add(table);
            }

            document.close();
            return baos.toByteArray();

        } catch (DocumentException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate PDF report: " + e.getMessage());
        }
    }
}
