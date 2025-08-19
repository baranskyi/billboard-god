const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const fileDB = require('../utils/fileDB');

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Введіть логін та пароль' });
    }

    // Найти пользователя
    const user = await fileDB.getUser(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    // Проверить пароль
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    // Сохранить в сессию
    req.session.user = {
      id: user.id,
      username: user.username,
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
