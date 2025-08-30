// server/src/middlewares/auth.js - COMPREHENSIVE MERGED VERSION
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ----------------- Authentication Middleware -----------------

// Primary JWT Authentication middleware (recommended for all API routes)
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

    // Verify token with fallback secret
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
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

    // Get user from database with comprehensive fields
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
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    console.log('✅ Auth Middleware - User authenticated successfully');
    next();

  } catch (error) {
    console.error('❌ Auth Middleware - Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Token verification failed' 
    });
  }
};

// Backward compatibility JWT middleware
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.id || decoded.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// ----------------- Verification / Role Guards -----------------

// Require verified email
export const requireVerified = (req, res, next) => {
  console.log('🔍 RequireVerified - User verified:', req.user.isVerified);
  
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this feature',
      requiresVerification: true
    });
  }
  next();
};

// Flexible role requirement middleware
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
        message: 'Insufficient permissions. This action requires role: ' + roles.join(' or '),
        requiredRoles: roles,
        userRole: userRole
      });
    }
    next();
  };
};

// Individual role middleware functions (for backward compatibility)
export const requireVerifiedEndUser = (req, res, next) => {
  if (!req.user.isVerified) {
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

// Specific role middlewares
export const requireMechanic = requireRole(['MECHANIC']);
export const requireEndUser = requireRole(['END_USER']);
export const requireAdmin = requireRole(['ADMIN']);

// Multiple role middlewares
export const requireMechanicOrAdmin = requireRole(['MECHANIC', 'ADMIN']);
export const requireEndUserOrAdmin = requireRole(['END_USER', 'ADMIN']);
export const requireCustomerOrAdmin = requireRole(['CUSTOMER', 'END_USER', 'ADMIN']);

// ----------------- Predefined Middleware Combinations -----------------

export const requireCustomer = [authenticateToken, requireRole(['CUSTOMER', 'END_USER'])];
export const requireMechanicRole = [authenticateToken, requireRole(['MECHANIC'])]; 
export const requireAdminRole = [authenticateToken, requireRole(['ADMIN'])];
export const requireMechanicOrAdminRole = [authenticateToken, requireRole(['MECHANIC', 'ADMIN'])];

export const authenticateAndVerify = [authenticateToken, requireVerified];

export const requireVerifiedRole = (allowedRoles) => {
  return [authenticateToken, requireVerified, requireRole(allowedRoles)];
};

export const requireVerifiedCustomer = [authenticateToken, requireVerified, requireRole(['END_USER', 'CUSTOMER'])];

// ----------------- Service Request Access Control -----------------

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

// Activity logging middleware (enhanced version)
export const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      // Store activity info for later use
      req.activityAction = action;
      req.activityUserId = req.user?.id;
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to log successful operations
      res.json = function(data) {
        // Only log if the operation was successful AND user exists
        if (data.success && req.user?.id) {
          logActivityAfterResponse(action, req.user.id, {
            method: req.method,
            endpoint: req.originalUrl,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date(),
            // Include relevant request data based on action
            ...(req.body && { requestData: req.body }),
            ...(req.params && { params: req.params }),
            ...(req.query && { query: req.query }),
          }).catch(err => console.error('Activity log error:', err));
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Activity logging middleware error:', error);
      next(); // Continue even if logging fails
    }
  };
};

// Log activity after request completion
export const logActivityAfterResponse = async (action, userId, details = {}) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        userId,
        details
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
  authenticateToken,
  authenticateJWT,
  requireVerified,
  requireRole,
  requireVerifiedEndUser,
  requireMechanic,
  requireEndUser,
  requireAdmin,
  requireMechanicOrAdmin,
  requireEndUserOrAdmin,
  requireCustomer,
  requireMechanicRole,
  requireAdminRole,
  requireMechanicOrAdminRole,
  requireCustomerOrAdmin,
  authenticateAndVerify,
  requireVerifiedRole,
  requireVerifiedCustomer,
  canAccessServiceRequest,
  logActivity,
  logActivityAfterResponse
};
