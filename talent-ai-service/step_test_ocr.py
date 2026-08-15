"""
step_test_ocr.py
─────────────────────────────────────────
Test setiap tahap OCR secara bertahap:
  Stage 1: Detection  (det_default.onnx)
  Stage 2: Classification (cls.onnx)
  Stage 3: Recognition (rec.onnx)
  Stage 4: Full Pipeline + Flask API
"""
import os
import io
import fitz
import numpy as np
from PIL import Image
import onnxruntime as ort

MODEL_DIR = os.path.abspath(os.path.join("input_model", "model", "weights"))
PDF_PATH  = "sample_cv_gold.pdf"

# Render halaman 1 PDF menjadi gambar
print("=" * 55)
print("  PERSIAPAN: Render PDF halaman 1 → gambar PNG")
print("=" * 55)
with fitz.open(PDF_PATH) as doc:
    page    = doc[0]
    pix     = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
    img_bytes = pix.tobytes("png")
    img_pil   = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_arr   = np.array(img_pil)

print(f"  ✅ Halaman dirender: {img_arr.shape[1]}×{img_arr.shape[0]} pixels\n")


# ─── STAGE 1: DETECTION ───────────────────────────────
print("=" * 55)
print("  STAGE 1: Detection — mencari lokasi teks (det_default.onnx)")
print("=" * 55)
try:
    from rapidocr_onnxruntime.ch_ppocr_det import TextDetector
    import yaml, importlib.resources

    det_sess = ort.InferenceSession(os.path.join(MODEL_DIR, "det_default.onnx"))
    print(f"  ✅ det_default.onnx loaded")
    print(f"     Input : {det_sess.get_inputs()[0].name}  shape={det_sess.get_inputs()[0].shape}")
    print(f"     Output: {det_sess.get_outputs()[0].name} shape={det_sess.get_outputs()[0].shape}")
    print(f"  ✅ Stage 1 (Detection) SIAP\n")
except Exception as e:
    print(f"  ❌ Stage 1 Error: {e}\n")


# ─── STAGE 2: CLASSIFICATION ──────────────────────────
print("=" * 55)
print("  STAGE 2: Classification — orientasi teks (cls.onnx)")
print("=" * 55)
try:
    cls_sess = ort.InferenceSession(os.path.join(MODEL_DIR, "cls.onnx"))
    print(f"  ✅ cls.onnx loaded")
    print(f"     Input : {cls_sess.get_inputs()[0].name}  shape={cls_sess.get_inputs()[0].shape}")
    print(f"     Output: {cls_sess.get_outputs()[0].name} shape={cls_sess.get_outputs()[0].shape}")
    print(f"     Label : 0°  atau  180°  (2 kelas)")
    print(f"  ✅ Stage 2 (Classification) SIAP\n")
except Exception as e:
    print(f"  ❌ Stage 2 Error: {e}\n")


# ─── STAGE 3: RECOGNITION ─────────────────────────────
print("=" * 55)
print("  STAGE 3: Recognition — baca karakter (rec.onnx)")
print("=" * 55)
try:
    rec_sess = ort.InferenceSession(os.path.join(MODEL_DIR, "rec.onnx"))
    vocab_size = rec_sess.get_outputs()[0].shape[-1]
    dict_path  = os.path.join(MODEL_DIR, "ppocr_keys_v1.txt")
    with open(dict_path, encoding="utf-8") as f:
        char_count = sum(1 for _ in f)
    print(f"  ✅ rec.onnx loaded")
    print(f"     Output vocab size : {vocab_size}")
    print(f"     Dictionary chars  : {char_count}")
    match = "✅ COCOK" if abs(vocab_size - char_count - 1) <= 1 else "❌ TIDAK COCOK"
    print(f"     Kecocokan         : {match}")
    print(f"  ✅ Stage 3 (Recognition) SIAP\n")
except Exception as e:
    print(f"  ❌ Stage 3 Error: {e}\n")


# ─── STAGE 4: FULL PIPELINE ───────────────────────────
print("=" * 55)
print("  STAGE 4: Full Pipeline (Det → Cls → Rec) pada PDF")
print("=" * 55)
try:
    from rapidocr_onnxruntime import RapidOCR
    engine = RapidOCR(
        det_model_path=os.path.join(MODEL_DIR, "det_default.onnx"),
        cls_model_path=os.path.join(MODEL_DIR, "cls.onnx"),
        rec_model_path=os.path.join(MODEL_DIR, "rec.onnx"),
        rec_keys_path=os.path.join(MODEL_DIR, "ppocr_keys_v1.txt"),
    )
    result, elapse = engine(img_bytes)
    if result:
        print(f"  ✅ Total text region terdeteksi : {len(result)}")
        print(f"  ✅ Waktu total                  : {sum(elapse):.3f}s")
        print(f"     Detection   : {elapse[0]:.3f}s")
        print(f"     Classification : {elapse[1]:.3f}s")
        print(f"     Recognition : {elapse[2]:.3f}s")
        print(f"\n  📄 5 teks pertama yang terbaca:")
        for i, item in enumerate(result[:5], 1):
            text, score = item[1], item[2]
            print(f"     [{i}] ({score:.0%}) {text}")
    else:
        print("  ⚠️  Tidak ada teks yang terdeteksi")
    print(f"\n  ✅ Stage 4 (Full Pipeline) SELESAI\n")
except Exception as e:
    print(f"  ❌ Stage 4 Error: {e}\n")


# ─── STAGE 5: CEK FLASK API ───────────────────────────
print("=" * 55)
print("  STAGE 5: Test Flask API /ocr-and-match")
print("=" * 55)
try:
    import urllib.request, json
    url = "http://localhost:5000/health"
    with urllib.request.urlopen(url, timeout=3) as resp:
        data = json.loads(resp.read())
    print(f"  ✅ Flask server AKTIF")
    print(f"     status  : {data.get('status')}")
    print(f"     service : {data.get('service')}")
    print(f"     mode    : {data.get('mode')}")
    print(f"\n  💡 Untuk test upload CV:")
    print(f"     curl -X POST http://localhost:5000/ocr-and-match -F \"file=@sample_cv_gold.pdf\"")
except Exception as e:
    print(f"  ⚠️  Flask server tidak aktif atau error: {e}")

print("\n" + "=" * 55)
print("  SEMUA STAGE SELESAI DIUJI")
print("=" * 55)
