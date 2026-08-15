# Talent AI Service 🧠

**Talent Bridge — AI-powered CV Matching & Skill Assessment**

Talent AI Service adalah backend berbasis Python Flask yang dirancang untuk memproses CV kandidat (PDF/Images), mengekstrak teks menggunakan pipeline OCR berbasis Deep Learning (ONNX), dan mencocokkan *skill* kandidat dengan kebutuhan industri Data Center (menggunakan AI NLP atau Rule-based matching). Hasil akhirnya berupa rekomendasi *grade* dan *skill* yang sesuai.

---

## ✨ Fitur Utama

- **📝 Advanced OCR Pipeline**: Mengekstrak teks dari CV dengan akurasi tinggi menggunakan model ONNX 3-stage (Detection → Classification → Recognition).
- **🤖 AI Skill Matching**: Menggunakan model NLP `sentence-transformers` (`all-MiniLM-L6-v2`) untuk pencocokan skill secara semantik.
- **⚡ Rule-based Fallback**: Mode fallback super cepat berbasis pencocokan *keyword* dan *Jaccard similarity* jika AI model dimatikan.
- **📊 Automated Grading**: Mengkategorikan kandidat ke dalam *tier* (Gold, Silver, Bronze, Unranked) berdasarkan *overall match score*.
- **🔍 Visual Debugging**: Dilengkapi script untuk memvisualisasikan hasil deteksi OCR (bounding box) langsung ke atas file PDF.

---

## 🛠️ Tech Stack

- **Framework**: Flask, Flask-CORS, Werkzeug
- **OCR Engine**: RapidOCR (ONNX Runtime), OpenCV, Pillow
- **PDF Processor**: PyMuPDF (fitz)
- **AI / NLP**: sentence-transformers, NumPy
- **Environment**: python-dotenv

---

## ⚙️ Persyaratan Sistem

- Python 3.9 atau lebih baru
- Model ONNX OCR (ditempatkan di `input_model/model/weights/`)
- *Opsional*: Tesseract-OCR terinstall di OS (untuk fallback legasi)

---

## 🚀 Instalasi & Setup

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/farhansyfrllh/Testathon.git
   cd Testathon/talent-ai-service
   ```

2. **Buat dan aktifkan Virtual Environment (Direkomendasikan):**
   ```bash
   python -m venv venv
   # Di Windows:
   venv\Scripts\activate
   # Di macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Konfigurasi Environment:**
   Pastikan Anda memiliki file `.env` di root direktori dengan isi:
   ```env
   FLASK_ENV=development
   FLASK_PORT=5000
   MODEL_NAME=all-MiniLM-L6-v2
   USE_AI_FALLBACK=true  # Set 'false' untuk menggunakan SentenceTransformers
   UPLOAD_FOLDER=uploads
   MAX_CONTENT_LENGTH=10485760
   ```

---

## 🏃‍♂️ Menjalankan Server

Jalankan perintah berikut di terminal Anda:
```bash
python app.py
```
*Server akan berjalan di `http://localhost:5000` atau `http://127.0.0.1:5000`.*

---

## 📡 API Endpoints

### 1. `POST /ocr-and-match`
Mengunggah file CV (PDF/PNG/JPG) untuk diekstrak teksnya dan dicocokkan skillnya.
- **Request (form-data)**: 
  - `file`: File CV yang akan diproses (Max 10 MB).
- **Response (200 OK)**:
  ```json
  {
    "extracted_skills": [
      {"confidence": 97.0, "name": "Cloud Computing"},
      {"confidence": 85.0, "name": "Python"}
    ],
    "overall_match_score": 92.5,
    "grade": "Gold",
    "method": "rule_based",
    "extracted_text": "...teks mentah dari CV..."
  }
  ```

### 2. `POST /recommend-courses`
Mendapatkan rekomendasi kursus berdasarkan skill kandidat.
- **Request (JSON)**: `talent_skills` (list of strings), `courses` (list of objects).
- **Response (200 OK)**: Daftar kursus yang diurutkan berdasarkan `similarity_score`.

### 3. `GET /health`
Mengecek status server dan mode AI yang aktif.

---

## 🧪 Testing & Debugging Script

Aplikasi ini dilengkapi dengan beberapa script utilitas untuk menguji kapabilitas OCR tanpa perlu menjalankan Flask server:

- **`python visualize_ocr.py [nama_file.pdf]`**
  Membaca PDF, menjalankan model ONNX (Det → Cls → Rec), dan merender *bounding box* hijau pada setiap teks yang terdeteksi. Hasilnya disimpan di folder `ocr_output/`.

- **`python step_test_ocr.py`**
  Menguji alur OCR secara bertahap: (1) Detection, (2) Classification, (3) Recognition, (4) Full Pipeline, dan (5) Pengecekan Flask API. Sangat berguna untuk mendiagnosis error pada model ONNX.

- **`python inspect_model.py`**
  Mengecek input/output tensor shape dari file `.onnx` Anda untuk memastikan kecocokan dengan dictionary karakter (misalnya memastikan `rec.onnx` cocok dengan `ppocr_keys_v1.txt`).

---

## 📁 Struktur Direktori Penting

```text
talent-ai-service/
├── app.py                 # Entry point server Flask
├── routes.py              # Definisi Endpoint API
├── ocr_service.py         # Logika ekstraksi teks (PyMuPDF & RapidOCR)
├── matching_service.py    # Logika pencocokan skill AI/Rule-based
├── skills_config.py       # Daftar skill industri & ambang batas grade
├── input_model/           # Tempat menyimpan model ONNX (det, cls, rec)
└── requirements.txt       # Daftar package Python
```
