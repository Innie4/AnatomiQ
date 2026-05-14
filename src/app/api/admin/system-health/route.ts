import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(db, request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get system health metrics
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalPayments,
      successfulPayments,
      totalReferrals,
      completedReferrals,
      recentUsers,
    ] = await Promise.all([
      db.facultyUser.count(),
      db.facultyUser.count({ where: { isActive: true } }),
      db.subscription.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.paymentHistory.count(),
      db.paymentHistory.count({ where: { status: "SUCCESS" } }),
      db.referral.count(),
      db.referral.count({ where: { status: "COMPLETED" } }),
      db.facultyUser.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    // Revenue calculation
    const revenue = await db.paymentHistory.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: totalPayments - successfulPayments,
      },
      referrals: {
        total: totalReferrals,
        completed: completedReferrals,
        pending: totalReferrals - completedReferrals,
      },
      revenue: {
        total: revenue._sum.amount || 0,
        currency: "NGN",
      },
    });
  } catch (error) {
    console.error("Get system health error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system health" },
      { status: 500 }
    );
  }
}
