package com.shiptrack.shiptrack_pro.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private final String accountSid;
    private final String authToken;
    private final String fromPhoneNumber;

    public SmsService(
            @Value("${twilio.account-sid}") String accountSid,
            @Value("${twilio.auth-token}") String authToken,
            @Value("${twilio.phone-number}") String fromPhoneNumber
    ) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromPhoneNumber = fromPhoneNumber;

        Twilio.init(accountSid, authToken);
    }

    public void sendSms(String recipient, String messageText) {
        Message.creator(
                new PhoneNumber(recipient),
                new PhoneNumber(fromPhoneNumber),
                messageText
        ).create();
    }
}