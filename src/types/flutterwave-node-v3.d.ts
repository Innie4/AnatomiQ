/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'flutterwave-node-v3' {
  interface FlutterwaveConfig {
    public_key: string;
    secret_key: string;
  }

  interface PaymentData {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
      email: string;
      name: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
    meta?: Record<string, unknown>;
  }

  interface PaymentResponse {
    status: string;
    message: string;
    data: {
      link: string;
      [key: string]: unknown;
    };
  }

  interface VerificationResponse {
    status: string;
    message: string;
    data: {
      id: number;
      tx_ref: string;
      flw_ref: string;
      amount: number;
      currency: string;
      charged_amount: number;
      status: string;
      payment_type: string;
      created_at: string;
      customer: {
        id: number;
        email: string;
        name: string;
      };
      meta?: Record<string, unknown>;
      [key: string]: unknown;
    };
  }

  interface PaymentInterface {
    initialize(data: PaymentData): Promise<PaymentResponse>;
  }

  interface TransactionInterface {
    verify(data: { id: string }): Promise<VerificationResponse>;
  }

  class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    Payment: PaymentInterface;
    Transaction: TransactionInterface;
  }

  export default Flutterwave;
}
