-- Add phone-based password reset support and WebAuthn credentials.
CREATE TYPE "PasswordResetChannel" AS ENUM ('EMAIL', 'PHONE');

ALTER TABLE "FacultyUser"
ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "biometricsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resetOtpHash" TEXT,
ADD COLUMN "resetOtpExpiry" TIMESTAMP(3),
ADD COLUMN "resetOtpChannel" "PasswordResetChannel";

CREATE UNIQUE INDEX "FacultyUser_phoneNumber_key" ON "FacultyUser"("phoneNumber");

CREATE TABLE "WebAuthnCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "publicKey" TEXT NOT NULL,
  "counter" INTEGER NOT NULL DEFAULT 0,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL DEFAULT false,
  "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),

  CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");
CREATE INDEX "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId");

ALTER TABLE "WebAuthnCredential"
ADD CONSTRAINT "WebAuthnCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "FacultyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
