import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { NextResponse } from "next/server";

import { signToken } from "@/lib/auth";
import { serializeFacultyUser, setAuthCookie } from "@/lib/auth-session";
import { db } from "@/lib/db";
import {
  WEBAUTHN_LOGIN_CHALLENGE_COOKIE,
  credentialToAuthenticator,
  getWebAuthnRequestMeta,
} from "@/lib/webauthn";

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function POST(request: Request) {
  const expectedChallenge = readCookie(request, WEBAUTHN_LOGIN_CHALLENGE_COOKIE);

  if (!expectedChallenge) {
    return NextResponse.json({ error: "Biometric login expired. Try again." }, { status: 400 });
  }

  const responseBody = (await request.json()) as AuthenticationResponseJSON;
  const credential = await db.webAuthnCredential.findUnique({
    where: { credentialId: responseBody.id },
    include: { user: true },
  });

  if (!credential || !credential.user.biometricsEnabled || credential.user.isGuest || !credential.user.isActive) {
    return NextResponse.json({ error: "This biometric credential is not active." }, { status: 401 });
  }

  const { origin, rpID } = getWebAuthnRequestMeta(request);
  const verification = await verifyAuthenticationResponse({
    response: responseBody,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: credentialToAuthenticator(credential),
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Biometric login could not be verified." }, { status: 401 });
  }

  await db.webAuthnCredential.update({
    where: { id: credential.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });

  const token = signToken({
    userId: credential.user.id,
    email: credential.user.email,
    fullName: credential.user.fullName,
    department: credential.user.department,
  });

  const response = NextResponse.json({
    token,
    user: serializeFacultyUser(credential.user),
  });

  response.cookies.set(WEBAUTHN_LOGIN_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return setAuthCookie(response, token);
}
