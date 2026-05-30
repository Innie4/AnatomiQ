import { NextResponse } from "next/server";

import type { FacultyUser } from "@prisma/client";

export const AUTH_COOKIE_NAME = "anatomiq_auth_token";
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
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    department: user.department,
    faculty: user.faculty,
    course: user.course,
    isGuest: user.isGuest,
    avatarUrl: user.avatarUrl,
    preferences: {
      theme: user.themePreference,
      emailNotifications: user.emailNotifications,
      referralNotifications: user.referralNotifications,
      subscriptionNotifications: user.subscriptionNotifications,
    },
    biometricsEnabled: user.biometricsEnabled,
    requiresProfileCompletion: user.requiresProfileCompletion,
  };
}
