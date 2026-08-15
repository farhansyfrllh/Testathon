"""Flask route definitions for talent-ai-service."""
from flask import request, jsonify
import os
import uuid


def register_routes(app):

    @app.route('/ocr-and-match', methods=['POST'])
    def ocr_and_match():
        from ocr_service import extract_text
        from matching_service import match_skills

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        # Validate file type
        allowed_extensions = {'pdf', 'png', 'jpg', 'jpeg'}
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return jsonify({
                "error": f"File type '{ext}' not allowed. Use PDF, PNG, or JPG"
            }), 400

        # Save file temporarily with UUID to avoid collisions
        temp_filename = f"{uuid.uuid4()}.{ext}"
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)

        try:
            file.save(temp_path)

            # Extract text using appropriate OCR method
            extracted_text = extract_text(temp_path, ext)

            if not extracted_text:
                extracted_text = ""

            # Run skill matching (AI or rule-based depending on availability)
            result = match_skills(extracted_text)

            # Include extracted_text in response for transparency/debugging
            result['extracted_text'] = extracted_text

            return jsonify(result)

        except RuntimeError as e:
            return jsonify({"error": str(e)}), 422
        except Exception as e:
            return jsonify({"error": f"Processing failed: {str(e)}"}), 500
        finally:
            # Always clean up temp file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

    @app.route('/recommend-courses', methods=['POST'])
    def recommend_courses():
        from matching_service import recommend_courses_by_skills

        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON body required"}), 400

        talent_skills = data.get('talent_skills', [])
        courses = data.get('courses', [])

        if not courses:
            return jsonify([])

        result = recommend_courses_by_skills(talent_skills, courses)
        return jsonify(result)
