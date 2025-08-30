// server/src/services/emailService.js - SENDGRID DELIVERABILITY OPTIMIZED
import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('📧 SendGrid EmailService initialized');

    // Test connection on startup
    this.testConnection();
  }

  async sendOTP(email, otp, type = 'verification') {
    try {
      const subject =
        type === 'verification'
          ? 'Your RoadGuard Verification Code'
          : 'Your RoadGuard Password Reset Code';

      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'RoadGuard'
        },
        subject: subject,
        text: `RoadGuard - Your ${type} code: ${otp}. Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
        html: this.generateDeliverableOTPEmail(otp, type),

        // SendGrid specific settings for better deliverability
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        },
        mailSettings: {
          sandboxMode: { enable: process.env.NODE_ENV === 'development' }
        }
      };

      console.log('📧 Sending email via SendGrid to:', email);
      console.log('📧 From address:', msg.from.email);
      console.log('📧 Subject:', subject);

      const response = await sgMail.send(msg);

      console.log('✅ SendGrid email sent successfully:', {
        statusCode: response[0].statusCode,
        messageId: response[0].headers['x-message-id'],
        to: email
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        message: 'Email sent successfully via SendGrid'
      };
    } catch (error) {
      console.error('❌ SendGrid email send failed:', error);

      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        console.error('SendGrid status code:', error.code);
      }

      throw new Error(`SendGrid email failed: ${error.message}`);
    }
  }

  generateDeliverableOTPEmail(otp, type) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RoadGuard ${type === 'verification' ? 'Verification' : 'Password Reset'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border: 1px solid #dddddd; border-radius: 8px;">
          
          <!-- Header -->
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">RoadGuard</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Vehicle Management System</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">
              ${type === 'verification' ? 'Email Verification Required' : 'Password Reset Request'}
            </h2>
            
            <p style="color: #4b5563; margin: 0 0 25px 0; line-height: 1.5;">
              ${type === 'verification' 
                ? 'Please enter this code to verify your email address:' 
                : 'Use this code to reset your password:'}
            </p>
            
            <!-- OTP Code Box -->
            <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <div style="font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes
              </p>
            </div>
            
            <!-- Security Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Security:</strong> If you didn’t request this code, please ignore this email.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 25px 0 0 0;">
              This is an automated message from RoadGuard. Please do not reply to this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © 2025 RoadGuard. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    try {
      const testMsg = {
        to: process.env.SENDGRID_FROM_EMAIL, // Send test to yourself
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'RoadGuard'
        },
        subject: 'SendGrid Connection Test - RoadGuard',
        text: 'This is a test email to verify SendGrid configuration.',
        html: '<p>This is a test email to verify SendGrid configuration.</p>'
      };

      const response = await sgMail.send(testMsg);
      console.log('✅ SendGrid connection test successful:', response[0].statusCode);
      return true;
    } catch (error) {
      console.error('❌ SendGrid connection test failed:', error.message);
      if (error.response) {
        console.error('SendGrid test error details:', error.response.body);
      }
      return false;
    }
  }

  async sendWelcomeEmail(email, firstName) {
    try {
      const msg = {
        to: email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME || 'RoadGuard'
        },
        subject: 'Welcome to RoadGuard!',
        text: `Welcome ${firstName}! Your account has been successfully verified and is now active. You can now access all features of RoadGuard.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to RoadGuard, ${firstName}! 🎉</h2>
            <p>Your account has been successfully verified and is now active.</p>
            <p>You can now access all features of RoadGuard.</p>
          </div>
        `
      };

      const response = await sgMail.send(msg);
      console.log('✅ Welcome email sent successfully');
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Welcome email failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}

export default new EmailService();
