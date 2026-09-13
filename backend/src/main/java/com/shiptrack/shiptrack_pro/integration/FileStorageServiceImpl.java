package com.shiptrack.shiptrack_pro.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Local-disk implementation of FileStorageService: writes uploaded files under
 * file.upload-dir (default "uploads") and returns a relative URL under /files/**, which
 * StaticFileConfig maps back to that same directory.
 *
 * This is a placeholder for a real object store (the architecture diagram calls for AWS S3
 * / Cloudinary) - it works end to end for local development and demos, but files don't
 * survive a container rebuild and won't be shared across multiple backend instances. Swap
 * this implementation for an S3-backed one before a real production deployment; the
 * FileStorageService interface and its one method are the only thing callers depend on.
 */
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png", "image/jpeg", "image/jpg", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file was uploaded.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds the 10MB size limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type: " + contentType + ". Allowed: " + ALLOWED_CONTENT_TYPES);
        }

        try {
            Path directory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(directory);

            String extension = switch (contentType.toLowerCase()) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> ".jpg";
            };
            // A fresh random name - never trust the client-supplied filename (path traversal,
            // collisions, etc).
            String filename = UUID.randomUUID() + extension;
            Path destination = directory.resolve(filename).normalize();

            if (!destination.getParent().equals(directory)) {
                // Defensive - should be unreachable given the UUID filename, but guards
                // against any future change that reintroduces client-controlled naming.
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name.");
            }

            try (InputStream in = file.getInputStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            return "/files/" + filename;

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store the uploaded file: " + e.getMessage());
        }
    }
}
