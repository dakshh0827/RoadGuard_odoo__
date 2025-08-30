// server/src/middlewares/validation.js
import { body, validationResult } from 'express-validator';

// Service request validation middleware
export const validateServiceRequest = [
  // Validate required fields
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10-500 characters'),
    
  body('serviceType')
    .notEmpty()
    .withMessage('Service type is required')
    .isIn([
      'instant_service', 
      'towing', 
      'battery_jump', 
      'tire_change', 
      'fuel_delivery', 
      'engine_repair', 
      'brake_repair', 
      'electrical_issue', 
      'general_repair'
    ])
    .withMessage('Invalid service type'),
    
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required (-90 to 90)'),
    
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required (-180 to 180)'),
    
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 255 })
    .withMessage('Address must be less than 255 characters'),
    
  // Optional fields validation
  body('vehicleType')
    .optional()
    .isIn(['car', 'motorcycle', 'truck', 'bus', 'auto_rickshaw', 'other'])
    .withMessage('Invalid vehicle type'),
    
  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Vehicle number must be less than 20 characters'),
    
  body('vehicleMake')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle make must be less than 50 characters'),
    
  body('vehicleModel')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle model must be less than 50 characters'),
    
  body('issue')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Issue description must be less than 1000 characters'),
    
  body('customerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters'),
    
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    next();
  }
];

// Status update validation
export const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status'),
    
  body('mechanicNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mechanic notes must be less than 500 characters'),
    
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
    
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    next();
  }
];
