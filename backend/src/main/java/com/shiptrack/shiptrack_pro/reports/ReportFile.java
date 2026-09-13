package com.shiptrack.shiptrack_pro.reports;

/** What a report-generating method hands back to the controller: the bytes plus everything needed for the response headers. */
public record ReportFile(byte[] content, String filename, String contentType) {

    public static final String PDF_CONTENT_TYPE = "application/pdf";
    public static final String EXCEL_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}
