import { NextResponse } from "next/server";

import { auth } from "@/lib/auth-config";
import { signToken } from "@/lib/auth";
import { serializeFacultyUser, setAuthCookie } from "@/lib/auth-session";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "No social session found" }, { status: 401 });
  }

  const user = await db.facultyUser.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.requiresProfileCompletion) {
    return NextResponse.json({
      requiresProfileCompletion: true,
      user: serializeFacultyUser(user),
    });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    department: user.department,
  });

  const response = NextResponse.json({
    requiresProfileCompletion: false,
    token,
    user: serializeFacultyUser(user),
  });

  return setAuthCookie(response, token);
}
