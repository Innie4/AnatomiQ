import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { db } from "@/lib/db";
import * as guestRouteModule from "@/app/api/auth/guest/route";
import * as loginRouteModule from "@/app/api/auth/login/route";
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

after(async () => {
  await db.$disconnect();
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
          faculty: "Medicine",
        }),
      }),
    );
    const signupPayload = (await signupResponse.json()) as { token: string; user: { email: string } };

    assert.equal(signupResponse.status, 201);
    assert.equal(typeof signupPayload.token, "string");
    assert.equal(signupPayload.user.email, email);
    assert.match(signupResponse.headers.get("set-cookie") || "", /anatomiq:auth-token=/);

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
    assert.match(loginResponse.headers.get("set-cookie") || "", /anatomiq:auth-token=/);

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
    assert.match(guestResponse.headers.get("set-cookie") || "", /anatomiq:auth-token=/);

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
