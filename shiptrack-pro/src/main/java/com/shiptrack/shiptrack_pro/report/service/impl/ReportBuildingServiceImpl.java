package com.shiptrack.shiptrack_pro.report.service.impl;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ProofOfDeliveryRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.report.service.ReportBuildingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportBuildingServiceImpl implements ReportBuildingService {

    private final ShipmentRepository shipmentRepository;
    private final RouteRepository routeRepository;
    private final ProofOfDeliveryRepository proofOfDeliveryRepository;
    private final UserRepository userRepository;

    // ============================================================
    // 1. SHIPMENT REPORT
    // ============================================================

    @Override
    public byte[] buildShipmentReport(String email, String format) {

        User user = getUser(email);

        List<Shipment> shipments = getScopedShipments(user);

        validateFormat(format);

        if ("PDF".equalsIgnoreCase(format)) {
            return generateShipmentPdf(shipments, user);
        }

        return generateShipmentExcel(shipments, user);
    }

    // ============================================================
    // 2. DELIVERY REPORT
    // ============================================================

    @Override
    public byte[] buildDeliveryReport(String email, String format) {

        User user = getUser(email);

        List<Shipment> shipments = getScopedShipments(user);

        validateFormat(format);

        if ("PDF".equalsIgnoreCase(format)) {
            return generateDeliveryPdf(shipments, user);
        }

        return generateDeliveryExcel(shipments, user);
    }

    // ============================================================
    // 3. ROUTE PERFORMANCE REPORT
    // ============================================================

    @Override
    public byte[] buildRoutePerformanceReport(
            String email,
            String format) {

        User user = getUser(email);

        List<Shipment> shipments = getScopedShipments(user);

        validateFormat(format);

        if ("PDF".equalsIgnoreCase(format)) {
            return generateRoutePdf(shipments, user);
        }

        return generateRouteExcel(shipments, user);
    }

    // ============================================================
    // 4. DELAY ANALYSIS REPORT
    // ============================================================

    @Override
    public byte[] buildDelayAnalysisReport(
            String email,
            String format) {

        User user = getUser(email);

        List<Shipment> shipments = getScopedShipments(user);

        validateFormat(format);

        List<Shipment> delayedShipments =
                getDelayedShipments(shipments);

        if ("PDF".equalsIgnoreCase(format)) {
            return generateDelayPdf(delayedShipments, user);
        }

        return generateDelayExcel(delayedShipments, user);
    }

    // ============================================================
    // USER / ROLE / DATA SCOPE
    // ============================================================

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found: " + email));
    }

    private List<Shipment> getScopedShipments(User user) {

        String role = user.getRole();

        if (role == null) {
            throw new IllegalArgumentException(
                    "User role is not available");
        }

        if ("CUSTOMER".equalsIgnoreCase(role)) {

            return shipmentRepository
                    .findByCreatedBy(user.getId());
        }

        if ("BUSINESS_CLIENT".equalsIgnoreCase(role)) {

            return shipmentRepository.findAll()
                    .stream()
                    .filter(shipment ->
                            Objects.equals(
                                    shipment.getBusinessId(),
                                    user.getId()))
                    .toList();
        }

        if ("ADMINISTRATOR".equalsIgnoreCase(role)) {

            return shipmentRepository.findAll();
        }

        throw new IllegalArgumentException(
                "You are not authorized to generate reports");
    }

    // ============================================================
    // DELAY CALCULATION
    // ============================================================

    private List<Shipment> getDelayedShipments(
            List<Shipment> shipments) {

        if (shipments == null || shipments.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDate today = LocalDate.now();

        List<Shipment> delayed = new ArrayList<>();

        for (Shipment shipment : shipments) {

            if (shipment.getEstimatedDeliveryDate() == null) {
                continue;
            }

            // Delivered shipment:
            // actual date after estimated date = delayed
            if (shipment.getActualDeliveryDate() != null) {

                if (shipment.getActualDeliveryDate()
                        .isAfter(
                                shipment.getEstimatedDeliveryDate())) {

                    delayed.add(shipment);
                }

                continue;
            }

            // Not delivered:
            // estimated date already passed = delayed
            if (today.isAfter(
                    shipment.getEstimatedDeliveryDate())) {

                delayed.add(shipment);
            }
        }

        return delayed;
    }

    // ============================================================
    // FORMAT VALIDATION
    // ============================================================

    private void validateFormat(String format) {

        if (format == null ||
                (!"PDF".equalsIgnoreCase(format)
                && !"EXCEL".equalsIgnoreCase(format))) {

            throw new IllegalArgumentException(
                    "Format must be PDF or Excel");
        }
    }

    // ============================================================
    // SHIPMENT PDF
    // ============================================================

    private byte[] generateShipmentPdf(
            List<Shipment> shipments,
            User user) {

        try (ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Document document =
                    new Document(PageSize.A4.rotate());

            PdfWriter.getInstance(
                    document,
                    output);

            document.open();

            addTitle(
                    document,
                    "ShipTrack Pro - Shipment Report");

            addSubtitle(
                    document,
                    "Generated for: " + user.getEmail());

            PdfPTable table =
                    new PdfPTable(7);

            table.setWidthPercentage(100);

            addPdfHeader(table, "ID");
            addPdfHeader(table, "Tracking Number");
            addPdfHeader(table, "Sender");
            addPdfHeader(table, "Receiver");
            addPdfHeader(table, "Status");
            addPdfHeader(table, "Created Date");
            addPdfHeader(table, "Estimated Delivery");

            for (Shipment shipment : shipments) {

                addPdfCell(
                        table,
                        value(shipment.getId()));

                addPdfCell(
                        table,
                        value(shipment.getTrackingNumber()));

                addPdfCell(
                        table,
                        value(shipment.getSenderName()));

                addPdfCell(
                        table,
                        value(shipment.getReceiverName()));

                addPdfCell(
                        table,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus().name());

                addPdfCell(
                        table,
                        shipment.getCreatedAt() == null
                                ? "-"
                                : shipment.getCreatedAt()
                                        .toLocalDate()
                                        .toString());

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getEstimatedDeliveryDate()));
            }

            document.add(table);

            document.close();

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate shipment PDF",
                    e);
        }
    }

    // ============================================================
    // SHIPMENT EXCEL
    // ============================================================

    private byte[] generateShipmentExcel(
            List<Shipment> shipments,
            User user) {

        try (XSSFWorkbook workbook =
                     new XSSFWorkbook();
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Sheet sheet =
                    workbook.createSheet(
                            "Shipment Report");

            Row title =
                    sheet.createRow(0);

            title.createCell(0)
                    .setCellValue(
                            "ShipTrack Pro - Shipment Report");

            Row generated =
                    sheet.createRow(1);

            generated.createCell(0)
                    .setCellValue(
                            "Generated for: "
                                    + user.getEmail());

            Row header =
                    sheet.createRow(3);

            String[] headers = {
                    "ID",
                    "Tracking Number",
                    "Sender",
                    "Receiver",
                    "Status",
                    "Created Date",
                    "Estimated Delivery"
            };

            createExcelHeader(
                    header,
                    headers,
                    workbook);

            int rowNumber = 4;

            for (Shipment shipment : shipments) {

                Row row =
                        sheet.createRow(rowNumber++);

                setCell(
                        row,
                        0,
                        value(shipment.getId()));

                setCell(
                        row,
                        1,
                        value(
                                shipment
                                        .getTrackingNumber()));

                setCell(
                        row,
                        2,
                        value(
                                shipment
                                        .getSenderName()));

                setCell(
                        row,
                        3,
                        value(
                                shipment
                                        .getReceiverName()));

                setCell(
                        row,
                        4,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus()
                                        .name());

                setCell(
                        row,
                        5,
                        shipment.getCreatedAt() == null
                                ? "-"
                                : shipment.getCreatedAt()
                                        .toLocalDate()
                                        .toString());

                setCell(
                        row,
                        6,
                        value(
                                shipment
                                        .getEstimatedDeliveryDate()));
            }

            autoSizeColumns(
                    sheet,
                    headers.length);

            workbook.write(output);

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate shipment Excel",
                    e);
        }
    }

    // ============================================================
    // DELIVERY PDF
    // ============================================================

    private byte[] generateDeliveryPdf(
            List<Shipment> shipments,
            User user) {

        try (ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Document document =
                    new Document(PageSize.A4.rotate());

            PdfWriter.getInstance(
                    document,
                    output);

            document.open();

            addTitle(
                    document,
                    "ShipTrack Pro - Delivery Report");

            addSubtitle(
                    document,
                    "Generated for: " + user.getEmail());

            PdfPTable table =
                    new PdfPTable(7);

            table.setWidthPercentage(100);

            addPdfHeader(table, "Shipment ID");
            addPdfHeader(table, "Tracking Number");
            addPdfHeader(table, "Status");
            addPdfHeader(table, "POD Status");
            addPdfHeader(table, "Delivered To");
            addPdfHeader(table, "Delivered At");
            addPdfHeader(table, "Actual Delivery Date");

            for (Shipment shipment : shipments) {

                ProofOfDelivery pod =
                        proofOfDeliveryRepository
                                .findByShipmentId(
                                        shipment.getId())
                                .orElse(null);

                addPdfCell(
                        table,
                        value(shipment.getId()));

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getTrackingNumber()));

                addPdfCell(
                        table,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus().name());

                addPdfCell(
                        table,
                        pod == null
                                ? "NOT AVAILABLE"
                                : value(
                                        pod
                                                .getVerificationStatus()));

                addPdfCell(
                        table,
                        pod == null
                                ? "-"
                                : value(
                                        pod
                                                .getDeliveredToName()));

                addPdfCell(
                        table,
                        pod == null ||
                                pod.getDeliveredAt() == null
                                ? "-"
                                : pod.getDeliveredAt()
                                        .toString());

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getActualDeliveryDate()));
            }

            document.add(table);

            document.close();

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate delivery PDF",
                    e);
        }
    }

    // ============================================================
    // DELIVERY EXCEL
    // ============================================================

    private byte[] generateDeliveryExcel(
            List<Shipment> shipments,
            User user) {

        try (XSSFWorkbook workbook =
                     new XSSFWorkbook();
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Sheet sheet =
                    workbook.createSheet(
                            "Delivery Report");

            Row title =
                    sheet.createRow(0);

            title.createCell(0)
                    .setCellValue(
                            "ShipTrack Pro - Delivery Report");

            Row generated =
                    sheet.createRow(1);

            generated.createCell(0)
                    .setCellValue(
                            "Generated for: "
                                    + user.getEmail());

            Row header =
                    sheet.createRow(3);

            String[] headers = {
                    "Shipment ID",
                    "Tracking Number",
                    "Status",
                    "POD Status",
                    "Delivered To",
                    "Delivered At",
                    "Actual Delivery Date"
            };

            createExcelHeader(
                    header,
                    headers,
                    workbook);

            int rowNumber = 4;

            for (Shipment shipment : shipments) {

                ProofOfDelivery pod =
                        proofOfDeliveryRepository
                                .findByShipmentId(
                                        shipment.getId())
                                .orElse(null);

                Row row =
                        sheet.createRow(rowNumber++);

                setCell(
                        row,
                        0,
                        value(shipment.getId()));

                setCell(
                        row,
                        1,
                        value(
                                shipment
                                        .getTrackingNumber()));

                setCell(
                        row,
                        2,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus().name());

                setCell(
                        row,
                        3,
                        pod == null
                                ? "NOT AVAILABLE"
                                : value(
                                        pod
                                                .getVerificationStatus()));

                setCell(
                        row,
                        4,
                        pod == null
                                ? "-"
                                : value(
                                        pod
                                                .getDeliveredToName()));

                setCell(
                        row,
                        5,
                        pod == null ||
                                pod.getDeliveredAt() == null
                                ? "-"
                                : pod.getDeliveredAt()
                                        .toString());

                setCell(
                        row,
                        6,
                        value(
                                shipment
                                        .getActualDeliveryDate()));
            }

            autoSizeColumns(
                    sheet,
                    headers.length);

            workbook.write(output);

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate delivery Excel",
                    e);
        }
    }

    // ============================================================
    // ROUTE PERFORMANCE PDF
    // ============================================================

    private byte[] generateRoutePdf(
            List<Shipment> shipments,
            User user) {

        try (ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Document document =
                    new Document(PageSize.A4.rotate());

            PdfWriter.getInstance(
                    document,
                    output);

            document.open();

            addTitle(
                    document,
                    "ShipTrack Pro - Route Performance Report");

            addSubtitle(
                    document,
                    "Generated for: " + user.getEmail());

            PdfPTable table =
                    new PdfPTable(8);

            table.setWidthPercentage(100);

            addPdfHeader(table, "Shipment ID");
            addPdfHeader(table, "Tracking Number");
            addPdfHeader(table, "Origin");
            addPdfHeader(table, "Destination");
            addPdfHeader(table, "Distance (km)");
            addPdfHeader(table, "Estimated (min)");
            addPdfHeader(table, "Actual (min)");
            addPdfHeader(table, "Traffic");

            for (Shipment shipment : shipments) {

                List<Route> routes =
                        routeRepository
                                .findAllByShipmentIdOrderByCreatedAtDesc(
                                        shipment.getId());

                if (routes.isEmpty()) {

                    addPdfCell(
                            table,
                            value(shipment.getId()));

                    addPdfCell(
                            table,
                            value(
                                    shipment
                                            .getTrackingNumber()));

                    addPdfCell(table, "-");
                    addPdfCell(table, "-");
                    addPdfCell(table, "-");
                    addPdfCell(table, "-");
                    addPdfCell(table, "-");
                    addPdfCell(table, "-");

                    continue;
                }

                Route route = routes.get(0);

                addPdfCell(
                        table,
                        value(shipment.getId()));

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getTrackingNumber()));

                addPdfCell(
                        table,
                        value(route.getOrigin()));

                addPdfCell(
                        table,
                        value(route.getDestination()));

                addPdfCell(
                        table,
                        value(route.getDistanceKm()));

                addPdfCell(
                        table,
                        value(
                                route
                                        .getEstimatedTimeMinutes()));

                addPdfCell(
                        table,
                        value(
                                route
                                        .getActualTimeMinutes()));

                addPdfCell(
                        table,
                        value(
                                route
                                        .getTrafficCondition()));
            }

            document.add(table);

            document.close();

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate route performance PDF",
                    e);
        }
    }

    // ============================================================
    // ROUTE PERFORMANCE EXCEL
    // ============================================================

    private byte[] generateRouteExcel(
            List<Shipment> shipments,
            User user) {

        try (XSSFWorkbook workbook =
                     new XSSFWorkbook();
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Sheet sheet =
                    workbook.createSheet(
                            "Route Performance");

            Row title =
                    sheet.createRow(0);

            title.createCell(0)
                    .setCellValue(
                            "ShipTrack Pro - Route Performance Report");

            Row generated =
                    sheet.createRow(1);

            generated.createCell(0)
                    .setCellValue(
                            "Generated for: "
                                    + user.getEmail());

            Row header =
                    sheet.createRow(3);

            String[] headers = {
                    "Shipment ID",
                    "Tracking Number",
                    "Origin",
                    "Destination",
                    "Distance (km)",
                    "Estimated (min)",
                    "Actual (min)",
                    "Traffic"
            };

            createExcelHeader(
                    header,
                    headers,
                    workbook);

            int rowNumber = 4;

            for (Shipment shipment : shipments) {

                List<Route> routes =
                        routeRepository
                                .findAllByShipmentIdOrderByCreatedAtDesc(
                                        shipment.getId());

                Row row =
                        sheet.createRow(rowNumber++);

                setCell(
                        row,
                        0,
                        value(shipment.getId()));

                setCell(
                        row,
                        1,
                        value(
                                shipment
                                        .getTrackingNumber()));

                if (routes.isEmpty()) {

                    for (int i = 2; i < 8; i++) {
                        setCell(row, i, "-");
                    }

                    continue;
                }

                Route route = routes.get(0);

                setCell(
                        row,
                        2,
                        value(route.getOrigin()));

                setCell(
                        row,
                        3,
                        value(route.getDestination()));

                setCell(
                        row,
                        4,
                        value(route.getDistanceKm()));

                setCell(
                        row,
                        5,
                        value(
                                route
                                        .getEstimatedTimeMinutes()));

                setCell(
                        row,
                        6,
                        value(
                                route
                                        .getActualTimeMinutes()));

                setCell(
                        row,
                        7,
                        value(
                                route
                                        .getTrafficCondition()));
            }

            autoSizeColumns(
                    sheet,
                    headers.length);

            workbook.write(output);

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate route performance Excel",
                    e);
        }
    }

    // ============================================================
    // DELAY PDF
    // ============================================================

    private byte[] generateDelayPdf(
            List<Shipment> delayedShipments,
            User user) {

        try (ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Document document =
                    new Document(PageSize.A4.rotate());

            PdfWriter.getInstance(
                    document,
                    output);

            document.open();

            addTitle(
                    document,
                    "ShipTrack Pro - Delay Analysis Report");

            addSubtitle(
                    document,
                    "Generated for: " + user.getEmail());

            addSubtitle(
                    document,
                    "Total delayed shipments: "
                            + delayedShipments.size());

            PdfPTable table =
                    new PdfPTable(6);

            table.setWidthPercentage(100);

            addPdfHeader(table, "Shipment ID");
            addPdfHeader(table, "Tracking Number");
            addPdfHeader(table, "Status");
            addPdfHeader(table, "Estimated Date");
            addPdfHeader(table, "Actual Date");
            addPdfHeader(table, "Delay Days");

            for (Shipment shipment : delayedShipments) {

                addPdfCell(
                        table,
                        value(shipment.getId()));

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getTrackingNumber()));

                addPdfCell(
                        table,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus().name());

                addPdfCell(
                        table,
                        value(
                                shipment
                                        .getEstimatedDeliveryDate()));

                addPdfCell(
                        table,
                        shipment.getActualDeliveryDate() == null
                                ? "PENDING"
                                : shipment
                                        .getActualDeliveryDate()
                                        .toString());

                addPdfCell(
                        table,
                        String.valueOf(
                                calculateDelayDays(shipment)));
            }

            document.add(table);

            document.close();

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate delay analysis PDF",
                    e);
        }
    }

    // ============================================================
    // DELAY EXCEL
    // ============================================================

    private byte[] generateDelayExcel(
            List<Shipment> delayedShipments,
            User user) {

        try (XSSFWorkbook workbook =
                     new XSSFWorkbook();
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            Sheet sheet =
                    workbook.createSheet(
                            "Delay Analysis");

            Row title =
                    sheet.createRow(0);

            title.createCell(0)
                    .setCellValue(
                            "ShipTrack Pro - Delay Analysis Report");

            Row generated =
                    sheet.createRow(1);

            generated.createCell(0)
                    .setCellValue(
                            "Generated for: "
                                    + user.getEmail());

            Row total =
                    sheet.createRow(2);

            total.createCell(0)
                    .setCellValue(
                            "Total delayed shipments");

            total.createCell(1)
                    .setCellValue(
                            delayedShipments.size());

            Row header =
                    sheet.createRow(4);

            String[] headers = {
                    "Shipment ID",
                    "Tracking Number",
                    "Status",
                    "Estimated Date",
                    "Actual Date",
                    "Delay Days"
            };

            createExcelHeader(
                    header,
                    headers,
                    workbook);

            int rowNumber = 5;

            for (Shipment shipment : delayedShipments) {

                Row row =
                        sheet.createRow(rowNumber++);

                setCell(
                        row,
                        0,
                        value(shipment.getId()));

                setCell(
                        row,
                        1,
                        value(
                                shipment
                                        .getTrackingNumber()));

                setCell(
                        row,
                        2,
                        shipment.getStatus() == null
                                ? "-"
                                : shipment.getStatus().name());

                setCell(
                        row,
                        3,
                        value(
                                shipment
                                        .getEstimatedDeliveryDate()));

                setCell(
                        row,
                        4,
                        shipment.getActualDeliveryDate() == null
                                ? "PENDING"
                                : shipment
                                        .getActualDeliveryDate()
                                        .toString());

                setCell(
                        row,
                        5,
                        String.valueOf(
                                calculateDelayDays(shipment)));
            }

            autoSizeColumns(
                    sheet,
                    headers.length);

            workbook.write(output);

            return output.toByteArray();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to generate delay analysis Excel",
                    e);
        }
    }

    // ============================================================
    // DELAY DAYS
    // ============================================================

    private long calculateDelayDays(
            Shipment shipment) {

        if (shipment.getEstimatedDeliveryDate() == null) {
            return 0;
        }

        LocalDate comparisonDate =
                shipment.getActualDeliveryDate() != null
                        ? shipment.getActualDeliveryDate()
                        : LocalDate.now();

        long days =
                java.time.temporal.ChronoUnit.DAYS.between(
                        shipment.getEstimatedDeliveryDate(),
                        comparisonDate);

        return Math.max(days, 0);
    }

    // ============================================================
    // PDF HELPERS
    // ============================================================

    private void addTitle(
            Document document,
            String title)
            throws Exception {

        Paragraph paragraph =
                new Paragraph(
                        title,
                        FontFactory.getFont(
                                FontFactory.HELVETICA,
                                18));

        paragraph.setAlignment(
                Element.ALIGN_CENTER);

        paragraph.setSpacingAfter(10);

        document.add(paragraph);
    }

    private void addSubtitle(
            Document document,
            String text)
            throws Exception {

        Paragraph paragraph =
                new Paragraph(
                        text,
                        FontFactory.getFont(
                                FontFactory.HELVETICA,
                                10));

        paragraph.setAlignment(
                Element.ALIGN_CENTER);

        paragraph.setSpacingAfter(10);

        document.add(paragraph);
    }

    private void addPdfHeader(
            PdfPTable table,
            String text) {

        PdfPCell cell =
                new PdfPCell(
                        new Phrase(text));

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER);

        table.addCell(cell);
    }

    private void addPdfCell(
            PdfPTable table,
            String text) {

        table.addCell(
                new PdfPCell(
                        new Phrase(
                                text == null
                                        ? "-"
                                        : text)));
    }

    // ============================================================
    // EXCEL HELPERS
    // ============================================================

    private void createExcelHeader(
            Row row,
            String[] headers,
            XSSFWorkbook workbook) {

        CellStyle style =
                workbook.createCellStyle();

        Font font =
                workbook.createFont();

        font.setBold(true);

        style.setFont(font);

        for (int i = 0;
             i < headers.length;
             i++) {

            Cell cell =
                    row.createCell(i);

            cell.setCellValue(
                    headers[i]);

            cell.setCellStyle(style);
        }
    }

    private void setCell(
            Row row,
            int column,
            String value) {

        row.createCell(column)
                .setCellValue(
                        value == null
                                ? "-"
                                : value);
    }

    private void autoSizeColumns(
            Sheet sheet,
            int count) {

        for (int i = 0; i < count; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    // ============================================================
    // VALUE HELPER
    // ============================================================

    private String value(Object value) {

        return value == null
                ? "-"
                : String.valueOf(value);
    }
}