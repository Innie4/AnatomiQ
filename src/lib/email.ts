type EmailData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendGridPersonalization = {
  to: Array<{ email: string }>;
  subject: string;
};

function parseEmailAddress(value: string) {
  const match = value.match(/^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/);

  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].trim(),
    };
  }

  return { email: value.trim() };
}

async function sendWithSendGrid(data: EmailData) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Email service is not configured. Set SENDGRID_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: data.to }],
          subject: data.subject,
        } satisfies SendGridPersonalization,
      ],
      from: parseEmailAddress(from),
      content: [
        ...(data.text ? [{ type: "text/plain", value: data.text }] : []),
        { type: "text/html", value: data.html },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid email failed with ${response.status}: ${detail}`);
  }
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    await sendWithSendGrid(data);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] Development email fallback", {
        to: data.to,
        subject: data.subject,
        preview: data.text?.slice(0, 100) || data.html.slice(0, 100),
      });
      return true;
    }

    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  appUrl: string
): Promise<boolean> {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0969da;">Reset Your Password</h2>
      <p>You requested to reset your password for your AnatomiQ account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Reset Your Password

You requested to reset your password for your AnatomiQ account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.`;

  return sendEmail({
    to: email,
    subject: "Reset Your AnatomiQ Password",
    html,
    text,
  });
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  appUrl: string
): Promise<boolean> {
  const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0969da;">Verify Your Email</h2>
      <p>Welcome to AnatomiQ! Please verify your email address to complete your registration.</p>
      <p>Click the button below to verify your email:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #0969da; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
    </div>
  `;

  const text = `Verify Your Email

Welcome to AnatomiQ! Please verify your email address to complete your registration.

Click this link to verify your email:
${verifyUrl}

This link will expire in 1 hour.`;

  return sendEmail({
    to: email,
    subject: "Verify Your AnatomiQ Email",
    html,
    text,
  });
}
