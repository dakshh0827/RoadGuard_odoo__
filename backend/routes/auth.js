// server/src/routes/auth.js
import express from 'express';
import AuthController from '../controllers/authController.js';
import {
  authenticateJWT,
  requireVerified,
} from '../middlewares/auth.js';
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, AuthController.signup);
router.post('/login', authLimiter, AuthController.login);
router.post('/verify-otp', authLimiter, AuthController.verifyOTP);
router.post('/resend-otp', otpLimiter, AuthController.resendOTP);
router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/refresh-token', authLimiter, AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticateJWT, AuthController.logout);
router.get('/profile', authenticateJWT, AuthController.getProfile);

// Routes that require verified email
router.get('/protected', authenticateJWT, requireVerified, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to protected resource',
    user: req.user,
  });
});

export default router;