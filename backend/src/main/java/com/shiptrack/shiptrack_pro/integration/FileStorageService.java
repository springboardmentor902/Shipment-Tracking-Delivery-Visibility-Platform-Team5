package com.shiptrack.shiptrack_pro.integration;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Persists an uploaded file and returns a URL the client can use to retrieve it
     * (e.g. "/files/3f9a...-signature.png"). Throws if the file is empty, exceeds the
     * configured size limit, or isn't an allowed content type - unlike the external
     * integrations (Maps/Email/SMS), a failed upload has no sensible "silently skip"
     * fallback since the caller (Complete Delivery screen) needs the URL to proceed.
     */
    String store(MultipartFile file);
}
