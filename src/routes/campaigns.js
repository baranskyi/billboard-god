const express = require('express');
const router = express.Router();
const fileDB = require('../utils/fileDB');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Получить список кампаний
router.get('/', requireAuth, async (req, res) => {
  try {
    const campaigns = await fileDB.getAllCampaigns();
    
    // Для агентов - фильтровать только назначенные кампании
    if (req.session.user.role === 'agent') {
      const filteredCampaigns = campaigns.filter(campaign => 
        campaign.agents && campaign.agents.includes(req.session.user.id)
      );
      return res.json(filteredCampaigns);
    }
    
    // Админы видят все
    res.json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: 'Помилка отримання кампаній' });
  }
});

// Получить одну кампанию
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const campaign = await fileDB.getCampaign(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Кампанію не знайдено' });
    }

    // Проверить доступ для агентов
    if (req.session.user.role === 'agent' && 
        (!campaign.agents || !campaign.agents.includes(req.session.user.id))) {
      return res.status(403).json({ error: 'Немає доступу до цієї кампанії' });
    }

    res.json(campaign);
  } catch (err) {
    console.error('Error fetching campaign:', err);
    res.status(500).json({ error: 'Помилка отримання кампанії' });
  }
});

// Создать кампанию (только админ)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, startDate, endDate, agents, instructions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Введіть назву кампанії' });
    }

    const campaign = {
      name,
      startDate: startDate || new Date().toISOString(),
      endDate,
      agents: agents || [],
      instructions: instructions || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.session.user.id
    };

    const savedCampaign = await fileDB.saveCampaign(campaign);
    res.json(savedCampaign);

  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({ error: 'Помилка створення кампанії' });
  }
});

// Обновить кампанию (только админ)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, agents, instructions, status } = req.body;

    const campaign = await fileDB.getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Кампанію не знайдено' });
    }

    // Обновить поля
    if (name) campaign.name = name;
    if (startDate) campaign.startDate = startDate;
    if (endDate) campaign.endDate = endDate;
    if (agents) campaign.agents = agents;
    if (instructions !== undefined) campaign.instructions = instructions;
    if (status) campaign.status = status;

    campaign.updatedAt = new Date().toISOString();
    campaign.updatedBy = req.session.user.id;

    const savedCampaign = await fileDB.saveCampaign(campaign);
    res.json(savedCampaign);

  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({ error: 'Помилка оновлення кампанії' });
  }
});

// Удалить кампанию (только админ)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверить есть ли точки в кампании
    const points = await fileDB.getPointsByCampaign(id);
    if (points.length > 0) {
      return res.status(400).json({ 
        error: 'Не можна видалити кампанію з існуючими точками' 
      });
    }

    const deleted = await fileDB.delete(`campaigns/${id}.json`);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Кампанію не знайдено' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ error: 'Помилка видалення кампанії' });
  }
});

// Получить статистику кампании
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await fileDB.getCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Кампанію не знайдено' });
    }

    // Проверить доступ для агентов
    if (req.session.user.role === 'agent' && 
        (!campaign.agents || !campaign.agents.includes(req.session.user.id))) {
      return res.status(403).json({ error: 'Немає доступу до цієї кампанії' });
    }

    // Получить все точки кампании
    const points = await fileDB.getPointsByCampaign(id);
    
    // Подсчитать статистику
    const stats = {
      totalPoints: points.length,
      byAgent: {},
      byType: {},
      byCondition: {}
    };

    points.forEach(point => {
      // По агентам
      if (!stats.byAgent[point.userId]) {
        stats.byAgent[point.userId] = 0;
      }
      stats.byAgent[point.userId]++;

      // По типам
      if (!stats.byType[point.type]) {
        stats.byType[point.type] = 0;
      }
      stats.byType[point.type]++;

      // По состоянию
      if (!stats.byCondition[point.condition]) {
        stats.byCondition[point.condition] = 0;
      }
      stats.byCondition[point.condition]++;
    });

    res.json(stats);

  } catch (err) {
    console.error('Error fetching campaign stats:', err);
    res.status(500).json({ error: 'Помилка отримання статистики' });
  }
});

module.exports = router;
