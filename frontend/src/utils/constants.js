// src/utils/constants.js - UPDATED
export const API_BASE_URL = 'http://localhost:5001/api';
export const OAUTH_BASE_URL = 'http://localhost:5001/auth'; // New: separate base for OAuth

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/
};

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  VERIFY_EMAIL: '/verify-email',
  ROOT: '/'
};

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  REFRESH_TOKEN: '/auth/refresh-token'
};

export const OAUTH_ENDPOINTS = {
  GOOGLE: '/oauth/google',
  GITHUB: '/oauth/github'
};

// NEW: Service Request Endpoints
export const SERVICE_REQUEST_ENDPOINTS = {
  CREATE: '/service-requests',
  GET_USER_REQUESTS: '/service-requests',
  GET_BY_ID: '/service-requests',
  UPDATE_STATUS: '/service-requests',
  CANCEL: '/service-requests'
};

// NEW: Service Type Mappings
export const SERVICE_TYPE_MAPPING = {
  'instant_service': 'EMERGENCY_ASSISTANCE',
  'towing': 'TOWING',
  'battery_jump': 'BATTERY_JUMP',
  'tire_change': 'TIRE_CHANGE',
  'fuel_delivery': 'FUEL_DELIVERY',
  'engine_repair': 'ENGINE_REPAIR',
  'brake_repair': 'BRAKE_REPAIR',
  'electrical_issue': 'ELECTRICAL_ISSUE',
  'general_repair': 'GENERAL_REPAIR'
};

// NEW: Vehicle Type Mappings
export const VEHICLE_TYPE_MAPPING = {
  'car': 'CAR',
  'motorcycle': 'MOTORCYCLE',
  'truck': 'TRUCK',
  'bus': 'BUS',
  'auto_rickshaw': 'AUTO_RICKSHAW',
  'other': 'OTHER'
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field) => `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be 8+ chars with uppercase, lowercase, number, and special character',
  INVALID_NAME: 'Name must be 2-50 characters, letters only',
  INVALID_OTP: 'Please enter a valid 6-digit code',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  // NEW: Service Request specific errors
  LOCATION_REQUIRED: 'Location is required for service request',
  INVALID_COORDINATES: 'Invalid GPS coordinates provided',
  FILE_TOO_LARGE: 'Image file is too large (max 5MB)',
  INVALID_FILE_TYPE: 'Only image files are allowed'
};

// NEW: Success Messages
export const SUCCESS_MESSAGES = {
  SERVICE_REQUEST_CREATED: 'Service request created successfully!',
  SERVICE_REQUEST_CANCELLED: 'Service request cancelled successfully!',
  SERVICE_REQUEST_UPDATED: 'Service request updated successfully!'
};
