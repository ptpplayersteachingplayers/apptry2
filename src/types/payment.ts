/**
 * Payment-related TypeScript types
 *
 * Defines types for Stripe payment processing.
 */

/**
 * Payment method types supported
 */
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay' | 'bank_account';

/**
 * Card brand types
 */
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | 'unknown';

/**
 * Payment status
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'requires_action'
  | 'requires_payment_method';

/**
 * Saved payment method
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  createdAt: string;

  // Card details (if type is 'card')
  card?: {
    brand: CardBrand;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  };

  // Billing details
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };
}

/**
 * Payment intent for processing a payment
 */
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId?: string;

  // Metadata
  orderId?: number;
  programId?: number;
  customerId?: number;

  // Timestamps
  createdAt: string;
}

/**
 * Setup intent for saving payment methods
 */
export interface SetupIntent {
  id: string;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  paymentMethodId?: string;
}

/**
 * Request to create payment intent
 */
export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  orderId?: number;
  programId?: number;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Request to create setup intent (for saving cards)
 */
export interface CreateSetupIntentRequest {
  customerId?: number;
  usage?: 'on_session' | 'off_session';
}

/**
 * Confirm payment request
 */
export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

/**
 * Payment result
 */
export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  orderId?: number;
  error?: {
    code: string;
    message: string;
    declineCode?: string;
  };
}

/**
 * Refund request
 */
export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

/**
 * Refund result
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: 'pending' | 'succeeded' | 'failed' | 'canceled';
  error?: string;
}

/**
 * Apple Pay / Google Pay configuration
 */
export interface WalletPaymentConfig {
  merchantId: string;
  merchantName: string;
  countryCode: string;
  currencyCode: string;
  supportedNetworks: CardBrand[];
}

/**
 * Payment sheet configuration
 */
export interface PaymentSheetConfig {
  paymentIntentClientSecret: string;
  customerEphemeralKeySecret?: string;
  customerId?: string;
  merchantDisplayName: string;
  applePay?: {
    merchantCountryCode: string;
    merchantId: string;
  };
  googlePay?: {
    merchantCountryCode: string;
    testEnv?: boolean;
  };
  defaultBillingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  allowsDelayedPaymentMethods?: boolean;
  returnURL?: string;
}

/**
 * Payment methods response
 */
export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string;
}

/**
 * Stripe configuration for the app
 */
export interface StripeConfig {
  publishableKey: string;
  merchantIdentifier: string;
  urlScheme: string;
}
