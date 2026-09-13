package com.shiptrack.shiptrack_pro.integration;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Backed by the Twilio Java SDK. Credentials come from TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER environment variables, never hardcoded.
 *
 * Twilio.init(...) is only called lazily, the first time sendSms() actually runs with a
 * complete configuration - never at startup - so the app boots cleanly whether or not
 * Twilio is configured at all.
 */
@Service
public class SmsServiceImpl implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsServiceImpl.class);

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    private volatile boolean initialized = false;

    @Override
    public void sendSms(String toPhoneNumber, String message) {
        if (!isConfigured()) {
            log.debug("Twilio is not configured (TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER unset) - " +
                    "skipping SMS to {}", toPhoneNumber);
            return;
        }
        if (toPhoneNumber == null || toPhoneNumber.isBlank()) {
            log.debug("Recipient has no phone number on file - skipping SMS.");
            return;
        }

        try {
            ensureInitialized();
            Message.creator(new PhoneNumber(toPhoneNumber), new PhoneNumber(fromNumber), message).create();
        } catch (Exception e) {
            log.warn("Failed to send SMS to {}: {}", toPhoneNumber, e.getMessage());
        }
    }

    private boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && fromNumber != null && !fromNumber.isBlank();
    }

    private synchronized void ensureInitialized() {
        if (!initialized) {
            Twilio.init(accountSid, authToken);
            initialized = true;
        }
    }
}
