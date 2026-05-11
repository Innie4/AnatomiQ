import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle successful payment
    if (event.event === "charge.success") {
      const { reference, amount, metadata, paid_at, customer } = event.data;

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

      // Calculate next payment date
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
        // Update existing subscription
        subscription = await db.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            tier,
            billingPeriod,
            status: "ACTIVE",
            endDate,
            lastPaymentDate: new Date(paid_at),
            nextPaymentDate,
            amountPaid: amount / 100, // Convert from kobo to naira
            paystackCustomerCode: customer.customer_code,
          },
        });
      } else {
        // Create new subscription
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

      console.log(`Payment successful for user ${userId}: ${tier} (${billingPeriod})`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
