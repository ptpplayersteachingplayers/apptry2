/**
 * Navigation TypeScript types
 *
 * Defines param lists for all navigation stacks and tabs.
 */

import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Auth Stack params
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OnboardingLocation: undefined;
  OnboardingAge: undefined;
  OnboardingSkill: undefined;
  OnboardingInterest: undefined;
};

/**
 * Parent Tab params
 */
export type ParentTabParamList = {
  Home: undefined;
  Trainers: { trainerId?: number; market?: string } | undefined;
  Camps: { filter?: string } | undefined;
  Bookings: { date?: string } | undefined;
  Profile: undefined;
};

/**
 * Trainer Tab params
 */
export type TrainerTabParamList = {
  TrainerDashboard: undefined;
  TrainerSchedule: { date?: string } | undefined;
  TrainerStudents: undefined;
  TrainerMessages: { conversationId?: number } | undefined;
  TrainerProfile: undefined;
};

/**
 * Parent Stack params (for nested screens)
 */
export type ParentStackParamList = {
  ParentTabs: NavigatorScreenParams<ParentTabParamList>;
  ProgramDetail: { programId: number | string };
  TrainerDetail: { trainerId: number };
  Checkout: { productId?: number; programName?: string; programDate?: string; programLocation?: string; returnUrl?: string };
  NativeCheckout: { amount: number; productName: string; productDescription?: string; orderId?: number; programId?: number };
  SessionRequest: { trainerId: number };
  Messages: { conversationId?: number };
  ConversationDetail: { conversationId: number };
  OrderDetail: { orderId: number };
  EditProfile: undefined;
  EditChild: { childId?: number };
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  NotificationCenter: undefined;
  // New screens
  Cart: undefined;
  Blog: undefined;
  BlogPost: { slug: string };
  Contact: undefined;
  StateLanding: { stateCode: string };
  CoachApplication: undefined;
};

/**
 * Trainer Stack params (for nested screens)
 */
export type TrainerStackParamList = {
  TrainerTabs: NavigatorScreenParams<TrainerTabParamList>;
  SessionDetail: { sessionId: number };
  StudentDetail: { studentId: number };
  ConversationDetail: { conversationId: number };
  EditTrainerProfile: undefined;
  EditAvailability: undefined;
  EarningsDetail: undefined;
};

/**
 * Root Stack params
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Parent: NavigatorScreenParams<ParentStackParamList>;
  Trainer: NavigatorScreenParams<TrainerStackParamList>;
};

/**
 * Declaration for useNavigation hook typing
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
