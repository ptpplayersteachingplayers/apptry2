/**
 * Orders API Module
 *
 * Handles order history and checkout flow.
 * Orders are synced from WooCommerce.
 */

import { apiClient } from './client';
import { apiConfig, buildCheckoutUrl } from './config';
import { getStoredToken } from './client';
import {
  Order,
  OrdersResponse,
  OrderSummary,
  CheckoutRequest,
  CheckoutResponse,
} from '../types';

/**
 * Get user's order history
 *
 * GET /wp-json/ptp/v1/me/orders
 */
export const getMyOrders = async (page = 1, perPage = 10): Promise<OrdersResponse> => {
  if (apiConfig.demoMode) {
    return getMockOrders(page, perPage);
  }

  const response = await apiClient.get(`/me/orders?page=${page}&per_page=${perPage}`);
  return response.data;
};

/**
 * Get single order details
 *
 * GET /wp-json/ptp/v1/me/orders/:id
 */
export const getOrder = async (orderId: number): Promise<Order> => {
  if (apiConfig.demoMode) {
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  const response = await apiClient.get(`/me/orders/${orderId}`);
  return response.data;
};

/**
 * Get checkout URL for a product
 * Opens WooCommerce checkout in WebView
 */
export const getCheckoutUrl = async (productId: number): Promise<string> => {
  const token = await getStoredToken();
  return buildCheckoutUrl(productId, token || undefined);
};

/**
 * Initiate checkout session
 * Returns URL for WebView checkout
 *
 * POST /wp-json/ptp/v1/checkout/init
 */
export const initiateCheckout = async (data: CheckoutRequest): Promise<CheckoutResponse> => {
  if (apiConfig.demoMode) {
    return {
      success: true,
      checkoutUrl: buildCheckoutUrl(data.productId),
      sessionId: `demo_session_${Date.now()}`,
    };
  }

  const response = await apiClient.post('/checkout/init', data);
  return response.data;
};

/**
 * Verify checkout completion
 * Called after WebView checkout returns
 *
 * POST /wp-json/ptp/v1/checkout/verify
 */
export const verifyCheckout = async (
  sessionId: string
): Promise<{ success: boolean; orderId?: number }> => {
  if (apiConfig.demoMode) {
    return { success: true, orderId: Date.now() };
  }

  const response = await apiClient.post('/checkout/verify', { session_id: sessionId });
  return response.data;
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockOrders: Order[] = [
  {
    id: 1001,
    orderNumber: 'PTP-1001',
    status: 'completed',
    customerId: 1,
    customerEmail: 'parent@example.com',
    customerName: 'Sarah Johnson',
    items: [
      {
        id: 1,
        productId: 1,
        name: 'Winter Skills Intensive',
        type: 'clinic',
        programDate: '2024-12-28',
        programTime: '9:00 AM – 12:00 PM',
        programLocation: 'Steelyard Sports – KOP, PA',
        quantity: 1,
        price: 175,
        total: 175,
        childId: 1,
        childName: 'Jake',
      },
    ],
    subtotal: 175,
    tax: 0,
    discount: 0,
    total: 175,
    currency: 'USD',
    paymentMethod: 'stripe',
    paymentMethodTitle: 'Credit Card',
    isPaid: true,
    datePaid: '2024-11-15T10:30:00Z',
    createdAt: '2024-11-15T10:25:00Z',
    updatedAt: '2024-11-15T10:30:00Z',
    completedAt: '2024-11-15T10:30:00Z',
  },
  {
    id: 1002,
    orderNumber: 'PTP-1002',
    status: 'completed',
    customerId: 1,
    customerEmail: 'parent@example.com',
    customerName: 'Sarah Johnson',
    items: [
      {
        id: 2,
        productId: 5,
        name: 'PTP Summer Soccer Camp - Main Line',
        type: 'camp',
        programDate: '2025-06-23',
        programTime: '9:00 AM – 3:00 PM',
        programLocation: 'Haverford School, PA',
        quantity: 1,
        price: 495,
        total: 495,
        childId: 1,
        childName: 'Jake',
      },
    ],
    subtotal: 495,
    tax: 0,
    discount: 55,
    total: 440,
    currency: 'USD',
    paymentMethod: 'stripe',
    paymentMethodTitle: 'Credit Card',
    isPaid: true,
    datePaid: '2024-10-01T14:00:00Z',
    createdAt: '2024-10-01T13:55:00Z',
    updatedAt: '2024-10-01T14:00:00Z',
    completedAt: '2024-10-01T14:00:00Z',
  },
];

const getMockOrders = async (page = 1, perPage = 10): Promise<OrdersResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const total = mockOrders.length;
  const start = (page - 1) * perPage;
  const orders = mockOrders.slice(start, start + perPage);

  return {
    orders,
    total,
    page,
    perPage,
    hasMore: start + perPage < total,
  };
};

export { mockOrders };
