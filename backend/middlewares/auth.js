// server/src/middlewares/auth.js - UPDATED VERSION
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import TokenService from '../services/tokenService.js';

const prisma = new PrismaClient();

// JWT Authentication middleware using passport (FIXED)
const authenticateJWT = (req, res, next) => {
  console.log('🔍 AuthMiddleware - authenticateJWT called');
  
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    console.log('🔍 AuthMiddleware - Passport result:', { err: !!err, user: !!user, info });
    
    if (err) {
      console.error('❌ AuthMiddleware - Authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }

    if (!user) {
      console.log('❌ AuthMiddleware - No user found');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    console.log('✅ AuthMiddleware - User authenticated:', user.email);
    req.user = user;
    next();
  })(req, res, next);
};

// Direct JWT Authentication middleware (RECOMMENDED for service requests)
const authenticateToken = async (req, res, next) => {
  console.log('🔍 AuthMiddleware - authenticateToken called');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 AuthMiddleware - Token exists:', !!token);

  if (!token) {
    console.log('❌ AuthMiddleware - No token provided');
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 AuthMiddleware - Token decoded:', { userId: decoded.userId, email: decoded.email });
    
    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        phone: true,
        latitude: true,
        longitude: true,
        address: true,
        city: true
      }
    });

    if (!user) {
      console.log('❌ AuthMiddleware - User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    console.log('✅ AuthMiddleware - User found and authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ AuthMiddleware - Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional JWT Authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Require verified email
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true,
    });
  }

  next();
};

// Require specific role
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  }

  next();
};

// Require specific provider (for unlinking OAuth)
const requireProvider = (provider) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.provider !== provider) {
    return res.status(403).json({
      success: false,
      message: `This endpoint requires ${provider} authentication`,
    });
  }

  next();
};

// Combined middleware for authenticated and verified users
const authenticateAndVerify = [authenticateToken, requireVerified];

// Middleware for mechanics only
const requireMechanic = [authenticateToken, requireRole('MECHANIC')];

// Middleware for admins only
const requireAdmin = [authenticateToken, requireRole('ADMIN')];

// Middleware for mechanics and admins
const requireMechanicOrAdmin = [authenticateToken, requireRole(['MECHANIC', 'ADMIN'])];

export {
  authenticateJWT,
  authenticateToken,
  optionalAuth,
  requireVerified,
  requireProvider,
  requireRole,
  authenticateAndVerify,
  requireMechanic,
  requireAdmin,
  requireMechanicOrAdmin,
};
