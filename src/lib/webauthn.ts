import { isoBase64URL } from "@simplewebauthn/server/helpers";

import type { WebAuthnCredential } from "@prisma/client";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";

export const WEBAUTHN_REGISTER_CHALLENGE_COOKIE = "anatomiq:webauthn-register";
export const WEBAUTHN_LOGIN_CHALLENGE_COOKIE = "anatomiq:webauthn-login";

export function getWebAuthnRequestMeta(request: Request) {
  const url = new URL(request.url);
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const origin = configuredOrigin || url.origin;
  const rpID = new URL(origin).hostname;

  return {
    origin,
    rpID,
    rpName: "AnatomiQ",
  };
}

export function credentialIdToString(credentialId: Uint8Array) {
  return isoBase64URL.fromBuffer(credentialId);
}

export function stringToCredentialId(credentialId: string) {
  return isoBase64URL.toBuffer(credentialId);
}

export function credentialToAuthenticator(credential: WebAuthnCredential) {
  return {
    credentialID: stringToCredentialId(credential.credentialId),
    credentialPublicKey: isoBase64URL.toBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports as AuthenticatorTransportFuture[],
  };
}
