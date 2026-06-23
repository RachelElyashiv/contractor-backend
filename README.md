# 🏗️ Contractor Management API

Backend מלא לאפליקציית ניהול קבלנים.  
בנוי עם **NestJS + TypeORM + PostgreSQL**

---

## Stack

| טכנולוגיה | שימוש |
|---|---|
| NestJS | Framework |
| TypeORM | ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| Multer | העלאת תמונות |
| bcrypt | הצפנת סיסמאות |

---

## הרצה מהירה

### 1. התקן PostgreSQL

```bash
# Mac
brew install postgresql && brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql && sudo service postgresql start

# Windows – הורד מ: https://www.postgresql.org/download/
```

### 2. צור Database

```bash
psql -U postgres
CREATE DATABASE contractor_db;
\q
```

### 3. הגדר משתני סביבה

```bash
cp .env.example .env
# ערוך את .env עם הפרטים שלך
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=contractor_db
JWT_SECRET=choose_a_strong_secret_key
```

### 4. הרץ

```bash
npm install
npm run start:dev
```

שרת יעלה על: **http://localhost:3000/api/v1**

---

## API Endpoints

### 🔐 Auth
```
POST /api/v1/auth/register    # הרשמה
POST /api/v1/auth/login       # התחברות
```

### 👤 User
```
GET    /api/v1/users/me       # פרטי המשתמש הנוכחי
PATCH  /api/v1/users/me       # עדכון פרופיל
```

### 🏗️ Projects
```
GET    /api/v1/projects                    # כל הפרויקטים
GET    /api/v1/projects/dashboard          # סטטיסטיקות דשבורד
GET    /api/v1/projects/:id                # פרויקט ספציפי
POST   /api/v1/projects                    # פרויקט חדש
PATCH  /api/v1/projects/:id               # עדכון
DELETE /api/v1/projects/:id               # מחיקה

GET    /api/v1/projects/:id/tasks         # משימות פרויקט
POST   /api/v1/projects/:id/tasks         # משימה חדשה
PATCH  /api/v1/projects/tasks/:taskId     # עדכון משימה
DELETE /api/v1/projects/tasks/:taskId     # מחיקת משימה
```

### 👷 Workers
```
GET    /api/v1/workers                      # כל העובדים
GET    /api/v1/workers/attendance/today     # נוכחות היום
GET    /api/v1/workers/attendance/monthly   # דוח חודשי
POST   /api/v1/workers                      # עובד חדש
PATCH  /api/v1/workers/:id                  # עדכון
DELETE /api/v1/workers/:id                  # הסרה
POST   /api/v1/workers/:id/attendance       # רישום נוכחות
```

### 📦 Materials
```
GET    /api/v1/materials               # כל החומרים
GET    /api/v1/materials/low-stock     # חומרים במלאי נמוך
POST   /api/v1/materials               # חומר חדש
PATCH  /api/v1/materials/:id           # עדכון
DELETE /api/v1/materials/:id           # מחיקה
POST   /api/v1/materials/:id/adjust    # עדכון מלאי { delta: 10 }
```

### 🧾 Invoices
```
GET    /api/v1/invoices               # כל החשבוניות
GET    /api/v1/invoices/summary       # סיכום כספי
POST   /api/v1/invoices               # חשבונית חדשה
PATCH  /api/v1/invoices/:id           # עדכון
POST   /api/v1/invoices/:id/mark-paid # סימון כשולם
DELETE /api/v1/invoices/:id           # מחיקה
```

### 💸 Expenses
```
GET    /api/v1/expenses               # כל ההוצאות (?projectId=xxx)
GET    /api/v1/expenses/summary       # סיכום חודשי
POST   /api/v1/expenses               # הוצאה חדשה
PATCH  /api/v1/expenses/:id           # עדכון
DELETE /api/v1/expenses/:id           # מחיקה
```

### 📸 Photos
```
GET    /api/v1/photos                 # כל התמונות (?projectId=xxx)
POST   /api/v1/photos/upload          # העלאת תמונות (multipart/form-data, field: "files")
DELETE /api/v1/photos/:id             # מחיקת תמונה
```

---

## דוגמאות שימוש

### הרשמה
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contractor@example.com",
    "password": "123456",
    "fullName": "יעקב לוי",
    "companyName": "בניית על בע\"מ",
    "phone": "050-1234567"
  }'
```

### יצירת פרויקט
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "בנייה רחוב הרצל 12",
    "clientName": "משפחת כהן",
    "clientPhone": "052-9876543",
    "address": "הרצל 12",
    "city": "תל אביב",
    "budget": 380000,
    "startDate": "2025-03-15",
    "endDate": "2025-08-30"
  }'
```

### העלאת תמונה
```bash
curl -X POST http://localhost:3000/api/v1/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/photo.jpg" \
  -F "projectId=PROJECT_UUID" \
  -F "caption=קומה 2 לאחר יציקה"
```

### רישום נוכחות
```bash
curl -X POST http://localhost:3000/api/v1/workers/WORKER_ID/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-05-25",
    "checkIn": "07:30",
    "checkOut": "16:00",
    "hoursWorked": 8.5,
    "status": "present",
    "projectId": "PROJECT_UUID"
  }'
```

---

## חיבור ל-React Native

```javascript
// services/api.js
const BASE_URL = 'http://localhost:3000/api/v1';

export const api = {
  login: (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  getProjects: (token) =>
    fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

  uploadPhoto: (token, projectId, photoUri) => {
    const formData = new FormData();
    formData.append('files', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' });
    formData.append('projectId', projectId);
    return fetch(`${BASE_URL}/photos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(r => r.json());
  },
};
```

---

## מבנה קבצים

```
src/
├── auth/           # JWT, login, register
├── users/          # פרופיל משתמש
├── projects/       # פרויקטים + משימות
├── workers/        # עובדים + נוכחות
├── materials/      # חומרים + מלאי
├── invoices/       # חשבוניות + פריטים
├── expenses/       # הוצאות
├── photos/         # תמונות שטח
├── app.module.ts   # Root module
└── main.ts         # Entry point
```

---

## Production

לפרודקשן מומלץ:
- **Railway** או **Render** לאירוח (חינמי לתחילה)
- **Supabase** לפוסטגרס מנוהל
- **Cloudinary** לתמונות במקום Multer מקומי

```bash
npm run build
npm start
```
