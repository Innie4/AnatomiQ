import { NextResponse } from "next/server";

import type { FacultyUser } from "@prisma/client";

const AUTH_COOKIE_NAME = "anatomiq:auth-token";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function serializeFacultyUser(user: FacultyUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    department: user.department,
    faculty: user.faculty,
    isGuest: user.isGuest,
    avatarUrl: user.avatarUrl,
    requiresProfileCompletion: user.requiresProfileCompletion,
  };
}
