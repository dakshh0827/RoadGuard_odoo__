// server/src/middlewares/auth.js - INTEGRATED VERSION
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ----------------- Core Authentication Middleware -----------------

/**
 * Primary JWT Authentication middleware - recommended for all API routes
 * Combines token verification with fresh user data retrieval
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Auth Middleware - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId; // Support both formats

    console.log('🔍 Auth Middleware - Decoded token:', { 
      userId, 
      email: decoded.email, 
      role: decoded.role 
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Get fresh user data from database with comprehensive fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isActive: true,
        phone: true,
        latitude: true,
        longitude: true,
        address: true,
        city: true
      }
    });

    console.log('🔍 Auth Middleware - User from DB:', user ? 'Found' : 'Not found');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    req.user = user;
    console.log('✅ Auth Middleware - User authenticated successfully');
    next();

  } catch (error) {
    console.error('❌ Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Backward compatibility JWT middleware
 * Alias for authenticateToken to support existing code
 */
export const authenticateJWT = authenticateToken;

// ----------------- Verification Middleware -----------------

/**
 * Require email verification
 */
export const requireVerified = (req, res, next) => {
  console.log('🔍 RequireVerified - User verified:', req.user?.isVerified);
  
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true
    });
  }
  next();
};

// ----------------- Role-based Authorization -----------------

/**
 * Flexible role requirement middleware
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    console.log('🔍 RequireRole - Checking roles:', { 
      userRole, 
      allowedRoles: roles 
    });
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `${roles.length > 1 ? roles.join(' or ') : roles[0]} role required`,
        requiredRoles: roles,
        userRole: userRole
      });
    }
    next();
  };
};

// Individual role middleware functions
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Administrator role required'
    });
  }
  next();
};

export const requireMechanic = (req, res, next) => {
  if (req.user?.role !== 'MECHANIC') {
    return res.status(403).json({
      success: false,
      message: 'Mechanic role required'
    });
  }
  next();
};

export const requireCustomer = (req, res, next) => {
  if (!['END_USER', 'CUSTOMER'].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: 'Customer role required'
    });
  }
  next();
};

export const requireEndUser = (req, res, next) => {
  if (req.user?.role !== 'END_USER') {
    return res.status(403).json({
      success: false,
      message: 'End user role required'
    });
  }
  next();
};

// Combined role requirements
export const requireMechanicOrAdmin = requireRole(['MECHANIC', 'ADMIN']);
export const requireEndUserOrAdmin = requireRole(['END_USER', 'ADMIN']);
export const requireCustomerOrAdmin = requireRole(['CUSTOMER', 'END_USER', 'ADMIN']);

/**
 * Require verified end user (for service requests)
 */
export const requireVerifiedEndUser = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to continue',
      requiresVerification: true
    });
  }
  
  if (!['END_USER', 'CUSTOMER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only customers can create service requests'
    });
  }
  next();
};

// ----------------- Middleware Combinations -----------------

// Pre-composed middleware chains for common use cases
export const requireMechanicRole = [authenticateToken, requireMechanic];
export const requireAdminRole = [authenticateToken, requireAdmin];
export const requireMechanicOrAdminRole = [authenticateToken, requireMechanicOrAdmin];
export const requireCustomerRole = [authenticateToken, requireCustomer];

export const authenticateAndVerify = [authenticateToken, requireVerified];
export const requireVerifiedCustomer = [authenticateToken, requireVerified, requireCustomer];

/**
 * Create verified role requirement middleware
 * @param {string|string[]} allowedRoles - Roles that are allowed
 */
export const requireVerifiedRole = (allowedRoles) => {
  return [authenticateToken, requireVerified, requireRole(allowedRoles)];
};

// ----------------- Service Request Access Control -----------------

/**
 * Check if user can access a specific service request
 */
export const canAccessServiceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔍 CanAccessServiceRequest - Checking access for user:', { 
      userId, 
      userRole, 
      requestId: id 
    });

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        endUserId: true,
        mechanicId: true,
        status: true
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    console.log('🔍 CanAccessServiceRequest - Service request:', { 
      endUserId: serviceRequest.endUserId, 
      mechanicId: serviceRequest.mechanicId,
      status: serviceRequest.status
    });

    // Admin can access all requests
    if (userRole === 'ADMIN') {
      console.log('✅ CanAccessServiceRequest - Admin access granted');
      return next();
    }

    // End user can access their own requests
    if (['CUSTOMER', 'END_USER'].includes(userRole) && serviceRequest.endUserId === userId) {
      console.log('✅ CanAccessServiceRequest - Customer access to own request granted');
      return next();
    }

    // Mechanic can access assigned requests or pending requests
    if (userRole === 'MECHANIC') {
      if (serviceRequest.mechanicId === userId || serviceRequest.status === 'PENDING') {
        console.log('✅ CanAccessServiceRequest - Mechanic access granted');
        return next();
      }
    }

    console.log('❌ CanAccessServiceRequest - Access denied');
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this service request'
    });
  } catch (error) {
    console.error('❌ Service request access check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking permissions' 
    });
  }
};

// ----------------- Activity Logging -----------------

/**
 * Activity logging middleware with enhanced error handling
 * @param {string} action - The action being performed
 */
export const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      // Store activity info for later logging
      req.activityAction = action;
      req.activityStartTime = Date.now();
      
      // Continue with the request
      next();
      
      // Log successful activity after response (in background)
      res.on('finish', async () => {
        try {
          if (req.user && res.statusCode < 400) {
            const details = {
              method: req.method,
              url: req.originalUrl,
              userAgent: req.get('User-Agent'),
              ip: req.ip || req.connection.remoteAddress,
              duration: Date.now() - req.activityStartTime,
              statusCode: res.statusCode,
              timestamp: new Date()
            };
            
            // Add request-specific details
            if (req.params?.id) {
              details.resourceId = req.params.id;
            }
            
            if (req.query && Object.keys(req.query).length > 0) {
              details.queryParams = req.query;
            }

            // Add relevant body data for certain actions
            if (req.body && ['CREATE', 'UPDATE', 'DELETE'].some(a => action.includes(a))) {
              details.requestData = req.body;
            }
            
            await prisma.activityLog.create({
              data: {
                action: req.activityAction,
                userId: req.user.id,
                details
              }
            });
            
            console.log('📝 Activity logged:', { userId: req.user.id, action });
          }
        } catch (logError) {
          console.warn('❌ Failed to log activity:', logError);
        }
      });
    } catch (error) {
      console.warn('❌ Activity logging middleware error:', error);
      next(); // Continue even if logging fails
    }
  };
};

/**
 * Manual activity logging function
 * @param {string} action - The action performed
 * @param {string} userId - User ID
 * @param {Object} details - Additional details
 */
export const logActivityAfterResponse = async (action, userId, details = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        userId,
        details: {
          ...details,
          timestamp: new Date()
        }
      }
    });
    console.log('📝 Activity logged:', { userId, action });
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
};

// ----------------- Default Export -----------------

export default {
  // Core authentication
  authenticateToken,
  authenticateJWT,
  
  // Verification
  requireVerified,
  requireVerifiedEndUser,
  
  // Role-based authorization
  requireRole,
  requireAdmin,
  requireMechanic,
  requireCustomer,
  requireEndUser,
  requireMechanicOrAdmin,
  requireEndUserOrAdmin,
  requireCustomerOrAdmin,
  
  // Middleware combinations
  requireMechanicRole,
  requireAdminRole,
  requireMechanicOrAdminRole,
  requireCustomerRole,
  authenticateAndVerify,
  requireVerifiedRole,
  requireVerifiedCustomer,
  
  // Access control
  canAccessServiceRequest,
  
  // Activity logging
  logActivity,
  logActivityAfterResponse
};
