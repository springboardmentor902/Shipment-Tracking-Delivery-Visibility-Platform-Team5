package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.FileUploadResponse;
import com.shiptrack.shiptrack_pro.integration.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Generic authenticated file upload, primarily for Proof of Delivery's signature/photo
 * capture, but not tied to that module specifically - any authenticated user can upload,
 * each upload gets its own random filename, so there's no risk of overwriting or exposing
 * someone else's file.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.store(file);
        return new ResponseEntity<>(FileUploadResponse.builder().url(url).build(), HttpStatus.CREATED);
    }
}
