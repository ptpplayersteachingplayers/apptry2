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
  CampsClinics: { filter?: string } | undefined;
  PrivateTraining: { trainerId?: number; market?: string } | undefined;
  Schedule: { date?: string } | undefined;
  Account: undefined;
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
  ProgramDetail: { programId: number };
  TrainerDetail: { trainerId: number };
  Checkout: { productId: number; returnUrl?: string };
  SessionRequest: { trainerId: number };
  Messages: { conversationId?: number };
  ConversationDetail: { conversationId: number };
  OrderDetail: { orderId: number };
  EditProfile: undefined;
  EditChild: { childId?: number };
  NotificationSettings: undefined;
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
