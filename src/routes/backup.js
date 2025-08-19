const express = require('express');
const router = express.Router();
const BackupManager = require('../../scripts/backup');
const { requireAdmin } = require('../middleware/auth');

const backup = new BackupManager();

// Создать бэкап
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const backupFile = await backup.createBackup();
    res.json({ 
      success: true, 
      backup: backupFile,
      message: 'Бэкап успішно створено'
    });
  } catch (err) {
    console.error('Backup creation error:', err);
    res.status(500).json({ error: 'Помилка створення бэкапа' });
  }
});

// Список бэкапов
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const backups = await backup.listBackups();
    res.json(backups);
  } catch (err) {
    console.error('Backup list error:', err);
    res.status(500).json({ error: 'Помилка отримання списку бэкапів' });
  }
});

// Восстановить из бэкапа
router.post('/restore', requireAdmin, async (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({ error: 'Не вказано файл бэкапа' });
    }

    await backup.restoreBackup(backupFile);
    res.json({ 
      success: true,
      message: 'Дані успішно відновлено з бэкапа'
    });
  } catch (err) {
    console.error('Backup restore error:', err);
    res.status(500).json({ error: 'Помилка відновлення з бэкапа' });
  }
});

// Скачать бэкап
router.get('/download/:filename', requireAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = `./backups/${filename}`;
    
    // Проверка безопасности - только файлы бэкапов
    if (!filename.startsWith('backup-') || !filename.endsWith('.tar.gz')) {
      return res.status(400).json({ error: 'Невірний файл бэкапа' });
    }

    res.download(backupPath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).json({ error: 'Файл бэкапа не знайдено' });
      }
    });
  } catch (err) {
    console.error('Backup download error:', err);
    res.status(500).json({ error: 'Помилка завантаження бэкапа' });
  }
});

module.exports = router;
