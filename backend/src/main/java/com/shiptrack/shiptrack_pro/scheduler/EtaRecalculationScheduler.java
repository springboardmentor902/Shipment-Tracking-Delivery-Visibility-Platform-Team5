package com.shiptrack.shiptrack_pro.scheduler;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ETA Prediction Module - periodic recalculation.
 *
 * Even a shipment that hasn't had a new tracking event recently can drift off
 * its predicted time just from the clock moving forward. This scheduler catches
 * already-overdue risk factors between tracking events.
 *
 * Interval is configurable via:
 * eta.recalculation.interval-ms
 *
 * Default interval: 20 minutes.
 */
@Component
@RequiredArgsConstructor
public class EtaRecalculationScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(EtaRecalculationScheduler.class);

    private static final List<String> TERMINAL_STATUSES =
            List.of("DELIVERED", "CANCELLED");

    private final ShipmentRepository shipmentRepository;
    private final EtaPredictionService etaPredictionService;

    @Transactional
    @Scheduled(fixedRateString = "${eta.recalculation.interval-ms:1200000}")
    public void recalculateInProgressShipments() {

        List<Shipment> inProgress =
                shipmentRepository.findByStatusNotIn(TERMINAL_STATUSES);

        if (inProgress.isEmpty()) {
            log.debug("No in-progress shipments found for ETA recalculation");
            return;
        }

        log.info(
                "Scheduled ETA recalculation: {} in-progress shipment(s)",
                inProgress.size()
        );

        int failures = 0;

        for (Shipment shipment : inProgress) {
            try {
                etaPredictionService.calculateForShipment(shipment.getId());

                log.debug(
                        "ETA recalculation completed for shipment {}",
                        shipment.getId()
                );

            } catch (Exception e) {
                failures++;

                log.warn(
                        "Scheduled ETA recalculation failed for shipment {}: {}",
                        shipment.getId(),
                        e.getMessage(),
                        e
                );
            }
        }

        if (failures > 0) {
            log.warn(
                    "Scheduled ETA recalculation finished with {} failure(s) out of {}",
                    failures,
                    inProgress.size()
            );
        } else {
            log.info(
                    "Scheduled ETA recalculation completed successfully for all {} shipment(s)",
                    inProgress.size()
            );
        }
    }
}