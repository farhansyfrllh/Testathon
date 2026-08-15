"""OCR text extraction from PDF and image files."""
import os

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'input_model', 'model', 'weights'))
            _engine = RapidOCR(
                det_model_path=os.path.join(model_dir, 'det_default.onnx'),
                cls_model_path=os.path.join(model_dir, 'cls.onnx'),
                rec_model_path=os.path.join(model_dir, 'rec.onnx'),
                rec_keys_path=os.path.join(model_dir, 'ppocr_keys_v1.txt')
            )
        except Exception as e:
            print(f"[OCR Init] Failed to load RapidOCR: {e}")
            _engine = False
    return _engine


def extract_text(file_path: str, file_ext: str) -> str:
    """Extract text from a file based on its extension."""
    if file_ext == 'pdf':
        return extract_text_from_pdf(file_path)
    else:
        return extract_text_from_image(file_path)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF (fitz) and ONNX models."""
    try:
        import fitz  # PyMuPDF
        text_parts = []
        with fitz.open(file_path) as doc:
            for page in doc:
                page_text = page.get_text()
                if page_text:
                    text_parts.append(page_text)
        result = "\n".join(text_parts).strip()
        if not result:
            # PDF might have images on pages — try OCR on rendered pages
            result = _extract_pdf_via_ocr(file_path)
        return result
    except ImportError:
        return _fallback_text_extraction(file_path)
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}")


def _extract_pdf_via_ocr(file_path: str) -> str:
    """Render PDF pages as images and OCR them (for image-based PDFs)."""
    try:
        import fitz
        
        text_parts = []
        engine = get_engine()
        if not engine:
            return ""

        with fitz.open(file_path) as doc:
            for page in doc:
                # Render page at 2x resolution for better OCR accuracy
                mat = fitz.Matrix(2.0, 2.0)
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                result, _ = engine(img_data)
                if result:
                    page_text = "\n".join([res[1] for res in result])
                    text_parts.append(page_text.strip())
        return "\n".join(text_parts).strip()
    except Exception as e:
        print(f"[OCR Error] PDF OCR failed: {e}")
        return ""


def extract_text_from_image(file_path: str) -> str:
    """Extract text from image using Deep Learning ONNX Model (classification, detection, recognition)."""
    try:
        engine = get_engine()
        if not engine:
            return _fallback_text_extraction(file_path)
            
        result, _ = engine(file_path)
        if result:
            return "\n".join([res[1] for res in result]).strip()
        return ""
    except Exception as e:
        raise RuntimeError(f"Image OCR failed: {e}")


def _fallback_text_extraction(file_path: str) -> str:
    """Fallback: return filename as minimal text for testing."""
    return os.path.basename(file_path)
