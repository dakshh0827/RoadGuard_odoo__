// server/src/lib/validation.js - FIXED VERSION
import { z } from 'zod';

// Email validation
const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  );

// Name validation
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be at most 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// OTP validation
const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

// FIXED: User role validation - Accept CUSTOMER for frontend compatibility
const userRoleSchema = z.enum(['CUSTOMER', 'END_USER', 'MECHANIC', 'ADMIN'], {
  errorMap: () => ({ message: 'Role must be one of: CUSTOMER, END_USER, MECHANIC, or ADMIN' }),
});

// Auth schemas
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const resendOTPSchema = z.object({
  email: emailSchema,
  type: z.enum(['verification', 'password_reset'], {
    errorMap: () => ({ message: 'Type must be either verification or password_reset' }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema,
});

// FIXED: Role selection schema - Accept CUSTOMER for mapping
export const roleSelectionSchema = z.object({
  email: emailSchema,
  role: userRoleSchema, // Now accepts CUSTOMER, END_USER, MECHANIC, ADMIN
});

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Service request schemas
export const createServiceRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  serviceType: z.enum([
    'TOWING',
    'BATTERY_JUMP', 
    'TIRE_CHANGE',
    'FUEL_DELIVERY',
    'ENGINE_REPAIR',
    'BRAKE_REPAIR',
    'ELECTRICAL_ISSUE',
    'GENERAL_REPAIR',
    'EMERGENCY_ASSISTANCE'
  ]),
  issue: z.string().max(500).optional(),
  vehicleType: z.enum([
    'CAR',
    'MOTORCYCLE',
    'TRUCK', 
    'BUS',
    'AUTO_RICKSHAW',
    'OTHER'
  ]).optional(),
  vehicleNumber: z.string().max(50).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, 'Address is required').max(255),
});

// Update service request status schema
export const updateServiceStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED', 
    'REJECTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  ]),
  mechanicNotes: z.string().max(500).optional(),
  cost: z.number().positive().optional(),
});
