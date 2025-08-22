const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const fileDB = require('../utils/fileDB');
const { requireAdmin } = require('../middleware/auth');

// Получить список пользователей (только админ)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const userFiles = await fileDB.list('users');
    const users = [];
    
    for (const file of userFiles) {
      const user = await fileDB.read(`users/${file}`);
      if (user) {
        // Не отправляем пароли
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Создать нового пользователя (только админ)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    
    // Валидация
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Заповніть усі поля' });
    }

    // Проверка существования пользователя
    const existingUser = await fileDB.getUser(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Користувач з таким логіном already exists' });
    }

    // Хешировать пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создать пользователя
    const user = {
      username,
      password: hashedPassword,
      name,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.session.user.id
    };

    const savedUser = await fileDB.saveUser(user);
    
    // Вернуть без пароля
    const { password: _, ...userWithoutPassword } = savedUser;
    res.json(userWithoutPassword);

  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Обновить пользователя (только админ)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, isActive } = req.body;

    const user = await fileDB.read(`users/${id}.json`);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    // Обновить данные
    if (name) user.name = name;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    // Обновить пароль если передан
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    user.updatedAt = new Date().toISOString();
    user.updatedBy = req.session.user.id;

    const savedUser = await fileDB.saveUser(user);
    
    // Вернуть без пароля
    const { password: _, ...userWithoutPassword } = savedUser;
    res.json(userWithoutPassword);

  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Удалить пользователя (только админ)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Нельзя удалить себя
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Не можна видалити власний акаунт' });
    }

    // Нельзя удалить админа
    if (id === 'admin') {
      return res.status(400).json({ error: 'Не можна видалити адміністратора' });
    }

    const deleted = await fileDB.delete(`users/${id}.json`);
    
    if (!deleted) {
      return res.status(404).json({ error: 'user not found' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
