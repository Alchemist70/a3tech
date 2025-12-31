const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Check if email is enabled (handle various formats and trim whitespace)
    const emailEnabledStr = (process.env.EMAIL_ENABLED || '').trim();
    const emailEnabled = emailEnabledStr === 'True' || emailEnabledStr === 'true' || emailEnabledStr === '1' || emailEnabledStr === 'TRUE';
    
    let transporter;
    
    // Check for new email configuration first (EMAIL_ENABLED, SENDER_EMAIL, SENDER_PASSWORD)
    const senderEmail = process.env.SENDER_EMAIL?.trim();
    const senderPassword = process.env.SENDER_PASSWORD?.trim();
    
    if (emailEnabled && senderEmail && senderPassword) {
      // Use Gmail SMTP configuration
      transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: senderEmail,
          pass: senderPassword
        }
      });
      console.log('✓ Email enabled - Using Gmail SMTP with email:', senderEmail);
    }
    // Fallback to old SMTP configuration
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('Using custom SMTP configuration');
    } else {
      // For development: create a test account with Ethereal Email
      console.warn('Email not configured. Using Ethereal Email test account for development.');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM?.trim() || senderEmail || process.env.SMTP_USER?.trim() || 'noreply@a3research.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for your A3 Research account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour. If you did not request this password reset, 
            please ignore this email.
          </p>
        </div>
      `,
      text: `
Password Reset Request

You have requested to reset your password for your A3 Research account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour. If you did not request this password reset, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log the preview URL if using ethereal (development mode)
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('\n=== EMAIL PREVIEW URL (Development Mode) ===');
        console.log('Password reset email preview:', previewUrl);
        console.log('(Use this URL to view the email in your browser)\n');
      } else {
        // Successfully sent via real SMTP
        console.log('✓ Password reset email sent successfully to:', email);
      }
    } else {
      console.log('✓ Password reset email sent successfully to:', email);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};

