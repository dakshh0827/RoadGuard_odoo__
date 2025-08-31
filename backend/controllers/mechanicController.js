// server/src/controllers/mechanicController.js - FIXED REJECT FUNCTIONALITY
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all service requests visible to mechanics (NOT filtered by mechanic ID)
export const getMechanicServiceRequests = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status,
      serviceType,
      vehicleType,
      maxDistance = 100
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Fetching ALL service requests for mechanic dashboard:', mechanicId);
    console.log('🔍 Query params:', { page, limit, status, serviceType, vehicleType, maxDistance });
    
    // Get mechanic's location for distance calculations
    const mechanic = await prisma.user.findUnique({
      where: { id: mechanicId },
      select: { latitude: true, longitude: true, firstName: true, lastName: true }
    });

    // Build where clause - Show ALL requests regardless of assignment
    const where = {};
    
    // Add status filter if provided
    if (status && status.trim()) {
      where.status = status.toUpperCase();
    }
    
    // Add service type filter if provided
    if (serviceType && serviceType.trim()) {
      where.serviceType = serviceType.toUpperCase();
    }
    
    // Add vehicle type filter if provided
    if (vehicleType && vehicleType.trim()) {
      where.vehicleType = vehicleType.toUpperCase();
    }

    console.log('🔍 Using where clause (all requests):', where);

    // Get all requests matching filters
    const allRequests = await prisma.serviceRequest.findMany({
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
            phone: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then others
        { createdAt: 'desc' }
      ]
    });

    console.log(`🔍 Found ${allRequests.length} total service requests from database`);

    // Add distance calculations and mechanic interaction flags
    let enrichedRequests = allRequests.map(request => {
      const baseRequest = {
        ...request,
        canAccept: request.status === 'PENDING' && !request.mechanicId,
        canReject: request.status === 'PENDING',
        isAssignedToMe: request.mechanicId === mechanicId,
        isAvailableToMe: request.status === 'PENDING' && !request.mechanicId,
        mechanicActions: {
          canAccept: request.status === 'PENDING' && !request.mechanicId,
          canReject: request.status === 'PENDING',
          canUpdateStatus: request.mechanicId === mechanicId && ['ACCEPTED', 'IN_PROGRESS'].includes(request.status),
          canComplete: request.mechanicId === mechanicId && request.status === 'IN_PROGRESS'
        }
      };

      // Add distance if mechanic location is available
      if (mechanic?.latitude && mechanic?.longitude) {
        const distance = calculateDistance(
          mechanic.latitude,
          mechanic.longitude,
          request.latitude,
          request.longitude
        );
        
        baseRequest.distance = Math.round(distance * 100) / 100;
        baseRequest.estimatedTravelTime = Math.round(distance / 40 * 60);
        baseRequest.isNearby = distance <= parseFloat(maxDistance);
      }

      return baseRequest;
    });

    // Filter by distance if mechanic location is available and maxDistance is specified
    if (mechanic?.latitude && mechanic?.longitude && maxDistance) {
      enrichedRequests = enrichedRequests.filter(request => 
        request.distance <= parseFloat(maxDistance)
      );
    }

    // Apply pagination
    const paginatedRequests = enrichedRequests.slice(skip, skip + parseInt(limit));

    // Get stats
    const stats = {
      total: enrichedRequests.length,
      pending: enrichedRequests.filter(r => r.status === 'PENDING').length,
      accepted: enrichedRequests.filter(r => r.status === 'ACCEPTED').length,
      inProgress: enrichedRequests.filter(r => r.status === 'IN_PROGRESS').length,
      completed: enrichedRequests.filter(r => r.status === 'COMPLETED').length,
      availableToAccept: enrichedRequests.filter(r => r.canAccept).length,
      assignedToMe: enrichedRequests.filter(r => r.isAssignedToMe).length
    };

    console.log(`🔍 Returning ${paginatedRequests.length} requests (page ${page})`);
    console.log('📊 Stats:', stats);

    res.json({
      success: true,
      data: {
        serviceRequests: paginatedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: enrichedRequests.length,
          pages: Math.ceil(enrichedRequests.length / parseInt(limit))
        },
        stats,
        mechanicLocation: mechanic?.latitude && mechanic?.longitude ? {
          latitude: mechanic.latitude,
          longitude: mechanic.longitude
        } : null,
        filters: {
          status: status || null,
          serviceType: serviceType || null,
          vehicleType: vehicleType || null,
          maxDistance: parseFloat(maxDistance)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get available service requests (PENDING only) - This can be used for "Available" tab
export const getAvailableServiceRequests = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      serviceType,
      vehicleType,
      maxDistance = 50
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Getting ONLY available (PENDING) requests for mechanic:', mechanicId);
    
    // Get mechanic's location
    const mechanic = await prisma.user.findUnique({
      where: { id: mechanicId },
      select: { latitude: true, longitude: true }
    });

    if (!mechanic?.latitude || !mechanic?.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please update your location to view nearby service requests',
        data: {
          serviceRequests: [],
          mechanicLocation: null,
          requiresLocationUpdate: true
        }
      });
    }

    // Build filter - ONLY PENDING and unassigned requests
    const where = {
      status: 'PENDING',
      mechanicId: null
    };

    if (serviceType && serviceType.trim()) {
      where.serviceType = serviceType.toUpperCase();
    }

    if (vehicleType && vehicleType.trim()) {
      where.vehicleType = vehicleType.toUpperCase();
    }

    console.log('🔍 Fetching available requests with filter:', where);

    const availableRequests = await prisma.serviceRequest.findMany({
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`🔍 Found ${availableRequests.length} available requests`);

    // Calculate distance and filter by maxDistance
    const requestsWithDistance = availableRequests.map(request => {
      const distance = calculateDistance(
        mechanic.latitude,
        mechanic.longitude,
        request.latitude,
        request.longitude
      );
      
      return {
        ...request,
        distance: Math.round(distance * 100) / 100,
        estimatedTravelTime: Math.round(distance / 40 * 60),
        canAccept: true, // All available requests can be accepted
        canReject: true  // All available requests can be rejected
      };
    }).filter(request => request.distance <= parseFloat(maxDistance));

    // Sort by distance (nearest first)
    requestsWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply pagination
    const paginatedRequests = requestsWithDistance.slice(skip, skip + parseInt(limit));

    console.log(`🔍 Returning ${paginatedRequests.length} available requests within ${maxDistance}km`);

    res.json({
      success: true,
      data: {
        serviceRequests: paginatedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: requestsWithDistance.length,
          pages: Math.ceil(requestsWithDistance.length / parseInt(limit))
        },
        mechanicLocation: {
          latitude: mechanic.latitude,
          longitude: mechanic.longitude
        },
        stats: {
          totalAvailable: requestsWithDistance.length,
          searchRadius: `${maxDistance}km`
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Accept service request (any mechanic can accept any PENDING request)
export const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const mechanicId = req.user.id;
    
    console.log('🔍 Any mechanic accepting request:', id, 'by mechanic:', mechanicId);
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Find and verify the request is available for acceptance
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        endUser: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    console.log('🔍 Found request:', {
      status: existingRequest.status,
      mechanicId: existingRequest.mechanicId,
      requestId: existingRequest.requestId
    });

    // Only PENDING requests without assigned mechanics can be accepted
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This service request is ${existingRequest.status.toLowerCase()} and no longer available for acceptance`
      });
    }

    if (existingRequest.mechanicId) {
      return res.status(400).json({
        success: false,
        message: 'This service request has already been accepted by another mechanic'
      });
    }

    // Accept the request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        mechanicId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        updatedAt: new Date()
      },
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
            phone: true
          }
        }
      }
    });

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'request_accepted',
          userId: mechanicId,
          details: {
            requestId: updatedRequest.requestId,
            customerId: existingRequest.endUserId,
            serviceType: existingRequest.serviceType,
            acceptedAt: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }

    console.log('✅ Service request accepted successfully by any mechanic');
    
    res.json({
      success: true,
      message: 'Service request accepted successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error accepting service request:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or no longer available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to accept service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// FIXED: Reject service request (any mechanic can reject any PENDING request)
export const rejectServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const mechanicId = req.user.id;
    
    console.log('🔍 Any mechanic rejecting request:', id, 'by mechanic:', mechanicId);
    console.log('🔍 Reject reason:', reason);
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Find and verify the request can be rejected
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        endUser: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Only PENDING requests can be rejected
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This service request is ${existingRequest.status.toLowerCase()} and cannot be rejected`
      });
    }

    // FIXED: Use only fields that exist in the schema
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        mechanicNotes: reason || 'Request rejected by mechanic',
        // Remove rejectedAt and rejectedBy fields as they don't exist in schema
        updatedAt: new Date()
      },
      include: {
        endUser: {
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

    // Log activity with rejection details
    try {
      await prisma.activityLog.create({
        data: {
          action: 'request_rejected',
          userId: mechanicId,
          details: {
            requestId: updatedRequest.requestId,
            customerId: existingRequest.endUserId,
            serviceType: existingRequest.serviceType,
            reason: reason || 'No reason provided',
            rejectedBy: mechanicId,
            rejectedAt: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }

    console.log('✅ Service request rejected successfully by any mechanic');
    
    res.json({
      success: true,
      message: 'Service request rejected successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error rejecting service request:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or no longer available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reject service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update service request status (by mechanic)
export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mechanicNotes, cost } = req.body;
    const mechanicId = req.user.id;

    console.log('🔍 Updating service request status:', id, 'to:', status, 'by mechanic:', mechanicId);

    // Validate inputs
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the service request first
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Validate ownership for certain operations
    const newStatus = status.toUpperCase();
    if (['IN_PROGRESS', 'COMPLETED'].includes(newStatus) && serviceRequest.mechanicId !== mechanicId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update service requests assigned to you'
      });
    }

    // Validate status transition
    const currentStatus = serviceRequest.status;
    const validTransitions = {
      'PENDING': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'ACCEPTED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': [],
      'REJECTED': []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${newStatus}`
      });
    }

    const updateData = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Add notes if provided
    if (mechanicNotes !== undefined) {
      updateData.mechanicNotes = mechanicNotes.trim() || null;
    }

    // Handle status-specific updates
    if (newStatus === 'ACCEPTED') {
      updateData.mechanicId = mechanicId;
      updateData.acceptedAt = new Date();
    }

    if (newStatus === 'IN_PROGRESS') {
      // Note: If there's no startedAt field, you might want to use a different field or add it to schema
      // updateData.startedAt = new Date();
    }

    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (cost !== undefined && cost !== null && cost !== '') {
        const parsedCost = parseFloat(cost);
        if (isNaN(parsedCost) || parsedCost < 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cost value'
          });
        }
        updateData.cost = parsedCost;
      }
    }

    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
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
            phone: true
          }
        }
      }
    });

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          action: `request_${newStatus.toLowerCase()}`,
          userId: mechanicId,
          details: {
            requestId: updatedRequest.requestId,
            previousStatus: currentStatus,
            newStatus: newStatus,
            cost: cost || null,
            reason: mechanicNotes || null,
            updatedAt: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }

    console.log('✅ Service request status updated successfully');

    res.json({
      success: true,
      message: `Service request ${newStatus.toLowerCase().replace('_', ' ')} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error updating service request:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or no longer available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get service request details
export const getServiceRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mechanicId = req.user.id;

    console.log('🔍 Fetching service request details:', id, 'for mechanic:', mechanicId);

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Allow access to all requests, not just assigned ones
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
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
            phone: true
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

    // Add distance calculation if mechanic location is available
    const mechanic = await prisma.user.findUnique({
      where: { id: mechanicId },
      select: { latitude: true, longitude: true }
    });

    let enrichedRequest = { ...serviceRequest };
    if (mechanic?.latitude && mechanic?.longitude) {
      const distance = calculateDistance(
        mechanic.latitude,
        mechanic.longitude,
        serviceRequest.latitude,
        serviceRequest.longitude
      );
      enrichedRequest.distance = Math.round(distance * 100) / 100;
      enrichedRequest.estimatedTravelTime = Math.round(distance / 40 * 60);
    }

    console.log('✅ Service request details found');

    res.json({
      success: true,
      data: enrichedRequest
    });

  } catch (error) {
    console.error('❌ Error fetching service request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service request details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update mechanic location
export const updateMechanicLocation = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { latitude, longitude, address } = req.body;

    console.log('🔍 Updating mechanic location for:', mechanicId);

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    const updatedMechanic = await prisma.user.update({
      where: { id: mechanicId },
      data: {
        latitude: lat,
        longitude: lng,
        address: address?.trim() || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        latitude: true,
        longitude: true,
        address: true
      }
    });

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'location_updated',
          userId: mechanicId,
          details: {
            latitude: lat,
            longitude: lng,
            address: address?.trim() || null,
            updatedAt: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }

    console.log('✅ Mechanic location updated successfully');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedMechanic
    });

  } catch (error) {
    console.error('❌ Error updating mechanic location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}
