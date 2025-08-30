// server/src/routes/mechanic.js - FIXED VERSION
import express from 'express';
import {
  getAvailableServiceRequests,
  getMechanicServiceRequests,
  acceptServiceRequest,
  updateServiceRequestStatus,
  getServiceRequestDetails,
  updateMechanicLocation
} from '../controllers/mechanicController.js';
import { 
  authenticateToken,
  requireVerified,
  requireMechanic,
  logActivity
} from '../middlewares/auth.js';

const router = express.Router();

// Apply base authentication and mechanic role requirement to all routes
router.use(authenticateToken);
router.use(requireVerified);
router.use(requireMechanic);

// Get available service requests (PENDING requests near mechanic)
router.get('/service-requests/available', 
  logActivity('available_requests_viewed'),
  getAvailableServiceRequests
);

// Get mechanic's assigned service requests
router.get('/service-requests', 
  logActivity('mechanic_requests_viewed'),
  getMechanicServiceRequests
);

// Get specific service request details
router.get('/service-requests/:id', 
  logActivity('service_request_details_viewed'),
  getServiceRequestDetails
);

// Accept a service request
router.post('/service-requests/:id/accept', 
  logActivity('service_request_accepted'),
  acceptServiceRequest
);

// Update service request status
router.patch('/service-requests/:id/status', 
  logActivity('service_request_status_updated'),
  updateServiceRequestStatus
);

// Update mechanic's location
router.patch('/location', 
  logActivity('mechanic_location_updated'),
  updateMechanicLocation
);

export default router;