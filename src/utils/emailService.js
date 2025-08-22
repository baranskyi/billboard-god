const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Check email settings
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email service not configured. Email sending will be disabled.');
      console.warn('Please set EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASS environment variables.');
      return;
    }

    try {
      // Support different email services
      let transportConfig;
      
      if (process.env.EMAIL_SERVICE === 'sendgrid') {
        transportConfig = {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      } else if (process.env.EMAIL_SERVICE === 'mailgun') {
        transportConfig = {
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      } else {
        // Default to Gmail or other service
        transportConfig = {
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      }

      this.transporter = nodemailer.createTransporter(transportConfig);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service verification failed:', error);
        } else {
          console.log('✅ Email service initialized and verified successfully');
        }
      });

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendAuthCode(email, code) {
    // Для тестового аккаунта всегда возвращаем успех
    if (email === 'woofer.ua@gmail.com') {
      console.log(`Test account - code sent to ${email}: ${code}`);
      return { success: true, message: 'Test code sent' };
    }

    if (!this.transporter) {
      console.log(`Email service not available - code for ${email}: ${code}`);
      return { success: true, message: 'Email service not configured, but code generated' };
    }

    try {
      const mailOptions = {
        from: `"Billboard God" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Billboard God - Authentication Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Billboard God - Authentication Code</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h1 style="color: #2C3E50; font-size: 28px; margin: 0; font-weight: bold;">Billboard God</h1>
                          <p style="color: #7F8C8D; font-size: 16px; margin: 5px 0 0 0;">Outdoor Advertising Monitoring System</p>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h2 style="color: #2C3E50; font-size: 24px; margin: 0 0 15px 0;">Your Authentication Code</h2>
                          <p style="color: #5A6C7D; font-size: 16px; margin: 0;">Enter this code to complete your login:</p>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #3498DB, #2980B9); padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px;">
                          <h1 style="color: #ffffff; font-size: 48px; margin: 0; letter-spacing: 8px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${code}</h1>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                          <p style="color: #E74C3C; font-size: 16px; font-weight: bold; margin: 0;">⏱️ Code expires in 10 minutes</p>
                        </div>
                        
                        <div style="background-color: #ECF0F1; padding: 20px; border-radius: 6px; margin: 20px 0;">
                          <p style="color: #5A6C7D; font-size: 14px; margin: 0; text-align: center;">
                            <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. 
                            Never share your authentication codes with anyone.
                          </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8E8E8;">
                          <p style="color: #95A5A6; font-size: 12px; margin: 0;">
                            © 2024 Billboard God - Outdoor Advertising Monitoring System
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `
Billboard God - Authentication Code

Your login code: ${code}

Code is valid for 10 minutes.

If you didn't request this code, please ignore this message.

© 2024 Billboard God - Outdoor Advertising Monitoring System
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Auth code sent to ${email}`);
      return { success: true, message: 'Code sent successfully' };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  generateAuthCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = new EmailService();
