#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupManager {
  constructor() {
    this.dataPath = process.env.DATA_PATH || './data';
    this.uploadsPath = process.env.UPLOADS_PATH || './uploads';
    this.backupPath = './backups';
  }

  // Создать бэкап
  async createBackup() {
    try {
      console.log('🔄 Создание бэкапа...');
      
      // Создать папку для бэкапов
      await fs.mkdir(this.backupPath, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `backup-${timestamp}.tar.gz`);
      
      // Создать архив
      const command = `tar -czf "${backupFile}" "${this.dataPath}" "${this.uploadsPath}"`;
      await execAsync(command);
      
      console.log(`✅ Бэкап создан: ${backupFile}`);
      
      // Очистить старые бэкапы (оставить последние 10)
      await this.cleanOldBackups();
      
      return backupFile;
    } catch (err) {
      console.error('❌ Ошибка создания бэкапа:', err);
      throw err;
    }
  }

  // Восстановить из бэкапа
  async restoreBackup(backupFile) {
    try {
      console.log(`🔄 Восстановление из ${backupFile}...`);
      
      // Проверить существование файла
      await fs.access(backupFile);
      
      // Создать временную папку
      const tempDir = './temp_restore';
      await fs.mkdir(tempDir, { recursive: true });
      
      // Извлечь архив
      const command = `tar -xzf "${backupFile}" -C "${tempDir}"`;
      await execAsync(command);
      
      // Переместить данные
      const tempDataPath = path.join(tempDir, path.basename(this.dataPath));
      const tempUploadsPath = path.join(tempDir, path.basename(this.uploadsPath));
      
      if (await this.exists(tempDataPath)) {
        await this.copyDir(tempDataPath, this.dataPath);
      }
      
      if (await this.exists(tempUploadsPath)) {
        await this.copyDir(tempUploadsPath, this.uploadsPath);
      }
      
      // Очистить временную папку
      await execAsync(`rm -rf "${tempDir}"`);
      
      console.log('✅ Восстановление завершено');
    } catch (err) {
      console.error('❌ Ошибка восстановления:', err);
      throw err;
    }
  }

  // Автоматический бэкап при запуске
  async autoBackup() {
    try {
      // Проверить есть ли данные для бэкапа
      const hasData = await this.hasExistingData();
      
      if (hasData) {
        console.log('📦 Создание автоматического бэкапа...');
        await this.createBackup();
      }
    } catch (err) {
      console.error('⚠️ Ошибка автобэкапа:', err);
    }
  }

  // Проверить есть ли существующие данные
  async hasExistingData() {
    try {
      const dataFiles = await fs.readdir(this.dataPath);
      return dataFiles.some(file => file.endsWith('.json'));
    } catch {
      return false;
    }
  }

  // Очистить старые бэкапы
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          time: fs.stat(path.join(this.backupPath, file)).then(stat => stat.mtime)
        }));

      // Получить времена модификации
      for (let file of backupFiles) {
        file.time = await file.time;
      }

      // Сортировать по времени (новые первые)
      backupFiles.sort((a, b) => b.time - a.time);

      // Удалить старые (оставить 10 последних)
      const toDelete = backupFiles.slice(10);
      
      for (let file of toDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️ Удален старый бэкап: ${file.name}`);
      }
    } catch (err) {
      console.error('⚠️ Ошибка очистки бэкапов:', err);
    }
  }

  // Вспомогательные методы
  async exists(path) {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const command = `cp -R "${src}/"* "${dest}/"`;
    await execAsync(command);
  }

  // Список доступных бэкапов
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'))
        .sort()
        .reverse();

      console.log('📋 Доступные бэкапы:');
      backupFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });

      return backupFiles;
    } catch (err) {
      console.log('📋 Бэкапы не найдены');
      return [];
    }
  }
}

// CLI интерфейс
if (require.main === module) {
  const backup = new BackupManager();
  const command = process.argv[2];

  switch (command) {
    case 'create':
      backup.createBackup();
      break;
    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.log('Использование: node backup.js restore <файл_бэкапа>');
        process.exit(1);
      }
      backup.restoreBackup(backupFile);
      break;
    case 'list':
      backup.listBackups();
      break;
    case 'auto':
      backup.autoBackup();
      break;
    default:
      console.log(`
Использование:
  node backup.js create          - создать бэкап
  node backup.js restore <file>  - восстановить из бэкапа
  node backup.js list           - список бэкапов
  node backup.js auto           - автобэкап
      `);
  }
}

module.exports = BackupManager;
