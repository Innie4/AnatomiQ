import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import * as forgotPasswordRouteModule from "@/app/api/auth/forgot-password/route";
import * as guestRouteModule from "@/app/api/auth/guest/route";
import * as loginRouteModule from "@/app/api/auth/login/route";
import * as profileRouteModule from "@/app/api/profile/route";
import * as resetPasswordRouteModule from "@/app/api/auth/reset-password/route";
import * as signupRouteModule from "@/app/api/auth/signup/route";

function getPostHandler(moduleRecord: Record<string, unknown>) {
  const handler =
    moduleRecord.POST ||
    (moduleRecord.default as { POST?: unknown } | undefined)?.POST ||
    (moduleRecord["module.exports"] as { POST?: unknown } | undefined)?.POST;

  if (typeof handler !== "function") {
    throw new TypeError("Route handler POST export was not found");
  }

  return handler as (request: Request) => Promise<Response>;
}

const guestRoute = getPostHandler(guestRouteModule);
const loginRoute = getPostHandler(loginRouteModule);
const signupRoute = getPostHandler(signupRouteModule);
const forgotPasswordRoute = getPostHandler(forgotPasswordRouteModule);
const resetPasswordRoute = getPostHandler(resetPasswordRouteModule);
const profilePatchRoute = profileRouteModule.PATCH as unknown as (request: Request) => Promise<Response>;

after(async () => {
  await db.$disconnect();
});

test("password reset supports phone OTP and guests cannot edit profile settings", async () => {
  const suffix = randomUUID().slice(0, 8);
  const email = `reset-${suffix}@example.com`;
  const phoneNumber = `+23480${Math.floor(10000000 + Math.random() * 89999999)}`;
  const otp = "482913";

  const user = await db.facultyUser.create({
    data: {
      fullName: "Reset Flow User",
      email,
      phoneNumber,
      department: "Human Anatomy",
      passwordHash: await hashPassword("OldPassword123!"),
      isActive: true,
      referralCode: `RST${suffix}`.toUpperCase(),
      resetOtpHash: await hashPassword(otp),
      resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      resetOtpChannel: "PHONE",
    },
  });

  try {
    const forgotResponse = await forgotPasswordRoute(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "phone", phoneNumber }),
      }),
    );
    assert.equal(forgotResponse.status, 200);

    await db.facultyUser.update({
      where: { id: user.id },
      data: {
        resetOtpHash: await hashPassword(otp),
        resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        resetOtpChannel: "PHONE",
      },
    });

    const resetResponse = await resetPasswordRoute(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "phone",
          identifier: phoneNumber,
          otp,
          password: "NewPassword123!",
        }),
      }),
    );
    assert.equal(resetResponse.status, 200);

    const loginResponse = await loginRoute(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.0.3.${Math.floor(Math.random() * 200) + 1}`,
        },
        body: JSON.stringify({ email, password: "NewPassword123!" }),
      }),
    );
    assert.equal(loginResponse.status, 200);

    const guest = await db.facultyUser.create({
      data: {
        fullName: "Guest Lockdown",
        email: `guest-lockdown-${suffix}@guest.anatomiq.local`,
        department: "Guest",
        isGuest: true,
        isActive: true,
      },
    });
    const guestToken = signToken({
      userId: guest.id,
      email: guest.email,
      fullName: guest.fullName,
      department: guest.department,
    });

    const guestPatchResponse = await profilePatchRoute(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({ fullName: "Edited Guest" }),
      }),
    );
    assert.equal(guestPatchResponse.status, 403);

    await db.facultyUser.delete({ where: { id: guest.id } });
  } finally {
    await db.facultyUser.deleteMany({ where: { email } });
  }
});

test("signup, login, and guest auth routes issue durable sessions", async () => {
  const suffix = randomUUID().slice(0, 8);
  const email = `auth-${suffix}@example.com`;

  try {
    const signupResponse = await signupRoute(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 200) + 1}`,
        },
        body: JSON.stringify({
          fullName: "Integration Auth User",
          email,
          password: "StrongPassword123!",
          department: "Human Anatomy",
          faculty: "Faculty of Basic Medical Sciences",
          course: "Human Anatomy",
        }),
      }),
    );
    const signupPayload = (await signupResponse.json()) as { token: string; user: { email: string } };

    assert.equal(signupResponse.status, 201);
    assert.equal(typeof signupPayload.token, "string");
    assert.equal(signupPayload.user.email, email);
    assert.match(signupResponse.headers.get("set-cookie") || "", /anatomiq_auth_token=/);

    const loginResponse = await loginRoute(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.0.1.${Math.floor(Math.random() * 200) + 1}`,
        },
        body: JSON.stringify({
          email,
          password: "StrongPassword123!",
        }),
      }),
    );
    const loginPayload = (await loginResponse.json()) as { token: string; user: { email: string } };

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.user.email, email);
    assert.match(loginResponse.headers.get("set-cookie") || "", /anatomiq_auth_token=/);

    const guestResponse = await guestRoute(
      new Request("http://localhost/api/auth/guest", {
        method: "POST",
        headers: {
          "x-forwarded-for": `10.0.2.${Math.floor(Math.random() * 200) + 1}`,
        },
      }),
    );
    const guestPayload = (await guestResponse.json()) as { user: { isGuest: boolean; email: string } };

    assert.equal(guestResponse.status, 200);
    assert.equal(guestPayload.user.isGuest, true);
    assert.match(guestResponse.headers.get("set-cookie") || "", /anatomiq_auth_token=/);

    await db.facultyUser.delete({
      where: {
        email: guestPayload.user.email,
      },
    });
  } finally {
    await db.facultyUser.deleteMany({
      where: { email },
    });
  }
});
