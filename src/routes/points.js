const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const fileDB = require('../utils/fileDB');
const { requireAuth } = require('../middleware/auth');

// Настройка загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Дозволені тільки JPG та PNG зображення'));
    }
  }
});

// Получить points кампании
router.get('/campaign/:campaignId', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // Проверить доступ к кампании
    const campaign = await fileDB.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'campaign not found' });
    }

    if (req.session.user.role === 'agent' && 
        (!campaign.agents || !campaign.agents.includes(req.session.user.id))) {
      return res.status(403).json({ error: 'Немає доступу до цієї campaigns' });
    }

    const points = await fileDB.getPointsByCampaign(campaignId);
    
    // Для агентов - показывать только их points
    if (req.session.user.role === 'agent') {
      const filteredPoints = points.filter(point => point.userId === req.session.user.id);
      return res.json(filteredPoints);
    }

    res.json(points);
  } catch (err) {
    console.error('Error fetching points:', err);
    res.status(500).json({ error: 'Failed to get points' });
  }
});

// Создать новую point
router.post('/', requireAuth, upload.array('photos', 3), async (req, res) => {
  try {
    const { campaignId, latitude, longitude, accuracy, type, condition, comment } = req.body;

    // Валидация
    if (!campaignId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Відсутні обов\'язкові поля' });
    }

    // Проверить доступ к кампании
    const campaign = await fileDB.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'campaign not found' });
    }

    if (req.session.user.role === 'agent' && 
        (!campaign.agents || !campaign.agents.includes(req.session.user.id))) {
      return res.status(403).json({ error: 'Немає доступу до цієї campaigns' });
    }

    // Валидация состояния
    const validConditions = ['good', 'damaged', 'absent', 'not_working'];
    if (condition && !validConditions.includes(condition)) {
      return res.status(400).json({ error: 'Невірний стан конструкції' });
    }

    // Создать point
    const point = {
      campaignId,
      userId: req.session.user.id,
      userName: req.session.user.name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy) || 0,
      type: type || 'billboard',
      condition: condition || 'good',
      comment: comment || '',
      photos: [],
      createdAt: new Date().toISOString()
    };

    // Сохранить point чтобы получить ID
    const savedPoint = await fileDB.savePoint(campaignId, point);

    // Обработать и сохранить фотографии
    if (req.files && req.files.length > 0) {
      const uploadDir = path.join('uploads', campaignId, savedPoint.id);
      await fs.mkdir(uploadDir, { recursive: true });

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filename = `photo_${i + 1}.jpg`;
        const filepath = path.join(uploadDir, filename);

        // Сжать и сохранить изображение
        await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(filepath);

        savedPoint.photos.push(`/uploads/${campaignId}/${savedPoint.id}/${filename}`);
      }

      // Обновить point с фотографиями
      await fileDB.savePoint(campaignId, savedPoint);
    }

    res.json(savedPoint);

  } catch (err) {
    console.error('Error creating point:', err);
    res.status(500).json({ error: 'Failed to create points' });
  }
});

// Обновить point
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { campaignId, type, condition, comment } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Не вказано campaign' });
    }

    const point = await fileDB.getPoint(campaignId, id);
    if (!point) {
      return res.status(404).json({ error: 'point not found' });
    }

    // Проверить права (только создатель или админ)
    if (req.session.user.role !== 'admin' && point.userId !== req.session.user.id) {
      return res.status(403).json({ error: 'Немає прав для редагування' });
    }

    // Обновить поля
    if (type) point.type = type;
    if (condition) point.condition = condition;
    if (comment !== undefined) point.comment = comment;

    point.updatedAt = new Date().toISOString();
    point.updatedBy = req.session.user.id;

    const savedPoint = await fileDB.savePoint(campaignId, point);
    res.json(savedPoint);

  } catch (err) {
    console.error('Error updating point:', err);
    res.status(500).json({ error: 'Failed to update points' });
  }
});

// Удалить point
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'Не вказано campaign' });
    }

    const point = await fileDB.getPoint(campaignId, id);
    if (!point) {
      return res.status(404).json({ error: 'point not found' });
    }

    // Проверить права (только создатель или админ)
    if (req.session.user.role !== 'admin' && point.userId !== req.session.user.id) {
      return res.status(403).json({ error: 'Немає прав для видалення' });
    }

    // Удалить фотографии
    if (point.photos && point.photos.length > 0) {
      const uploadDir = path.join('uploads', campaignId, id);
      try {
        await fs.rmdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error deleting photos:', err);
      }
    }

    // Удалить point
    await fileDB.deletePoint(campaignId, id);
    res.json({ success: true });

  } catch (err) {
    console.error('Error deleting point:', err);
    res.status(500).json({ error: 'Failed to delete points' });
  }
});

// Получить все points для карты (админ)
router.get('/map', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Тільки для адміністраторів' });
    }

    const { campaignId, agentId, type, condition } = req.query;
    const campaigns = campaignId ? [await fileDB.getCampaign(campaignId)] : await fileDB.getAllCampaigns();
    
    let allPoints = [];

    for (const campaign of campaigns) {
      if (!campaign) continue;
      
      const points = await fileDB.getPointsByCampaign(campaign.id);
      
      // Добавить информацию о кампании к каждой точке
      const enrichedPoints = points.map(point => ({
        ...point,
        campaignName: campaign.name
      }));
      
      allPoints = allPoints.concat(enrichedPoints);
    }

    // Фильтрация
    if (agentId) {
      allPoints = allPoints.filter(p => p.userId === agentId);
    }
    if (type) {
      allPoints = allPoints.filter(p => p.type === type);
    }
    if (condition) {
      allPoints = allPoints.filter(p => p.condition === condition);
    }

    res.json(allPoints);

  } catch (err) {
    console.error('Error fetching map points:', err);
    res.status(500).json({ error: 'Failed to get points для карти' });
  }
});

module.exports = router;
