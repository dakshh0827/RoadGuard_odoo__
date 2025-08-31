// server/src/controllers/adminController.js - READ-ONLY SERVICE REQUESTS FOR ADMIN
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all service requests for admin dashboard (READ-ONLY)
export const getAdminServiceRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      serviceType,
      vehicleType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Admin fetching ALL service requests (READ-ONLY)');
    console.log('🔍 Query params:', { page, limit, status, serviceType, vehicleType, sortBy, sortOrder, search });
    
    // Build where clause for filtering
    const where = {};
    
    // Status filter
    if (status && status.trim()) {
      where.status = status.toUpperCase();
    }
    
    // Service type filter
    if (serviceType && serviceType.trim()) {
      where.serviceType = serviceType.toUpperCase();
    }
    
    // Vehicle type filter
    if (vehicleType && vehicleType.trim()) {
      where.vehicleType = vehicleType.toUpperCase();
    }
    
    // Search functionality
    if (search && search.trim()) {
      where.OR = [
        { requestId: { contains: search.trim(), mode: 'insensitive' } },
        { 
          endUser: {
            OR: [
              { firstName: { contains: search.trim(), mode: 'insensitive' } },
              { lastName: { contains: search.trim(), mode: 'insensitive' } },
              { phone: { contains: search.trim(), mode: 'insensitive' } }
            ]
          }
        },
        {
          mechanic: {
            OR: [
              { firstName: { contains: search.trim(), mode: 'insensitive' } },
              { lastName: { contains: search.trim(), mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    console.log('🔍 Using where clause:', JSON.stringify(where, null, 2));

    // Get total count for pagination
    const totalRequests = await prisma.serviceRequest.count({ where });

    // Get service requests with pagination
    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        endUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    console.log(`🔍 Found ${serviceRequests.length} service requests out of ${totalRequests} total`);

    // Calculate stats
    const stats = await Promise.all([
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.serviceRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.serviceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.serviceRequest.count({ where: { status: 'REJECTED' } }),
      prisma.serviceRequest.count({ where: { status: 'CANCELLED' } }),
      prisma.serviceRequest.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.user.count({ where: { role: 'MECHANIC' } })
    ]);

    const dashboardStats = {
      totalRequests: totalRequests,
      pending: stats[0],
      accepted: stats[1],
      inProgress: stats[2],
      completed: stats[3],
      rejected: stats[4],
      cancelled: stats[5],
      createdToday: stats[6],
      activeMechanics: stats[7]
    };

    // Add read-only flags to each request
    const enrichedRequests = serviceRequests.map(request => ({
      ...request,
      // Admin-specific flags (all read-only)
      isReadOnly: true,
      canView: true,
      canModify: false,
      canAccept: false,
      canReject: false,
      canAssign: false,
      canComplete: false,
      adminView: true
    }));

    res.json({
      success: true,
      data: {
        serviceRequests: enrichedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRequests,
          pages: Math.ceil(totalRequests / parseInt(limit))
        },
        stats: dashboardStats,
        filters: {
          status: status || null,
          serviceType: serviceType || null,
          vehicleType: vehicleType || null,
          search: search || null,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching service requests for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get service request audit logs / history
export const getServiceRequestAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      requestId,
      userId,
      action,
      dateFrom,
      dateTo,
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Admin fetching audit logs');
    console.log('🔍 Query params:', { page, limit, requestId, userId, action, dateFrom, dateTo });
    
    // Build where clause for filtering
    const where = {};
    
    // Filter by specific request ID
    if (requestId && requestId.trim()) {
      where.details = {
        path: ['requestId'],
        equals: requestId.trim()
      };
    }
    
    // Filter by user ID
    if (userId && userId.trim()) {
      where.userId = userId.trim();
    }
    
    // Filter by action type
    if (action && action.trim()) {
      where.action = { contains: action.trim(), mode: 'insensitive' };
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Get total count
    const totalLogs = await prisma.activityLog.count({ where });

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
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
      orderBy: {
        createdAt: sortOrder === 'asc' ? 'asc' : 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    console.log(`🔍 Found ${activityLogs.length} activity logs out of ${totalLogs} total`);

    // Enrich logs with additional context
    const enrichedLogs = activityLogs.map(log => ({
      ...log,
      actionDescription: getActionDescription(log.action),
      userFullName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User',
      timeAgo: getTimeAgo(log.createdAt)
    }));

    res.json({
      success: true,
      data: {
        activityLogs: enrichedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalLogs,
          pages: Math.ceil(totalLogs / parseInt(limit))
        },
        filters: {
          requestId: requestId || null,
          userId: userId || null,
          action: action || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get comprehensive admin dashboard stats
export const getAdminDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Fetching comprehensive admin dashboard stats');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    // Parallel queries for better performance
    const [
      totalRequests,
      pendingRequests,
      acceptedRequests,
      inProgressRequests,
      completedRequests,
      rejectedRequests,
      cancelledRequests,
      todayRequests,
      weekRequests,
      monthRequests,
      totalUsers,
      totalMechanics,
      activeMechanics,
      recentActivity
    ] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.serviceRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.serviceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.serviceRequest.count({ where: { status: 'REJECTED' } }),
      prisma.serviceRequest.count({ where: { status: 'CANCELLED' } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: today } } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.count({ where: { role: 'END_USER' } }),
      prisma.user.count({ where: { role: 'MECHANIC' } }),
      prisma.user.count({ 
        where: { 
          role: 'MECHANIC',
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Updated in last 24 hours
        } 
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      })
    ]);

    const stats = {
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        rejected: rejectedRequests,
        cancelled: cancelledRequests
      },
      timeframes: {
        today: todayRequests,
        thisWeek: weekRequests,
        thisMonth: monthRequests
      },
      users: {
        totalCustomers: totalUsers,
        totalMechanics: totalMechanics,
        activeMechanics: activeMechanics
      },
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        userFullName: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown User',
        actionDescription: getActionDescription(activity.action),
        timeAgo: getTimeAgo(activity.createdAt)
      }))
    };

    console.log('✅ Admin dashboard stats fetched successfully');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get service request details for admin (read-only)
export const getAdminServiceRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Admin fetching service request details:', id);

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        endUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true
          }
        },
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Get activity logs for this request
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        details: {
          path: ['requestId'],
          equals: serviceRequest.requestId
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedRequest = {
      ...serviceRequest,
      isReadOnly: true,
      canView: true,
      canModify: false,
      activityLogs: activityLogs.map(log => ({
        ...log,
        userFullName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User',
        actionDescription: getActionDescription(log.action),
        timeAgo: getTimeAgo(log.createdAt)
      }))
    };

    console.log('✅ Service request details found for admin');

    res.json({
      success: true,
      data: enrichedRequest
    });

  } catch (error) {
    console.error('❌ Error fetching service request details for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service request details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to get human-readable action descriptions
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

// Helper function to get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}