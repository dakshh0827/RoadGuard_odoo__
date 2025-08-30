// server/src/config/passport.js - COMPLETE FIXED VERSION
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // CRITICAL: This must EXACTLY match what's in Google Cloud Console
      callbackURL: process.env.NODE_ENV === 'production' 
        ? `${process.env.SERVER_URL}/auth/oauth/google/callback`
        : 'http://localhost:5000/auth/oauth/google/callback', // Updated port if needed
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Update existing user with Google info if not already linked
          if (!user.providerId || user.provider !== 'google') {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'google',
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
                isVerified: true, // Google accounts are pre-verified
              },
            });
          }
        } else {
          // Create new user
          const names = profile.displayName?.split(' ') || ['', ''];
          user = await prisma.user.create({
            data: {
              email,
              firstName: names[0] || profile.name?.givenName || '',
              lastName: names.slice(1).join(' ') || profile.name?.familyName || '',
              provider: 'google',
              providerId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true, // Google accounts are pre-verified
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // CRITICAL: This must EXACTLY match what's in GitHub OAuth App settings
      callbackURL: process.env.NODE_ENV === 'production'
        ? `${process.env.SERVER_URL}/auth/oauth/github/callback`
        : 'http://localhost:5000/auth/oauth/github/callback', // Updated port if needed
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub OAuth profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          username: profile.username
        });

        const email = profile.emails?.find(e => e.primary)?.value || profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in GitHub profile'), null);
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Update existing user with GitHub info if not already linked
          if (!user.providerId || user.provider !== 'github') {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'github',
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
                isVerified: true, // GitHub accounts are pre-verified
              },
            });
          }
        } else {
          // Create new user
          const displayName = profile.displayName || profile.username || '';
          const names = displayName.split(' ');
          
          user = await prisma.user.create({
            data: {
              email,
              firstName: names[0] || profile.name?.givenName || profile.username || '',
              lastName: names.slice(1).join(' ') || profile.name?.familyName || '',
              provider: 'github',
              providerId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isVerified: true, // GitHub accounts are pre-verified
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize/deserialize user (required by Passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        provider: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
