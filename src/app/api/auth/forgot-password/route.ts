import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateOtp, generateOtpExpiry, generateToken, generateTokenExpiry } from "@/lib/tokens";
import { sendPasswordResetEmail, sendPasswordResetOtpEmail } from "@/lib/email";
import { sendPasswordResetSms } from "@/lib/sms";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  channel: z.enum(["email", "phone"]).default("email"),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().min(7, "Phone number is required").optional(),
});

const genericMessage = "If the account exists, a password reset code has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { channel, email, phoneNumber } = validation.data;

    if (channel === "email" && !email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    if (channel === "phone" && !phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Find user
    const user = channel === "email"
      ? await db.facultyUser.findUnique({ where: { email } })
      : await db.facultyUser.findUnique({ where: { phoneNumber } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: genericMessage,
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetTokenExpiry = generateTokenExpiry();
    const otp = generateOtp();
    const resetOtpHash = await hashPassword(otp);
    const resetOtpExpiry = generateOtpExpiry();

    // Save token to database
    await db.facultyUser.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        resetOtpHash,
        resetOtpExpiry,
        resetOtpChannel: channel === "email" ? "EMAIL" : "PHONE",
      },
    });

    if (channel === "email" && email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await Promise.all([
        sendPasswordResetEmail(email, resetToken, appUrl),
        sendPasswordResetOtpEmail(email, otp),
      ]);
    } else if (phoneNumber) {
      await sendPasswordResetSms(phoneNumber, otp);
    }

    return NextResponse.json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
