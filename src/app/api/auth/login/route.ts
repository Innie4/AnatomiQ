import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { comparePassword, signToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.facultyUser.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
