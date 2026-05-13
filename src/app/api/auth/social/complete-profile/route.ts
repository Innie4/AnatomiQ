import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth-config";
import { signToken } from "@/lib/auth";
import { AUTH_DEPARTMENTS, AUTH_FACULTIES } from "@/lib/auth-options";
import { serializeFacultyUser, setAuthCookie } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { processReferral } from "@/lib/referral";

const completeProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  department: z.enum(AUTH_DEPARTMENTS, {
    error: "Please choose your department",
  }),
  faculty: z.union([z.enum(AUTH_FACULTIES), z.literal("")]).optional(),
  referralCode: z.string().trim().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "No social session found" }, { status: 401 });
  }

  const payload = completeProfileSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid profile data" }, { status: 400 });
  }

  const existingUser = await db.facultyUser.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedUser = await db.facultyUser.update({
    where: { id: existingUser.id },
    data: {
      fullName: payload.data.fullName,
      department: payload.data.department,
      faculty: payload.data.faculty || null,
      emailVerified: true,
      requiresProfileCompletion: false,
    },
  });

  const submittedReferralCode = payload.data.referralCode?.toUpperCase();
  if (submittedReferralCode && !updatedUser.referredBy && submittedReferralCode !== updatedUser.referralCode) {
    await processReferral(updatedUser.id, submittedReferralCode);
  }

  const token = signToken({
    userId: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    department: updatedUser.department,
  });

  const response = NextResponse.json({
    token,
    user: serializeFacultyUser(updatedUser),
  });

  return setAuthCookie(response, token);
}
