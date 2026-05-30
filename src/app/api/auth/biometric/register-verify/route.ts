import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  WEBAUTHN_REGISTER_CHALLENGE_COOKIE,
  credentialIdToString,
  getWebAuthnRequestMeta,
} from "@/lib/webauthn";

export async function POST(request: Request) {
  const auth = await authenticateRequest(db, request);
  if (!auth || auth.userId === "legacy-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.facultyUser.findUnique({ where: { id: auth.userId } });
  if (!user || user.isGuest) {
    return NextResponse.json({ error: "Please sign in or create an account to use biometrics." }, { status: 403 });
  }

  const expectedChallenge = request.headers.get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${WEBAUTHN_REGISTER_CHALLENGE_COOKIE}=`))
    ?.split("=")[1];

  if (!expectedChallenge) {
    return NextResponse.json({ error: "Biometric setup expired. Try again." }, { status: 400 });
  }

  const responseBody = (await request.json()) as RegistrationResponseJSON;
  const { origin, rpID } = getWebAuthnRequestMeta(request);
  const verification = await verifyRegistrationResponse({
    response: responseBody,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Biometric setup could not be verified." }, { status: 400 });
  }

  const credentialId = credentialIdToString(verification.registrationInfo.credentialID);

  await db.$transaction([
    db.webAuthnCredential.upsert({
      where: { credentialId },
      create: {
        userId: user.id,
        credentialId,
        publicKey: isoBase64URL.fromBuffer(verification.registrationInfo.credentialPublicKey),
        counter: verification.registrationInfo.counter,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        transports: responseBody.response.transports || [],
      },
      update: {
        publicKey: isoBase64URL.fromBuffer(verification.registrationInfo.credentialPublicKey),
        counter: verification.registrationInfo.counter,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        transports: responseBody.response.transports || [],
      },
    }),
    db.facultyUser.update({
      where: { id: user.id },
      data: { biometricsEnabled: true },
    }),
  ]);

  const response = NextResponse.json({ verified: true });
  response.cookies.set(WEBAUTHN_REGISTER_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
