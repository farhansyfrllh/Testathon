import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Explicit CORS configuration — allow all origins in development so
# the React frontend (port 5173) can communicate without CORS errors.
# In production this should be tightened to the specific frontend origin.
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 10485760))
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import routes after app is created
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


@app.errorhandler(413)
def file_too_large(error):
    """Return JSON when uploaded file exceeds MAX_CONTENT_LENGTH."""
    return jsonify({"error": "File terlalu besar. Maksimum 10 MB."}), 413


@app.errorhandler(500)
def internal_error(error):
    """Return JSON for unhandled server errors."""
    return jsonify({"error": "Terjadi kesalahan, coba lagi"}), 500


@app.errorhandler(Exception)
def unhandled_exception(error):
    """Catch-all for unexpected exceptions — keeps response as JSON."""
    app.logger.error("Unhandled exception: %s", str(error), exc_info=True)
    return jsonify({"error": "Terjadi kesalahan, coba lagi"}), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
