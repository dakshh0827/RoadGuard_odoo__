// server/src/controllers/serviceRequestController.js
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/service-requests';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `service-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Create a new service request
export const createServiceRequest = async (req, res) => {
  try {
    const {
      name,
      description,
      serviceType,
      issue,
      vehicleType,
      vehicleNumber,
      vehicleMake,
      vehicleModel,
      latitude,
      longitude,
      address,
      customerNotes
    } = req.body;

    const endUserId = req.user.id; // From JWT middleware

    // Handle image uploads
    const images = req.files ? req.files.map(file => file.path) : [];

    // Map frontend serviceType to backend ServiceType enum
    const serviceTypeMapping = {
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

    // Map frontend vehicleType or default to CAR
    const vehicleTypeMapping = {
      'car': 'CAR',
      'motorcycle': 'MOTORCYCLE',
      'truck': 'TRUCK',
      'bus': 'BUS',
      'auto_rickshaw': 'AUTO_RICKSHAW',
      'other': 'OTHER'
    };

    const mappedServiceType = serviceTypeMapping[serviceType] || 'GENERAL_REPAIR';
    const mappedVehicleType = vehicleTypeMapping[vehicleType] || 'CAR';

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        endUserId,
        vehicleType: mappedVehicleType,
        vehicleNumber: vehicleNumber || null,
        vehicleMake: vehicleMake || name, // Use 'name' field as vehicleMake
        vehicleModel: vehicleModel || null,
        serviceType: mappedServiceType,
        description: description || issue || 'Service request',
        images,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        customerNotes: customerNotes || issue,
        status: 'PENDING'
      },
      include: {
        endUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'request_created',
        userId: endUserId,
        details: {
          requestId: serviceRequest.requestId,
          serviceType: mappedServiceType,
          location: { latitude, longitude, address }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: serviceRequest
    });

  } catch (error) {
    console.error('Error creating service request:', error);
    
    // Clean up uploaded files if database operation failed
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's service requests
export const getUserServiceRequests = async (req, res) => {
  try {
    const endUserId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { endUserId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            latitude: true,
            longitude: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.serviceRequest.count({ where });

    res.json({
      success: true,
      data: {
        serviceRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get service request by ID
export const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id,
        OR: [
          { endUserId: userId },
          { mechanicId: userId }
        ]
      },
      include: {
        endUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            latitude: true,
            longitude: true
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

    res.json({
      success: true,
      data: serviceRequest
    });

  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update service request status (for mechanics)
export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mechanicNotes, cost } = req.body;
    const mechanicId = req.user.id;

    // Verify mechanic role
    if (req.user.role !== 'MECHANIC' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only mechanics can update service requests'
      });
    }

    const updateData = {
      status: status.toUpperCase(),
      mechanicNotes,
      updatedAt: new Date()
    };

    if (status.toUpperCase() === 'ACCEPTED') {
      updateData.mechanicId = mechanicId;
      updateData.acceptedAt = new Date();
    }

    if (status.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (cost) updateData.cost = parseFloat(cost);
    }

    if (status.toUpperCase() === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        endUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
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
    await prisma.activityLog.create({
      data: {
        action: `request_${status.toLowerCase()}`,
        userId: mechanicId,
        details: {
          requestId: serviceRequest.requestId,
          previousStatus: serviceRequest.status,
          newStatus: status.toUpperCase()
        }
      }
    });

    res.json({
      success: true,
      message: 'Service request updated successfully',
      data: serviceRequest
    });

  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Cancel service request (for end users)
// Cancel service request (for end users)
export const cancelServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Allow optional cancellation reason
    const endUserId = req.user.id;

    console.log('🔄 Cancelling service request:', id, 'by user:', endUserId);

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    // Find the service request
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id,
        endUserId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      },
      include: {
        mechanic: {
          select: {
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
        message: 'Service request not found or cannot be cancelled. Only pending or accepted requests can be cancelled.'
      });
    }

    // Check if request is in a cancellable state
    if (!['PENDING', 'ACCEPTED'].includes(serviceRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status: ${serviceRequest.status.toLowerCase()}`
      });
    }

    // Update the request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        customerNotes: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer',
        updatedAt: new Date()
      },
      include: {
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
          action: 'request_cancelled',
          userId: endUserId,
          details: {
            requestId: updatedRequest.requestId,
            reason: reason || 'cancelled_by_user',
            previousStatus: serviceRequest.status,
            cancelledAt: new Date().toISOString(),
            mechanicWasAssigned: !!serviceRequest.mechanicId
          }
        }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity:', logError);
    }

    console.log('✅ Service request cancelled successfully');

    res.json({
      success: true,
      message: 'Service request cancelled successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error cancelling service request:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or no longer available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
