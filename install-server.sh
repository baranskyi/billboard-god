#!/bin/bash

# Billboard Tracker - автоматическая установка на Ubuntu сервер
# Использование: curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/billboard-tracker/main/install-server.sh | bash

echo "🚀 Начинаем установку Billboard Tracker..."

# Обновляем систему
echo "📦 Обновляем систему..."
apt update && apt upgrade -y

# Устанавливаем Node.js 18
echo "📦 Устанавливаем Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Устанавливаем PM2
echo "📦 Устанавливаем PM2..."
npm install -g pm2

# Устанавливаем Nginx
echo "📦 Устанавливаем Nginx..."
apt install nginx -y

# Устанавливаем Git
apt install git -y

# Создаем пользователя для приложения
echo "👤 Создаем пользователя billboard..."
useradd -m -s /bin/bash billboard
usermod -aG sudo billboard

# Переходим в домашнюю директорию пользователя
cd /home/billboard

# Клонируем репозиторий
echo "📥 Загружаем Billboard Tracker..."
git clone https://github.com/YOUR_USERNAME/billboard-tracker.git
cd billboard-tracker

# Меняем владельца файлов
chown -R billboard:billboard /home/billboard/billboard-tracker

# Переключаемся на пользователя billboard
sudo -u billboard bash << 'EOF'
cd /home/billboard/billboard-tracker

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Создаем .env файл
echo "⚙️ Создаем конфигурацию..."
cp env.example .env

# Генерируем случайный секретный ключ
SECRET_KEY=$(openssl rand -base64 32)
sed -i "s/your-secret-key-here/$SECRET_KEY/" .env

echo "🔑 Внимание! Измените пароль админа в файле .env"
echo "Файл находится в: /home/billboard/billboard-tracker/.env"
EOF

# Настраиваем PM2
echo "🚀 Настраиваем PM2..."
sudo -u billboard pm2 start /home/billboard/billboard-tracker/server.js --name billboard-tracker
sudo -u billboard pm2 startup
sudo -u billboard pm2 save

# Настраиваем Nginx
echo "🌐 Настраиваем Nginx..."
cat > /etc/nginx/sites-available/billboard-tracker << 'EOF'
server {
    listen 80;
    server_name _;

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
        
        # Увеличиваем лимит для загрузки фото
        client_max_body_size 50M;
    }
}
EOF

# Активируем сайт
ln -sf /etc/nginx/sites-available/billboard-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Тестируем и перезапускаем Nginx
nginx -t && systemctl restart nginx

# Настраиваем брандмауэр
echo "🔒 Настраиваем брандмауэр..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Установка завершена!"
echo ""
echo "🎉 Billboard Tracker доступен по адресу: http://$(curl -s ifconfig.me)"
echo ""
echo "🔑 Данные для входа:"
echo "   Логин: admin"
echo "   Пароль: admin123 (ОБЯЗАТЕЛЬНО измените в .env файле!)"
echo ""
echo "📝 Полезные команды:"
echo "   Статус приложения: sudo -u billboard pm2 status"
echo "   Логи приложения:   sudo -u billboard pm2 logs billboard-tracker"
echo "   Перезапуск:        sudo -u billboard pm2 restart billboard-tracker"
echo "   Редактировать .env: nano /home/billboard/billboard-tracker/.env"
echo ""
echo "⚠️  ВАЖНО: Измените пароль админа в /home/billboard/billboard-tracker/.env"
