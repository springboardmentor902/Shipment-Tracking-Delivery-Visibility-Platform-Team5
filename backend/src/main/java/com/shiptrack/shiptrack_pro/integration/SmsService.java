package com.shiptrack.shiptrack_pro.integration;

public interface SmsService {
    /**
     * Sends an SMS via Twilio. Never throws - if Twilio isn't configured (missing env
     * vars) or the API call fails, it's logged and swallowed, same fail-safe pattern as
     * every other external integration in this project.
     */
    void sendSms(String toPhoneNumber, String message);
}
