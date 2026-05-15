declare module 'paystack-node' {
  interface TransactionInitializeData {
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
    callback_url?: string;
    metadata?: Record<string, unknown>;
    channels?: string[];
    split_code?: string;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: string;
  }

  interface TransactionInitializeResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }

  interface TransactionVerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string;
      channel: string;
      customer: {
        id: number;
        email: string;
        customer_code: string;
        first_name?: string;
        last_name?: string;
      };
      metadata?: Record<string, unknown>;
      [key: string]: unknown;
    };
  }

  interface TransactionInterface {
    initialize(data: TransactionInitializeData): Promise<TransactionInitializeResponse>;
    verify(reference: string): Promise<TransactionVerifyResponse>;
  }

  class Paystack {
    constructor(secretKey: string, publicKey?: string);
    transaction: TransactionInterface;
  }

  export default Paystack;
}
