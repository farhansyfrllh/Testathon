"""
Test script: RapidOCR (det + cls + rec) on a PDF file.
Renders each PDF page as an image (via PyMuPDF), then passes
the raw PNG bytes to the ONNX-based engine for
Classification -> Detection -> Recognition.
"""
import os
import fitz  # PyMuPDF

from rapidocr_onnxruntime import RapidOCR

MODEL_DIR = os.path.abspath(os.path.join("input_model", "model", "weights"))

engine = RapidOCR(
    det_model_path=os.path.join(MODEL_DIR, "det_default.onnx"),
    cls_model_path=os.path.join(MODEL_DIR, "cls.onnx"),
    rec_model_path=os.path.join(MODEL_DIR, "rec.onnx"),
    rec_keys_path=os.path.join(MODEL_DIR, "en_dict.txt"),
)

PDF_PATH = "sample_cv_gold.pdf"
all_texts = []

with fitz.open(PDF_PATH) as doc:
    for page_num, page in enumerate(doc, start=1):
        # Render at 2× resolution for better OCR accuracy
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")

        result, elapse = engine(img_bytes)

        if result:
            page_text = "\n".join(res[1] for res in result)
            all_texts.append(page_text)
            print(f"--- Page {page_num} (elapsed: {elapse:.3f}s) ---")
            print(page_text)
        else:
            print(f"--- Page {page_num}: No text detected ---")

full_text = "\n".join(all_texts)
print("\n====== FULL EXTRACTED TEXT ======")
print(full_text)
print(f"\nTotal characters extracted: {len(full_text)}")
