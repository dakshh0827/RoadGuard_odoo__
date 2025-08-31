// server/src/routes/admin.js - READ-ONLY SERVICE REQUESTS FOR ADMIN
import express from 'express';
import {
  getAdminServiceRequests,
  getServiceRequestAuditLogs,
  getAdminDashboardStats,
  getAdminServiceRequestDetails
} from '../controllers/adminController.js';
import {
  authenticateToken,
  requireVerified,
  requireAdmin,
  logActivity
} from '../middlewares/auth.js';

const router = express.Router();

// Apply base authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireVerified);
router.use(requireAdmin);

// Get comprehensive dashboard stats for admin
router.get('/dashboard/stats',
  logActivity('admin_dashboard_stats_viewed'),
  getAdminDashboardStats
);

// Get all service requests (READ-ONLY for admin)
router.get('/service-requests',
  logActivity('admin_service_requests_viewed'),
  getAdminServiceRequests
);

// Get specific service request details (READ-ONLY for admin)
router.get('/service-requests/:id',
  logActivity('admin_service_request_details_viewed'),
  getAdminServiceRequestDetails
);

// Get audit logs / activity history
router.get('/audit-logs',
  logActivity('admin_audit_logs_viewed'),
  getServiceRequestAuditLogs
);

// Get audit logs for a specific service request
router.get('/service-requests/:id/audit-logs',
  logActivity('admin_request_audit_logs_viewed'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID format'
        });
      }

      // Get the service request to find its requestId
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id },
        select: { requestId: true }
      });

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found'
        });
      }

      // Get activity logs for this specific request
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const where = {
        details: {
          path: ['requestId'],
          equals: serviceRequest.requestId
        }
      };

      const [totalLogs, activityLogs] = await Promise.all([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        })
      ]);

      const enrichedLogs = activityLogs.map(log => ({
        ...log,
        userFullName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User',
        actionDescription: getActionDescription(log.action),
        timeAgo: getTimeAgo(log.createdAt)
      }));

      res.json({
        success: true,
        data: {
          serviceRequestId: id,
          requestId: serviceRequest.requestId,
          activityLogs: enrichedLogs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalLogs,
            pages: Math.ceil(totalLogs / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching service request audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Helper functions (same as in controller)
function getActionDescription(action) {
  const descriptions = {
    'request_created': 'Service request created',
    'request_accepted': 'Request accepted by mechanic',
    'request_rejected': 'Request rejected by mechanic',
    'request_completed': 'Request marked as completed',
    'request_cancelled': 'Request cancelled',
    'request_in_progress': 'Request work started',
    'location_updated': 'Location updated',
    'profile_updated': 'Profile updated',
    'login': 'User logged in',
    'logout': 'User logged out'
  };
  
  return descriptions[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default router;