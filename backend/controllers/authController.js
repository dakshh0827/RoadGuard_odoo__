// server/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import EmailService from '../services/emailService.js';
import TokenService from '../services/tokenService.js';
import {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOTPSchema,
} from '../lib/validation.js';

const prisma = new PrismaClient();

class AuthController {
  static async signup(req, res) {
    try {
      const validatedData = signupSchema.parse(req.body);
      const { email, password, firstName, lastName } = validatedData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          provider: 'credentials',
        },
      });

      // Generate and send OTP
      const otp = TokenService.generateOTP();
      const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

      await prisma.oTPCode.create({
        data: {
          email: email.toLowerCase(),
          code: await bcrypt.hash(otp, 10),
          type: 'verification',
          expiresAt,
        },
      });

      await EmailService.sendOTP(email, otp, 'verification');

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please check your email for verification code.',
        data: {
          email: user.email,
          id: user.id,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async login(req, res) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || user.provider !== 'credentials') {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if email is verified
      if (!user.isVerified) {
        // Generate and send new OTP
        const otp = TokenService.generateOTP();
        const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

        await prisma.oTPCode.deleteMany({
          where: { email: email.toLowerCase(), type: 'verification' },
        });

        await prisma.oTPCode.create({
          data: {
            email: email.toLowerCase(),
            code: await bcrypt.hash(otp, 10),
            type: 'verification',
            expiresAt,
          },
        });

        await EmailService.sendOTP(email, otp, 'verification');

        return res.status(403).json({
          success: false,
          message: 'Please verify your email first. A new verification code has been sent.',
          requiresVerification: true,
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const validatedData = verifyOTPSchema.parse(req.body);
      const { email, otp } = validatedData;

      // Find OTP record
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          email: email.toLowerCase(),
          type: 'verification',
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Check attempt limit
      if (otpRecord.attempts >= (process.env.MAX_OTP_ATTEMPTS || 3)) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please request a new OTP.',
        });
      }

      // Verify OTP
      const isOTPValid = await bcrypt.compare(otp, otpRecord.code);
      
      if (!isOTPValid) {
        // Increment attempts
        await prisma.oTPCode.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 },
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          attemptsLeft: (process.env.MAX_OTP_ATTEMPTS || 3) - (otpRecord.attempts + 1),
        });
      }

      // Mark OTP as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Update user as verified
      const user = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { isVerified: true },
      });

      // Generate tokens
      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async resendOTP(req, res) {
    try {
      const validatedData = resendOTPSchema.parse(req.body);
      const { email, type } = validatedData;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // For password reset, don't reveal if user exists
      if (type === 'password_reset' && (!user || user.provider !== 'credentials')) {
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset code will be sent.',
        });
      }

      // Delete existing OTP codes of the same type
      await prisma.oTPCode.deleteMany({
        where: { email: email.toLowerCase(), type },
      });

      // Generate new OTP
      const otp = TokenService.generateOTP();
      const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

      await prisma.oTPCode.create({
        data: {
          email: email.toLowerCase(),
          code: await bcrypt.hash(otp, 10),
          type,
          expiresAt,
        },
      });

      await EmailService.sendOTP(email, otp, type);

      res.json({
        success: true,
        message: `${type === 'verification' ? 'Verification' : 'Password reset'} code sent successfully`,
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const { email } = validatedData;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || user.provider !== 'credentials') {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset code will be sent.',
        });
      }

      // Delete existing password reset OTP codes
      await prisma.oTPCode.deleteMany({
        where: { email: email.toLowerCase(), type: 'password_reset' },
      });

      // Generate new OTP
      const otp = TokenService.generateOTP();
      const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

      await prisma.oTPCode.create({
        data: {
          email: email.toLowerCase(),
          code: await bcrypt.hash(otp, 10),
          type: 'password_reset',
          expiresAt,
        },
      });

      await EmailService.sendOTP(email, otp, 'password_reset');

      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset code will be sent.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const { email, otp, newPassword } = validatedData;

      // Find valid OTP record
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          email: email.toLowerCase(),
          type: 'password_reset',
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Check attempt limit
      if (otpRecord.attempts >= (process.env.MAX_OTP_ATTEMPTS || 3)) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please request a new OTP.',
        });
      }

      // Verify OTP
      const isOTPValid = await bcrypt.compare(otp, otpRecord.code);
      
      if (!isOTPValid) {
        // Increment attempts
        await prisma.oTPCode.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 },
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          attemptsLeft: (process.env.MAX_OTP_ATTEMPTS || 3) - (otpRecord.attempts + 1),
        });
      }

      // Mark OTP as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { 
          password: hashedPassword,
          refreshToken: null, // Invalidate all existing sessions
        },
      });

      // Clean up all OTP codes for this email
      await prisma.oTPCode.deleteMany({
        where: { email: email.toLowerCase() },
      });

      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      // Verify refresh token
      const decoded = TokenService.verifyRefreshToken(refreshToken);

      // Find user with this refresh token
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.id,
          refreshToken,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = TokenService.generateTokens(user);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  }

  static async logout(req, res) {
    try {
      const userId = req.user.id;

      // Clear refresh token
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          provider: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, avatar } = req.body;
      const userId = req.user.id;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(avatar && { avatar }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          provider: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.provider !== 'credentials') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change password for this account type',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password and invalidate all sessions
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          refreshToken: null,
        },
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // For credential users, verify password
      if (user.provider === 'credentials') {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: 'Password required to delete account',
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Incorrect password',
          });
        }
      }

      // Delete related OTP codes first
      await prisma.oTPCode.deleteMany({
        where: { email: user.email },
      });

      // Delete user account
      await prisma.user.delete({
        where: { id: userId },
      });

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default AuthController;