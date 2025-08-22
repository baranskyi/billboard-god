const express = require('express');
const router = express.Router();
const fileDB = require('../utils/fileDB');
const emailService = require('../utils/emailService');

// Отправка кода авторизации
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Введіть email' });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Невірний формат email' });
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
      message: 'Код відправлено на ваш email'
    });

  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ error: 'Помилка відправки коду' });
  }
});

// Вход по коду
router.post('/login', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Введіть email та код' });
    }

    // Получаем сохраненный код
    const authData = await fileDB.getAuthCode(email);
    
    if (!authData) {
      return res.status(401).json({ error: 'Код не знайдено або застарів' });
    }

    // Проверяем срок действия кода
    const now = new Date();
    const expiresAt = new Date(authData.expiresAt);
    
    if (now > expiresAt) {
      await fileDB.deleteAuthCode(email);
      return res.status(401).json({ error: 'Код застарів' });
    }

    // Проверяем код
    if (authData.code !== code) {
      return res.status(401).json({ error: 'Невірний код' });
    }

    // Удаляем использованный код
    await fileDB.deleteAuthCode(email);

    // Ищем пользователя по email
    let user = await fileDB.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Користувач не знайдений. Спочатку зареєструйтесь.' });
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
    res.status(500).json({ error: 'Помилка авторизації' });
  }
});

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Введіть email та ім\'я' });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Невірний формат email' });
    }

    // Проверяем, не существует ли пользователь
    const existingUser = await fileDB.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Користувач з таким email вже існує' });
    }

    // Создаем нового пользователя
    const user = {
      id: fileDB.generateId(),
      email: email,
      name: name,
      role: 'admin', // Все новые пользователи получают статус администратора
      createdAt: new Date().toISOString()
    };

    await fileDB.saveUser(user);

    // Генерируем и отправляем код для входа
    let code;
    if (email === 'woofer.ua@gmail.com') {
      code = '111111'; // Тестовый код
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
      message: 'Реєстрація успішна! Код для входу відправлено на ваш email.'
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Помилка реєстрації' });
  }
});

// Выход из системы
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Помилка виходу' });
    }
    res.json({ success: true });
  });
});

// Проверка текущего пользователя
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Не авторизовано' });
  }
  
  res.json({ user: req.session.user });
});

module.exports = router;
