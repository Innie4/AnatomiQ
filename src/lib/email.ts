// Email sending functionality
// For now, this will log emails to console
// In production, integrate with SendGrid, AWS SES, or similar service

type EmailData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send an email (stub for now - logs to console)
 * TODO: Integrate with actual email service in production
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  console.log("📧 Email would be sent:", {
    to: data.to,
    subject: data.subject,
    preview: data.text?.substring(0, 100) || data.html.substring(0, 100),
  });

  // In production, replace with actual email service:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(data);

  return true;
}

/**
 * Send password reset email
 */
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
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0969da 0%, #0ca678 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const text = `
Reset Your Password

You requested to reset your password for your AnatomiQ account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your AnatomiQ Password",
    html,
    text,
  });
}

/**
 * Send email verification email
 */
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
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0969da 0%, #0ca678 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
    </div>
  `;

  const text = `
Verify Your Email

Welcome to AnatomiQ! Please verify your email address to complete your registration.

Click this link to verify your email:
${verifyUrl}

This link will expire in 1 hour.
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your AnatomiQ Email",
    html,
    text,
  });
}
