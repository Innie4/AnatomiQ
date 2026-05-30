import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import { isTokenExpired } from "@/lib/tokens";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().optional(),
  channel: z.enum(["email", "phone"]).optional(),
  identifier: z.string().optional(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code").optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, channel, identifier, otp, password } = validation.data;

    const user = token
      ? await db.facultyUser.findUnique({ where: { resetToken: token } })
      : channel === "email" && identifier
        ? await db.facultyUser.findUnique({ where: { email: identifier } })
        : channel === "phone" && identifier
          ? await db.facultyUser.findUnique({ where: { phoneNumber: identifier } })
          : null;

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset request" },
        { status: 400 }
      );
    }

    if (token && isTokenExpired(user.resetTokenExpiry)) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (!token) {
      if (!otp || !user.resetOtpHash || isTokenExpired(user.resetOtpExpiry)) {
        return NextResponse.json(
          { error: "Reset code has expired. Please request a new one." },
          { status: 400 },
        );
      }

      const expectedChannel = channel === "email" ? "EMAIL" : "PHONE";
      const codeMatches = await comparePassword(otp, user.resetOtpHash);

      if (user.resetOtpChannel !== expectedChannel || !codeMatches) {
        return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await db.facultyUser.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        resetOtpHash: null,
        resetOtpExpiry: null,
        resetOtpChannel: null,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
