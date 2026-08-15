# Implementation Plan: Talent Bridge

## Overview

Build platform Talent Bridge secara lengkap: ASP.NET Core backend, Flask AI service, dan React frontend dengan quiz pixel-art. Tiga service dijalankan secara lokal dan terintegrasi penuh.

## Tasks

- [x] 1. Setup ASP.NET Core Web API project
  - Buat project `talent-bridge-api` dengan .NET 8 Web API template
  - Install NuGet packages: Microsoft.EntityFrameworkCore.SqlServer, Microsoft.EntityFrameworkCore.Tools, Microsoft.AspNetCore.Authentication.JwtBearer, BCrypt.Net-Next, Swashbuckle.AspNetCore
  - Buat struktur folder: Controllers/, Models/, DTOs/, Services/, Repositories/, Data/
  - Konfigurasi `appsettings.json` dengan placeholder ConnectionString, JWT config, FlaskService URL
  - Konfigurasi `Program.cs`: EF Core, JWT auth middleware, CORS (allow localhost:5173), Swagger
  - Deliverable: project bisa di-build dan swagger terbuka di https://localhost:5001/swagger

- [x] 2. Setup EF Core Models & Database
  - Depends on: 1
  - Buat semua entity class: User, Cv, TalentSkill, Course, Module, Question, QuestionOption, UserProgress, Job
  - Buat `AppDbContext` dengan DbSet untuk semua entity dan konfigurasi relasi (HasMany, HasForeignKey)
  - Jalankan `dotnet ef migrations add InitialCreate` dan `dotnet ef database update`
  - Deliverable: database TalentBridgeDb terbuat di SQL Server dengan semua tabel

- [x] 3. Setup Flask AI Service project
  - Buat folder `talent-ai-service/`
  - Buat `requirements.txt`: flask, flask-cors, pytesseract, PyMuPDF, sentence-transformers, numpy, Pillow, python-dotenv
  - Buat `app.py` dengan Flask app dasar, CORS enabled, health check endpoint GET `/health`
  - Buat `skills_config.py` dengan PREDEFINED_SKILLS list (Python, Networking, Cybersecurity, Data Center Operations, Cloud Computing, AI/ML, Linux Administration, Virtualization, Power Systems, Cooling Systems, dll)
  - Buat `.env` dengan konfigurasi port 5000 dan model name
  - Deliverable: `python app.py` berjalan di port 5000, GET /health return 200

- [x] 4. Setup React Frontend project
  - Buat project `talent-bridge-frontend` dengan `npm create vite@latest -- --template react-ts`
  - Install dependencies: tailwindcss, @tailwindcss/vite, zustand, axios, react-router-dom, react-dnd, react-dnd-html5-backend, canvas-confetti, @types/canvas-confetti
  - Konfigurasi TailwindCSS dengan custom pixel-art theme (border-radius 0, warna pixel-gold/silver/bronze)
  - Tambahkan Google Font "Press Start 2P" di index.html
  - Buat `src/api/client.ts`: Axios instance dengan baseURL http://localhost:5001 dan JWT Bearer interceptor
  - Buat struktur folder: components/quiz/, components/ui/, components/layout/, pages/, stores/, types/
  - Buat `src/types/index.ts` dengan semua TypeScript interfaces (User, Course, Module, Question, Job, QuizAnswer)
  - Deliverable: `npm run dev` berjalan di port 5173

- [x] 5. Implementasi Auth Register & Login (ASP.NET Core)
  - Depends on: 2
  - Buat `AuthController.cs` dengan POST `/api/auth/register` dan POST `/api/auth/login`
  - Buat DTOs: RegisterRequest, LoginRequest, AuthResponse
  - Buat `AuthService.cs`: hash password BCrypt (salt 12), generate JWT token dengan claims (userId, email, role)
  - Endpoint register: validasi email unik, hash password, simpan user dengan Role="Talent" dan Grade="Unranked", return 201 + token
  - Endpoint login: verifikasi password BCrypt, return JWT token + user info (id, name, email, grade, role)
  - Deliverable: POST /api/auth/register dan /api/auth/login berfungsi, dapat ditest via Swagger

- [x] 6. Implementasi CV Upload & Orchestration ke Flask (ASP.NET Core)
  - Depends on: 2, 3
  - Buat `CvController.cs` dengan POST `/api/cv/upload` (require auth) dan GET `/api/cv/{userId}/result`
  - Buat `CvService.cs`: validasi file tipe MIME (PDF/PNG/JPG) dan max 10MB, simpan file ke disk dengan nama GUID
  - Forward file ke Flask via HttpClient multipart POST ke `http://localhost:5000/ocr-and-match`
  - Parse response Flask: `extracted_skills` dan `overall_match_score`
  - Simpan ke tabel CVs (FilePath, ExtractedText, MatchScore) dan TalentSkills (SkillName, ProficiencyScore per skill)
  - Update Users.Grade berdasarkan score: < 40 = Unranked, 40-59 = Bronze, 60-79 = Silver, >= 80 = Gold
  - Deliverable: upload CV end-to-end berfungsi, grade user terupdate di DB

- [x] 7. Implementasi Courses & Recommendation API (ASP.NET Core)
  - Depends on: 2
  - Buat `CoursesController.cs` dengan: GET `/api/courses`, GET `/api/courses/{id}`, GET `/api/courses/{id}/modules`, GET `/api/courses/recommended/{userId}`
  - Buat `CourseService.cs`: load TalentSkills user, parse RequiredSkillsJson setiap course, hitung gap score (required skills yang belum dimiliki user)
  - Endpoint recommended: urutkan course dari gap score terbesar (paling dibutuhkan dahulu)
  - Deliverable: semua endpoint courses berfungsi dengan data rekomendasi yang akurat

- [x] 8. Implementasi Quiz Submit API (ASP.NET Core)
  - Depends on: 2
  - Buat `QuizController.cs` dengan POST `/api/quiz/{moduleId}/submit`
  - DTO: `QuizSubmitRequest { answers: [{ questionId, selectedOptionIds, dragDropMapping }] }`
  - `QuizService.cs`: load Questions + QuestionOptions dari DB, validasi:
    - MCQ: selectedOptionId harus sama dengan option yang IsCorrect=true
    - Multi-select: semua IsCorrect=true harus dipilih, tidak boleh memilih IsCorrect=false
    - Drag-drop: mapping { slotId: componentId } dicocokkan dengan Position field di QuestionOptions
  - Hitung skor (correct_count / total_questions * 100), simpan ke UserProgress (UserId, CourseId, ModuleId, Score, CompletedAt)
  - Update Users.Grade kumulatif: ambil rata-rata semua UserProgress.Score, terapkan aturan grade (grade hanya naik)
  - Return: `{ score, grade, xpGained, passed: score >= 70 }`
  - Deliverable: submit quiz tersimpan ke DB dan grade user terupdate

- [x] 9. Implementasi Jobs Matching API (ASP.NET Core)
  - Depends on: 2
  - Buat `JobsController.cs` dengan GET `/api/jobs` dan GET `/api/jobs/matched/{userId}`
  - `JobService.cs`: grade hierarchy (Unranked=0, Bronze=1, Silver=2, Gold=3), filter job MinGrade <= userGrade
  - Hitung skill overlap score: intersection(userSkills, jobRequiredSkills) / jobRequiredSkills.length
  - Urutkan matched jobs berdasarkan skill overlap score tertinggi
  - Deliverable: GET /api/jobs/matched/{userId} mengembalikan list job relevan terurut

- [x] 10. Implementasi OCR & Skill Matching (Flask)
  - Depends on: 3
  - Buat `ocr_service.py`: fungsi `extract_text_from_pdf(file_path)` pakai PyMuPDF (fitz), `extract_text_from_image(file_path)` pakai pytesseract
  - Buat `matching_service.py`:
    - Load model sentence-transformers `all-MiniLM-L6-v2` saat startup dalam try/except
    - `match_skills_ai(text)`: encode teks CV dan setiap skill dari PREDEFINED_SKILLS, hitung cosine similarity, threshold 0.3
    - `match_skills_rule_based(text)`: keyword matching case-insensitive (cek apakah skill name ada dalam teks)
    - Set global `AI_AVAILABLE = True/False` berdasarkan hasil load model
  - Endpoint POST `/ocr-and-match`: terima file multipart, simpan sementara, ekstrak teks, jalankan matching, hapus file temp
  - Response: `{ extracted_skills: [{name: str, confidence: float}], overall_match_score: float, method: "ai"|"rule_based" }`
  - Deliverable: /ocr-and-match berfungsi dengan file PDF dan gambar nyata

- [x] 11. Implementasi Course Recommendation (Flask)
  - Depends on: 3
  - Endpoint POST `/recommend-courses`: terima `{ talent_skills: [str], courses: [{id, title, required_skills: [str]}] }`
  - Hitung cosine similarity antara gabungan talent skills vs required skills setiap course menggunakan sentence-transformers
  - Fallback: hitung Jaccard similarity jika AI tidak tersedia
  - Return list course terurut: `[{ id, title, similarity_score, missing_skills: [str] }]`
  - Deliverable: /recommend-courses mengembalikan ranking course yang relevan

- [x] 12. Seed Data Database (ASP.NET Core)
  - Depends on: 2
  - Buat `Data/SeedData.cs` dengan method `InitializeAsync(AppDbContext context)`
  - Seed Course 1 "Data Center Fundamentals" (Category: "Infrastructure"):
    - RequiredSkills: ["Data Center Operations", "Power Systems", "Cooling Systems", "Networking"]
    - Module 1 (mcq, order 1): 3 soal tentang komponen data center
    - Module 2 (multi_select, order 2): 3 soal tentang standar kelistrikan/cooling
    - Module 3 (drag_drop, order 3): 3 soal mapping komponen ke zona (Power/Network/Compute/Cooling)
  - Seed Course 2 "Cybersecurity Essentials" (Category: "Security"):
    - RequiredSkills: ["Cybersecurity", "Networking", "Linux Administration"]
    - Module 1 (mcq, order 1): 3 soal tentang konsep keamanan
    - Module 2 (multi_select, order 2): 3 soal tentang threat types
    - Module 3 (drag_drop, order 3): 3 soal mapping security tools
  - Seed Jobs (5 total): 3 di Batam (MinGrade: Unranked, Bronze, Silver), 2 di Singapore (MinGrade: Silver, Gold)
  - Panggil InitializeAsync di Program.cs pada startup
  - Deliverable: seed data lengkap tersedia setelah `dotnet run`

- [x] 13. Implementasi Auth Pages & Store (Frontend)
  - Depends on: 4, 5
  - Buat `authStore.ts` (Zustand): state { user, token }, actions login/logout/updateGrade, persist ke localStorage menggunakan zustand/middleware persist
  - Buat `LoginPage.tsx`: form email+password dengan validasi, submit ke POST /api/auth/login, simpan token ke store, redirect ke /dashboard
  - Buat `RegisterPage.tsx`: form name/email/password, submit ke POST /api/auth/register, auto-login setelah sukses
  - Buat `ProtectedRoute.tsx`: wrapper komponen, redirect ke /login jika token tidak ada
  - Buat `Navbar.tsx`: logo "TALENT BRIDGE" (pixel font), link navigasi (Dashboard, Courses, Jobs), grade badge berwarna, tombol logout
  - Buat `Layout.tsx`: wrapper dengan Navbar + main content area
  - Setup routing di App.tsx: /, /login, /register, /dashboard, /cv-upload, /courses, /courses/:id/quiz/:moduleId, /jobs
  - Deliverable: register, login, logout berfungsi dengan routing dan protected routes

- [x] 14. Implementasi Dashboard & CV Upload Page (Frontend)
  - Depends on: 4, 6, 13
  - Buat `GradeBadge.tsx`: tampilkan grade dengan warna (Unranked=gray, Bronze=#CD7F32, Silver=#C0C0C0, Gold=#FFD700), style pixel-art
  - Buat `DashboardPage.tsx`: header dengan nama user dan grade badge, skill cards (daftar skill dengan progress bar), course progress list, tombol "Upload CV" dan "View Jobs"
  - Buat `CvUploadPage.tsx`: drop zone dengan border dashed pixel-style, file picker fallback, tampilkan nama file dipilih, tombol upload, loading state "Processing CV...", result section (grade baru, skill list, match score bar)
  - Setelah upload berhasil: update grade di authStore, tampilkan animasi grade naik jika berubah
  - Deliverable: dashboard informatif dan CV upload berfungsi end-to-end

- [x] 15. Implementasi Courses Page & Quiz Page Structure (Frontend)
  - Depends on: 4, 7, 13
  - Buat `CoursesPage.tsx`: grid 2-3 kolom course cards, setiap card: judul, kategori, required skills chips, badge "Recommended" jika relevan, tombol "Start Course"
  - Buat `quizStore.ts` (Zustand): state { currentModuleId, answers: Record<string,string[]>, dragDropAnswers: Record<string,string>, xp, questionCount, correctCount }, actions setAnswer/setDragDrop/addXp/resetQuiz
  - Buat `XpProgressBar.tsx`: progress bar animasi dengan CSS transition, label "XP: {current}/{max}", warna pixel-gold
  - Buat `QuizPage.tsx`: fetch module data dari GET /api/courses/{id}/modules, tampilkan XpProgressBar di atas, render komponen quiz sesuai tipe modul (mcq/multi_select/drag_drop), tombol Next Question dan Submit
  - Deliverable: halaman course dan struktur quiz page berfungsi dengan routing yang benar

- [x] 16. Implementasi MCQ & Multi-Select Quiz Components (Frontend)
  - Depends on: 4, 15
  - Buat `McqCard.tsx`: kartu pixel-art (border 4px solid, box-shadow 4px 4px 0 offset), 4 state visual:
    - default: border abu-abu, bg gelap
    - hover: border putih, scale 1.02, cursor pointer
    - selected: border pixel-gold (#FFD700), bg sedikit terang
    - Teks opsi dengan font biasa (bukan pixel) agar readable
    - Klik trigger: callback onSelect(optionId), simpan ke quizStore
  - Buat `MultiSelectCard.tsx`: layout mirip McqCard tapi bisa multi-select, icon "⚡" di sudut kanan atas yang menyala (glow CSS: drop-shadow) saat selected, checkbox tersembunyi, klik toggle selection
  - Integrasi di QuizPage: map questions, render McqCard untuk `mcq`, MultiSelectCard untuk `multi_select`
  - Deliverable: MCQ dan multi-select berfungsi dengan visual feedback pixel-art yang jelas

- [x] 17. Implementasi Drag & Drop Quiz Component (Frontend)
  - Depends on: 4, 15
  - Setup DnDProvider di App.tsx dengan HTML5Backend dari react-dnd-html5-backend
  - Buat `DragDropQuiz.tsx` dengan react-dnd:
    - Komponen Draggable (useDrag): ServerRack 🖥️, CoolingUnit ❄️, NetworkSwitch 🔀, UPS 🔋 (gunakan emoji + label pixel-art dalam kotak pixel-style)
    - Drop Slots (useDrop): 4 zona ("Power Zone", "Network Zone", "Compute Zone", "Cooling Zone") ditampilkan dalam grid 2x2
    - Visual feedback: slot background berubah saat `isOver` (isDraggingOver state)
    - State lokal: mapping { slotId: { componentId, label } }, tampilkan komponen yang sudah di-drop di dalam slot
    - Callback onChange(mapping) untuk update quizStore.dragDropAnswers
  - Deliverable: drag & drop berfungsi dengan visual interaktif yang jelas

- [x] 18. Implementasi Quiz Submit & Reward Screen (Frontend)
  - Depends on: 4, 8, 16, 17
  - Buat `ConfettiReward.tsx`: trigger canvas-confetti saat prop `show=true`, animasi 3 detik dengan warna pixel-gold/silver/bronze
  - Di QuizPage, tombol "Submit Quiz":
    - Kumpulkan semua answers dari quizStore (mcq/multi_select: selectedOptionIds, drag_drop: dragDropMapping)
    - POST ke `/api/quiz/{moduleId}/submit`
    - Loading state "Grading..."
    - Result screen: skor besar di tengah, grade badge (baru jika naik), "XP +{xpGained}" animasi, ConfettiReward jika passed=true
    - Tombol "Next Module" (jika ada) atau "Back to Courses"
  - Update authStore.user.grade jika grade berubah
  - Deliverable: submit quiz menampilkan score screen dengan confetti dan grade update

- [x] 19. Implementasi Jobs Page (Frontend)
  - Depends on: 4, 9, 13
  - Buat `JobsPage.tsx`: fetch dari GET /api/jobs/matched/{userId}, tampilkan loading skeleton
  - Filter tabs: "All Jobs" / "Batam 🇮🇩" / "Singapore 🇸🇬"
  - Job card: judul (font pixel kecil), badge lokasi berwarna, required skills sebagai chips, min grade badge, badge "Best Match" untuk top 2 job
  - Empty state: pesan "Upload CV dulu untuk melihat matched jobs" jika belum ada grade
  - Deliverable: jobs page menampilkan matched jobs dengan filter lokasi

- [x] 20. Pixel-Art Global Styling & Final Polish (Frontend)
  - Depends on: 13, 14, 15, 16, 17, 18, 19
  - Konfigurasi tailwind.config.js dengan warna kustom: pixel-gold, pixel-silver, pixel-bronze, pixel-bg (#1a1a2e), pixel-card (#16213e)
  - Buat CSS classes di index.css: `.pixel-border` (4px solid border + 4px offset shadow), `.pixel-btn` (hover: translate(-2px,-2px) shadow bergeser), `.pixel-card` (rounded-none, pixel-border)
  - Pastikan Navbar responsive, hamburger menu di mobile
  - Fix font sizing: "Press Start 2P" hanya untuk heading/title, body text gunakan font system
  - Pastikan semua halaman memiliki loading state dan error state yang user-friendly
  - Test responsive di 375px (mobile) dan 1280px (desktop)
  - Deliverable: UI konsisten dengan tema pixel-art di semua halaman

- [x] 21. Integrasi End-to-End & Bug Fix
  - Depends on: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  - Test flow lengkap: Register → Login → Upload CV → lihat grade di Dashboard → buka Courses → kerjakan Module MCQ → Module Multi-select → Module Drag-drop → lihat hasil quiz → buka Jobs → lihat matched jobs
  - Fix semua CORS error yang ditemukan
  - Pastikan error handling: 401 redirect ke login, 500 tampilkan pesan "Terjadi kesalahan, coba lagi"
  - Test fallback Flask: simulasikan model AI gagal, pastikan rule-based tetap berjalan
  - Pastikan JWT expired (8 jam) redirect ke login
  - Deliverable: flow demo lengkap berjalan tanpa error kritis

- [x] 22. README & Demo Preparation
  - Depends on: 21
  - Buat `README.md` di root folder dengan instruksi lengkap:
    - Prerequisites: .NET 8, Python 3.10+, SQL Server, Node.js 18+, Tesseract OCR
    - Setup SQL Server: connection string, create database
    - Jalankan service 1: `cd talent-bridge-api && dotnet run`
    - Jalankan service 2: `cd talent-ai-service && pip install -r requirements.txt && python app.py`
    - Jalankan service 3: `cd talent-bridge-frontend && npm install && npm run dev`
  - Buat `DEMO_FLOW.md`: step-by-step demo (5 menit), screenshot placeholder, talking points per step
  - Buat sample CV PDF sederhana (`sample_cv.pdf`) berisi nama dan skill keywords untuk demo OCR
  - Verifikasi seed data: 2 courses, 6 modules, 18+ questions, 5 jobs
  - Deliverable: semua dokumentasi siap, demo dapat dijalankan dalam < 5 menit setup

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "3", "4"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["5", "7", "8", "9", "10", "11", "12"] },
    { "wave": 4, "tasks": ["6", "13"] },
    { "wave": 5, "tasks": ["14", "15"] },
    { "wave": 6, "tasks": ["16", "17", "19"] },
    { "wave": 7, "tasks": ["18", "20"] },
    { "wave": 8, "tasks": ["21"] },
    { "wave": 9, "tasks": ["22"] }
  ]
}
```

## Notes

- Prioritas utama untuk demo: task 1–12 (backend + Flask) harus selesai sebelum integrasi frontend
- Jika Flask AI service lambat load model, gunakan flag `USE_AI_FALLBACK=true` di `.env` untuk langsung pakai rule-based
- Seed data (task 12) harus dijalankan sebelum test frontend
- Untuk drag & drop: gunakan emoji sebagai placeholder visual, bukan gambar eksternal
- Database: jika SQL Server tidak tersedia, bisa pakai SQL Server Express (gratis) atau LocalDB untuk development
