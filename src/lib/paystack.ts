import Paystack from "paystack-node";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

let paystackInstance: Paystack | null = null;

function getPaystackInstance(): Paystack {
  if (!paystackInstance) {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack credentials not configured");
    }
    paystackInstance = new Paystack(PAYSTACK_SECRET_KEY);
  }
  return paystackInstance;
}

export const paystack = new Proxy({} as Paystack, {
  get(_target, prop) {
    return (getPaystackInstance() as any)[prop];
  },
});

export const PAYSTACK_CONFIG = {
  publicKey: PAYSTACK_PUBLIC_KEY,
  secretKey: PAYSTACK_SECRET_KEY,
};

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `ANATQ-${timestamp}-${random}`.toUpperCase();
}
