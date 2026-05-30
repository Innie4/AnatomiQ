type SmsPayload = {
  to: string;
  message: string;
};

function normalizeTwilioNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

async function sendWithTwilio({ to, message }: SmsPayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("SMS service is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.");
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: normalizeTwilioNumber(from),
      To: normalizeTwilioNumber(to),
      Body: message,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Twilio SMS failed with ${response.status}: ${detail}`);
  }
}

export async function sendSms(payload: SmsPayload): Promise<boolean> {
  try {
    await sendWithTwilio(payload);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[sms] Development SMS fallback", {
        to: payload.to,
        preview: payload.message.slice(0, 120),
      });
      return true;
    }

    throw error;
  }
}

export async function sendPasswordResetSms(phoneNumber: string, otp: string) {
  return sendSms({
    to: phoneNumber,
    message: `Your AnatomiQ password reset code is ${otp}. It expires in 10 minutes.`,
  });
}
