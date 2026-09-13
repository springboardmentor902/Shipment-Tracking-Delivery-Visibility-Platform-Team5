package com.shiptrack.shiptrack_pro.reports;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/** The Excel counterpart to PdfTableWriter - same generic (title, headers, rows) shape, via Apache POI. */
public final class ExcelTableWriter {

    private ExcelTableWriter() {
    }

    public static byte[] write(String title, List<String> headers, List<List<String>> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Sheet names can't contain: \ / ? * [ ] and are capped at 31 chars.
            String sheetName = title.replaceAll("[\\\\/?*\\[\\]]", "").substring(0, Math.min(title.length(), 31));
            Sheet sheet = workbook.createSheet(sheetName);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.BLACK.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (List<String> row : rows) {
                Row excelRow = sheet.createRow(rowIndex++);
                for (int i = 0; i < row.size(); i++) {
                    excelRow.createCell(i).setCellValue(row.get(i) == null ? "" : row.get(i));
                }
            }

            for (int i = 0; i < headers.size(); i++) {
                try {
                    sheet.autoSizeColumn(i);
                } catch (Exception e) {
                    // autoSizeColumn needs AWT font metrics, which can misbehave on some
                    // headless server JVMs - purely cosmetic if it fails, so don't let a
                    // sizing hiccup break the whole report.
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate Excel report: " + e.getMessage());
        }
    }
}
