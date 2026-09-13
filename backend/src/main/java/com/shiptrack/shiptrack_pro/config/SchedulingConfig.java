package com.shiptrack.shiptrack_pro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled support for the whole application (used by EtaRecalculationScheduler). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
