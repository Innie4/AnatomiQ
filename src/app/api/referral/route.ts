import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getReferralStats } from "@/lib/referral";

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

    const stats = await getReferralStats(payload.userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral information" },
      { status: 500 }
    );
  }
}
