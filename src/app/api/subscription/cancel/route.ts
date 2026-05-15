import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { disablePaystackSubscription } from "@/lib/paystack";

export async function POST(request: NextRequest) {
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

    // Find active subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: "ACTIVE",
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (subscription.paystackSubscriptionCode) {
      await disablePaystackSubscription(
        subscription.paystackSubscriptionCode,
        subscription.paystackEmailToken
      );
    }

    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        autoRenew: false,
      },
    });

    return NextResponse.json({
      message: "Subscription cancelled successfully",
      subscription: updated,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
