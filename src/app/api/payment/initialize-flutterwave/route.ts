import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { flutterwave, generateFlutterwaveReference } from "@/lib/flutterwave";
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

    // Calculate amount
    const pricing = PRICING[tier as keyof typeof PRICING];
    const amount = billingPeriod === "MONTHLY" ? pricing.monthly : pricing.annual;

    // Generate payment reference
    const reference = generateFlutterwaveReference();

    // Initialize Flutterwave payment
    const paymentData = {
      tx_ref: reference,
      amount,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      customer: {
        email: user.email,
        name: user.fullName,
      },
      customizations: {
        title: "AcademIQ Subscription",
        description: `${tier} Plan (${billingPeriod})`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/anatomiQ.png`,
      },
      meta: {
        userId: user.id,
        tier,
        billingPeriod,
      },
    };

    const response = await flutterwave.Payment.initialize(paymentData);

    if (response.status !== "success") {
      throw new Error("Failed to initialize Flutterwave payment");
    }

    return NextResponse.json({
      authorizationUrl: response.data.link,
      reference: reference,
    });
  } catch (error) {
    console.error("Flutterwave initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
