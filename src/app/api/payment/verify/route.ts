import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { paystack } from "@/lib/paystack";
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

    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ error: "Payment reference required" }, { status: 400 });
    }

    // Verify with Paystack
    const verification = await paystack.transaction.verify(reference);

    if (!verification.status || verification.data.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not successful" }, { status: 400 });
    }

    const { metadata, amount, paid_at, customer } = verification.data;

    if (!metadata) {
      return NextResponse.json({ success: false, error: "Payment metadata missing" }, { status: 400 });
    }

    const userId = metadata.userId;
    const tier = metadata.tier;
    const billingPeriod = metadata.billingPeriod;

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const nextPaymentDate = new Date(endDate);

    // Create or update subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    let subscription;
    if (existingSubscription) {
      subscription = await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          tier,
          billingPeriod,
          status: "ACTIVE",
          endDate,
          lastPaymentDate: new Date(paid_at),
          nextPaymentDate,
          amountPaid: amount / 100,
          paystackCustomerCode: customer.customer_code,
        },
      });
    } else {
      subscription = await db.subscription.create({
        data: {
          userId,
          tier,
          billingPeriod,
          status: "ACTIVE",
          startDate,
          endDate,
          lastPaymentDate: new Date(paid_at),
          nextPaymentDate,
          amountPaid: amount / 100,
          paystackCustomerCode: customer.customer_code,
        },
      });
    }

    // Record payment history
    await db.paymentHistory.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount: amount / 100,
        status: "SUCCESS",
        paystackReference: reference,
        paidAt: new Date(paid_at),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        tier: subscription.tier,
        billingPeriod: subscription.billingPeriod,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
