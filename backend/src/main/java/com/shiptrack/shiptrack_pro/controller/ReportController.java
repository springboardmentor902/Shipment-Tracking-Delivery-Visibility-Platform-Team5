package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.reports.ReportFile;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.ReportBuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Reports & Export Module. Every endpoint is scoped server-side to the calling user via
 * ReportBuildingService -> ShipmentService.resolveAccessibleShipments(...) - CUSTOMER gets
 * only their own shipments, BUSINESS_CLIENT only their own business's, ADMINISTRATOR gets
 * everything. No id/businessId query parameter exists to ask for someone else's data.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CUSTOMER', 'BUSINESS_CLIENT', 'ADMINISTRATOR')")
public class ReportController {

    private final ReportBuildingService reportBuildingService;
    private final CurrentUser currentUser;

    @GetMapping("/shipments")
    public ResponseEntity<byte[]> shipments(@RequestParam(required = false) String format) {
        return download(reportBuildingService.generateShipmentReport(currentUser.id(), role(), format));
    }

    @GetMapping("/delivery")
    public ResponseEntity<byte[]> delivery(@RequestParam(required = false) String format) {
        return download(reportBuildingService.generateDeliveryReport(currentUser.id(), role(), format));
    }

    @GetMapping("/routes")
    public ResponseEntity<byte[]> routes(@RequestParam(required = false) String format) {
        return download(reportBuildingService.generateRoutePerformanceReport(currentUser.id(), role(), format));
    }

    @GetMapping("/delay-analysis")
    public ResponseEntity<byte[]> delayAnalysis(@RequestParam(required = false) String format) {
        return download(reportBuildingService.generateDelayAnalysisReport(currentUser.id(), role(), format));
    }

    private String role() {
        return currentUser.get().getRole();
    }

    private ResponseEntity<byte[]> download(ReportFile file) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(file.filename()).build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(file.contentType()))
                .body(file.content());
    }
}
