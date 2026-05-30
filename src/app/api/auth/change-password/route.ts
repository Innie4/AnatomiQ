import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { hashPassword, comparePassword } from "@/lib/auth";
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

    const { currentPassword, newPassword } = await request.json();

    const user = await db.facultyUser.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.isGuest) {
      return NextResponse.json(
        { error: "Guests need to sign in or create an account before changing a password.", code: "GUEST_REQUIRES_ACCOUNT" },
        { status: 403 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.facultyUser.update({
      where: { id: payload.userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
