package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.reports.ReportFile;

public interface ReportBuildingService {
    /** format: "pdf" or "excel" (case-insensitive, defaults to pdf if null). */
    ReportFile generateShipmentReport(Long userId, String role, String format);
    ReportFile generateDeliveryReport(Long userId, String role, String format);
    ReportFile generateRoutePerformanceReport(Long userId, String role, String format);
    ReportFile generateDelayAnalysisReport(Long userId, String role, String format);
}
