import Flutterwave from "flutterwave-node-v3";

const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "";
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLW_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY || "";

if (!FLW_SECRET_KEY) {
  console.warn("FLUTTERWAVE_SECRET_KEY is not set");
}

export const flutterwave = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY);

export const FLUTTERWAVE_CONFIG = {
  publicKey: FLW_PUBLIC_KEY,
  secretKey: FLW_SECRET_KEY,
  encryptionKey: FLW_ENCRYPTION_KEY,
};

export function generateFlutterwaveReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `ANATQ-FLW-${timestamp}-${random}`.toUpperCase();
}
