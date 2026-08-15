# Requirements — Talent Bridge

## Pendahuluan

Talent Bridge adalah platform talent matching berbasis AI untuk ekosistem data center Batam–Singapura. Platform ini membantu talent lokal Batam mendapatkan pekerjaan di industri data center melalui penilaian CV berbasis AI, micro-credential lewat quiz gamifikasi, dan job matching berdasarkan grade.

---

## Requirements Fungsional

### RF-01: Autentikasi & Manajemen Pengguna

- **RF-01.1**: Sistem harus memungkinkan talent untuk registrasi dengan nama, email, dan password
- **RF-01.2**: Sistem harus memvalidasi email unik saat registrasi
- **RF-01.3**: Sistem harus melakukan hashing password menggunakan BCrypt sebelum disimpan
- **RF-01.4**: Sistem harus mengembalikan JWT token saat login berhasil
- **RF-01.5**: Sistem harus mendukung tiga role pengguna: Talent, Admin, Employer
- **RF-01.6**: Sistem harus memproteksi endpoint dengan JWT authentication middleware
- **RF-01.7**: Grade awal talent adalah "Unranked" dan dapat berubah menjadi Bronze, Silver, atau Gold

### RF-02: Upload & Review CV berbasis AI

- **RF-02.1**: Talent harus dapat mengupload CV dalam format PDF atau gambar (PNG, JPG)
- **RF-02.2**: Backend harus menyimpan file CV ke folder lokal dan mencatat path-nya
- **RF-02.3**: Backend harus meneruskan file ke Flask AI service melalui HTTP POST
- **RF-02.4**: Flask service harus mengekstrak teks dari CV menggunakan pytesseract (gambar) atau PyMuPDF (PDF)
- **RF-02.5**: Flask service harus menghitung cosine similarity antara teks CV dengan skill predefined menggunakan model `all-MiniLM-L6-v2`
- **RF-02.6**: Flask service harus memiliki fallback rule-based scoring (keyword matching) jika model AI gagal load
- **RF-02.7**: Flask service harus mengembalikan `extracted_skills` (list skill dengan confidence score) dan `overall_match_score` (0–100)
- **RF-02.8**: Backend harus menyimpan hasil ke tabel CVs, TalentSkills, dan memperbarui Users.Grade
- **RF-02.9**: Grade ditentukan berdasarkan match score: < 40 = Unranked, 40–59 = Bronze, 60–79 = Silver, ≥ 80 = Gold
- **RF-02.10**: Talent harus dapat melihat hasil analisis CV termasuk daftar skill dan grade

### RF-03: Rekomendasi Course

- **RF-03.1**: Sistem harus membandingkan TalentSkills dengan RequiredSkills setiap course
- **RF-03.2**: Sistem harus merekomendasikan course yang relevan dengan gap skill talent
- **RF-03.3**: Course yang skill-nya belum dikuasai talent harus diprioritaskan dalam rekomendasi
- **RF-03.4**: Talent harus dapat melihat daftar semua course yang tersedia
- **RF-03.5**: Endpoint `/api/courses/recommended/{userId}` harus mengembalikan course terurut berdasarkan relevansi gap skill
- **RF-03.6**: Flask endpoint `/recommend-courses` harus menerima list skill dan mengembalikan course terurut berdasarkan cosine similarity

### RF-04: Course & Quiz Gamifikasi

- **RF-04.1**: Course terdiri dari beberapa Module yang terurut (OrderIndex)
- **RF-04.2**: Setiap Module memiliki tipe: `mcq`, `multi_select`, atau `drag_drop`
- **RF-04.3**: **MCQ**: Talent memilih satu jawaban dari beberapa pilihan bergaya kartu pixel-art
- **RF-04.4**: **Multi-select**: Talent dapat memilih beberapa jawaban bergaya "power-up icon"
- **RF-04.5**: **Drag & drop**: Talent drag komponen data center (server rack, cooling unit, switch, UPS) ke slot yang benar dalam diagram pixel-art menggunakan react-dnd
- **RF-04.6**: Setiap soal benar menambahkan XP ke progress bar talent
- **RF-04.7**: Setelah submit quiz, sistem harus menampilkan animasi reward (confetti) jika skor ≥ 70%
- **RF-04.8**: Progress quiz disimpan di state management Zustand selama session berlangsung
- **RF-04.9**: Backend harus memvalidasi jawaban terhadap `QuestionOptions.IsCorrect` di database
- **RF-04.10**: Skor modul disimpan ke UserProgress setelah submit
- **RF-04.11**: Grade talent diperbarui secara kumulatif berdasarkan akumulasi skor quiz

### RF-05: Job Matching

- **RF-05.1**: Sistem harus menampilkan daftar job yang cocok dengan grade dan skill talent
- **RF-05.2**: Matching dilakukan berdasarkan `MinGrade` dan `RequiredSkills` setiap job
- **RF-05.3**: Job listing mencakup lokasi Batam dan Singapura
- **RF-05.4**: Talent hanya melihat job yang grade-nya memenuhi MinGrade job tersebut
- **RF-05.5**: Job listing harus menampilkan judul, lokasi, required skills, dan minimum grade

### RF-06: Dashboard & Navigasi

- **RF-06.1**: Talent harus memiliki dashboard yang menampilkan grade saat ini, skill, dan progress course
- **RF-06.2**: Navigasi utama mencakup: Dashboard, Upload CV, Courses, Jobs
- **RF-06.3**: Tampilan harus konsisten dengan tema pixel-art menggunakan Google Font "Press Start 2P" untuk heading

### RF-07: Seed Data untuk Demo

- **RF-07.1**: Database harus memiliki minimal 1 course lengkap dengan 3 tipe modul (MCQ, multi-select, drag-drop)
- **RF-07.2**: Setiap modul memiliki minimal 3 pertanyaan dengan options
- **RF-07.3**: Tersedia minimal 5 job listing (Batam dan Singapura) dengan berbagai MinGrade
- **RF-07.4**: Tersedia list skill predefined: Python, Networking, Cybersecurity, Data Center Operations, Cloud Computing, AI/ML, Linux Administration, Virtualization, Power Systems, Cooling Systems

---

## Requirements Non-Fungsional

### RNF-01: Performa
- Endpoint API harus merespons dalam < 500ms untuk operasi non-AI
- Flask AI service boleh mengambil hingga 30 detik untuk proses OCR + matching
- Frontend harus memuat halaman utama dalam < 3 detik

### RNF-02: Keamanan
- Password harus di-hash dengan BCrypt sebelum disimpan (salt rounds ≥ 10)
- JWT token harus memiliki expiry (minimal 1 jam)
- File upload harus divalidasi tipe MIME (hanya PDF, PNG, JPG)
- Ukuran file CV dibatasi maksimum 10MB

### RNF-03: Ketersediaan & Fallback
- Flask service harus memiliki fallback rule-based scoring jika model AI gagal
- Sistem harus tetap fungsional untuk demo meskipun model sentence-transformers gagal load

### RNF-04: Interoperabilitas
- CORS harus dikonfigurasi untuk komunikasi Frontend ↔ ASP.NET Core ↔ Flask
- ASP.NET Core berjalan di port 5001, Flask di port 5000, Frontend di port 5173

### RNF-05: Maintainability
- Backend menggunakan Repository/Service pattern sederhana
- Kode harus memiliki struktur folder yang jelas dan konsisten
- Konfigurasi disimpan di `appsettings.json` dan `.env` (bukan hardcoded)

### RNF-06: Aksesibilitas
- Komponen quiz harus memiliki label ARIA untuk keyboard navigation
- Kontras warna harus memenuhi WCAG AA minimum untuk teks pixel-art

---

## Constraints

- Waktu pengembangan: 16 jam (hackathon)
- Stack harus sesuai yang ditentukan (tidak boleh diganti tanpa alasan kuat)
- Demo harus bisa dijalankan secara lokal tanpa dependensi cloud
- Model AI bisa digunakan offline setelah download pertama