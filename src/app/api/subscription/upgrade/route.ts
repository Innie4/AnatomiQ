import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

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

    const { tier, billingPeriod } = await request.json();

    if (!tier || !["STARTER", "PRO"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    if (!billingPeriod || !["MONTHLY", "ANNUAL"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "Invalid billing period" },
        { status: 400 }
      );
    }

    // Find current active subscription
    const currentSubscription = await db.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: "ACTIVE",
      },
    });

    if (currentSubscription) {
      // Cancel current subscription
      await db.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: "CANCELLED",
          autoRenew: false,
        },
      });
    }

    // Create new subscription with PENDING status
    // (will be activated after payment)
    const newSubscription = await db.subscription.create({
      data: {
        userId: payload.userId,
        tier,
        billingPeriod,
        status: "PENDING",
        autoRenew: true,
      },
    });

    // TODO: Integrate with Paystack to initiate payment
    // const paymentUrl = await initiatePaystackPayment({
    //   email: user.email,
    //   amount: getSubscriptionAmount(tier, billingPeriod),
    //   plan: tier,
    //   metadata: { subscriptionId: newSubscription.id }
    // });

    return NextResponse.json({
      message: "Subscription upgrade initiated",
      subscription: newSubscription,
      // paymentUrl, // Redirect user here to complete payment
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
