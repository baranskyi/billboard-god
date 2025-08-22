const express = require('express');
const router = express.Router();
const fileDB = require('../utils/fileDB');
const emailService = require('../utils/emailService');

// Отправка кода авторизации
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Please enter email' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Генерируем код
    let code;
    if (email === 'woofer.ua@gmail.com') {
      code = '111111'; // Тестовый код
    } else {
      code = emailService.generateAuthCode();
    }

    // Сохраняем код в базе
    await fileDB.saveAuthCode(email, code);

    // Отправляем код на email
    const emailResult = await emailService.sendAuthCode(email, code);
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.message);
      // Но продолжаем, так как код сохранен
    }

    res.json({
      success: true,
      message: 'Code sent to your email'
    });

  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Вход по коду
router.post('/login', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Please enter email and code' });
    }

    // Get saved code
    const authData = await fileDB.getAuthCode(email);
    
    if (!authData) {
      return res.status(401).json({ error: 'Code not found or expired' });
    }

    // Check code expiration
    const now = new Date();
    const expiresAt = new Date(authData.expiresAt);
    
    if (now > expiresAt) {
      await fileDB.deleteAuthCode(email);
      return res.status(401).json({ error: 'Code expired' });
    }

    // Verify code
    if (authData.code !== code) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Удаляем использованный код
    await fileDB.deleteAuthCode(email);

    // Find user by email
    let user = await fileDB.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }

    // Сохранить в сессию
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.json({
      success: true,
      user: req.session.user
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
});

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Please enter email and name' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await fileDB.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = {
      id: fileDB.generateId(),
      email: email,
      name: name,
      role: 'admin', // All new users get admin status
      createdAt: new Date().toISOString()
    };

    await fileDB.saveUser(user);

    // Generate and send login code
    let code;
    if (email === 'woofer.ua@gmail.com') {
      code = '111111'; // Test code
    } else {
      code = emailService.generateAuthCode();
    }

    await fileDB.saveAuthCode(email, code);
    const emailResult = await emailService.sendAuthCode(email, code);
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.message);
    }

    res.json({
      success: true,
      message: 'Registration successful! Login code sent to your email.'
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout error' });
    }
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ user: req.session.user });
});

module.exports = router;
