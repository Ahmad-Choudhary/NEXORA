import os
from dotenv import load_dotenv

load_dotenv()  # it ia reading the .env file into environment variables

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '#Zia47bbb'),
    'database': os.getenv('DB_NAME', 'nexora_db'),
}

SECRET_KEY = os.getenv('SECRET_KEY', 'replace-this-secret-in-production')