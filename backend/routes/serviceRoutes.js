// server/src/routes/serviceRequest.js - FIXED VERSION
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
  authenticateToken,
  requireVerified,
  requireMechanicOrAdmin,
  requireVerifiedEndUser,
  canAccessServiceRequest,
  logActivity
} from '../middlewares/auth.js';

const router = express.Router();

// Apply base authentication to all routes
router.use(authenticateToken);

// Create new service request (requires verified END_USER)
router.post('/', 
  requireVerified, 
  upload.array('images', 5), 
  logActivity('service_request_created'),
  createServiceRequest
);

// Get user's service requests (authenticated users only)
router.get('/', 
  logActivity('service_requests_viewed'),
  getUserServiceRequests
);

// Get specific service request (with access control)
router.get('/:id', 
  canAccessServiceRequest,
  logActivity('service_request_viewed'),
  getServiceRequestById
);

// Update service request status (mechanics and admins only)
router.patch('/:id/status', 
  requireMechanicOrAdmin, 
  canAccessServiceRequest,
  logActivity('service_request_status_updated'),
  updateServiceRequestStatus
);

// Cancel service request (end users only, for their own requests)
router.patch('/:id/cancel', 
  canAccessServiceRequest,
  logActivity('service_request_cancelled'),
  cancelServiceRequest
);

export default router;