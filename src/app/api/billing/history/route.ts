import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch payment history
    const payments = await db.paymentHistory.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          select: {
            tier: true,
            billingPeriod: true,
          },
        },
      },
    });

    // Fetch subscription history
    const subscriptions = await db.subscription.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      payments,
      subscriptions,
    });
  } catch (error) {
    console.error("Get billing history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}
