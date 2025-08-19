# 💾 Збереження даних при деплої

## 🚨 Проблема

При кожному новому деплої (оновленні коду) всі дані користувачів, кампанії та фотографії **видаляються**. Це відбувається тому, що:

1. Папки `data/` та `uploads/` не зберігаються в git
2. При деплої створюється новий контейнер/сервер
3. Старі дані залишаються на попередньому сервері

## ✅ Рішення

### Варіант 1: Railway Volumes (Рекомендується)

Railway автоматично зберігає дані у volumes:

1. **В Railway панелі** перейдіть в Settings → Volumes
2. **Додайте Volume:**
   - Mount Path: `/app/data`
   - Size: 1GB (достатньо для початку)
3. **Додайте ще один Volume:**
   - Mount Path: `/app/uploads` 
   - Size: 5GB (для фотографій)

**Після цього дані будуть зберігатися між деплоями!**

### Варіант 2: Зовнішнє сховище (AWS S3, Google Cloud)

Для production рекомендую:
- **Фотографії** → AWS S3 або Google Cloud Storage
- **Дані** → Managed Database (PostgreSQL)

### Варіант 3: Ручне збереження/відновлення

#### Перед деплоєм:
```bash
# Створити бэкап
node scripts/backup.js create

# Завантажити бэкап локально
scp user@server:/path/to/backups/backup-*.tar.gz ./local-backup/
```

#### Після деплою:
```bash
# Завантажити бэкап на новий сервер
scp ./local-backup/backup-*.tar.gz user@server:/path/to/app/

# Відновити дані
node scripts/backup.js restore backup-*.tar.gz
```

---

## 🔄 Автоматичні бэкапи

Система тепер автоматично:
- ✅ **Створює бэкап** при кожному запуску сервера
- ✅ **Періодичні бэкапи** кожні 6 годин
- ✅ **Очищає старі** бэкапи (залишає 10 останніх)
- ✅ **Зберігає в папці** `./backups/`

### Ручне управління бэкапами:

```bash
# Створити бэкап
node scripts/backup.js create

# Переглянути список бэкапів
node scripts/backup.js list

# Відновити з конкретного бэкапа
node scripts/backup.js restore backups/backup-2025-01-14T15-30-00-000Z.tar.gz
```

---

## 🐳 Docker з постійними volumes

### docker-compose.yml (оновлений):

```yaml
version: '3.8'
services:
  billboard-tracker:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SESSION_SECRET=${SESSION_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      # Постійні дані
      - billboard_data:/app/data
      - billboard_uploads:/app/uploads
      - billboard_backups:/app/backups
    restart: unless-stopped

# Створити named volumes для збереження даних
volumes:
  billboard_data:
    driver: local
  billboard_uploads:
    driver: local
  billboard_backups:
    driver: local
```

**З такою конфігурацією дані зберігаються навіть при перезапуску контейнерів!**

---

## 🔧 Налаштування для різних платформ

### Railway:
1. **Settings → Volumes**
2. **Додати volumes** для `/app/data` та `/app/uploads`
3. **Дані автоматично зберігаються**

### Heroku:
⚠️ **Heroku НЕ зберігає файли!** Потрібно:
- Використовувати AWS S3 для фотографій
- PostgreSQL для даних
- Або перейти на Railway/DigitalOcean

### DigitalOcean/VPS:
- **Дані зберігаються** автоматично на диску сервера
- **Рекомендується** налаштувати cron для бэкапів:

```bash
# Додати в crontab (crontab -e):
0 */6 * * * cd /path/to/app && node scripts/backup.js create
```

---

## 📋 Чек-лист збереження даних

### Перед деплоєм завжди:
- [ ] Створити ручний бэкап: `node scripts/backup.js create`
- [ ] Перевірити наявність автобэкапів: `node scripts/backup.js list`
- [ ] Зберегти важливі бэкапи локально

### Після деплою:
- [ ] Перевірити роботу системи
- [ ] Переконатися, що дані на місці
- [ ] При потребі відновити з бэкапа

### Налаштування production:
- [ ] Налаштувати volumes/persistent storage
- [ ] Налаштувати зовнішнє сховище для фото
- [ ] Налаштувати автоматичні бэкапи
- [ ] Перевірити відновлення з бэкапа

---

## 🎯 Рекомендації по платформах

### 🥇 **Railway** (найпростіше):
- Додати Volumes в налаштуваннях
- Дані зберігаються автоматично
- Ніяких додаткових налаштувань

### 🥈 **DigitalOcean** (найнадійніше):
- Дані на диску сервера
- Налаштувати cron для бэкапів
- Повний контроль

### 🥉 **Docker** (універсальне):
- Named volumes зберігають дані
- Легко переносити між серверами

### ❌ **Heroku** (не рекомендується):
- Не зберігає файли
- Потрібні зовнішні сервіси

---

## 🔄 Міграція існуючих даних

Якщо у вас вже є дані на старому сервері:

### 1. Створити бэкап на старому сервері:
```bash
cd /old/server/path
node scripts/backup.js create
```

### 2. Завантажити бэкап:
```bash
scp user@old-server:/path/backup-*.tar.gz ./
```

### 3. Відновити на новому сервері:
```bash
cd /new/server/path
node scripts/backup.js restore backup-*.tar.gz
```

---

## 📦 Структура бэкапа

Кожен бэкап містить:
```
backup-2025-01-14T15-30-00-000Z.tar.gz
├── data/
│   ├── users/          # Всі користувачі
│   ├── campaigns/      # Всі кампанії
│   └── points/         # Всі точки
└── uploads/            # Всі фотографії
```

**Один файл = повне відновлення системи!**

---

*Тепер твої дані захищені від втрати при деплоях! 🛡️*
