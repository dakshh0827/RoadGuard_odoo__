// server/src/services/tokenService.js - FIXED VERSION
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class TokenService {
  static generateAccessToken(payload) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set');
    }
    
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
  }

  static generateRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  static verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set');
    }
    
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }
}

export default TokenService;
