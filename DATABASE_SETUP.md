# Database Setup Guide

## 📊 PostgreSQL Setup

### Option 1: Local Development (macOS/Linux)

```bash
# 1. התקנו PostgreSQL
brew install postgresql

# 2. התחילו את השרת
brew services start postgresql

# 3. בדקו שהוא רץ
psql --version
```

### Option 2: Docker (Recommended)

```bash
# יהיה נתמך ב-docker-compose.yml שלנו
docker-compose up -d postgres

# בדקו
docker-compose logs postgres
```

### Option 3: Cloud Providers

#### Google Cloud SQL
```bash
gcloud sql instances create contractor-db \
  --database-version=POSTGRES_15 \
  --region=us-central1 \
  --tier=db-f1-micro

# בדקו את ה-connection string בקונסול
```

#### AWS RDS
```bash
# דרך AWS Console:
# RDS → Create Database
# Engine: PostgreSQL 15
# Instance: db.t3.micro (free tier)
# DB Name: contractor_db
# Master Username: postgres
# Master Password: your_secure_password
```

#### Heroku PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0
```

---

## 🔧 Database Connection

### Local Development

```bash
# צרו את ה-database
psql -U postgres -c "CREATE DATABASE contractor_db;"

# או דרך docker-compose
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE contractor_db;"
```

### .env Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=contractor_db
```

---

## 🚀 Running the App

```bash
# 1. התקנו dependencies
npm install

# 2. בחרו בפקודה:

# Development (with watch mode)
npm run start:dev

# Production
npm run build
npm run start

# Docker
docker-compose up
```

---

## 📝 Database Entities (Schema)

### נוצר אוטומטית דרך TypeORM:

**Users** - משתמשים (קבלנים, מנהלים)
```
- id (UUID)
- email (unique)
- password (hashed)
- name
- phone
- createdAt
```

**Projects** - פרויקטים (שטחים)
```
- id (UUID)
- userId (FK)
- name
- description
- address
- status
- createdAt
```

**Tasks** - משימות בפרויקט
```
- id (UUID)
- projectId (FK)
- title
- status
- createdAt
```

**Photos** - תמונות (שמורות ב-Cloudinary)
```
- id (UUID)
- projectId (FK)
- cloudinaryUrl
- uploadedAt
```

**Workers** - עובדים
```
- id (UUID)
- projectId (FK)
- name
- email
- phone
```

**Attendance** - נוכחות עובדים
```
- id (UUID)
- workerId (FK)
- date
- status
```

**Materials** - חומרים
```
- id (UUID)
- projectId (FK)
- name
- quantity
- unit
- cost
```

**Invoices** - חשבוניות
```
- id (UUID)
- projectId (FK)
- invoiceNumber
- totalAmount
- status
```

**Expenses** - הוצאות
```
- id (UUID)
- projectId (FK)
- category
- amount
- description
```

**Apartments** - דירות (למטרות הקדמה)
```
- id (UUID)
- address
- numberOfRooms
```

---

## ✅ Backup & Restore

### Local Backup

```bash
# Backup
pg_dump -U postgres contractor_db > backup.sql

# Restore
psql -U postgres contractor_db < backup.sql
```

### Cloud Backup

#### Google Cloud SQL
```bash
# Automatic backups every day (default)
# Manual backup via Console
gcloud sql backups create \
  --instance=contractor-db
```

#### AWS RDS
```bash
# Automatic backups every day (default)
# Retention: 7 days

# Manual snapshot via Console
aws rds create-db-snapshot \
  --db-instance-identifier contractor-db \
  --db-snapshot-identifier contractor-db-snapshot-date
```

---

## 🔑 Important Notes

⚠️ **Production:**
- Set `synchronize: false` בـ app.module.ts
- Use SSL connections
- Enable automated backups
- Monitor database performance
- Regular backup tests

✅ **Development:**
- Use `synchronize: true`
- Local PostgreSQL
- Regular testing

---

## 🆘 Troubleshooting

### "FATAL: database "contractor_db" does not exist"
```bash
psql -U postgres -c "CREATE DATABASE contractor_db;"
```

### "role "postgres" does not exist"
```bash
# Create role
psql -U postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'password';"
```

### Connection Timeout
- בדקו את HOST ו-PORT
- בדקו ש-database שרץ
- בדקו firewall rules

---

**צריכים עזרה עם database? שאלו אותי!** 💪
