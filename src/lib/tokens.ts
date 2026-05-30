import { randomBytes } from "crypto";

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate token expiry time (1 hour from now)
 */
export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOtpExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}
