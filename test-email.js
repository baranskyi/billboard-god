#!/usr/bin/env node

/**
 * Email Test Script for Billboard God
 * 
 * This script tests email functionality locally or on Railway
 * Usage: node test-email.js your-email@example.com
 */

require('dotenv').config();
const emailService = require('./src/utils/emailService');

async function testEmail(targetEmail) {
  if (!targetEmail) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node test-email.js your-email@example.com');
    process.exit(1);
  }

  console.log('🧪 Testing Billboard God Email Service');
  console.log('=====================================');
  console.log();

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || '❌ Not set'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '❌ Not set'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);
  console.log();

  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email service not properly configured!');
    console.log('Please set the following environment variables:');
    console.log('- EMAIL_SERVICE (gmail, sendgrid, mailgun)');
    console.log('- EMAIL_USER (your email or API username)');
    console.log('- EMAIL_PASS (your app password or API key)');
    console.log('- EMAIL_FROM (sender email address)');
    process.exit(1);
  }

  try {
    console.log(`📧 Sending test email to: ${targetEmail}`);
    
    // Generate test code
    const testCode = emailService.generateAuthCode();
    console.log(`🔢 Generated test code: ${testCode}`);
    
    // Send email
    const result = await emailService.sendAuthCode(targetEmail, testCode);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📬 Check ${targetEmail} for the authentication code`);
      console.log();
      console.log('🎉 Email service is working correctly!');
    } else {
      console.error('❌ Failed to send email:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    // Common error solutions
    console.log();
    console.log('💡 Common Solutions:');
    console.log('1. Check your Gmail App Password is correct');
    console.log('2. Ensure 2-Factor Authentication is enabled on Gmail');
    console.log('3. Verify EMAIL_USER matches your Gmail address');
    console.log('4. Try using SendGrid or Mailgun for better reliability');
  }
}

// Get email from command line arguments
const targetEmail = process.argv[2];
testEmail(targetEmail);
