/**
 * Booking Store - Zustand
 *
 * Manages booking flow state and cart for training sessions.
 */

import { create } from 'zustand';
import { Child, TrainerProfile } from './authStore';

// Types
export type LocationType = 'TRAINER_LOCATION' | 'PARENT_LOCATION' | 'PUBLIC_FIELD';

export interface TrainerService {
  id: string;
  trainerId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  maxPlayers: number;
  price: number;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface BookingLocation {
  type: LocationType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export interface BookingCart {
  trainer: TrainerProfile | null;
  service: TrainerService | null;
  selectedDate: string | null;
  selectedTimeSlot: TimeSlot | null;
  selectedChildren: Child[];
  location: BookingLocation | null;
  notes: string;
}

export interface PricingDetails {
  subtotal: number;
  serviceFee: number;
  total: number;
  trainerPayout: number;
}

interface BookingState {
  // Cart state
  cart: BookingCart;
  pricing: PricingDetails | null;
  isCalculating: boolean;

  // Flow state
  currentStep: number;
  maxStep: number;

  // Actions
  setTrainer: (trainer: TrainerProfile) => void;
  setService: (service: TrainerService) => void;
  setDate: (date: string) => void;
  setTimeSlot: (slot: TimeSlot) => void;
  addChild: (child: Child) => void;
  removeChild: (childId: string) => void;
  setChildren: (children: Child[]) => void;
  setLocation: (location: BookingLocation) => void;
  setNotes: (notes: string) => void;
  setPricing: (pricing: PricingDetails) => void;
  setCalculating: (calculating: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  clearCart: () => void;
  reset: () => void;

  // Computed
  canProceed: () => boolean;
  getStepTitle: () => string;
}

const BOOKING_STEPS = [
  'Select Service',
  'Choose Date & Time',
  'Select Players',
  'Set Location',
  'Review & Notes',
  'Payment',
];

const initialCart: BookingCart = {
  trainer: null,
  service: null,
  selectedDate: null,
  selectedTimeSlot: null,
  selectedChildren: [],
  location: null,
  notes: '',
};

export const useBookingStore = create<BookingState>((set, get) => ({
  cart: initialCart,
  pricing: null,
  isCalculating: false,
  currentStep: 0,
  maxStep: BOOKING_STEPS.length - 1,

  setTrainer: (trainer) =>
    set((state) => ({
      cart: { ...state.cart, trainer },
    })),

  setService: (service) =>
    set((state) => ({
      cart: { ...state.cart, service },
    })),

  setDate: (date) =>
    set((state) => ({
      cart: { ...state.cart, selectedDate: date, selectedTimeSlot: null },
    })),

  setTimeSlot: (slot) =>
    set((state) => ({
      cart: { ...state.cart, selectedTimeSlot: slot },
    })),

  addChild: (child) =>
    set((state) => {
      const { cart } = state;
      const maxPlayers = cart.service?.maxPlayers || 4;
      if (cart.selectedChildren.length >= maxPlayers) return state;
      if (cart.selectedChildren.some((c) => c.id === child.id)) return state;
      return {
        cart: {
          ...cart,
          selectedChildren: [...cart.selectedChildren, child],
        },
      };
    }),

  removeChild: (childId) =>
    set((state) => ({
      cart: {
        ...state.cart,
        selectedChildren: state.cart.selectedChildren.filter((c) => c.id !== childId),
      },
    })),

  setChildren: (children) =>
    set((state) => ({
      cart: { ...state.cart, selectedChildren: children },
    })),

  setLocation: (location) =>
    set((state) => ({
      cart: { ...state.cart, location },
    })),

  setNotes: (notes) =>
    set((state) => ({
      cart: { ...state.cart, notes },
    })),

  setPricing: (pricing) => set({ pricing }),

  setCalculating: (isCalculating) => set({ isCalculating }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.maxStep),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  goToStep: (step) =>
    set((state) => ({
      currentStep: Math.max(0, Math.min(step, state.maxStep)),
    })),

  clearCart: () =>
    set({
      cart: initialCart,
      pricing: null,
      currentStep: 0,
    }),

  reset: () =>
    set({
      cart: initialCart,
      pricing: null,
      isCalculating: false,
      currentStep: 0,
    }),

  canProceed: () => {
    const { cart, currentStep } = get();

    switch (currentStep) {
      case 0: // Service
        return !!cart.service;
      case 1: // Date & Time
        return !!cart.selectedDate && !!cart.selectedTimeSlot;
      case 2: // Players
        return cart.selectedChildren.length > 0;
      case 3: // Location
        return !!cart.location?.type;
      case 4: // Review
        return true;
      case 5: // Payment
        return true;
      default:
        return false;
    }
  },

  getStepTitle: () => {
    const { currentStep } = get();
    return BOOKING_STEPS[currentStep] || '';
  },
}));

// Selectors
export const selectCart = (state: BookingState) => state.cart;
export const selectPricing = (state: BookingState) => state.pricing;
export const selectCurrentStep = (state: BookingState) => state.currentStep;
export const selectTrainer = (state: BookingState) => state.cart.trainer;
export const selectService = (state: BookingState) => state.cart.service;
export const selectSelectedChildren = (state: BookingState) => state.cart.selectedChildren;
