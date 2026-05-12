import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await db.facultyUser.findUnique({
      where: { email },
    });

    // Don't reveal if email exists
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, a verification link has been sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();

    // Save token to database
    await db.facultyUser.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendVerificationEmail(email, verificationToken, appUrl);

    return NextResponse.json({
      message: "If that email exists, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification" },
      { status: 500 }
    );
  }
}
