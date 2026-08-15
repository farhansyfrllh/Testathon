# Design — Talent Bridge

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│          React (Vite) + TailwindCSS + Zustand               │
│                     Port: 5173                               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST (JWT Bearer)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ASP.NET Core Web API (.NET 8)                   │
│                     Port: 5001                               │
│  Auth | CV | Courses | Quiz | Jobs | UserProgress           │
└──────────────┬──────────────────────────┬───────────────────┘
               │ EF Core                  │ HttpClient
               ▼                          ▼
┌──────────────────────┐    ┌────────────────────────────────┐
│   SQL Server DB      │    │     Flask AI Service           │
│   (MSSQL)            │    │     Port: 5000                 │
│                      │    │  /ocr-and-match                │
│  Users               │    │  /recommend-courses            │
│  CVs                 │    │                                │
│  TalentSkills        │    │  pytesseract / PyMuPDF         │
│  Courses             │    │  sentence-transformers         │
│  Modules             │    │  (all-MiniLM-L6-v2)           │
│  Questions           │    │  fallback rule-based           │
│  QuestionOptions     │    └────────────────────────────────┘
│  UserProgress        │
│  Jobs                │
└──────────────────────┘
```

---

## Struktur Folder Proyek

```
D:\Downloads\Hackathon\
├── talent-bridge-api/           # ASP.NET Core Web API
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── CvController.cs
│   │   ├── CoursesController.cs
│   │   ├── QuizController.cs
│   │   └── JobsController.cs
│   ├── Models/                  # EF Core entities
│   │   ├── User.cs
│   │   ├── Cv.cs
│   │   ├── TalentSkill.cs
│   │   ├── Course.cs
│   │   ├── Module.cs
│   │   ├── Question.cs
│   │   ├── QuestionOption.cs
│   │   ├── UserProgress.cs
│   │   └── Job.cs
│   ├── DTOs/                    # Request/Response DTOs
│   ├── Services/                # Business logic
│   │   ├── AuthService.cs
│   │   ├── CvService.cs
│   │   ├── CourseService.cs
│   │   ├── QuizService.cs
│   │   └── JobService.cs
│   ├── Repositories/            # Data access
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── SeedData.cs
│   ├── Migrations/
│   ├── appsettings.json
│   └── Program.cs
│
├── talent-ai-service/           # Flask Python Service
│   ├── app.py
│   ├── ocr_service.py
│   ├── matching_service.py
│   ├── skills_config.py         # Predefined skill list
│   ├── requirements.txt
│   └── uploads/                 # Temp upload folder
│
└── talent-bridge-frontend/      # React Vite App
    ├── src/
    │   ├── components/
    │   │   ├── quiz/
    │   │   │   ├── McqCard.tsx
    │   │   │   ├── MultiSelectCard.tsx
    │   │   │   ├── DragDropQuiz.tsx
    │   │   │   └── XpProgressBar.tsx
    │   │   ├── ui/
    │   │   │   ├── PixelButton.tsx
    │   │   │   ├── GradeBadge.tsx
    │   │   │   └── ConfettiReward.tsx
    │   │   └── layout/
    │   │       ├── Navbar.tsx
    │   │       └── Layout.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── CvUploadPage.tsx
    │   │   ├── CoursesPage.tsx
    │   │   ├── QuizPage.tsx
    │   │   └── JobsPage.tsx
    │   ├── stores/
    │   │   ├── authStore.ts      # Zustand: user, token, grade
    │   │   └── quizStore.ts      # Zustand: quiz progress, answers
    │   ├── api/
    │   │   └── client.ts         # Axios instance + interceptors
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css             # TailwindCSS + pixel-art custom styles
    ├── public/
    │   └── assets/               # Pixel-art sprites
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## Data Flow Utama

### Flow 1: Register & Login

```
Frontend → POST /api/auth/register { name, email, password }
         ← 201 { userId, token, grade: "Unranked" }

Frontend → POST /api/auth/login { email, password }
         ← 200 { token, userId, name, grade, role }
```

### Flow 2: Upload CV & Grading

```
Frontend → POST /api/cv/upload (multipart/form-data: file)
         → [ASP.NET] simpan file ke disk
         → [ASP.NET] POST Flask /ocr-and-match (file)
           → [Flask] PyMuPDF/pytesseract ekstrak teks
           → [Flask] sentence-transformers cosine similarity
           ← [Flask] { extracted_skills, overall_match_score }
         → [ASP.NET] simpan ke CVs, TalentSkills, update Grade
         ← 200 { matchScore, grade, skills: [{ name, score }] }
```

### Flow 3: Rekomendasi Course

```
Frontend → GET /api/courses/recommended/{userId}
         → [ASP.NET] ambil TalentSkills user
         → bandingkan dengan Courses.RequiredSkills (JSON)
         ← 200 [{ courseId, title, gapScore, missingSkills }]
```

### Flow 4: Quiz Submit

```
Frontend → POST /api/quiz/{moduleId}/submit
           { answers: [{ questionId, selectedOptionIds[] }] }
         → [ASP.NET] load QuestionOptions (IsCorrect)
         → hitung skor (correct / total * 100)
         → simpan UserProgress
         → update Users.Grade (kumulatif)
         ← 200 { score, grade, xpGained, passed: bool }
```

### Flow 5: Job Matching

```
Frontend → GET /api/jobs/matched/{userId}
         → [ASP.NET] ambil user grade + TalentSkills
         → filter Jobs: Grade >= MinGrade && skill overlap
         ← 200 [{ jobId, title, location, matchScore }]
```

---

## Model Database (EF Core)

### User
```csharp
public class User {
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string Role { get; set; }  // Talent, Admin, Employer
    public string Grade { get; set; } // Unranked, Bronze, Silver, Gold
    public DateTime CreatedAt { get; set; }
    public ICollection<Cv> CVs { get; set; }
    public ICollection<TalentSkill> Skills { get; set; }
    public ICollection<UserProgress> Progress { get; set; }
}
```

### Course & Module
```csharp
public class Course {
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Category { get; set; }
    public string RequiredSkillsJson { get; set; } // JSON array
    public ICollection<Module> Modules { get; set; }
}

public class Module {
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public int OrderIndex { get; set; }
    public string ModuleType { get; set; } // mcq, multi_select, drag_drop
    public ICollection<Question> Questions { get; set; }
}
```

---

## Komponen Frontend

### Quiz Components

**McqCard** — kartu pixel-art untuk MCQ:
- Border pixel-style 4px dengan efek shadow
- State: default / hover / selected (border warna berubah)
- Font "Press Start 2P" untuk opsi jawaban (ukuran kecil)
- Animasi bounce saat diklik

**MultiSelectCard** — power-up style:
- Icon pixel-art yang "menyala" saat selected
- Checkbox tersembunyi, visual custom
- Bisa memilih multiple options

**DragDropQuiz** — diagram data center:
- Komponen draggable: ServerRack, CoolingUnit, Switch, UPS (gambar pixel-art)
- Drop slots: labeled zones dalam diagram
- Visual feedback: slot berubah warna saat drag over
- Menggunakan react-dnd backend HTML5

**XpProgressBar** — bar XP:
- Animasi smooth fill saat XP bertambah
- Label menampilkan total XP dan level

### State Management (Zustand)

```typescript
// authStore.ts
interface AuthState {
  user: { id: string; name: string; email: string; role: string; grade: string } | null;
  token: string | null;
  login: (credentials) => Promise<void>;
  logout: () => void;
  updateGrade: (grade: string) => void;
}

// quizStore.ts
interface QuizState {
  currentModuleId: string | null;
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  xp: number;
  setAnswer: (questionId: string, optionIds: string[]) => void;
  addXp: (amount: number) => void;
  resetQuiz: () => void;
}
```

---

## Konfigurasi & Environment

### appsettings.json (ASP.NET Core)
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

### .env (Flask)
```
FLASK_ENV=development
FLASK_PORT=5000
MODEL_NAME=all-MiniLM-L6-v2
USE_AI_FALLBACK=true
UPLOAD_FOLDER=uploads
```

---

## Grade Calculation Logic

### Dari CV Match Score (ASP.NET Core)
```
score < 40  → "Unranked"
score >= 40 → "Bronze"
score >= 60 → "Silver"
score >= 80 → "Gold"
```

### Grade Hierarchy (untuk job matching)
```
Unranked < Bronze < Silver < Gold
```

### Update Grade dari Quiz (kumulatif)
```
Hitung rata-rata semua UserProgress.Score user
Terapkan aturan grade yang sama
Grade hanya bisa naik (tidak turun karena quiz)
```

---

## Skill Predefined (Flask config)

```python
PREDEFINED_SKILLS = [
    "Python", "Networking", "Cybersecurity",
    "Data Center Operations", "Cloud Computing",
    "AI/ML", "Linux Administration", "Virtualization",
    "Power Systems", "Cooling Systems",
    "SQL Server", "Docker", "Kubernetes",
    "Fiber Optics", "DCIM", "HVAC"
]
```

---

## API Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```
