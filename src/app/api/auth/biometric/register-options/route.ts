import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  WEBAUTHN_REGISTER_CHALLENGE_COOKIE,
  getWebAuthnRequestMeta,
  stringToCredentialId,
} from "@/lib/webauthn";

export async function POST(request: Request) {
  const auth = await authenticateRequest(db, request);
  if (!auth || auth.userId === "legacy-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.facultyUser.findUnique({
    where: { id: auth.userId },
    include: { WebAuthnCredentials: true },
  });

  if (!user || user.isGuest) {
    return NextResponse.json({ error: "Please sign in or create an account to use biometrics." }, { status: 403 });
  }

  const { rpID, rpName } = getWebAuthnRequestMeta(request);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.fullName,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: user.WebAuthnCredentials.map((credential) => ({
      id: stringToCredentialId(credential.credentialId),
      type: "public-key",
      transports: credential.transports as AuthenticatorTransportFuture[],
    })),
  });

  const response = NextResponse.json(options);
  response.cookies.set(WEBAUTHN_REGISTER_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
