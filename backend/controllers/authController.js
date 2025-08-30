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
  roleSelectionSchema,
} from '../lib/validation.js';

// Initialize Prisma Client OUTSIDE the class
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Add logging for debugging
});

// Test the connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));

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

      // Create user with default role as END_USER
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role: 'END_USER', // Default role until they select one
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
          role: user.role,
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

    console.log('🔐 Login attempt for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('🔐 User found:', user.email, 'Role:', user.role, 'Verified:', user.isVerified);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('🔐 Password valid');

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      console.log('📧 User not verified, sending new OTP');
      
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

    // FIXED: Don't force END_USER to select role - END_USER IS the customer role!
    // Only require role selection for users without any role (shouldn't happen with current signup flow)
    // Remove this block entirely since END_USER is a valid role for customers
    
    console.log('✅ User authenticated successfully with role:', user.role);

    // Generate tokens with role included
    const { accessToken, refreshToken } = TokenService.generateTokens(user);

    console.log('🔑 Tokens generated successfully');

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
          role: user.role, // This will be 'END_USER' for customers
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

      // Check if this is an admin email and auto-assign role
      if (AuthController.isAdminEmail(email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
        user.role = 'ADMIN';
      }

      // For admin users or users who already have a role selected, generate tokens
      if (user.role !== 'END_USER') {
        const { accessToken, refreshToken } = TokenService.generateTokens(user);

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        return res.json({
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
              role: user.role,
            },
            accessToken,
            refreshToken,
          },
        });
      }

      // For regular users, they need to select a role
      res.json({
        success: true,
        message: 'Email verified successfully. Please select your role to continue.',
        requiresRoleSelection: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            isVerified: user.isVerified,
            role: user.role,
          },
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

  // server/src/controllers/authController.js - FIX selectRole method
static async selectRole(req, res) {
  try {
    const validatedData = roleSelectionSchema.parse(req.body);
    const { email, role } = validatedData;
    
    console.log('🔄 Role selection requested:', { email, role });
    
    // Map CUSTOMER to END_USER
    let mappedRole = role;
    if (role === 'CUSTOMER') {
      mappedRole = 'END_USER';
    }
    
    console.log('🎯 Mapped role:', mappedRole);
    
    // Validate the mapped role
    if (!['END_USER', 'MECHANIC', 'ADMIN'].includes(mappedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selection',
      });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first',
      });
    }
    
    // Check if role already assigned (and not END_USER)
    if (user.role !== 'END_USER') {
      return res.status(400).json({
        success: false,
        message: 'Role has already been assigned to this account',
      });
    }
    
    // ALWAYS update the role in database - this ensures the correct role is saved
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: mappedRole }, // This will be 'END_USER' for CUSTOMER selection
    });
    
    console.log('✅ Database updated with role:', updatedUser.role);
    
    // Generate tokens with the updated user data
    const { accessToken, refreshToken } = TokenService.generateTokens(updatedUser);
    
    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    
    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'role_selected',
        userId: user.id,
        details: {
          selectedRole: role,           // What user selected (CUSTOMER/MECHANIC)
          databaseRole: mappedRole,     // What got saved (END_USER/MECHANIC)
          timestamp: new Date(),
        },
      },
    });
    
    res.json({
      success: true,
      message: `Role selected successfully.`,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          avatar: updatedUser.avatar,
          isVerified: updatedUser.isVerified,
          role: updatedUser.role, // This should be 'END_USER' for customer selection
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Role selection error:', error);
    
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
      if (type === 'password_reset' && !user) {
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

      if (!user) {
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

      // Check if user is still active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated',
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
          role: true,
          isActive: true,
          latitude: true,
          longitude: true,
          address: true,
          city: true,
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
      const { firstName, lastName, avatar, latitude, longitude, address, city } = req.body;
      const userId = req.user.id;

      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (avatar) updateData.avatar = avatar;
      if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
      if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
      if (address) updateData.address = address;
      if (city) updateData.city = city;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
          role: true,
          isActive: true,
          latitude: true,
          longitude: true,
          address: true,
          city: true,
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

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found',
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

      // Verify password
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

      // Delete related records in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete OTP codes
        await tx.oTPCode.deleteMany({
          where: { email: user.email },
        });

        // Delete activity logs
        await tx.activityLog.deleteMany({
          where: { userId },
        });

        // Update service requests to remove references
        await tx.serviceRequest.updateMany({
          where: { endUserId: userId },
          data: { endUserId: null },
        });

        await tx.serviceRequest.updateMany({
          where: { mechanicId: userId },
          data: { mechanicId: null },
        });

        // Delete user account
        await tx.user.delete({
          where: { id: userId },
        });
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

  // Helper method to check if email is admin
  static isAdminEmail(email) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    return adminEmails.includes(email.toLowerCase());
  }
}

export default AuthController;