package com.shiptrack.shiptrack_pro.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Backed by Spring's auto-configured JavaMailSender (active once spring.mail.host is set -
 * see application.properties). Credentials come from MAIL_USERNAME / MAIL_APP_PASSWORD
 * environment variables, never hardcoded.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendEmail(String toAddress, String subject, String body) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.debug("Mail is not configured (MAIL_USERNAME unset) - skipping email to {}", toAddress);
            return;
        }
        if (toAddress == null || toAddress.isBlank()) {
            log.debug("Recipient has no email address on file - skipping email.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toAddress);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", toAddress, e.getMessage());
        }
    }
}
