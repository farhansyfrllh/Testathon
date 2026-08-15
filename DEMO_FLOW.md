# 🎮 Talent Bridge — Demo Flow (5 Menit)

> Script demo lengkap untuk presentasi hackathon.
> Total waktu: **~5 menit** | Audience: judges / evaluators

---

## ⏱️ Timeline Overview

| Menit | Aktivitas |
|-------|-----------|
| 0:00–0:30 | Setup & verifikasi services |
| 0:30–1:00 | Register & login |
| 1:00–2:00 | Upload CV & lihat grade |
| 2:00–3:30 | Quiz: MCQ → Multi-select → Drag & Drop |
| 3:30–4:30 | Jobs matching |
| 4:30–5:00 | Ringkasan & Q&A |

---

## 🚀 Pre-Demo Checklist (Sebelum Presentasi)

Pastikan semua 3 services sudah berjalan:

```powershell
# Terminal 1 — API
cd talent-bridge-api && dotnet run

# Terminal 2 — AI Service
cd talent-ai-service && python app.py

# Terminal 3 — Frontend
cd talent-bridge-frontend && npm run dev
```

Verifikasi:
- [ ] http://localhost:5173 → halaman login tampil
- [ ] http://localhost:5000/health → `{"status":"ok","mode":"rule_based"}`
- [ ] http://localhost:5001/swagger → Swagger UI tampil
- [ ] `sample_cv.pdf` ada di root folder (`D:\Downloads\Hackathon\sample_cv.pdf`)
- [ ] Browser siap di http://localhost:5173 (full screen / presentation mode)

---

## 📋 Step-by-Step Demo Script

---

### STEP 1: Landing & Register (0:30–1:00)

**🖥️ Aksi**: Buka http://localhost:5173

```
[SCREENSHOT PLACEHOLDER: Login page dengan pixel-art theme "Press Start 2P"]
```

**🗣️ Talking Points**:
> "Ini adalah Talent Bridge — platform yang menghubungkan talent lokal Batam dengan
> industri data center Batam dan Singapura. Tampilannya menggunakan tema pixel-art
> untuk memberikan pengalaman yang engaging."

---

**🖥️ Aksi**: Klik **"Register"** → isi form:
- Name: `Demo User`
- Email: `demo@talentbridge.id`
- Password: `Demo1234!`
- Klik **Register**

```
[SCREENSHOT PLACEHOLDER: Register form terisi, tombol Register]
```

**🗣️ Talking Points**:
> "Registrasi menggunakan BCrypt untuk keamanan password, dan langsung generate
> JWT token untuk session management. User baru otomatis mendapat grade 'Unranked'."

---

**🖥️ Aksi**: Setelah register, akan otomatis login dan masuk ke Dashboard

```
[SCREENSHOT PLACEHOLDER: Dashboard dengan grade badge "UNRANKED" abu-abu]
```

**🗣️ Talking Points**:
> "Dashboard menampilkan grade saat ini — masih Unranked karena belum upload CV.
> Kita akan lihat bagaimana grade berubah setelah upload CV."

---

### STEP 2: Upload CV & AI Skill Matching (1:00–2:00)

**🖥️ Aksi**: Klik **"Upload CV"** di navbar atau tombol di dashboard

```
[SCREENSHOT PLACEHOLDER: CV Upload page dengan drop zone border dashed]
```

**🗣️ Talking Points**:
> "CV bisa di-upload dalam format PDF atau gambar. Kita sudah siapkan sample CV
> yang berisi keywords untuk industri data center."

---

**🖥️ Aksi**: Drop `sample_cv.pdf` ke drop zone (atau klik untuk browse), lalu klik **"Upload CV"**

```
[SCREENSHOT PLACEHOLDER: Loading state "Processing CV..." dengan spinner]
```

**🗣️ Talking Points**:
> "Di balik layar, flow-nya: ASP.NET Core menerima file → forward ke Flask AI service
> → Flask mengekstrak teks dengan PyMuPDF → matching dengan 16 predefined skills
> menggunakan keyword matching (rule-based mode untuk demo yang cepat)."

---

**🖥️ Aksi**: Tunggu hasil analisis (~2-3 detik)

```
[SCREENSHOT PLACEHOLDER: Hasil upload — skill chips (Data Center Operations, Power Systems, dll),
 match score bar ~75%, grade badge "SILVER" warna silver/abu]
```

**🗣️ Talking Points**:
> "Sample CV kita berisi keywords: Data Center Operations, Power Systems, Cooling Systems,
> Networking, Linux Administration, Cybersecurity, dan lainnya. Flask mendeteksi ~10 skills
> dengan overall match score ~75%, yang berarti grade Silver.
> Grade langsung terupdate di badge navbar — dari Unranked ke Silver!"

---

### STEP 3: Quiz Gamifikasi (2:00–3:30)

**🖥️ Aksi**: Klik **"Courses"** di navbar

```
[SCREENSHOT PLACEHOLDER: Grid courses — "Data Center Fundamentals" dan "Cybersecurity Essentials"
 dengan badge "Recommended" dan skill chips]
```

**🗣️ Talking Points**:
> "Sistem merekomendasikan course berdasarkan gap skill. Karena kita punya skill data center
> tapi perlu tingkatkan, course ini muncul sebagai rekomendasi."

---

**🖥️ Aksi**: Klik **"START COURSE"** pada "Data Center Fundamentals"

---

#### Sub-Step 3a: Module 1 — MCQ

```
[SCREENSHOT PLACEHOLDER: Quiz MCQ — 3 kartu pixel-art dengan border abu-abu]
```

**🗣️ Talking Points**:
> "Module pertama adalah Multiple Choice. Kartu bergaya pixel-art dengan visual
> feedback saat dipilih — border berubah menjadi pixel-gold."

**🖥️ Aksi**: Jawab ketiga pertanyaan:
1. Q1: Pilih **"Menyediakan daya cadangan saat listrik padam"** (fungsi UPS)
2. Q2: Pilih **"Network Switch"** (menghubungkan server)
3. Q3: Pilih **"Power Usage Effectiveness"** (PUE)
4. Klik **"Submit Quiz"**

```
[SCREENSHOT PLACEHOLDER: Score screen — "100 / 100", confetti pixel-gold,
 "XP +30" animasi, grade badge]
```

**🗣️ Talking Points**:
> "Skor 100%! Confetti animasi muncul karena skor ≥ 70%. XP bertambah ke progress bar."

**🖥️ Aksi**: Klik **"NEXT MODULE"**

---

#### Sub-Step 3b: Module 2 — Multi-Select

```
[SCREENSHOT PLACEHOLDER: Multi-select cards — icon ⚡ menyala (glow) saat selected]
```

**🗣️ Talking Points**:
> "Module kedua adalah Multi-select — user bisa pilih lebih dari satu jawaban benar.
> Icon power-up menyala saat opsi dipilih, memberikan visual feedback yang jelas."

**🖥️ Aksi**: Jawab pertanyaan multi-select (pilih semua opsi benar), klik **"Submit Quiz"**

**🖥️ Aksi**: Klik **"NEXT MODULE"**

---

#### Sub-Step 3c: Module 3 — Drag & Drop

```
[SCREENSHOT PLACEHOLDER: DragDrop quiz — 4 komponen draggable di kiri,
 4 zona (Power/Network/Compute/Cooling) di kanan dalam grid 2x2]
```

**🗣️ Talking Points**:
> "Module ketiga adalah Drag & Drop menggunakan react-dnd. User drag komponen
> data center ke zona yang tepat dalam diagram. Ini mensimulasikan pemahaman
> arsitektur fisik data center."

**🖥️ Aksi**: Drag setiap komponen ke zona yang benar:
- 🔋 **UPS** → Power Zone ⚡
- 🔀 **Network Switch** → Network Zone 🌐
- 🖥️ **Server Rack** → Compute Zone 💻
- ❄️ **CRAC Unit** → Cooling Zone ❄️

**🖥️ Aksi**: Klik **"Submit Quiz"**

```
[SCREENSHOT PLACEHOLDER: Score screen dengan grade update (Silver → mungkin Gold
 jika average naik)]
```

**🗣️ Talking Points**:
> "Semua 3 tipe quiz berfungsi penuh. Grade diupdate secara kumulatif berdasarkan
> rata-rata semua quiz yang sudah dikerjakan."

---

### STEP 4: Job Matching (3:30–4:30)

**🖥️ Aksi**: Klik **"Jobs"** di navbar

```
[SCREENSHOT PLACEHOLDER: Jobs page — daftar job cards dengan badge lokasi,
 skill chips, grade requirement, "Best Match" badge pada 2 job teratas]
```

**🗣️ Talking Points**:
> "Jobs page menampilkan pekerjaan yang cocok berdasarkan grade saat ini.
> Algoritma memfilter job dengan MinGrade ≤ grade user, lalu mengurutkan
> berdasarkan skill overlap score."

---

**🖥️ Aksi**: Klik filter **"Batam 🇮🇩"**

```
[SCREENSHOT PLACEHOLDER: Filtered — hanya 3 jobs di Batam]
```

**🖥️ Aksi**: Klik filter **"Singapore 🇸🇬"**

```
[SCREENSHOT PLACEHOLDER: Filtered — 1-2 jobs di Singapore sesuai grade]
```

**🗣️ Talking Points**:
> "Ada 5 jobs tersedia — 3 di Batam dan 2 di Singapore. Jobs di Singapore memerlukan
> grade Silver atau Gold. Ini mendorong talent untuk terus meningkatkan skill mereka
> melalui quiz untuk membuka akses ke lebih banyak peluang."

---

### STEP 5: Summary & Value Proposition (4:30–5:00)

**🗣️ Talking Points**:
> "Dalam 5 menit demo ini, kita sudah melihat:
>
> ✅ **CV Assessment** — upload CV PDF, AI ekstrak skills otomatis, assign grade
>
> ✅ **Micro-credentials** — 3 tipe quiz interaktif (MCQ, Multi-select, Drag & Drop)
>   dengan gamifikasi XP dan konfeti
>
> ✅ **Job Matching** — filter jobs berdasarkan grade dan skill overlap
>
> Platform ini dibangun dengan **3 services terintegrasi**: ASP.NET Core API,
> Flask AI service, dan React frontend — semua berjalan lokal tanpa dependensi cloud."

---

## 🎯 Key Technical Highlights (untuk Q&A)

| Aspek | Detail |
|-------|--------|
| **Auth** | JWT Bearer token, BCrypt hash (salt 12), 8-jam expiry |
| **CV OCR** | PyMuPDF untuk PDF, pytesseract untuk gambar |
| **AI Matching** | sentence-transformers `all-MiniLM-L6-v2` (dengan fallback rule-based) |
| **Grade system** | Kumulatif: CV score + rata-rata quiz scores |
| **Drag & Drop** | react-dnd v16 dengan HTML5Backend |
| **State management** | Zustand dengan localStorage persistence |
| **CORS** | Dikonfigurasi di ASP.NET Core untuk localhost:5173 |
| **Database** | EF Core Code-First, SQL Server, auto-seed saat startup |

---

## 💡 Tips Presentasi

1. **Buka browser dalam incognito mode** untuk memulai sesi bersih
2. **Zoom browser ke 90%** agar semua elemen muat di layar
3. **Gunakan `sample_cv.pdf`** yang sudah disiapkan — dijamin mendapat Silver grade
4. **Jika Flask lambat**: service sudah set ke rule-based mode, respons < 3 detik
5. **Jika drag-drop bermasalah**: refresh halaman sekali, kemudian coba lagi
6. **Demo account cadangan**: Jika registrasi gagal karena email duplikat,
   gunakan email dengan timestamp: `demo+1@talentbridge.id`

---

## 🔄 Reset Sebelum Demo

Jika perlu start fresh (hapus user demo sebelumnya):

```sql
-- Di SQL Server Management Studio
USE TalentBridgeDb;
DELETE FROM UserProgress WHERE UserId IN (SELECT Id FROM Users WHERE Email = 'demo@talentbridge.id');
DELETE FROM TalentSkills WHERE UserId IN (SELECT Id FROM Users WHERE Email = 'demo@talentbridge.id');
DELETE FROM CVs WHERE UserId IN (SELECT Id FROM Users WHERE Email = 'demo@talentbridge.id');
DELETE FROM Users WHERE Email = 'demo@talentbridge.id';
```

Atau cukup gunakan email berbeda saat demo.

---

## 📸 Screenshot Guide

Untuk mengambil screenshot demo (gunakan sebagai pengganti placeholder di atas):

1. Login/Register page: http://localhost:5173/register
2. Dashboard (Unranked): http://localhost:5173/dashboard (sebelum upload CV)
3. CV Upload: http://localhost:5173/cv-upload
4. CV Result: setelah upload `sample_cv.pdf`
5. Dashboard (Silver): http://localhost:5173/dashboard (setelah upload)
6. Courses page: http://localhost:5173/courses
7. MCQ Quiz: klik Start Course → Module 1
8. Multi-select Quiz: Module 2
9. Drag & Drop Quiz: Module 3
10. Jobs page: http://localhost:5173/jobs
