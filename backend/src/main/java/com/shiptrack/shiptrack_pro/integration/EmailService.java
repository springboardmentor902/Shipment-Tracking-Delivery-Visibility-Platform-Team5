package com.shiptrack.shiptrack_pro.integration;

public interface EmailService {
    /**
     * Sends a plain-text email. Never throws - a delivery failure (bad credentials,
     * unreachable SMTP host, invalid recipient, etc.) is logged and swallowed, exactly like
     * GoogleMapsService, so a notification's in-app record is never blocked by email
     * delivery failing.
     */
    void sendEmail(String toAddress, String subject, String body);
}
