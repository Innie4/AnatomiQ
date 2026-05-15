/* eslint-disable @typescript-eslint/no-explicit-any */
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

export async function initializePaystackPayment(params: {
  email: string;
  amountInKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}) {
  const response = await paystack.transaction.initialize({
    email: params.email,
    amount: params.amountInKobo,
    reference: params.reference,
    currency: "NGN",
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  });

  if (!response.status) {
    throw new Error("Failed to initialize Paystack transaction");
  }

  return {
    authorizationUrl: response.data.authorization_url,
    reference: response.data.reference,
    accessCode: response.data.access_code,
  };
}

export async function disablePaystackSubscription(subscriptionCode: string, emailToken?: string | null) {
  if (!subscriptionCode || !emailToken) {
    return { skipped: true };
  }

  const response = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Paystack subscription cancellation failed: ${detail}`);
  }

  return { skipped: false };
}
