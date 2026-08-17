import os
import io
import fitz  # PyMuPDF
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from rapidocr_onnxruntime import RapidOCR

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 10485760))
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ── Inisialisasi Model RapidOCR ──
MODEL_DIR = os.path.abspath(os.path.join("talent-ai-service", "input_model", "model", "weights"))

# Cek apakah folder weights ada, jika tidak gunakan default model bawaan RapidOCR
if os.path.exists(MODEL_DIR):
    engine = RapidOCR(
        det_model_path=os.path.join(MODEL_DIR, "det_default.onnx"),
        cls_model_path=os.path.join(MODEL_DIR, "cls.onnx"),
        rec_model_path=os.path.join(MODEL_DIR, "rec.onnx"),
        rec_keys_path=os.path.join(MODEL_DIR, "ppocr_keys_v1.txt"),
    )
else:
    # Fallback ke default engine jika path custom weights belum siap
    engine = RapidOCR()

from routes import register_routes
register_routes(app)

@app.route('/health', methods=['GET'])
def health_check():
    from matching_service import AI_AVAILABLE
    return jsonify({
        "status": "ok",
        "service": "talent-ai-service",
        "version": "1.0.0",
        "ai_available": AI_AVAILABLE,
        "mode": "ai" if AI_AVAILABLE else "rule_based"
    })

@app.route('/api/extract-ocr', methods=['POST'])
def extract_ocr():
    if 'file' not in request.files:
        return jsonify({"error": "Tidak ada file PDF yang diunggah"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nama file kosong"}), 400

    try:
        pdf_bytes = file.read()
        all_pages_text = []

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page_num, page in enumerate(doc, start=1):
                mat = fitz.Matrix(2.0, 2.0)
                pix = page.get_pixmap(matrix=mat)
                img_bytes = pix.tobytes("png")

                result, _ = engine(img_bytes)
                page_texts = []
                if result:
                    for item in result:
                        text = item[1]
                        page_texts.append(text)
                
                all_pages_text.append(f"=== PAGE {page_num} ===\n" + "\n".join(page_texts))

        full_text = "\n\n".join(all_pages_text)
        return jsonify({"success": True, "ocr_text": full_text}), 200

    except Exception as e:
        app.logger.error("OCR Error: %s", str(e), exc_info=True)
        return jsonify({"error": f"Gagal memproses OCR: {str(e)}"}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({"error": "File terlalu besar. Maksimum 10 MB."}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Terjadi kesalahan pada server"}), 500

@app.errorhandler(Exception)
def unhandled_exception(error):
    app.logger.error("Unhandled exception: %s", str(error), exc_info=True)
    return jsonify({"error": f"Terjadi kesalahan: {str(error)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)