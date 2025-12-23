/**
 * Payments API Module
 *
 * Handles Stripe payment processing for the PTP app.
 * Supports native payments, Apple Pay, Google Pay, and saved payment methods.
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  PaymentMethod,
  PaymentIntent,
  SetupIntent,
  CreatePaymentIntentRequest,
  CreateSetupIntentRequest,
  ConfirmPaymentRequest,
  PaymentResult,
  PaymentMethodsResponse,
  RefundRequest,
  RefundResult,
  StripeConfig,
  PaymentSheetConfig,
  CardBrand,
} from '../types';

import Constants from 'expo-constants';

// Get environment variables from Expo config
const expoConfig = Constants.expoConfig?.extra || {};

/**
 * Stripe configuration
 *
 * For production deployment:
 * - Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file
 * - Use pk_live_* keys for production, pk_test_* for testing
 */
export const stripeConfig: StripeConfig = {
  publishableKey:
    expoConfig.STRIPE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_test_placeholder',
  merchantIdentifier: 'merchant.com.ptpsoccer.app',
  urlScheme: 'ptpsoccer',
};

/**
 * Get Stripe configuration from server
 * Ensures we always have the correct publishable key
 */
export const getStripeConfig = async (): Promise<StripeConfig> => {
  if (apiConfig.demoMode) {
    return stripeConfig;
  }

  try {
    const response = await apiClient.get('/payments/config');
    return {
      publishableKey: response.data.publishable_key,
      merchantIdentifier: response.data.merchant_identifier || stripeConfig.merchantIdentifier,
      urlScheme: response.data.url_scheme || stripeConfig.urlScheme,
    };
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return stripeConfig;
  }
};

/**
 * Create a payment intent for processing a payment
 *
 * POST /wp-json/ptp/v1/payments/intent
 */
export const createPaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<PaymentIntent> => {
  if (apiConfig.demoMode) {
    return mockCreatePaymentIntent(data);
  }

  const response = await apiClient.post('/payments/intent', {
    amount: data.amount,
    currency: data.currency || 'usd',
    order_id: data.orderId,
    program_id: data.programId,
    payment_method_id: data.paymentMethodId,
    save_payment_method: data.savePaymentMethod,
    metadata: data.metadata,
  });

  return mapPaymentIntent(response.data);
};

/**
 * Create a setup intent for saving a payment method
 *
 * POST /wp-json/ptp/v1/payments/setup-intent
 */
export const createSetupIntent = async (
  data?: CreateSetupIntentRequest
): Promise<SetupIntent> => {
  if (apiConfig.demoMode) {
    return mockCreateSetupIntent();
  }

  const response = await apiClient.post('/payments/setup-intent', {
    customer_id: data?.customerId,
    usage: data?.usage || 'off_session',
  });

  return {
    id: response.data.id,
    clientSecret: response.data.client_secret,
    status: response.data.status,
    paymentMethodId: response.data.payment_method,
  };
};

/**
 * Get payment sheet parameters for Stripe Payment Sheet
 *
 * POST /wp-json/ptp/v1/payments/sheet
 */
export const getPaymentSheetParams = async (
  amount: number,
  orderId?: number
): Promise<PaymentSheetConfig> => {
  if (apiConfig.demoMode) {
    return mockPaymentSheetConfig(amount);
  }

  const response = await apiClient.post('/payments/sheet', {
    amount,
    order_id: orderId,
  });

  return {
    paymentIntentClientSecret: response.data.payment_intent_client_secret,
    customerEphemeralKeySecret: response.data.ephemeral_key,
    customerId: response.data.customer_id,
    merchantDisplayName: 'PTP Soccer',
    applePay: {
      merchantCountryCode: 'US',
      merchantId: stripeConfig.merchantIdentifier,
    },
    googlePay: {
      merchantCountryCode: 'US',
      testEnv: __DEV__,
    },
    returnURL: `${stripeConfig.urlScheme}://stripe-redirect`,
  };
};

/**
 * Confirm a payment intent
 *
 * POST /wp-json/ptp/v1/payments/confirm
 */
export const confirmPayment = async (
  data: ConfirmPaymentRequest
): Promise<PaymentResult> => {
  if (apiConfig.demoMode) {
    return mockConfirmPayment(data);
  }

  try {
    const response = await apiClient.post('/payments/confirm', {
      payment_intent_id: data.paymentIntentId,
      payment_method_id: data.paymentMethodId,
      return_url: data.returnUrl,
    });

    return {
      success: response.data.status === 'succeeded',
      paymentIntent: mapPaymentIntent(response.data),
      orderId: response.data.order_id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.response?.data?.code || 'payment_failed',
        message: error.response?.data?.message || 'Payment failed. Please try again.',
        declineCode: error.response?.data?.decline_code,
      },
    };
  }
};

/**
 * Get saved payment methods for the current user
 *
 * GET /wp-json/ptp/v1/payments/methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethodsResponse> => {
  if (apiConfig.demoMode) {
    return { paymentMethods: mockPaymentMethods, defaultPaymentMethodId: mockPaymentMethods[0]?.id };
  }

  const response = await apiClient.get('/payments/methods');
  return {
    paymentMethods: (response.data.payment_methods || []).map(mapPaymentMethod),
    defaultPaymentMethodId: response.data.default_payment_method_id,
  };
};

/**
 * Add a new payment method
 *
 * POST /wp-json/ptp/v1/payments/methods
 */
export const addPaymentMethod = async (
  paymentMethodId: string,
  setAsDefault?: boolean
): Promise<PaymentMethod> => {
  if (apiConfig.demoMode) {
    const newMethod: PaymentMethod = {
      id: paymentMethodId,
      type: 'card',
      isDefault: setAsDefault || mockPaymentMethods.length === 0,
      createdAt: new Date().toISOString(),
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2026,
        funding: 'credit',
      },
    };
    mockPaymentMethods.push(newMethod);
    return newMethod;
  }

  const response = await apiClient.post('/payments/methods', {
    payment_method_id: paymentMethodId,
    set_as_default: setAsDefault,
  });

  return mapPaymentMethod(response.data);
};

/**
 * Delete a payment method
 *
 * DELETE /wp-json/ptp/v1/payments/methods/:id
 */
export const deletePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
  if (apiConfig.demoMode) {
    const index = mockPaymentMethods.findIndex((m) => m.id === paymentMethodId);
    if (index !== -1) mockPaymentMethods.splice(index, 1);
    return true;
  }

  await apiClient.delete(`/payments/methods/${paymentMethodId}`);
  return true;
};

/**
 * Set a payment method as default
 *
 * PUT /wp-json/ptp/v1/payments/methods/:id/default
 */
export const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
  if (apiConfig.demoMode) {
    mockPaymentMethods.forEach((m) => {
      m.isDefault = m.id === paymentMethodId;
    });
    return true;
  }

  await apiClient.put(`/payments/methods/${paymentMethodId}/default`);
  return true;
};

/**
 * Request a refund
 *
 * POST /wp-json/ptp/v1/payments/refund
 */
export const requestRefund = async (data: RefundRequest): Promise<RefundResult> => {
  if (apiConfig.demoMode) {
    return {
      success: true,
      refundId: `re_demo_${Date.now()}`,
      amount: data.amount || 0,
      status: 'pending',
    };
  }

  try {
    const response = await apiClient.post('/payments/refund', {
      payment_intent_id: data.paymentIntentId,
      amount: data.amount,
      reason: data.reason,
    });

    return {
      success: true,
      refundId: response.data.refund_id,
      amount: response.data.amount,
      status: response.data.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Refund failed',
    };
  }
};

/**
 * Get card brand icon name (for Ionicons)
 */
export const getCardBrandIcon = (brand: CardBrand): string => {
  const icons: Record<CardBrand, string> = {
    visa: 'card',
    mastercard: 'card',
    amex: 'card',
    discover: 'card',
    diners: 'card',
    jcb: 'card',
    unionpay: 'card',
    unknown: 'card-outline',
  };
  return icons[brand] || 'card-outline';
};

/**
 * Get card brand display name
 */
export const getCardBrandName = (brand: CardBrand): string => {
  const names: Record<CardBrand, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
    unknown: 'Card',
  };
  return names[brand] || 'Card';
};

/**
 * Format card expiry for display
 */
export const formatCardExpiry = (month: number, year: number): string => {
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString().slice(-2);
  return `${monthStr}/${yearStr}`;
};

/**
 * Check if a card is expired
 */
export const isCardExpired = (expMonth: number, expYear: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (expYear < currentYear) return true;
  if (expYear === currentYear && expMonth < currentMonth) return true;
  return false;
};

// ============================================================
// DATA MAPPING
// ============================================================

const mapPaymentIntent = (data: any): PaymentIntent => ({
  id: data.id,
  clientSecret: data.client_secret,
  amount: data.amount,
  currency: data.currency,
  status: data.status,
  paymentMethodId: data.payment_method,
  orderId: data.metadata?.order_id,
  programId: data.metadata?.program_id,
  customerId: data.metadata?.customer_id,
  createdAt: data.created ? new Date(data.created * 1000).toISOString() : new Date().toISOString(),
});

const mapPaymentMethod = (data: any): PaymentMethod => ({
  id: data.id,
  type: data.type || 'card',
  isDefault: data.is_default || false,
  createdAt: data.created ? new Date(data.created * 1000).toISOString() : new Date().toISOString(),
  card: data.card
    ? {
        brand: data.card.brand || 'unknown',
        last4: data.card.last4,
        expMonth: data.card.exp_month,
        expYear: data.card.exp_year,
        funding: data.card.funding || 'unknown',
      }
    : undefined,
  billingDetails: data.billing_details
    ? {
        name: data.billing_details.name,
        email: data.billing_details.email,
        phone: data.billing_details.phone,
        address: data.billing_details.address,
      }
    : undefined,
});

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_demo_1',
    type: 'card',
    isDefault: true,
    createdAt: '2024-10-01T00:00:00Z',
    card: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2026,
      funding: 'credit',
    },
    billingDetails: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
    },
  },
  {
    id: 'pm_demo_2',
    type: 'card',
    isDefault: false,
    createdAt: '2024-08-15T00:00:00Z',
    card: {
      brand: 'mastercard',
      last4: '5555',
      expMonth: 6,
      expYear: 2025,
      funding: 'debit',
    },
  },
];

const mockCreatePaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<PaymentIntent> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: `pi_demo_${Date.now()}`,
    clientSecret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
    amount: data.amount,
    currency: data.currency || 'usd',
    status: 'requires_payment_method',
    orderId: data.orderId,
    programId: data.programId,
    createdAt: new Date().toISOString(),
  };
};

const mockCreateSetupIntent = async (): Promise<SetupIntent> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: `seti_demo_${Date.now()}`,
    clientSecret: `seti_demo_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
    status: 'requires_payment_method',
  };
};

const mockPaymentSheetConfig = (amount: number): PaymentSheetConfig => ({
  paymentIntentClientSecret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
  customerEphemeralKeySecret: `ek_demo_${Math.random().toString(36).slice(2)}`,
  customerId: 'cus_demo_123',
  merchantDisplayName: 'PTP Soccer',
  applePay: {
    merchantCountryCode: 'US',
    merchantId: stripeConfig.merchantIdentifier,
  },
  googlePay: {
    merchantCountryCode: 'US',
    testEnv: true,
  },
  returnURL: `${stripeConfig.urlScheme}://stripe-redirect`,
});

const mockConfirmPayment = async (data: ConfirmPaymentRequest): Promise<PaymentResult> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate occasional failures for testing
  const shouldFail = Math.random() < 0.1;

  if (shouldFail) {
    return {
      success: false,
      error: {
        code: 'card_declined',
        message: 'Your card was declined. Please try a different payment method.',
        declineCode: 'insufficient_funds',
      },
    };
  }

  return {
    success: true,
    paymentIntent: {
      id: data.paymentIntentId,
      clientSecret: '',
      amount: 0,
      currency: 'usd',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    },
    orderId: Date.now(),
  };
};

export { mockPaymentMethods };
