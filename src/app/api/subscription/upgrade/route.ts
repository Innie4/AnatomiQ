import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentReference, initializePaystackPayment } from "@/lib/paystack";
import { PRICING } from "@/lib/pricing";

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

    const user = await db.facultyUser.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newSubscription = await db.subscription.create({
      data: {
        userId: payload.userId,
        tier,
        billingPeriod,
        status: "PENDING",
        autoRenew: true,
      },
    });

    try {
      const pricing = PRICING[tier as keyof typeof PRICING];
      const amount = billingPeriod === "MONTHLY" ? pricing.monthly : pricing.annual;
      const reference = generatePaymentReference();
      const payment = await initializePaystackPayment({
        email: user.email,
        amountInKobo: amount * 100,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/callback`,
        metadata: {
          userId: user.id,
          tier,
          billingPeriod,
          subscriptionId: newSubscription.id,
          userFullName: user.fullName,
        },
      });

      return NextResponse.json({
        message: "Subscription upgrade initiated",
        subscription: newSubscription,
        paymentUrl: payment.authorizationUrl,
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference,
        accessCode: payment.accessCode,
      });
    } catch (paymentError) {
      await db.subscription.delete({ where: { id: newSubscription.id } });
      throw paymentError;
    }
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
