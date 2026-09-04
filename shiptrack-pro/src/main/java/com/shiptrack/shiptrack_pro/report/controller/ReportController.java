package com.shiptrack.shiptrack_pro.report.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shiptrack.shiptrack_pro.report.service.ReportBuildingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportBuildingService reportBuildingService;

    // ============================================================
    // SHIPMENT REPORT
    // ============================================================

    @GetMapping("/shipments")
    public ResponseEntity<byte[]> shipmentReport(
            @RequestParam String format) {

        String email = getAuthenticatedEmail();

        byte[] report =
                reportBuildingService.buildShipmentReport(
                        email,
                        format);

        return buildResponse(
                report,
                format,
                "shipment-report");
    }

    // ============================================================
    // DELIVERY REPORT
    // ============================================================

    @GetMapping("/deliveries")
    public ResponseEntity<byte[]> deliveryReport(
            @RequestParam String format) {

        String email = getAuthenticatedEmail();

        byte[] report =
                reportBuildingService.buildDeliveryReport(
                        email,
                        format);

        return buildResponse(
                report,
                format,
                "delivery-report");
    }

    // ============================================================
    // ROUTE PERFORMANCE REPORT
    // ============================================================

    @GetMapping("/routes")
    public ResponseEntity<byte[]> routePerformanceReport(
            @RequestParam String format) {

        String email = getAuthenticatedEmail();

        byte[] report =
                reportBuildingService
                        .buildRoutePerformanceReport(
                                email,
                                format);

        return buildResponse(
                report,
                format,
                "route-performance-report");
    }

    // ============================================================
    // DELAY ANALYSIS REPORT
    // ============================================================

    @GetMapping("/delays")
    public ResponseEntity<byte[]> delayAnalysisReport(
            @RequestParam String format) {

        String email = getAuthenticatedEmail();

        byte[] report =
                reportBuildingService
                        .buildDelayAnalysisReport(
                                email,
                                format);

        return buildResponse(
                report,
                format,
                "delay-analysis-report");
    }

    // ============================================================
    // AUTHENTICATED USER EMAIL
    // ============================================================

    private String getAuthenticatedEmail() {

        org.springframework.security.core.Authentication
                authentication =
                org.springframework.security.core.context
                        .SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated");
        }

        return authentication.getName();
    }

    // ============================================================
    // FILE RESPONSE
    // ============================================================

    private ResponseEntity<byte[]> buildResponse(
            byte[] report,
            String format,
            String fileName) {

        boolean isPdf =
                "PDF".equalsIgnoreCase(format);

        String extension =
                isPdf ? ".pdf" : ".xlsx";

        MediaType contentType =
                isPdf
                        ? MediaType.APPLICATION_PDF
                        : MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(contentType);

        headers.setContentDisposition(
                ContentDisposition
                        .attachment()
                        .filename(
                                fileName + extension,
                                StandardCharsets.UTF_8)
                        .build());

        headers.setContentLength(
                report.length);

        return new ResponseEntity<>(
                report,
                headers,
                HttpStatus.OK);
    }
}