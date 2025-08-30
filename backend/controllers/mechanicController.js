// server/src/controllers/mechanicController.js - FIXED VERSION
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all available service requests for mechanics
export const getAvailableServiceRequests = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      serviceType,
      vehicleType,
      maxDistance = 50 // km
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Getting available requests for mechanic:', mechanicId);
    
    // Get mechanic's location
    const mechanic = await prisma.user.findUnique({
      where: { id: mechanicId },
      select: { latitude: true, longitude: true, firstName: true, lastName: true }
    });

    console.log('🔍 Mechanic location:', mechanic);

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

    // Build filter conditions - Only show PENDING requests that are unassigned
    const where = {
      status: 'PENDING',
      mechanicId: null, // Only unassigned requests
    };

    if (serviceType && serviceType.trim()) {
      where.serviceType = serviceType.toUpperCase();
    }

    if (vehicleType && vehicleType.trim()) {
      where.vehicleType = vehicleType.toUpperCase();
    }

    console.log('🔍 Fetching available requests with filter:', where);

    // Get all available requests first
    const allAvailableRequests = await prisma.serviceRequest.findMany({
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

    console.log(`🔍 Found ${allAvailableRequests.length} available requests from database`);

    // Calculate distance for each request and filter by maxDistance
    const requestsWithDistance = allAvailableRequests.map(request => {
      const distance = calculateDistance(
        mechanic.latitude,
        mechanic.longitude,
        request.latitude,
        request.longitude
      );
      
      return {
        ...request,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        estimatedTravelTime: Math.round(distance / 40 * 60) // Assume 40km/h average speed
      };
    }).filter(request => request.distance <= parseFloat(maxDistance));

    // Sort by distance (nearest first)
    requestsWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply pagination to the filtered and sorted results
    const paginatedRequests = requestsWithDistance.slice(skip, skip + parseInt(limit));

    console.log(`🔍 Returning ${paginatedRequests.length} requests within ${maxDistance}km (page ${page})`);

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
          totalAvailableInSystem: allAvailableRequests.length,
          totalNearby: requestsWithDistance.length,
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

// Get all service requests visible to mechanics - MODIFIED VERSION
export const getMechanicServiceRequests = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Fetching all service requests for mechanic:', mechanicId);
    console.log('🔍 Query params:', { page, limit, status });
    
    // Get comprehensive stats for debugging
    const allStats = await prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('📊 System-wide request stats:', allStats);

    // Build where clause - NO mechanicId filter, show ALL requests
    const where = {};

    // Add status filter if provided
    if (status && status.trim()) {
      where.status = status.toUpperCase();
    }

    console.log('🔍 Using where clause (all requests):', where);

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
            phone: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: parseInt(limit)
    });

    console.log(`🔍 Found ${serviceRequests.length} total service requests`);

    // Get mechanic's location for distance calculations
    const mechanic = await prisma.user.findUnique({
      where: { id: mechanicId },
      select: { latitude: true, longitude: true }
    });

    // Add distance calculations if mechanic location is available
    let enrichedRequests = serviceRequests;
    if (mechanic?.latitude && mechanic?.longitude) {
      enrichedRequests = serviceRequests.map(request => {
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
          isNearby: distance <= 50 // Within 50km
        };
      });
    }

    // Get total count for pagination
    const total = await prisma.serviceRequest.count({ where });

    // Calculate stats for this mechanic's involvement
    const mechanicInvolvedCount = serviceRequests.filter(req => req.mechanicId === mechanicId).length;
    const availableCount = serviceRequests.filter(req => req.status === 'PENDING' && !req.mechanicId).length;

    console.log(`🔍 Pagination info: total=${total}, page=${page}, limit=${limit}`);
    console.log(`🔍 Mechanic involvement: ${mechanicInvolvedCount} assigned, ${availableCount} available`);

    res.json({
      success: true,
      data: {
        serviceRequests: enrichedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          byStatus: allStats,
          total: total,
          mechanicAssigned: mechanicInvolvedCount,
          availableToAccept: availableCount
        },
        mechanicLocation: mechanic?.latitude && mechanic?.longitude ? {
          latitude: mechanic.latitude,
          longitude: mechanic.longitude
        } : null,
        debug: process.env.NODE_ENV === 'development' ? {
          mechanicId,
          whereClause: where,
          queryParams: { page, limit, status },
          mechanicHasLocation: !!(mechanic?.latitude && mechanic?.longitude)
        } : undefined
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

// Enhanced version with better error handling and logging
export const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const mechanicId = req.user.id;

    console.log('🔍 Accepting service request:', id, 'by mechanic:', mechanicId);

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Check if request exists and is still available
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

    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This service request is ${existingRequest.status.toLowerCase()} and no longer available`
      });
    }

    if (existingRequest.mechanicId) {
      return res.status(400).json({
        success: false,
        message: 'This service request has already been accepted by another mechanic'
      });
    }

    // Accept the request atomically
    const updatedRequest = await prisma.serviceRequest.update({
      where: { 
        id,
        status: 'PENDING', // Additional safety check
        mechanicId: null // Additional safety check
      },
      data: {
        mechanicId,
        status: 'ACCEPTED',
        acceptedAt: new Date()
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
      // Don't fail the main operation if logging fails
    }

    console.log('✅ Service request accepted successfully');

    res.json({
      success: true,
      message: 'Service request accepted successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error accepting service request:', error);
    
    // Handle specific Prisma errors
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

// Update service request status (by mechanic) - Enhanced version
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

    const validStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate that mechanic owns this request
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id,
        mechanicId
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or not assigned to you'
      });
    }

    // Validate status transition
    const currentStatus = serviceRequest.status;
    const newStatus = status.toUpperCase();
    
    const validTransitions = {
      'ACCEPTED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // Final state
      'CANCELLED': []  // Final state
    };

    if (currentStatus !== 'PENDING' && !validTransitions[currentStatus]?.includes(newStatus)) {
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
    if (newStatus === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
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
      message: `Service request ${newStatus.toLowerCase()} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error updating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get service request details - Enhanced version
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

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id,
        OR: [
          { mechanicId }, // Assigned to this mechanic
          { status: 'PENDING', mechanicId: null } // Or available for acceptance
        ]
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

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or not accessible'
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

// Update mechanic location - Enhanced version
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