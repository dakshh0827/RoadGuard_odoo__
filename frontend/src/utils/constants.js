// src/utils/constants.js - UPDATED WITH REJECTED STATUS
export const API_BASE_URL = 'http://localhost:5001/api';
export const OAUTH_BASE_URL = 'http://localhost:5001/auth';

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/
};

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  WORKER_DASHBOARD: '/worker-dashboard',
  ADMIN_DASHBOARD: '/admin-dashboard',
  VERIFY_EMAIL: '/verify-email',
  ROLE_SELECTION: '/role-selection',
  ROOT: '/'
};

export const DASHBOARD_ROUTES = {
  END_USER: '/dashboard',
  MECHANIC: '/worker-dashboard',
  ADMIN: '/admin-dashboard'
};

export const USER_ROLES = {
  CUSTOMER: 'END_USER',
  MECHANIC: 'MECHANIC',
  ADMIN: 'ADMIN'
};

export const ROLE_PERMISSIONS = {
  END_USER: [
    'CREATE_SERVICE_REQUEST',
    'VIEW_OWN_REQUESTS',
    'CANCEL_OWN_REQUESTS',
    'RATE_SERVICES'
  ],
  MECHANIC: [
    'VIEW_SERVICE_REQUESTS',
    'ACCEPT_REQUESTS',
    'REJECT_REQUESTS', // NEW: Added reject permission
    'UPDATE_REQUEST_STATUS',
    'VIEW_EARNINGS'
  ],
  ADMIN: [
    'VIEW_ALL_REQUESTS',
    'MANAGE_USERS',
    'VIEW_ANALYTICS',
    'MANAGE_MECHANICS',
    'SYSTEM_SETTINGS'
  ]
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
  REFRESH_TOKEN: '/auth/refresh-token',
  SELECT_ROLE: '/auth/select-role'
};

export const OAUTH_ENDPOINTS = {
  GOOGLE: '/oauth/google',
  GITHUB: '/oauth/github'
};

export const SERVICE_REQUEST_ENDPOINTS = {
  CREATE: '/service-requests',
  GET_USER_REQUESTS: '/service-requests',
  GET_BY_ID: '/service-requests',
  UPDATE_STATUS: '/service-requests',
  CANCEL: '/service-requests'
};

// Mechanic-specific endpoints
export const MECHANIC_ENDPOINTS = {
  AVAILABLE_REQUESTS: '/mechanic/service-requests/available',
  MY_REQUESTS: '/mechanic/service-requests',
  REQUEST_DETAILS: '/mechanic/service-requests',
  ACCEPT_REQUEST: '/mechanic/service-requests',
  REJECT_REQUEST: '/mechanic/service-requests', // NEW: Added reject endpoint
  UPDATE_STATUS: '/mechanic/service-requests',
  UPDATE_LOCATION: '/mechanic/location',
  UPDATE_AVAILABILITY: '/mechanic/availability',
  PROFILE: '/mechanic/profile'
};

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

// Reverse mapping for display purposes
export const SERVICE_TYPE_DISPLAY = {
  'EMERGENCY_ASSISTANCE': 'Emergency Assistance',
  'TOWING': 'Towing Service',
  'BATTERY_JUMP': 'Battery Jump Start',
  'TIRE_CHANGE': 'Tire Change',
  'FUEL_DELIVERY': 'Fuel Delivery',
  'ENGINE_REPAIR': 'Engine Repair',
  'BRAKE_REPAIR': 'Brake Repair',
  'ELECTRICAL_ISSUE': 'Electrical Issue',
  'GENERAL_REPAIR': 'General Repair'
};

export const VEHICLE_TYPE_MAPPING = {
  'car': 'CAR',
  'motorcycle': 'MOTORCYCLE',
  'truck': 'TRUCK',
  'bus': 'BUS',
  'auto_rickshaw': 'AUTO_RICKSHAW',
  'other': 'OTHER'
};

export const VEHICLE_TYPE_DISPLAY = {
  'CAR': 'Car',
  'MOTORCYCLE': 'Motorcycle',
  'TRUCK': 'Truck',
  'BUS': 'Bus',
  'AUTO_RICKSHAW': 'Auto Rickshaw',
  'OTHER': 'Other'
};

// Service request status with colors for UI - UPDATED WITH REJECTED STATUS
export const SERVICE_STATUS = {
  PENDING: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    description: 'Waiting for mechanic'
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Mechanic assigned'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    description: 'Work in progress'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Service completed'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    description: 'Request cancelled'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Request rejected by mechanic'
  }
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field) => `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be 8+ chars with uppercase, lowercase, number, and special character',
  INVALID_NAME: 'Name must be 2-50 characters, letters only',
  INVALID_OTP: 'Please enter a valid 6-digit code',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  LOCATION_REQUIRED: 'Location is required for service request',
  INVALID_COORDINATES: 'Invalid GPS coordinates provided',
  FILE_TOO_LARGE: 'Image file is too large (max 5MB)',
  INVALID_FILE_TYPE: 'Only image files are allowed',
  ROLE_REQUIRED: 'Please select a role',
  ROLE_ALREADY_SET: 'Role has already been assigned',
  UNAUTHORIZED_ROLE: 'You do not have permission to access this area',
  INVALID_ROLE: 'Invalid role selected',
  LOCATION_NOT_SET: 'Please set your location to view nearby requests',
  REQUEST_NOT_AVAILABLE: 'This service request is no longer available',
  REQUEST_ALREADY_ASSIGNED: 'This request has been assigned to another mechanic'
};

export const SUCCESS_MESSAGES = {
  SERVICE_REQUEST_CREATED: 'Service request created successfully!',
  SERVICE_REQUEST_CANCELLED: 'Service request cancelled successfully!',
  SERVICE_REQUEST_UPDATED: 'Service request updated successfully!',
  SERVICE_REQUEST_ACCEPTED: 'Service request accepted successfully!',
  SERVICE_REQUEST_REJECTED: 'Service request rejected successfully!', // NEW: Added reject message
  ROLE_SELECTED: 'Role selected successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  LOCATION_UPDATED: 'Location updated successfully!'
};