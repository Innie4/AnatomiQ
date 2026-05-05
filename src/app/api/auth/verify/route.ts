import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const payload = await authenticateRequest(prisma);

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
        department: payload.department,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
