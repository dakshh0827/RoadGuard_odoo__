// server/src/routes/auth.js - FIXED VERSION
import express from 'express';
import AuthController from '../controllers/authController.js';
import {
  authenticateJWT,
  authenticateToken, // Add this import
  requireVerified,
  requireRole,
  requireAdmin,
  logActivity,
} from '../middlewares/auth.js';
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, logActivity('user_signup'), AuthController.signup);
router.post('/login', authLimiter, logActivity('user_login'), AuthController.login);
router.post('/verify-otp', authLimiter, logActivity('email_verification'), AuthController.verifyOTP);
router.post('/resend-otp', otpLimiter, AuthController.resendOTP);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, logActivity('password_reset'), AuthController.resetPassword);
router.post('/refresh-token', authLimiter, AuthController.refreshToken);

// Role selection route (requires verified email but no role yet)
router.post('/select-role', authLimiter, logActivity('role_selection'), AuthController.selectRole);

// Protected routes - USING authenticateToken instead of authenticateJWT
router.post('/logout', authenticateToken, logActivity('user_logout'), AuthController.logout);
router.get('/profile', authenticateToken, requireVerified, AuthController.getProfile);
// router.put('/profile', authenticateToken, requireVerified, logActivity('profile_update'), AuthController.updateProfile);
router.post('/change-password', authenticateToken, requireVerified, logActivity('password_change'), AuthController.changePassword);
router.delete('/account', authenticateToken, requireVerified, logActivity('account_deletion'), AuthController.deleteAccount);

// Admin-only routes
// router.get('/users', authenticateToken, requireVerified, ...requireAdmin, AuthController.getAllUsers);
// router.patch('/users/:userId/role', authenticateToken, requireVerified, ...requireAdmin, logActivity('admin_role_update'), AuthController.updateUserRole);
// router.patch('/users/:userId/status', authenticateToken, requireVerified, ...requireAdmin, logActivity('admin_status_update'), AuthController.updateUserStatus);

// FIXED: Routes that require verified email and role selection
// The issue was here - requireRole returns a function that needs to be called correctly
router.get('/protected', 
  authenticateToken, 
  requireVerified, 
  requireRole(['CUSTOMER', 'MECHANIC', 'ADMIN']), // This is correct now
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to protected resource',
      user: req.user,
    });
  }
);

export default router;
