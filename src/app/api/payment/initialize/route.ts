import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { paystack, generatePaymentReference } from "@/lib/paystack";
import { PRICING } from "@/lib/pricing";

export async function POST(request: NextRequest) {
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
    const { tier, billingPeriod } = body;

    // Validate tier
    if (!["STARTER", "PRO"].includes(tier)) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    // Validate billing period
    if (!["MONTHLY", "ANNUAL"].includes(billingPeriod)) {
      return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
    }

    // Get user
    const user = await db.facultyUser.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate amount in kobo (Paystack uses kobo)
    const pricing = PRICING[tier as keyof typeof PRICING];
    const amount = billingPeriod === "MONTHLY" ? pricing.monthly : pricing.annual;
    const amountInKobo = amount * 100;

    // Generate payment reference
    const reference = generatePaymentReference();

    // Initialize Paystack transaction
    const paystackResponse = await paystack.transaction.initialize({
      email: user.email,
      amount: amountInKobo,
      reference,
      currency: "NGN",
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata: {
        userId: user.id,
        tier,
        billingPeriod,
        userFullName: user.fullName,
      },
    });

    if (!paystackResponse.status) {
      throw new Error("Failed to initialize Paystack transaction");
    }

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
      accessCode: paystackResponse.data.access_code,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
