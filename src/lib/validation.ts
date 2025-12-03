import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: phoneSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Profile schemas
export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  location: z.string().optional(),
});

export const trainerProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  hourlyRate: z.number().min(0, 'Rate must be positive').max(1000, 'Rate seems too high'),
  specializations: z.array(z.string()).optional(),
  location: z.string().optional(),
});

// Child profile schema
export const childProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  ageBand: z.string().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  position: z.string().optional(),
  team: z.string().max(100, 'Team name must be less than 100 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Training request schema
export const trainingRequestSchema = z.object({
  trainerId: z.number().positive('Please select a trainer'),
  childId: z.number().positive('Please select a child').optional(),
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a time'),
  duration: z.enum(['30', '60', '90', '120'], {
    errorMap: () => ({ message: 'Please select a duration' }),
  }),
  location: z.string().min(1, 'Location is required'),
  focus: z.string().max(200, 'Focus must be less than 200 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Message schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

// Helper function to validate and get errors
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  });

  return { success: false, errors };
}

// Hook-friendly validation
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: unknown) => validateForm(schema, data);

  const validateField = (field: string, value: unknown) => {
    try {
      const partialSchema = (schema as any).pick?.({ [field]: true });
      if (partialSchema) {
        partialSchema.parse({ [field]: value });
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Invalid value';
    }
  };

  return { validate, validateField };
}

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type TrainerProfileFormData = z.infer<typeof trainerProfileSchema>;
export type ChildProfileFormData = z.infer<typeof childProfileSchema>;
export type TrainingRequestFormData = z.infer<typeof trainingRequestSchema>;
export type SendMessageFormData = z.infer<typeof sendMessageSchema>;

export default {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  updateProfileSchema,
  trainerProfileSchema,
  childProfileSchema,
  trainingRequestSchema,
  sendMessageSchema,
  validateForm,
};
