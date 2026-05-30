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
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      department: user.department,
      faculty: user.faculty,
      course: user.course,
      isGuest: user.isGuest,
      biometricsEnabled: user.biometricsEnabled,
      avatarUrl: user.avatarUrl,
      selectedCourses: user.selectedCourses,
      referralCode: user.referralCode,
      preferences: {
        theme: user.themePreference,
        emailNotifications: user.emailNotifications,
        referralNotifications: user.referralNotifications,
        subscriptionNotifications: user.subscriptionNotifications,
      },
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
    const {
      fullName,
      phoneNumber,
      department,
      faculty,
      course,
      avatarUrl,
      themePreference,
      emailNotifications,
      referralNotifications,
      subscriptionNotifications,
      biometricsEnabled,
    } = body;

    const currentUser = await db.facultyUser.findUnique({
      where: { id: payload.userId },
      select: { isGuest: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.isGuest) {
      return NextResponse.json(
        { error: "Guests need to sign in or create an account before editing profile settings.", code: "GUEST_REQUIRES_ACCOUNT" },
        { status: 403 },
      );
    }

    // Update user
    const user = await db.facultyUser.update({
      where: { id: payload.userId },
      data: {
        fullName: fullName || undefined,
        phoneNumber: typeof phoneNumber === "string" ? phoneNumber.trim() || null : undefined,
        department: department || undefined,
        faculty: faculty ?? undefined,
        course: course ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        themePreference: ["light", "dark"].includes(themePreference) ? themePreference : undefined,
        emailNotifications:
          typeof emailNotifications === "boolean" ? emailNotifications : undefined,
        referralNotifications:
          typeof referralNotifications === "boolean" ? referralNotifications : undefined,
        subscriptionNotifications:
          typeof subscriptionNotifications === "boolean" ? subscriptionNotifications : undefined,
        biometricsEnabled:
          typeof biometricsEnabled === "boolean" ? biometricsEnabled : undefined,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      department: user.department,
      faculty: user.faculty,
      course: user.course,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      biometricsEnabled: user.biometricsEnabled,
      preferences: {
        theme: user.themePreference,
        emailNotifications: user.emailNotifications,
        referralNotifications: user.referralNotifications,
        subscriptionNotifications: user.subscriptionNotifications,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
