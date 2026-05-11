import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user with subscription
    const user = await db.facultyUser.findUnique({
      where: { id: payload.userId },
      include: {
        Subscription: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = user.Subscription[0] || null;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      faculty: user.faculty,
      isGuest: user.isGuest,
      avatarUrl: user.avatarUrl,
      subscription: subscription
        ? {
            tier: subscription.tier,
            billingPeriod: subscription.billingPeriod,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextPaymentDate: subscription.nextPaymentDate,
          }
        : null,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, department, faculty } = body;

    // Update user
    const user = await db.facultyUser.update({
      where: { id: payload.userId },
      data: {
        fullName: fullName || undefined,
        department: department || undefined,
        faculty: faculty || undefined,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      faculty: user.faculty,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
