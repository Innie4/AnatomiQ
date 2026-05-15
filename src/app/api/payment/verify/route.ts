import { NextRequest, NextResponse } from "next/server";
import { BillingPeriod, SubscriptionTier } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import { paystack } from "@/lib/paystack";
import { db } from "@/lib/db";

type PaystackVerificationMetadata = {
  userId?: unknown;
  tier?: unknown;
  billingPeriod?: unknown;
  subscriptionId?: unknown;
};

function parseSubscriptionTier(value: unknown) {
  return typeof value === "string" && Object.values(SubscriptionTier).includes(value as SubscriptionTier)
    ? (value as SubscriptionTier)
    : null;
}

function parseBillingPeriod(value: unknown) {
  return typeof value === "string" && Object.values(BillingPeriod).includes(value as BillingPeriod)
    ? (value as BillingPeriod)
    : null;
}

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

    const typedMetadata = metadata as PaystackVerificationMetadata;
    const userId = typeof typedMetadata.userId === "string" ? typedMetadata.userId : null;
    const tier = parseSubscriptionTier(typedMetadata.tier);
    const billingPeriod = parseBillingPeriod(typedMetadata.billingPeriod);
    const subscriptionId = typeof typedMetadata.subscriptionId === "string" ? typedMetadata.subscriptionId : null;
    const paidAt = typeof paid_at === "string" ? new Date(paid_at) : new Date();
    const amountPaid = typeof amount === "number" ? amount / 100 : 0;
    const customerCode =
      customer && typeof customer === "object" && "customer_code" in customer && typeof customer.customer_code === "string"
        ? customer.customer_code
        : undefined;

    if (!userId || !tier || !billingPeriod) {
      return NextResponse.json({ success: false, error: "Invalid payment metadata" }, { status: 400 });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingPeriod === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const nextPaymentDate = new Date(endDate);

    await db.subscription.updateMany({
      where: {
        userId,
        status: "ACTIVE",
        ...(subscriptionId ? { id: { not: subscriptionId } } : {}),
      },
      data: {
        status: "CANCELLED",
        autoRenew: false,
      },
    });

    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId,
        ...(subscriptionId ? { id: subscriptionId } : { status: "PENDING" }),
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
          lastPaymentDate: paidAt,
          nextPaymentDate,
          amountPaid,
          paystackCustomerCode: customerCode,
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
          lastPaymentDate: paidAt,
          nextPaymentDate,
          amountPaid,
          paystackCustomerCode: customerCode,
        },
      });
    }

    // Record payment history
    await db.paymentHistory.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount: amountPaid,
        status: "SUCCESS",
        paystackReference: reference,
        paidAt,
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
