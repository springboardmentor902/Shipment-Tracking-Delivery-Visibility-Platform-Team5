package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.*;
import com.shiptrack.shiptrack_pro.repository.EtaPredictionRepository;
import com.shiptrack.shiptrack_pro.repository.ProofOfDeliveryRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.reports.ExcelTableWriter;
import com.shiptrack.shiptrack_pro.reports.PdfTableWriter;
import com.shiptrack.shiptrack_pro.reports.ReportFile;
import com.shiptrack.shiptrack_pro.service.ReportBuildingService;
import com.shiptrack.shiptrack_pro.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reports & Export Module. Every method starts from
 * ShipmentService.resolveAccessibleShipments(userId, role) - the exact same scoping logic
 * getForCurrentUser() uses for the ordinary shipment list - so "Customer: only own
 * shipments", "Business Client: only own business", "Admin: platform-wide" is enforced in
 * exactly one place, not reimplemented here. Route/POD/ETA data is fetched in bulk
 * (findAll() + filter to the scoped shipment ids) rather than once per shipment, since
 * that's a handful of queries regardless of how many shipments are in scope.
 */
@Service
@RequiredArgsConstructor
public class ReportBuildingServiceImpl implements ReportBuildingService {

    private final ShipmentService shipmentService;
    private final RouteRepository routeRepository;
    private final ProofOfDeliveryRepository podRepository;
    private final EtaPredictionRepository etaPredictionRepository;

    @Override
    public ReportFile generateShipmentReport(Long userId, String role, String format) {
        List<Shipment> shipments = shipmentService.resolveAccessibleShipments(userId, role);

        List<String> headers = List.of("Tracking Number", "Status", "Priority", "Sender", "Receiver",
                "Pickup Address", "Delivery Address", "Created At", "Est. Delivery", "Actual Delivery");

        List<List<String>> rows = shipments.stream()
                .sorted(sortByCreatedAtDesc())
                .map(s -> List.of(
                        nullSafe(s.getTrackingNumber()),
                        nullSafe(s.getStatus()),
                        nullSafe(s.getPriority()),
                        nullSafe(s.getSenderName()),
                        nullSafe(s.getReceiverName()),
                        nullSafe(s.getPickupAddress()),
                        nullSafe(s.getDeliveryAddress()),
                        nullSafe(s.getCreatedAt()),
                        nullSafe(s.getEstimatedDeliveryDate()),
                        nullSafe(s.getActualDeliveryDate())))
                .collect(Collectors.toCollection(ArrayList::new));

        return build("shipment-report", format, "Shipment Report", headers, rows);
    }

    @Override
    public ReportFile generateDeliveryReport(Long userId, String role, String format) {
        List<Shipment> delivered = shipmentService.resolveAccessibleShipments(userId, role).stream()
                .filter(s -> "DELIVERED".equals(s.getStatus()))
                .toList();

        Set<Long> shipmentIds = delivered.stream().map(Shipment::getId).collect(Collectors.toSet());
        Map<Long, ProofOfDelivery> podByShipmentId = podRepository.findAll().stream()
                .filter(p -> shipmentIds.contains(p.getShipmentId()))
                .collect(Collectors.toMap(ProofOfDelivery::getShipmentId, Function.identity(), (a, b) -> a));

        List<String> headers = List.of("Tracking Number", "Receiver", "Actual Delivery Date",
                "Delivered To", "POD Status", "Delivered At");

        List<List<String>> rows = delivered.stream()
                .sorted(comparatorActualDeliveryDesc())
                .map(s -> {
                    ProofOfDelivery pod = podByShipmentId.get(s.getId());
                    return List.of(
                            nullSafe(s.getTrackingNumber()),
                            nullSafe(s.getReceiverName()),
                            nullSafe(s.getActualDeliveryDate()),
                            pod == null ? "\u2014" : nullSafe(pod.getDeliveredToName()),
                            pod == null ? "NO PROOF ON FILE" : nullSafe(pod.getVerificationStatus()),
                            pod == null ? "\u2014" : nullSafe(pod.getDeliveredAt()));
                })
                .collect(Collectors.toCollection(ArrayList::new));

        return build("delivery-report", format, "Delivery Report", headers, rows);
    }

    @Override
    public ReportFile generateRoutePerformanceReport(Long userId, String role, String format) {
        List<Shipment> shipments = shipmentService.resolveAccessibleShipments(userId, role);
        Map<Long, Shipment> shipmentById = shipments.stream()
                .collect(Collectors.toMap(Shipment::getId, Function.identity(), (a, b) -> a));
        Set<Long> shipmentIds = shipmentById.keySet();

        List<Route> routes = routeRepository.findAll().stream()
                .filter(r -> shipmentIds.contains(r.getShipmentId()))
                .sorted(comparatorRouteCreatedDesc())
                .toList();

        List<String> headers = List.of("Tracking Number", "Origin", "Destination",
                "Distance (km)", "Estimated (min)", "Actual (min)", "Variance (min)");

        List<List<String>> rows = new ArrayList<>();
        for (Route r : routes) {
            Shipment s = shipmentById.get(r.getShipmentId());
            String variance = (r.getEstimatedTimeMinutes() != null && r.getActualTimeMinutes() != null)
                    ? String.valueOf(r.getActualTimeMinutes() - r.getEstimatedTimeMinutes())
                    : "\u2014";
            rows.add(List.of(
                    s == null ? "\u2014" : nullSafe(s.getTrackingNumber()),
                    nullSafe(r.getOrigin()),
                    nullSafe(r.getDestination()),
                    nullSafe(r.getDistanceKm()),
                    nullSafe(r.getEstimatedTimeMinutes()),
                    nullSafe(r.getActualTimeMinutes()),
                    variance));
        }

        return build("route-performance-report", format, "Route Performance Report", headers, rows);
    }

    @Override
    public ReportFile generateDelayAnalysisReport(Long userId, String role, String format) {
        List<Shipment> shipments = shipmentService.resolveAccessibleShipments(userId, role);
        Map<Long, Shipment> shipmentById = shipments.stream()
                .collect(Collectors.toMap(Shipment::getId, Function.identity(), (a, b) -> a));
        Set<Long> shipmentIds = shipmentById.keySet();

        List<EtaPrediction> predictions = etaPredictionRepository.findAll().stream()
                .filter(p -> shipmentIds.contains(p.getShipmentId()))
                .sorted(comparatorRiskDesc())
                .toList();

        List<String> headers = List.of("Tracking Number", "Status", "Delay Risk Score (0-10)",
                "Confidence (%)", "Predicted Delivery", "Factors");

        List<List<String>> rows = new ArrayList<>();
        for (EtaPrediction p : predictions) {
            Shipment s = shipmentById.get(p.getShipmentId());
            rows.add(List.of(
                    s == null ? "\u2014" : nullSafe(s.getTrackingNumber()),
                    s == null ? "\u2014" : nullSafe(s.getStatus()),
                    nullSafe(p.getDelayRiskScore()),
                    nullSafe(p.getConfidenceScore()),
                    nullSafe(p.getPredictedDeliveryTime()),
                    nullSafe(p.getFactors())));
        }

        return build("delay-analysis-report", format, "Delay Analysis Report", headers, rows);
    }

    // ---------- helpers ----------

    private ReportFile build(String reportType, String format, String title, List<String> headers, List<List<String>> rows) {
        String normalized = format == null ? "pdf" : format.trim().toLowerCase();
        if (!normalized.equals("pdf") && !normalized.equals("excel")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "format must be 'pdf' or 'excel', got: " + format);
        }

        boolean isPdf = normalized.equals("pdf");
        byte[] content = isPdf ? PdfTableWriter.write(title, headers, rows) : ExcelTableWriter.write(title, headers, rows);
        String extension = isPdf ? ".pdf" : ".xlsx";
        String contentType = isPdf ? ReportFile.PDF_CONTENT_TYPE : ReportFile.EXCEL_CONTENT_TYPE;
        String filename = reportType + "-" + LocalDate.now() + extension;

        return new ReportFile(content, filename, contentType);
    }

    private static String nullSafe(Object value) {
        return value == null ? "" : value.toString();
    }

    private static java.util.Comparator<Shipment> sortByCreatedAtDesc() {
        return java.util.Comparator.comparing(Shipment::getCreatedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }

    private static java.util.Comparator<Shipment> comparatorActualDeliveryDesc() {
        return java.util.Comparator.comparing(Shipment::getActualDeliveryDate,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }

    private static java.util.Comparator<Route> comparatorRouteCreatedDesc() {
        return java.util.Comparator.comparing(Route::getCreatedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }

    private static java.util.Comparator<EtaPrediction> comparatorRiskDesc() {
        return java.util.Comparator.comparing(EtaPrediction::getDelayRiskScore,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }
}
