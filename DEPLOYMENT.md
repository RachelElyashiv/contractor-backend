# Backend Deployment Guide

## 🚀 עלייה ל-Production

תוכן עניינים:
- [Heroku](#heroku) (פשוט וחינם לחודש ראשון)
- [Google Cloud Run](#google-cloud-run) (מומלץ)
- [AWS EC2/RDS](#aws)

---

## Heroku

### 1. התקנו Heroku CLI

```bash
# Mac
brew tap heroku/brew && brew install heroku

# Windows / Linux
# הורידו מ: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. קבלו חשבון בחינם

https://www.heroku.com/

### 3. יצרו Heroku App

```bash
heroku login
heroku create your-contractor-api
```

### 4. הוסיפו PostgreSQL

```bash
heroku addons:create heroku-postgresql:essential-0 -a your-contractor-api

# בדקו את ה-connection string
heroku config -a your-contractor-api
```

### 5. הוסיפו Cloudinary Credentials

```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name -a your-contractor-api
heroku config:set CLOUDINARY_API_KEY=your_api_key -a your-contractor-api
heroku config:set CLOUDINARY_API_SECRET=your_api_secret -a your-contractor-api
heroku config:set JWT_SECRET=your_jwt_secret -a your-contractor-api
```

### 6. Deploy

```bash
git push heroku main
# או
git push heroku your-branch:main
```

### 7. בדקו את הדיפלויי

```bash
heroku logs -f -a your-contractor-api
```

### URL של ה-API
```
https://your-contractor-api.herokuapp.com/api/v1
```

---

## Google Cloud Run

### 1. התקנו Google Cloud CLI

https://cloud.google.com/sdk/docs/install

### 2. בחרו פרויקט

```bash
gcloud init
gcloud config set project your-project-id
```

### 3. בנו את ה-Docker Image

```bash
# בנו את ה-image
docker build -t contractor-api:latest .

# סימנו את ה-image עבור Google Container Registry
docker tag contractor-api:latest gcr.io/your-project-id/contractor-api:latest

# דחפו אל GCR
docker push gcr.io/your-project-id/contractor-api:latest
```

### 4. בנו Cloud SQL PostgreSQL

```bash
# בחרו "Cloud SQL" בקונסול Google Cloud
# יצרו instance של PostgreSQL 15
# זכרו את ה-connection string
```

### 5. Deploy ל-Cloud Run

```bash
gcloud run deploy contractor-api \
  --image gcr.io/your-project-id/contractor-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars DB_HOST=your-cloud-sql-host,DB_USERNAME=postgres,DB_PASSWORD=your_password,DB_NAME=contractor_db,JWT_SECRET=your_secret,CLOUDINARY_CLOUD_NAME=your_cloud_name,CLOUDINARY_API_KEY=your_key,CLOUDINARY_API_SECRET=your_secret
```

### URL של ה-API
```
https://contractor-api-xxxxx.run.app/api/v1
```

---

## AWS

### Option A: Elastic Beanstalk (Simple)

```bash
# 1. התקנו EB CLI
pip install awsebcli

# 2. יצרו Beanstalk app
eb init -p "Node.js 20 running on 64bit Amazon Linux 2" contractor-api

# 3. בנו environment עם RDS
eb create contractor-api-env \
  --instance-type t3.micro \
  --envvars DB_HOST=your-rds-endpoint,NODE_ENV=production

# 4. Deploy
eb deploy
```

### Option B: ECS + RDS (Recommended)

```bash
# 1. בנו את ה-Docker image
docker build -t contractor-api:latest .
docker tag contractor-api:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/contractor-api:latest

# 2. דחפו אל ECR
aws ecr push your-account-id.dkr.ecr.us-east-1.amazonaws.com/contractor-api:latest

# 3. יצרו ECS Cluster ו-Service (דרך AWS Console)

# 4. בנו RDS PostgreSQL Instance
```

---

## 🔑 Environment Variables שצריכות

כל פלטפורם צריכה את אלה:

```env
NODE_ENV=production
DB_HOST=your_database_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=contractor_db
JWT_SECRET=your_super_secret_key (minimum 32 characters)
JWT_EXPIRES_IN=7d
PORT=3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 📋 Cloudinary Setup

1. כנסו ל: https://cloudinary.com
2. הירשמו לחשבון חינם
3. בחרו "Dashboard"
4. העתיקו את:
   - Cloud Name
   - API Key
   - API Secret

---

## ✅ בדיקות לפני Production

```bash
# 1. בדקו ש-TypeORM יעבוד
npm run build
npm run start

# 2. בדקו ש-Docker עובד
docker-compose up

# 3. בדקו ש-API עובד
curl http://localhost:3000/api/v1
```

---

## 📝 עדכונים עתידיים

כל עדכון חדש:

```bash
# 1. עדכנו את ה-code
git add .
git commit -m "your changes"

# 2. Heroku
git push heroku main

# 3. או Google Cloud
docker build -t gcr.io/your-project-id/contractor-api:latest .
docker push gcr.io/your-project-id/contractor-api:latest
gcloud run deploy contractor-api --image gcr.io/your-project-id/contractor-api:latest
```

---

## 🆘 Troubleshooting

### "Error: ECONNREFUSED (Database connection)"
- בדקו ש-DATABASE_URL נכון
- בדקו שה-password נכון
- בדקו ש-database קיים

### "ModuleNotFoundError"
- בדקו ש-npm install רץ בבנייה
- בדקו ש-Dockerfile נכון

### "TypeError: Cannot read property 'listen'"
- בדקו ש-PORT מוגדר
- בדקו ש-bootstrap() כול סביב try-catch

---

**צריכים עזרה? שאלו אותי!** 💪
