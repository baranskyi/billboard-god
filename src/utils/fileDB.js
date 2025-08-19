const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileDB {
  constructor(basePath = './data') {
    this.basePath = basePath;
  }

  // Прочитать JSON файл
  async read(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  // Записать JSON файл
  async write(filePath, data) {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);
    
    // Создать директорию если не существует
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
    return data;
  }

  // Удалить файл
  async delete(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }

  // Получить список файлов в директории
  async list(dirPath) {
    try {
      const fullPath = path.join(this.basePath, dirPath);
      const files = await fs.readdir(fullPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  // Генерировать уникальный ID
  generateId() {
    return uuidv4();
  }

  // Специальные методы для работы с пользователями
  async getUser(username) {
    const users = await this.list('users');
    for (const userFile of users) {
      const user = await this.read(`users/${userFile}`);
      if (user && user.username === username) {
        return user;
      }
    }
    return null;
  }

  async saveUser(user) {
    if (!user.id) {
      user.id = this.generateId();
    }
    return await this.write(`users/${user.id}.json`, user);
  }

  // Методы для работы с кампаниями
  async getCampaign(id) {
    return await this.read(`campaigns/${id}.json`);
  }

  async getAllCampaigns() {
    const files = await this.list('campaigns');
    const campaigns = [];
    for (const file of files) {
      const campaign = await this.read(`campaigns/${file}`);
      if (campaign) campaigns.push(campaign);
    }
    return campaigns;
  }

  async saveCampaign(campaign) {
    if (!campaign.id) {
      campaign.id = this.generateId();
    }
    return await this.write(`campaigns/${campaign.id}.json`, campaign);
  }

  // Методы для работы с точками
  async getPoint(campaignId, pointId) {
    return await this.read(`points/${campaignId}/${pointId}.json`);
  }

  async getPointsByCampaign(campaignId) {
    const files = await this.list(`points/${campaignId}`);
    const points = [];
    for (const file of files) {
      const point = await this.read(`points/${campaignId}/${file}`);
      if (point) points.push(point);
    }
    return points;
  }

  async savePoint(campaignId, point) {
    if (!point.id) {
      point.id = this.generateId();
    }
    return await this.write(`points/${campaignId}/${point.id}.json`, point);
  }

  async deletePoint(campaignId, pointId) {
    return await this.delete(`points/${campaignId}/${pointId}.json`);
  }
}

module.exports = new FileDB();
