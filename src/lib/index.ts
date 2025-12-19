/**
 * PTP Soccer Library
 *
 * Central export for utility libraries.
 */

// Query Client
export { queryClient, queryKeys } from './queryClient';

// Formatting Utilities
export {
  parseDate,
  isValidDate,
  formatDateShort,
  formatDateLong,
  formatDateMedium,
  formatDateRange,
  formatTime,
  formatPrice,
  formatLocation,
  getStockStatus,
  safeString,
  formatProgramSubtitle,
} from './formatting';

// Validation
export {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  updateProfileSchema,
  trainerProfileSchema,
  childProfileSchema,
  trainingRequestSchema,
  sendMessageSchema,
  validateForm,
  useValidation,
} from './validation';

// Types
export type {
  LoginFormData,
  SignUpFormData,
  ForgotPasswordFormData,
  UpdateProfileFormData,
  TrainerProfileFormData,
  ChildProfileFormData,
  TrainingRequestFormData,
  SendMessageFormData,
} from './validation';
