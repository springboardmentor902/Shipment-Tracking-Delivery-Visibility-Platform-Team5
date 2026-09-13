package com.shiptrack.shiptrack_pro.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String senderEmail;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String senderEmail
    ) {
        this.mailSender = mailSender;
        this.senderEmail = senderEmail;
    }

    public void sendEmail(
            String recipient,
            String subject,
            String message
    ) {
        if (recipient == null || recipient.isBlank()) {
            log.warn("Email not sent because recipient email is empty.");
            return;
        }

        if (subject == null || subject.isBlank()) {
            subject = "ShipTrackPro Notification";
        }

        if (message == null || message.isBlank()) {
            message = "You have a new notification from ShipTrackPro.";
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();

            mail.setFrom(senderEmail);
            mail.setTo(recipient);
            mail.setSubject(subject);
            mail.setText(message);

            mailSender.send(mail);

            log.info(
                    "Email successfully sent to {} with subject '{}'",
                    recipient,
                    subject
            );

        } catch (Exception e) {
            log.error(
                    "Failed to send email to {}: {}",
                    recipient,
                    e.getMessage(),
                    e
            );

            throw new RuntimeException(
                    "Unable to send email notification.",
                    e
            );
        }
    }
}