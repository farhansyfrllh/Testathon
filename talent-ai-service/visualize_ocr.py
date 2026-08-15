"""
visualize_ocr.py
─────────────────────────────────────────────────────────────────
Bukti visual bahwa model ONNX (det + cls + rec) dapat membaca isi PDF.

Output: folder 'ocr_output/' berisi:
  - page_1_annotated.png  ← gambar dengan bounding-box di setiap teks
  - page_1_clean.png      ← gambar halaman asli (tanpa anotasi)
  - ocr_result.txt        ← semua teks yang berhasil dibaca

Cara pakai:
  python visualize_ocr.py                         (default: sample_cv_gold.pdf)
  python visualize_ocr.py sample_cv_silver.pdf    (custom file)
"""

import os
import sys
import json
import io
import fitz                        # PyMuPDF
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from rapidocr_onnxruntime import RapidOCR

# ── Config ──────────────────────────────────────────────────────
PDF_PATH    = sys.argv[1] if len(sys.argv) > 1 else "sample_cv_gold.pdf"
OUTPUT_DIR  = "ocr_output"
MODEL_DIR   = os.path.abspath(os.path.join("input_model", "model", "weights"))
RENDER_ZOOM = 2.0   # 2× resolusi agar teks lebih jelas dibaca model
BOX_COLOR   = (0, 200, 100)   # hijau neon untuk bounding box
TEXT_COLOR  = (255, 80, 80)   # merah untuk label confidence
BOX_WIDTH   = 2
# ────────────────────────────────────────────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"[INFO] Loading ONNX models from: {MODEL_DIR}")
engine = RapidOCR(
    det_model_path=os.path.join(MODEL_DIR, "det_default.onnx"),
    cls_model_path=os.path.join(MODEL_DIR, "cls.onnx"),
    rec_model_path=os.path.join(MODEL_DIR, "rec.onnx"),
    rec_keys_path=os.path.join(MODEL_DIR, "ppocr_keys_v1.txt"),
)
print("[INFO] Models loaded successfully.")

all_pages_text = []
total_boxes    = 0

with fitz.open(PDF_PATH) as doc:
    total_pages = len(doc)
    print(f"[INFO] Processing '{PDF_PATH}' ({total_pages} page(s))...\n")

    for page_num, page in enumerate(doc, start=1):
        # 1. Render halaman PDF menjadi gambar PNG
        mat      = fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM)
        pix      = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")

        # Simpan halaman bersih (tanpa anotasi)
        clean_path = os.path.join(OUTPUT_DIR, f"page_{page_num}_clean.png")
        with open(clean_path, "wb") as f:
            f.write(img_bytes)

        # 2. Jalankan OCR pipeline: Det → Cls → Rec
        print(f"[OCR] Page {page_num}/{total_pages} — running Detection → Classification → Recognition ...")
        result, elapse = engine(img_bytes)

        # 3. Gambar bounding box di atas halaman
        img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        draw    = ImageDraw.Draw(img_pil)

        page_texts = []
        if result:
            for item in result:
                # item = [bounding_box_points, text, confidence_score]
                box_points = item[0]   # list of 4 corner points [[x,y], ...]
                text       = item[1]
                score      = item[2]

                # Konversi ke format polygon untuk PIL
                pts = [(int(pt[0]), int(pt[1])) for pt in box_points]

                # Gambar outline kotak (polygon)
                draw.polygon(pts, outline=BOX_COLOR)
                # Pertebal garis dengan menggambar ulang
                for i in range(len(pts)):
                    p1 = pts[i]
                    p2 = pts[(i + 1) % len(pts)]
                    draw.line([p1, p2], fill=BOX_COLOR, width=BOX_WIDTH)

                # Label confidence di sudut kiri atas kotak
                label_x = min(pt[0] for pt in pts)
                label_y = min(pt[1] for pt in pts) - 14
                if label_y < 0:
                    label_y = min(pt[1] for pt in pts) + 2
                draw.text((label_x, label_y), f"{score:.0%}", fill=TEXT_COLOR)

                page_texts.append(text)

            print(f"  ✅ Detected {len(result)} text region(s) in {sum(elapse):.3f}s  (det={elapse[0]:.3f}s | cls={elapse[1]:.3f}s | rec={elapse[2]:.3f}s)")

            total_boxes += len(result)
        else:
            print(f"  ⚠️  No text detected on page {page_num}")

        # 4. Simpan gambar beranotasi
        annotated_path = os.path.join(OUTPUT_DIR, f"page_{page_num}_annotated.png")
        img_pil.save(annotated_path)
        print(f"  📄 Saved: {annotated_path}")

        page_text = "\n".join(page_texts)
        all_pages_text.append(f"=== PAGE {page_num} ===\n{page_text}")

# 5. Simpan semua teks ke file .txt
full_text    = "\n\n".join(all_pages_text)
txt_out_path = os.path.join(OUTPUT_DIR, "ocr_result.txt")
with open(txt_out_path, "w", encoding="utf-8") as f:
    f.write(full_text)

# 6. Simpan summary JSON
summary = {
    "pdf_file"       : PDF_PATH,
    "total_pages"    : total_pages,
    "total_text_boxes": total_boxes,
    "output_dir"     : OUTPUT_DIR,
    "files_generated": [
        f"page_{{n}}_annotated.png  ← halaman + bounding box",
        f"page_{{n}}_clean.png      ← halaman asli",
        "ocr_result.txt            ← semua teks yang dibaca",
    ]
}
json_path = os.path.join(OUTPUT_DIR, "summary.json")
with open(json_path, "w") as f:
    json.dump(summary, f, indent=2)

print(f"""
╔══════════════════════════════════════════════════════╗
║              OCR VISUALIZATION COMPLETE              ║
╠══════════════════════════════════════════════════════╣
║  PDF       : {PDF_PATH:<39}║
║  Pages     : {total_pages:<39}║
║  Text Boxes: {total_boxes:<39}║
║  Output    : {OUTPUT_DIR:<39}║
╚══════════════════════════════════════════════════════╝

Buka folder '{OUTPUT_DIR}/' dan lihat:
  → page_1_annotated.png   (bounding box overlay)
  → page_1_clean.png       (halaman original)
  → ocr_result.txt         (semua teks yang dibaca)
""")
