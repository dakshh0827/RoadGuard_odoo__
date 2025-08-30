// server/src/routes/serviceRequest.js - UPDATED
import express from 'express';
import {
  createServiceRequest,
  getUserServiceRequests,
  getServiceRequestById,
  updateServiceRequestStatus,
  cancelServiceRequest,
  upload
} from '../controllers/serviceController.js';
import { 
  authenticateToken,  // Use this instead of authenticateJWT
  requireVerified,
  requireMechanicOrAdmin 
} from '../middlewares/auth.js';
import { validateServiceRequest } from '../middlewares/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken); // This doesn't need Passport

// Create new service request (requires verified email)
router.post('/', requireVerified, upload.array('images', 5), validateServiceRequest, createServiceRequest);

// Get user's service requests
router.get('/', getUserServiceRequests);

// Get specific service request
router.get('/:id', getServiceRequestById);

// Update service request status (for mechanics and admins only)
router.patch('/:id/status', requireMechanicOrAdmin, updateServiceRequestStatus);

// Cancel service request (for end users)
router.patch('/:id/cancel', cancelServiceRequest);

export default router;
