import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  WEBAUTHN_LOGIN_CHALLENGE_COOKIE,
  getWebAuthnRequestMeta,
} from "@/lib/webauthn";

export async function POST(request: Request) {
  const { rpID } = getWebAuthnRequestMeta(request);
  const credentialCount = await db.webAuthnCredential.count({
    where: { user: { biometricsEnabled: true, isActive: true, isGuest: false } },
  });

  if (credentialCount === 0) {
    return NextResponse.json({ error: "No biometric login has been set up yet." }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  });

  const response = NextResponse.json(options);
  response.cookies.set(WEBAUTHN_LOGIN_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
