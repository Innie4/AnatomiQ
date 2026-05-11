import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await rateLimit(clientIP, 'auth');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Create a guest user with a unique identifier
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const guestEmail = `${guestId}@guest.anatomiq.local`;

    const guestUser = await db.facultyUser.create({
      data: {
        fullName: "Guest User",
        email: guestEmail,
        department: "Guest",
        isActive: true,
        isGuest: true,
        passwordHash: null,
      },
    });

    // Generate JWT for guest (shorter expiration)
    const token = signToken({
      userId: guestUser.id,
      email: guestUser.email,
      fullName: guestUser.fullName,
      department: guestUser.department,
    });

    return NextResponse.json({
      token,
      user: {
        id: guestUser.id,
        email: guestUser.email,
        fullName: guestUser.fullName,
        department: guestUser.department,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error("Guest sign-in error:", error);
    return NextResponse.json(
      { error: "Failed to create guest session" },
      { status: 500 }
    );
  }
}
