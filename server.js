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
      console.log(`📁 Directory created: ${dir}`);
    } catch (err) {
      console.error(`Error creating directory ${dir}:`, err);
    }
  }
  
  // Проверить существование данных
  try {
    const dataFiles = await fs.readdir('data/users');
    const hasData = dataFiles.some(file => file.endsWith('.json'));
    console.log(`💾 Existing data: ${hasData ? 'Found' : 'Not found'}`);
  } catch {
    console.log('💾 Existing data: Not found');
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
      name: 'Administrator',
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

// Landing page
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Demo access
app.get('/demo', (req, res) => {
  res.redirect('/landing#demo');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function start() {
  // Create auto-backup before startup
  const backup = new BackupManager();
  await backup.autoBackup();
  
  await initializeDataDirs();
  await initializeAdmin();
  
  // Setup periodic backups (every 6 hours)
  setInterval(async () => {
    try {
      await backup.createBackup();
      console.log('📦 Automatic backup created');
    } catch (err) {
      console.error('⚠️ Auto-backup error:', err);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  app.listen(PORT, () => {
    console.log(`Billboard God running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
    console.log(`📦 Auto-backup configured (every 6 hours)`);
  });
}

start();
