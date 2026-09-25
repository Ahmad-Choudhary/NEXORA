from flask import Flask
from flask_cors import CORS

from config import SECRET_KEY
from routes.auth_routes import auth_bp
from routes.assessment_routes import assessment_bp
from routes.admin_routes import admin_bp
from routes.psychologist_routes import psychologist_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})

# Final URLs, once the prefixes below are applied:
#   /api/auth/signup, /api/auth/login
#   /api/assessments (POST), /api/assessments/history (GET)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(assessment_bp, url_prefix='/api/assessments')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(psychologist_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)