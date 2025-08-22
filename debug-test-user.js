#!/usr/bin/env node

/**
 * Debug Test User Script
 * Checks if test user exists and creates it if missing
 */

const fileDB = require('./src/utils/fileDB');

async function debugTestUser() {
  console.log('🔍 Debugging Test User Account');
  console.log('==============================');
  console.log();

  try {
    // Check if test user exists
    const testUser = await fileDB.getUserByEmail('woofer.ua@gmail.com');
    
    if (testUser) {
      console.log('✅ Test user found:');
      console.log('   Email:', testUser.email);
      console.log('   Name:', testUser.name);
      console.log('   Role:', testUser.role);
      console.log('   ID:', testUser.id);
      console.log('   Created:', testUser.createdAt);
    } else {
      console.log('❌ Test user NOT found!');
      console.log('   Creating test user...');
      
      // Create test user
      const newTestUser = {
        id: 'test-user-woofer',
        email: 'woofer.ua@gmail.com',
        name: 'Test User',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      await fileDB.saveUser(newTestUser);
      console.log('✅ Test user created successfully!');
    }
    
    console.log();
    console.log('🧪 Test Authentication Flow:');
    console.log('1. Go to your Railway URL');
    console.log('2. Enter email: woofer.ua@gmail.com');
    console.log('3. Click "Get Code"');
    console.log('4. Enter code: 111111');
    console.log('5. Click "Login"');
    console.log();
    console.log('Or use the "Use Test Account" button for quick login!');
    
  } catch (error) {
    console.error('❌ Error debugging test user:', error);
  }
}

debugTestUser();
