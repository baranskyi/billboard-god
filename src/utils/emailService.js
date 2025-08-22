const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Проверяем настройки email
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email service not configured. Email sending will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
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
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Billboard God - Код авторизації',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Billboard God</h2>
            <p>Ваш код для входу в систему:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>Код діє протягом 10 хвилин.</p>
            <p style="color: #666; font-size: 14px;">Якщо ви не запитували цей код, проігноруйте це повідомлення.</p>
          </div>
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
