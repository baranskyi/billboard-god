const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const BackupManager = require('./scripts/backup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Disable caching for HTML/CSS/JS to avoid stale UI on mobile
app.use(express.static('public', {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
}));
app.use('/uploads', express.static('uploads', { etag: false, lastModified: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'billboard-tracker-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Initialize data directories
async function initializeDataDirs() {
  const dirs = [
    'data/users',
    'data/campaigns', 
    'data/points',
    'uploads',
    'backups'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Директорія створена: ${dir}`);
    } catch (err) {
      console.error(`Error creating directory ${dir}:`, err);
    }
  }
  
  // Проверить существование данных
  try {
    const dataFiles = await fs.readdir('data/users');
    const hasData = dataFiles.some(file => file.endsWith('.json'));
    console.log(`💾 Існуючі дані: ${hasData ? 'Знайдено' : 'Відсутні'}`);
  } catch {
    console.log('💾 Існуючі дані: Відсутні');
  }
}

// Initialize default admin user
async function initializeAdmin() {
  const adminFile = path.join('data/users', 'admin.json');
  
  try {
    await fs.access(adminFile);
  } catch {
    // Create default admin if doesn't exist
    const bcrypt = require('bcrypt');
    const adminData = {
      id: 'admin',
      username: 'admin',
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10),
      role: 'admin',
      name: 'Адміністратор',
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(adminFile, JSON.stringify(adminData, null, 2));
    console.log('Admin user created with default password');
  }
}

// Routes
const authRoutes = require('./src/routes/auth');
const campaignRoutes = require('./src/routes/campaigns');
const pointRoutes = require('./src/routes/points');
const userRoutes = require('./src/routes/users');
const backupRoutes = require('./src/routes/backup');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/users', userRoutes);
app.use('/api/backup', backupRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  if (!req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  } else if (req.session.user.role === 'admin') {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'agent.html'));
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Щось пішло не так!' });
});

// Start server
async function start() {
  // Создать автобэкап перед запуском
  const backup = new BackupManager();
  await backup.autoBackup();
  
  await initializeDataDirs();
  await initializeAdmin();
  
  // Настроить периодические бэкапы (каждые 6 часов)
  setInterval(async () => {
    try {
      await backup.createBackup();
      console.log('📦 Автоматический бэкап создан');
    } catch (err) {
      console.error('⚠️ Ошибка автобэкапа:', err);
    }
  }, 6 * 60 * 60 * 1000); // 6 часов
  
  app.listen(PORT, () => {
    console.log(`Billboard Tracker запущено на порту ${PORT}`);
    console.log(`Відкрийте http://localhost:${PORT} у браузері`);
    console.log(`📦 Автобэкап налаштовано (кожні 6 годин)`);
  });
}

start();
