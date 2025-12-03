/**
 * Order-related TypeScript types
 *
 * Defines types for WooCommerce orders and purchase history.
 */

// Order status (aligned with WooCommerce)
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

// Order item type
export type OrderItemType = 'camp' | 'clinic' | 'training';

/**
 * Order
 * Represents a WooCommerce order
 */
export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;

  // Customer
  customerId: number;
  customerEmail: string;
  customerName: string;

  // Items
  items: OrderItem[];

  // Totals
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;

  // Payment
  paymentMethod?: string;
  paymentMethodTitle?: string;
  isPaid: boolean;
  datePaid?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Order item
 * Individual line item in an order
 */
export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  type: OrderItemType;

  // For camps/clinics
  programDate?: string;
  programTime?: string;
  programLocation?: string;

  // For training sessions
  trainerId?: number;
  trainerName?: string;
  sessionDate?: string;

  // Pricing
  quantity: number;
  price: number;
  total: number;

  // Child info (if applicable)
  childId?: number;
  childName?: string;
}

/**
 * Orders API response
 */
export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

/**
 * Order summary for display
 */
export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  itemCount: number;
  firstItemName: string;
  total: number;
  createdAt: string;
}

/**
 * Checkout session request
 * Used to initiate checkout for a program
 */
export interface CheckoutRequest {
  productId: number;
  quantity?: number;
  childId?: number;
  // Additional fields for checkout
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout session response
 */
export interface CheckoutResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId?: string;
}
