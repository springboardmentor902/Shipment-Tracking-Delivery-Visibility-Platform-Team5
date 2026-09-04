package com.shiptrack.shiptrack_pro.report.service;

public interface ReportBuildingService {

    byte[] buildShipmentReport(String email, String format);

    byte[] buildDeliveryReport(String email, String format);

    byte[] buildRoutePerformanceReport(String email, String format);

    byte[] buildDelayAnalysisReport(String email, String format);
}