/**
 * Cart Store - Zustand
 *
 * Manages shopping cart state for camps and products.
 * Features: add/remove items, quantities, discounts, processing fees.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Program } from '../types';
import { Child } from './authStore';

// Cart item represents a program/camp in the cart
export interface CartItem {
  id: string; // unique cart item id
  programId: number;
  program: Program;
  quantity: number;
  selectedChildren: Child[];
  selectedDate?: string; // for clinics with multiple date options
  selectedTime?: string;
  notes?: string;
  addedAt: string;
}

// Coupon/discount code
export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: string;
  description?: string;
}

// Cart totals breakdown
export interface CartTotals {
  subtotal: number;
  discount: number;
  processingFee: number;
  total: number;
  savings: number;
  itemCount: number;
}

interface CartState {
  // Cart items
  items: CartItem[];

  // Applied coupon
  appliedCoupon: Coupon | null;

  // Cart settings
  processingFeePercentage: number; // e.g., 3.5%

  // Loading states
  isApplyingCoupon: boolean;
  couponError: string | null;

  // Actions
  addItem: (program: Program, children?: Child[], options?: { date?: string; time?: string; notes?: string }) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemChildren: (itemId: string, children: Child[]) => void;
  updateItemOptions: (itemId: string, options: { date?: string; time?: string; notes?: string }) => void;

  // Coupon actions
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setCouponError: (error: string | null) => void;

  // Cart management
  clearCart: () => void;
  getItemByProgramId: (programId: number) => CartItem | undefined;
  isInCart: (programId: number) => boolean;

  // Computed
  getTotals: () => CartTotals;
  getItemCount: () => number;
}

// Processing fee percentage (3.5% typical for Stripe)
const PROCESSING_FEE_PERCENTAGE = 3.5;

// Bundle discount thresholds
const BUNDLE_DISCOUNTS = [
  { minItems: 3, discount: 0.15 }, // 15% off 3+ items
  { minItems: 2, discount: 0.10 }, // 10% off 2 items
];

// Generate unique cart item ID
const generateCartItemId = () => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      processingFeePercentage: PROCESSING_FEE_PERCENTAGE,
      isApplyingCoupon: false,
      couponError: null,

      addItem: (program, children = [], options = {}) => {
        const { items } = get();

        // Check if program already in cart
        const existingItem = items.find(item => item.programId === program.id);

        if (existingItem) {
          // Update existing item
          set({
            items: items.map(item =>
              item.programId === program.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    selectedChildren: children.length > 0 ? children : item.selectedChildren,
                  }
                : item
            ),
          });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: generateCartItemId(),
            programId: program.id,
            program,
            quantity: 1,
            selectedChildren: children,
            selectedDate: options.date,
            selectedTime: options.time,
            notes: options.notes,
            addedAt: new Date().toISOString(),
          };

          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId),
        }));
      },

      updateItemQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateItemChildren: (itemId, children) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, selectedChildren: children } : item
          ),
        }));
      },

      updateItemOptions: (itemId, options) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  ...(options.date !== undefined && { selectedDate: options.date }),
                  ...(options.time !== undefined && { selectedTime: options.time }),
                  ...(options.notes !== undefined && { notes: options.notes }),
                }
              : item
          ),
        }));
      },

      applyCoupon: async (code) => {
        set({ isApplyingCoupon: true, couponError: null });

        try {
          // Simulate API call - in production, this would validate with backend
          await new Promise(resolve => setTimeout(resolve, 500));

          // Demo coupons
          const validCoupons: Record<string, Coupon> = {
            'WELCOME10': {
              code: 'WELCOME10',
              type: 'percentage',
              value: 10,
              description: '10% off your first order',
            },
            'SUMMER20': {
              code: 'SUMMER20',
              type: 'percentage',
              value: 20,
              minPurchase: 200,
              description: '20% off orders $200+',
            },
            'SAVE50': {
              code: 'SAVE50',
              type: 'fixed',
              value: 50,
              minPurchase: 300,
              description: '$50 off orders $300+',
            },
          };

          const coupon = validCoupons[code.toUpperCase()];

          if (!coupon) {
            set({ isApplyingCoupon: false, couponError: 'Invalid coupon code' });
            return false;
          }

          const totals = get().getTotals();
          if (coupon.minPurchase && totals.subtotal < coupon.minPurchase) {
            set({
              isApplyingCoupon: false,
              couponError: `Minimum purchase of $${coupon.minPurchase} required`,
            });
            return false;
          }

          set({ appliedCoupon: coupon, isApplyingCoupon: false });
          return true;
        } catch {
          set({ isApplyingCoupon: false, couponError: 'Failed to apply coupon' });
          return false;
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, couponError: null });
      },

      setCouponError: (error) => {
        set({ couponError: error });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, couponError: null });
      },

      getItemByProgramId: (programId) => {
        return get().items.find(item => item.programId === programId);
      },

      isInCart: (programId) => {
        return get().items.some(item => item.programId === programId);
      },

      getTotals: () => {
        const { items, appliedCoupon, processingFeePercentage } = get();

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => {
          const price = item.program.salePrice || item.program.price;
          return sum + (price * item.quantity);
        }, 0);

        // Calculate savings from sale prices
        const originalTotal = items.reduce((sum, item) => {
          return sum + (item.program.price * item.quantity);
        }, 0);
        const saleSavings = originalTotal - subtotal;

        // Calculate bundle discount
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const bundleDiscount = BUNDLE_DISCOUNTS.find(b => totalItems >= b.minItems);
        const bundleDiscountAmount = bundleDiscount ? subtotal * bundleDiscount.discount : 0;

        // Calculate coupon discount
        let couponDiscount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.type === 'percentage') {
            couponDiscount = subtotal * (appliedCoupon.value / 100);
            if (appliedCoupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
            }
          } else {
            couponDiscount = appliedCoupon.value;
          }
        }

        // Total discount (bundle + coupon, don't stack percentages)
        const discount = Math.max(bundleDiscountAmount, couponDiscount);

        // Subtotal after discount
        const discountedSubtotal = subtotal - discount;

        // Processing fee
        const processingFee = Math.round((discountedSubtotal * processingFeePercentage / 100) * 100) / 100;

        // Final total
        const total = discountedSubtotal + processingFee;

        return {
          subtotal,
          discount,
          processingFee,
          total: Math.round(total * 100) / 100,
          savings: saleSavings + discount,
          itemCount: totalItems,
        };
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'ptp-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);

// Selectors
export const selectCartItems = (state: CartState) => state.items;
export const selectCartTotals = (state: CartState) => state.getTotals();
export const selectCartItemCount = (state: CartState) => state.getItemCount();
export const selectAppliedCoupon = (state: CartState) => state.appliedCoupon;
export const selectIsInCart = (programId: number) => (state: CartState) =>
  state.isInCart(programId);
