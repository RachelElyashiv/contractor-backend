# 🚀 Contractor App - Complete Deployment Checklist

**Status:** Ready for Production Deployment  
**Date:** September 1, 2026  
**Platforms:** Google Cloud Run (Backend) + Google Play Store (Android)

---

## 📋 Pre-Deployment Requirements

### On Your Windows Machine, Verify You Have:

- ✅ **Git Bash** installed (for running shell scripts)
  ```bash
  git --version
  ```

- ✅ **gcloud CLI** installed and authenticated
  ```bash
  gcloud --version
  gcloud auth login
  gcloud config list
  ```

- ✅ **Docker Desktop** installed and running
  ```bash
  docker --version
  ```

- ✅ **Node.js** (v18+)
  ```bash
  node --version
  ```

- ✅ **EAS CLI** installed (for React Native/Expo)
  ```bash
  eas --version
  ```

- ✅ **Google Cloud Project** created and set
  ```bash
  gcloud projects list
  gcloud config set project YOUR_PROJECT_ID
  ```

- ✅ **Cloudinary Account** created
  - Sign up at https://cloudinary.com
  - Get your Cloud Name, API Key, and API Secret

- ✅ **Google Play Developer Account**
  - Enroll at https://play.google.com/console
  - Create a billing account
  - Create app listing

---

## 🔧 Step 1: Prepare Backend for Deployment

### 1.1 Configure gcloud Project

```bash
# Check if authenticated
gcloud auth login

# List available projects
gcloud projects list

# Set your project (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Verify it's set
gcloud config list
```

### 1.2 Enable Required APIs

Run these commands in PowerShell or Git Bash:

```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

**Expected Output:** "Operation completed successfully"

---

## 📦 Step 2: Run Backend Deployment Script

### 2.1 Open Git Bash and Navigate to Backend

```bash
# Navigate to backend directory (adjust path to your location)
cd /c/Users/רחל/Downloads/contractor-backend

# Or wherever you cloned the repository
cd /path/to/contractor-backend
```

### 2.2 Run the Deployment Script

```bash
# Make script executable
chmod +x deploy-gcloud.sh

# Run the script
./deploy-gcloud.sh
```

### 2.3 Script Will Prompt For Configuration

When the script runs, it will ask you for:

1. **DB Password** - Use a strong, secure password (min 8 chars)
   ```
   Example: SecureP@ssw0rd123
   ```

2. **JWT Secret** - Random string (min 32 chars)
   ```
   You can generate with: openssl rand -base64 32
   ```

3. **Cloudinary Cloud Name** - From your Cloudinary dashboard
4. **Cloudinary API Key** - From your Cloudinary dashboard  
5. **Cloudinary API Secret** - From your Cloudinary dashboard

### 2.4 Script Output

The script will:
- ✅ Check gcloud and Docker installation
- ✅ Enable Google Cloud APIs
- ✅ Create Cloud SQL PostgreSQL database
- ✅ Build Docker image
- ✅ Push image to Google Container Registry
- ✅ Deploy to Cloud Run

**Wait for completion (5-10 minutes).**

### 2.5 Save the Output

After deployment completes, you'll see:
```
🎉 Deployment Complete!
================================================
API URL: https://contractor-api-xxxxx.run.app
Database IP: 1.2.3.4
================================================
```

**⚠️ SAVE THE API URL** - You need it for the frontend!

---

## 🔌 Step 3: Update Frontend with Backend API URL

### 3.1 Navigate to Frontend Directory

```bash
cd /path/to/contractor-app
```

### 3.2 Update Environment Variable

Create or update `.env.production` file:

```env
EXPO_PUBLIC_API_URL=https://contractor-api-xxxxx.run.app
```

Or add to `app.json` if using inline config:

```json
{
  "expo": {
    "env": {
      "production": {
        "apiUrl": "https://contractor-api-xxxxx.run.app"
      }
    }
  }
}
```

### 3.3 Verify Frontend Configuration

```bash
# Check if API URL is properly set
echo $EXPO_PUBLIC_API_URL
```

---

## 📱 Step 4: Build and Submit Android App to Google Play

### 4.1 Set Up EAS Build

```bash
cd /path/to/contractor-app

# Login to EAS
eas login
# Enter your Expo account credentials
```

### 4.2 Create Google Play Credentials File

Download from Google Play Console:
1. Go to https://play.google.com/console
2. Select your app
3. Go to **Settings** → **API access**
4. Create service account and download JSON file
5. Save as `credentials.json` in project root

### 4.3 Build for Production

```bash
# Build production APK/AAB
eas build --platform android --profile production

# This will:
# - Increment version code
# - Build AAB format for Play Store
# - Upload to EAS Build servers
# - Take 5-10 minutes

# Check build status
eas build:list
```

**Wait for build to complete.** You'll get a confirmation email.

### 4.4 Submit to Google Play

```bash
# Submit to Play Store internal testing
eas submit --platform android --latest --profile production

# Or submit specific build:
eas submit --platform android --id BUILD_ID

# When asked, use the credentials.json you created
```

**Expected Output:**
```
✅ Successfully submitted to Google Play Console
Track: internal
```

### 4.5 Promote Release in Google Play Console

1. Go to Google Play Console
2. Navigate to **Testing** → **Internal testing**
3. Review the new build
4. Create Release:
   - Add Release Notes (in Hebrew/English)
   - Set version as "Ready for review"
5. Submit for Review to `Production` track

---

## 🧪 Step 5: Test Deployment

### 5.1 Test Backend API

```bash
# Test API endpoint
curl https://contractor-api-xxxxx.run.app/api/v1

# Should return JSON response
```

### 5.2 Test Authentication

```bash
curl -X POST https://contractor-api-xxxxx.run.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "Test User",
    "companyName": "Test Company"
  }'
```

### 5.3 Monitor Backend Logs

```bash
# Watch logs in real-time
gcloud run logs read contractor-api --limit=100 --follow
```

### 5.4 Test Android App

1. Install from Google Play Console → Internal Testing
2. Login with test account
3. Test key features:
   - ✅ Authentication
   - ✅ Photo upload
   - ✅ Project creation
   - ✅ Worker management

---

## 📊 Step 6: Production Verification

### 6.1 Database Verification

```bash
# List Cloud SQL instances
gcloud sql instances list

# Connect to database (if needed)
gcloud sql connect contractor-db --user=postgres
```

### 6.2 Cloud Run Service Status

```bash
# Check service status
gcloud run services list

# Get detailed info
gcloud run services describe contractor-api --region=us-central1
```

### 6.3 Monitor Cloud Run Metrics

```bash
# View metrics dashboard
gcloud monitoring dashboards list

# Or view in Google Cloud Console:
# https://console.cloud.google.com/run/detail/us-central1/contractor-api/metrics
```

---

## 🔐 Security Checklist

- [ ] JWT Secret is strong and unique (32+ chars)
- [ ] Database password is strong (8+ chars, mixed case, numbers)
- [ ] Cloudinary API keys are in Google Cloud secrets (not in code)
- [ ] CORS is properly configured for frontend domain
- [ ] API uses HTTPS only
- [ ] Database SSL connection enabled
- [ ] Cloud Run service has `--allow-unauthenticated` for public endpoints

---

## 💾 Backup & Maintenance

### Regular Backups

```bash
# Automatic daily backups are enabled in Cloud SQL
# To manually backup:
gcloud sql backups create \
  --instance=contractor-db \
  --description="Manual backup - 2026-09-01"

# List backups
gcloud sql backups list --instance=contractor-db
```

### Update Backend Code

```bash
# Make changes locally
git add .
git commit -m "Update API"

# Build new Docker image
docker build -t gcr.io/PROJECT_ID/contractor-api:latest .

# Push to registry
docker push gcr.io/PROJECT_ID/contractor-api:latest

# Deploy new version
gcloud run deploy contractor-api \
  --image=gcr.io/PROJECT_ID/contractor-api:latest \
  --region=us-central1
```

---

## 🚨 Troubleshooting

### Issue: gcloud is not installed
**Solution:**
```bash
# Windows Package Manager
winget install Google.CloudSDK

# Or download from https://cloud.google.com/sdk/docs/install
```

### Issue: Docker not running
**Solution:**
- Open Docker Desktop
- Wait for it to fully start (check system tray)
- Retry deployment script

### Issue: "No Google Cloud project configured"
**Solution:**
```bash
gcloud init
# Follow prompts to select/create project
```

### Issue: Cloud SQL connection timeout
**Solution:**
- Check database IP address: `gcloud sql instances describe contractor-db`
- Verify Cloud Run can access database
- Check firewall rules in Google Cloud Console

### Issue: "Build failed" in EAS Build
**Solution:**
- Check build logs in EAS dashboard
- Verify `.env.production` is correct
- Ensure all dependencies are in `package.json`
- Re-run: `eas build --platform android --profile production --clear-cache`

### Issue: App doesn't connect to API
**Solution:**
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check API is accessible: `curl HTTPS_API_URL/api/v1`
- Check logs: `gcloud run logs read contractor-api`
- Verify CORS settings in backend

---

## 📞 Support & Resources

- **Google Cloud Documentation:** https://cloud.google.com/docs
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Cloud SQL:** https://cloud.google.com/sql/docs
- **Cloud Run:** https://cloud.google.com/run/docs

---

## ✅ Final Checklist

- [ ] gcloud CLI authenticated and project configured
- [ ] All required APIs enabled
- [ ] Backend deployment script completed successfully
- [ ] API URL obtained and saved
- [ ] Frontend updated with API URL
- [ ] EAS CLI authenticated
- [ ] Google Play credentials configured
- [ ] Android app built and submitted to Play Store
- [ ] Backend API responding correctly
- [ ] Authentication working in Android app
- [ ] All key features tested in Android app
- [ ] Production release submitted for review in Play Console

---

**Status:** ✅ Ready for Production  
**Last Updated:** September 1, 2026  
**Next Steps:** Monitor deployment and await Play Store review approval

