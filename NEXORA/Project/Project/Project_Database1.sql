CREATE DATABASE IF NOT EXISTS nexora_db;
USE nexora_db;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE psychologists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    contact VARCHAR(100),
    email VARCHAR(255),
    experience VARCHAR(100),
    photo_url VARCHAR(500),
    availability VARCHAR(50) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DESCRIBE users;
INSERT INTO users (
    full_name,
    email,
    password_hash
)
VALUES (
    'Test User',
    'test@nexora.com',
    'TEST_HASH_ONLY'
);
SELECT * FROM users;
DELETE FROM users
WHERE email = 'test@nexora.com';
SELECT * FROM users;
SELECT * FROM nexora_db.users;
