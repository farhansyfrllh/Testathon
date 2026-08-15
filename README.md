# 🎮 Talent Bridge

> Platform talent matching berbasis AI untuk ekosistem data center **Batam–Singapura**.
> Penilaian CV otomatis, micro-credential quiz gamifikasi, dan job matching berbasis grade.

---

## 🏗️ Arsitektur

```
Frontend (React/Vite)  ─────►  ASP.NET Core API  ─────►  Flask AI Service
    Port 5173                      Port 5001                  Port 5000
                                       │
                                       ▼
                                  SQL Server DB
                                 (TalentBridgeDb)
```

---

## ✅ Prerequisites

Install semua tools berikut sebelum menjalankan project:

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Python | 3.10+ | https://www.python.org/downloads/ |
| SQL Server | 2019+ / Express / LocalDB | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |
| Node.js | 18+ | https://nodejs.org/ |
| Tesseract OCR | 5.x | https://github.com/UB-Mannheim/tesseract/wiki |

> **Tip Windows**: Install Tesseract via installer dari link di atas. Pastikan path `C:\Program Files\Tesseract-OCR` ada di System PATH.

### Verifikasi instalasi

```powershell
dotnet --version       # 8.x.x
python --version       # 3.10+
node --version         # v18+
npm --version          # 9+
tesseract --version    # 5.x
```

---

## 🗄️ Setup SQL Server

### 1. Buat database

Buka SQL Server Management Studio (SSMS) atau `sqlcmd`, lalu jalankan:

```sql
CREATE DATABASE TalentBridgeDb;
```

### 2. Konfigurasi connection string

Edit `talent-bridge-api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TalentBridgeDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> **Catatan**: Jika menggunakan SQL Server Express, ubah `Server=localhost` menjadi `Server=localhost\SQLEXPRESS`.
> Jika menggunakan SQL Server Auth (bukan Windows Auth), gunakan:
> `"Server=localhost;Database=TalentBridgeDb;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"`

### 3. Jalankan migrations

```powershell
cd talent-bridge-api
dotnet ef database update
```

Migrations sudah ada di folder `Migrations/` — database dan semua tabel akan dibuat otomatis.
**Seed data** (2 courses, 18 questions, 5 jobs) akan diinsert otomatis saat `dotnet run` pertama kali.

---

## 🚀 Menjalankan Services

Buka **3 terminal terpisah** dan jalankan masing-masing service:

### Service 1 — ASP.NET Core API (Port 5001)

```powershell
cd talent-bridge-api
dotnet run
```

Verifikasi: buka http://localhost:5001/swagger → Swagger UI tampil ✅

### Service 2 — Flask AI Service (Port 5000)

```powershell
cd talent-ai-service
pip install -r requirements.txt
python app.py
```

Verifikasi: `curl http://localhost:5000/health` → `{"status":"ok","ai_available":false,"mode":"rule_based"}` ✅

> **Catatan**: `USE_AI_FALLBACK=true` diset di `.env` untuk demo. Ini menonaktifkan sentence-transformers
> dan menggunakan rule-based keyword matching — lebih cepat dan tidak butuh download model (±400MB).
> Untuk AI mode, set `USE_AI_FALLBACK=false` dan install `sentence-transformers`.

### Service 3 — React Frontend (Port 5173)

```powershell
cd talent-bridge-frontend
npm install
npm run dev
```

Verifikasi: buka http://localhost:5173 → halaman login pixel-art tampil ✅

---

## 🔑 Konfigurasi Environment

### `talent-bridge-api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TalentBridgeDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyHere-MinimumLength32Chars",
    "Issuer": "TalentBridgeApi",
    "Audience": "TalentBridgeFrontend",
    "ExpiryHours": 8
  },
  "FlaskService": {
    "BaseUrl": "http://localhost:5000"
  },
  "FileStorage": {
    "UploadPath": "uploads/cv"
  }
}
```

### `talent-ai-service/.env`

```env
FLASK_ENV=development
FLASK_PORT=5000
MODEL_NAME=all-MiniLM-L6-v2
USE_AI_FALLBACK=true
UPLOAD_FOLDER=uploads
```

---

## 📁 Struktur Project

```
D:\Downloads\Hackathon\
├── README.md                        ← dokumen ini
├── DEMO_FLOW.md                     ← panduan demo 5 menit
├── INTEGRATION_NOTES.md             ← catatan teknis integrasi
├── sample_cv.pdf                    ← CV demo untuk OCR testing
├── create_sample_cv.py              ← script regenerasi sample CV
│
├── talent-bridge-api/               ← ASP.NET Core Web API (.NET 8)
│   ├── Controllers/                 ← Auth, CV, Courses, Quiz, Jobs
│   ├── Data/                        ← AppDbContext, SeedData
│   ├── Models/                      ← EF Core entities
│   ├── Services/                    ← Business logic
│   ├── Migrations/                  ← EF Core migrations
│   └── appsettings.json
│
├── talent-ai-service/               ← Flask Python Service
│   ├── app.py                       ← Flask app + routing
│   ├── ocr_service.py               ← PyMuPDF + pytesseract
│   ├── matching_service.py          ← AI/rule-based skill matching
│   ├── skills_config.py             ← predefined skills list
│   └── requirements.txt
│
└── talent-bridge-frontend/          ← React + Vite + TypeScript
    ├── src/
    │   ├── components/quiz/         ← McqCard, MultiSelectCard, DragDropQuiz
    │   ├── components/ui/           ← GradeBadge, ConfettiReward
    │   ├── pages/                   ← Login, Register, Dashboard, Quiz, Jobs
    │   ├── stores/                  ← Zustand: authStore, quizStore
    │   └── api/client.ts            ← Axios instance + JWT interceptors
    └── package.json
```

---

## 🎮 Fitur Demo

| Fitur | Endpoint | Deskripsi |
|-------|----------|-----------|
| Register/Login | `POST /api/auth/register` | JWT auth, BCrypt password |
| Upload CV | `POST /api/cv/upload` | OCR PDF → skill matching → grade |
| Courses | `GET /api/courses` | 2 courses, 6 modules |
| Quiz | `POST /api/quiz/{moduleId}/submit` | MCQ, Multi-select, Drag & Drop |
| Jobs | `GET /api/jobs/matched/{userId}` | Filter by grade + skills |

---

## 🏅 Grade System

| Grade | Skor | Warna |
|-------|------|-------|
| Unranked | < 40 | ⬜ Abu-abu |
| Bronze | 40–59 | 🟫 #CD7F32 |
| Silver | 60–79 | ⬛ #C0C0C0 |
| Gold | ≥ 80 | 🟡 #FFD700 |

Grade diperoleh dari:
1. **CV Upload**: overall match score dari Flask AI service
2. **Quiz**: rata-rata kumulatif semua UserProgress.Score (grade hanya naik)

---

## 📦 Seed Data

Data berikut sudah ada setelah `dotnet run` pertama kali:

**Courses (2)**:
- 📦 Data Center Fundamentals (Infrastructure)
- 🔐 Cybersecurity Essentials (Security)

**Modules (6)**: 3 per course — MCQ, Multi-select, Drag & Drop

**Questions (18)**: 3 per module

**Jobs (5)**:

| Job | Perusahaan | Lokasi | Min Grade |
|-----|-----------|--------|-----------|
| Data Center Technician | PT Citadel DC Batam | Batam 🇮🇩 | Unranked |
| Network Engineer | PT Equinix Batam | Batam 🇮🇩 | Bronze |
| Infrastructure Lead | PT NTT Batam | Batam 🇮🇩 | Silver |
| Data Center Specialist | ST Telemedia | Singapore 🇸🇬 | Silver |
| Senior Cloud Architect | Keppel DC | Singapore 🇸🇬 | Gold |

---

## 🐛 Troubleshooting

### Port sudah dipakai
```powershell
netstat -ano | findstr :5001
taskkill /PID <pid> /F
```

### Database connection gagal
- Pastikan SQL Server service berjalan: `services.msc` → SQL Server → Start
- Cek nama instance: coba `Server=localhost\SQLEXPRESS` atau `Server=.\SQLEXPRESS`
- Untuk LocalDB: `Server=(localdb)\mssqllocaldb`

### Flask gagal start
- Pastikan Python 3.10+: `python --version`
- Jika `pip install` error pada `pytesseract`: Tesseract OCR harus terinstall dulu
- Untuk skip AI model: pastikan `USE_AI_FALLBACK=true` di `.env`

### Frontend CORS error
- Pastikan ASP.NET Core sudah running di port 5001
- Cek bahwa `baseURL` di `src/api/client.ts` adalah `http://localhost:5001`

### Drag & Drop tidak bekerja
- Pastikan menggunakan browser modern (Chrome/Edge/Firefox)
- React StrictMode sudah dinonaktifkan di `main.tsx` untuk kompatibilitas react-dnd

---

## 🔄 Reset Data

Untuk reset database dan seed ulang:

```powershell
# Hapus database
sqlcmd -S localhost -Q "DROP DATABASE TalentBridgeDb"

# Buat ulang dan migrate
cd talent-bridge-api
dotnet ef database update

# Seed data akan dibuat otomatis saat dotnet run
dotnet run
```

---

## 📄 Lisensi

Dibuat untuk keperluan Hackathon. All rights reserved.
