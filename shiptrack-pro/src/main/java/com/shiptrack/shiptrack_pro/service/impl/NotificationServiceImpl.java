package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Notification;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.NotificationRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.NotificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final JavaMailSender mailSender;

    // Sender email comes from application.properties
    @Value("${spring.mail.username}")
    private String senderEmail;

    @Override
    public Notification createNotification(
            Long userId,
            Long shipmentId,
            String title,
            String message,
            String type) {

        // Find recipient user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with id: " + userId
                ));

        // Find shipment
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found with id: " + shipmentId
                ));

        /*
         * Receiver email is taken dynamically
         * from the user record in the database.
         *
         * So if the user's email changes in DB,
         * no code change is required.
         */
        String receiverEmail = user.getEmail();

        // Check recipient email
        if (receiverEmail == null || receiverEmail.isBlank()) {

            Notification notification = Notification.builder()
                    .userId(user.getId())
                    .shipmentId(shipment.getId())
                    .title(title)
                    .message(message)
                    .type(type)
                    .status("FAILED")
                    .build();

            System.out.println(
                    "Notification email failed: recipient email is empty"
            );

            return notificationRepository.save(notification);
        }

        // Create notification record
        Notification notification = Notification.builder()
                .userId(user.getId())
                .shipmentId(shipment.getId())
                .title(title)
                .message(message)
                .type(type)
                .status("PENDING")
                .build();

        Notification saved =
                notificationRepository.save(notification);

        try {

            /*
             * Sender:
             * spring.mail.username
             *
             * Receiver:
             * user email from database
             */
            SimpleMailMessage email =
                    new SimpleMailMessage();

            email.setFrom(senderEmail);
            email.setTo(receiverEmail);
            email.setSubject(title);
            email.setText(message);

            System.out.println("=================================");
            System.out.println("Sending notification email...");
            System.out.println("From: " + senderEmail);
            System.out.println("To: " + receiverEmail);
            System.out.println("Subject: " + title);

            mailSender.send(email);

            saved.setStatus("SENT");
            saved.setSentAt(LocalDateTime.now());

            System.out.println(
                    "Notification email sent successfully."
            );
            System.out.println("=================================");

        } catch (Exception e) {

            saved.setStatus("FAILED");

            System.out.println(
                    "Notification email failed: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }

        return notificationRepository.save(saved);
    }

    @Override
    public List<Notification> getNotifications(Long userId) {

        if (!userRepository.existsById(userId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with id: " + userId
            );
        }

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Notification markAsRead(
            Long notificationId,
            Long userId) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Notification not found"
                                )
                        );

        if (!notification.getUserId().equals(userId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot update this notification"
            );
        }

        notification.setReadAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }
}