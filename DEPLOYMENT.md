# 🚀 Деплоймент Billboard Tracker

## Вариант 1: Railway (Рекомендуется)

### Шаг 1: Подготовка кода
```bash
# Создаем GitHub репозиторий
git init
git add .
git commit -m "Initial Billboard Tracker"
```

### Шаг 2: Railway деплой
1. Перейдите на https://railway.app
2. Зарегистрируйтесь через GitHub
3. Нажмите "New Project" → "Deploy from GitHub repo"
4. Выберите репозиторий billboard-tracker
5. Railway автоматически определит Node.js приложение

### Шаг 3: Настройка переменных
В Railway панели → Variables добавьте:
```
PORT=3000
SESSION_SECRET=your-very-secret-random-string-here
ADMIN_PASSWORD=your-secure-admin-password
DATA_PATH=./data
UPLOADS_PATH=./uploads
```

### Шаг 4: Готово!
Railway даст вам URL типа: `https://billboard-tracker-production.up.railway.app`

---

## Вариант 2: DigitalOcean Droplet

### Шаг 1: Создание сервера
1. Зарегистрируйтесь на https://digitalocean.com
2. Создайте Droplet:
   - Ubuntu 22.04 LTS
   - Basic план $4/месяц (512MB RAM)
   - Выберите регион (Frankfurt для Европы)
   - Добавьте SSH ключ

### Шаг 2: Подключение к серверу
```bash
ssh root@YOUR_SERVER_IP
```

### Шаг 3: Установка Node.js
```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Устанавливаем PM2 для управления процессами
npm install -g pm2

# Устанавливаем Nginx
apt install nginx -y

# Устанавливаем Git
apt install git -y
```

### Шаг 4: Загрузка проекта
```bash
# Переходим в домашнюю директорию
cd /home

# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/billboard-tracker.git
cd billboard-tracker

# Устанавливаем зависимости
npm install

# Создаем .env файл
cp env.example .env
nano .env
```

В .env файле:
```env
PORT=3000
SESSION_SECRET=super-secret-key-change-this-in-production
ADMIN_PASSWORD=your-secure-password
DATA_PATH=./data
UPLOADS_PATH=./uploads
```

### Шаг 5: Настройка PM2
```bash
# Запускаем приложение через PM2
pm2 start server.js --name billboard-tracker

# Настраиваем автозапуск
pm2 startup
pm2 save

# Проверяем статус
pm2 status
```

### Шаг 6: Настройка Nginx
```bash
# Создаем конфиг Nginx
nano /etc/nginx/sites-available/billboard-tracker
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активируем конфиг
ln -s /etc/nginx/sites-available/billboard-tracker /etc/nginx/sites-enabled/

# Удаляем дефолтный сайт
rm /etc/nginx/sites-enabled/default

# Тестируем конфиг
nginx -t

# Перезапускаем Nginx
systemctl restart nginx
```

### Шаг 7: SSL сертификат (опционально)
```bash
# Устанавливаем Certbot
apt install certbot python3-certbot-nginx -y

# Получаем SSL сертификат
certbot --nginx -d YOUR_DOMAIN
```

---

## Вариант 3: Heroku

### Подготовка
Создайте файл `Procfile`:
```
web: node server.js
```

### Деплой
```bash
# Устанавливаем Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Логинимся
heroku login

# Создаем приложение
heroku create billboard-tracker-your-name

# Устанавливаем переменные
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set ADMIN_PASSWORD=your-password

# Деплоим
git push heroku main
```

---

## Вариант 4: Docker на любом VPS

### Dockerfile (уже создан)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  billboard-tracker:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SESSION_SECRET=your-secret-key
      - ADMIN_PASSWORD=your-password
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
```

### Запуск
```bash
docker-compose up -d
```

---

## 📱 Настройка для мобильных устройств

После деплоя:
1. Откройте ваш URL на мобильном устройстве
2. Добавьте в закладки или на рабочий стол
3. Разрешите доступ к геолокации
4. Готово к работе!

## 🔒 Безопасность в продакшене

1. **Измените пароли:**
   ```env
   SESSION_SECRET=очень-длинный-случайный-ключ-минимум-32-символа
   ADMIN_PASSWORD=сложный-пароль-администратора
   ```

2. **Используйте HTTPS** (обязательно для GPS)

3. **Настройте брандмауэр:**
   ```bash
   ufw allow ssh
   ufw allow 'Nginx Full'
   ufw enable
   ```

4. **Регулярные бэкапы:**
   ```bash
   # Создание бэкапа
   tar -czf backup-$(date +%Y%m%d).tar.gz data uploads
   ```

## 🆘 Устранение проблем

### Проблема: GPS не работает
- Убедитесь что используете HTTPS
- Проверьте разрешения браузера
- На iOS Safari может требовать полный домен

### Проблема: Фото не загружаются
- Проверьте права на папку uploads: `chmod 755 uploads`
- Проверьте место на диске: `df -h`

### Проблема: Приложение не запускается
- Проверьте логи: `pm2 logs billboard-tracker`
- Проверьте порты: `netstat -tlnp | grep 3000`

---

**Рекомендация:** Начните с Railway для быстрого старта, потом при необходимости переходите на VPS для большего контроля.
