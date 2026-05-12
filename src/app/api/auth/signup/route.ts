import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { generateUniqueReferralCode, processReferral } from "@/lib/referral";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().min(2, "Department is required"),
  faculty: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (3 requests per 15 minutes for signup)
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await rateLimit(clientIP, 'auth');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { fullName, email, password, department, faculty, referralCode } = validation.data;

    // Check if user already exists
    const existingUser = await db.facultyUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique referral code for new user
    const userReferralCode = await generateUniqueReferralCode(fullName);

    // Generate email verification token
    const verificationToken = generateToken();

    // Create user
    const user = await db.facultyUser.create({
      data: {
        fullName,
        email,
        passwordHash,
        department,
        faculty,
        referralCode: userReferralCode,
        verificationToken,
        emailVerified: false,
        isActive: true,
        isGuest: false,
      },
    });

    // Process referral if provided
    if (referralCode) {
      await processReferral(user.id, referralCode);
    }

    // Send verification email (don't block signup on email failure)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    sendVerificationEmail(email, verificationToken, appUrl).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        faculty: user.faculty,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
