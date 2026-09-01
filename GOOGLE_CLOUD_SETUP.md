# Google Cloud Run Deployment Guide

## 📋 דרישות מקדימות

### 1. **בחשבון Google Cloud (Free Trial)**
- https://console.cloud.google.com
- Get $300 free credits for 90 days

### 2. **Google Cloud CLI**
```bash
# Mac
brew install --cask google-cloud-sdk

# Linux/Windows
# https://cloud.google.com/sdk/docs/install
```

### 3. **Docker** (מותקן וממתין)

### 4. **Cloudinary Account** (לשמירת תמונות)
- https://cloudinary.com

---

## ✅ שלבים להעלאה

### **שלב 1: התקנו Google Cloud CLI**

```bash
gcloud init
# בחרו את ה-project שלכם
# בחרו location (us-central1)

# התחברו
gcloud auth login
```

### **שלב 2: הגדרו Project**

```bash
# בדקו את ה-project ID
gcloud config list

# או יצרו project חדש
gcloud projects create contractor-app --display-name="Contractor App"
gcloud config set project contractor-app
```

### **שלב 3: הפעילו את ה-APIs**

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL API (ל-Database)
gcloud services enable sqladmin.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

### **שלב 4: בנו את ה-Docker Image**

```bash
cd /path/to/contractor-backend

# הגדרו את GCP project
export PROJECT_ID=$(gcloud config get-value project)

# בנו את ה-image
docker build -t gcr.io/$PROJECT_ID/contractor-api:latest .

# דחפו את ה-image אל Google Container Registry
docker push gcr.io/$PROJECT_ID/contractor-api:latest
```

### **שלב 5: בנו Cloud SQL PostgreSQL**

#### **דרך Google Cloud Console (קל יותר):**

1. כנסו ל: https://console.cloud.google.com
2. בחרו **SQL** בתפריט הצד
3. בחרו **Create Instance**
4. בחרו **PostgreSQL**
5. הגדרות:
   - **Instance ID**: `contractor-db`
   - **Password**: שמרו password חזק
   - **Region**: `us-central1` (same as Cloud Run)
   - **Database**: `contractor_db`
6. בחרו **Create**

#### **או דרך CLI:**

```bash
gcloud sql instances create contractor-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --availability-type=regional \
  --backup-start-time=03:00 \
  --enable-bin-log

# יצרו database
gcloud sql databases create contractor_db \
  --instance=contractor-db

# הגדרו password של postgres
gcloud sql users set-password postgres \
  --instance=contractor-db \
  --password=YOUR_SECURE_PASSWORD
```

### **שלב 6: בדקו ה-Connection String**

```bash
# הדפיסו את ה-connection info
gcloud sql instances describe contractor-db \
  --format='value(ipAddresses[0].ipAddress)'

# תזכרו את ה-IP Address ל-DB_HOST
```

### **שלב 7: Deploy אל Cloud Run**

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export DB_HOST=YOUR_CLOUD_SQL_IP
export DB_PASSWORD=YOUR_SECURE_PASSWORD

gcloud run deploy contractor-api \
  --image=gcr.io/$PROJECT_ID/contractor-api:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --set-env-vars=\
NODE_ENV=production,\
DB_HOST=$DB_HOST,\
DB_PORT=5432,\
DB_USERNAME=postgres,\
DB_PASSWORD=$DB_PASSWORD,\
DB_NAME=contractor_db,\
JWT_SECRET=YOUR_SUPER_SECRET_KEY_HERE,\
JWT_EXPIRES_IN=7d,\
CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME,\
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY,\
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET,\
PORT=3000
```

### **שלב 8: בדקו את ה-Deployment**

```bash
# הדפיסו את URL של ה-API
gcloud run services describe contractor-api \
  --region=$REGION \
  --format='value(status.url)'

# בדקו שהוא עובד
curl https://contractor-api-xxxxx.run.app/api/v1
```

---

## 🔄 **Cloud SQL Proxy (Optional - for local development)**

אם רוצים להתחבר ל-Cloud SQL מקומית:

```bash
# התקנו ה-Cloud SQL Proxy
gcloud components install cloud-sql-proxy

# התחברו
cloud-sql-proxy --instances=PROJECT_ID:us-central1:contractor-db
```

---

## 📊 **URL של ה-API**

```
https://contractor-api-xxxxx.run.app/api/v1
```

עדכנו את Frontend עם ה-URL הזה!

---

## 💰 **Pricing**

**Cloud Run:**
- 2 million requests/month - FREE
- $0.00002400 per request after
- 360,000 GB-seconds/month - FREE

**Cloud SQL (PostgreSQL):**
- db-f1-micro - ~$3.50/month

**Total:** ~$5-10/month (rly cheap!)

---

## 📝 **Update Frontend**

בתוך ה-Frontend (contractor-app), עדכנו את ה-API URL:

```javascript
// src/config/api.ts (או דומה)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  'https://contractor-api-xxxxx.run.app/api/v1';
```

---

## 🔧 **Troubleshooting**

### **"Permission denied" ל-Cloud SQL**
```bash
# גדלו את ה-permissions
gcloud sql instances patch contractor-db \
  --insights-config-enabled
```

### **"ECONNREFUSED" Connection Timeout**
- בדקו שה-DB IP שלכם נכון
- בדקו ש-Cloud Run יכול להתחבר ל-Cloud SQL
- בדקו שה-password נכון

### **Build Failed**
```bash
# בדקו את ה-logs
docker build -t gcr.io/$PROJECT_ID/contractor-api:latest .

# אם יש שגיאה, תקנו אותה וחזרו
```

### **Service not reachable**
```bash
# בדקו ה-logs של Cloud Run
gcloud run logs read contractor-api --region=$REGION --limit=100
```

---

## 🚀 **Update ו-Redeploy**

כל עדכון:

```bash
# 1. עדכנו את ה-code
git add .
git commit -m "Update API"

# 2. בנו את ה-image
docker build -t gcr.io/$PROJECT_ID/contractor-api:latest .
docker push gcr.io/$PROJECT_ID/contractor-api:latest

# 3. Deploy
gcloud run deploy contractor-api \
  --image=gcr.io/$PROJECT_ID/contractor-api:latest \
  --region=$REGION
```

---

## 📋 **Monitoring & Logs**

```bash
# בדקו את ה-logs בזמן real-time
gcloud run logs read contractor-api --limit=100 --follow

# בדקו את ה-metrics
gcloud monitoring dashboards list
```

---

**צריכים עזרה עם Google Cloud? שאלו אותי!** 💪
