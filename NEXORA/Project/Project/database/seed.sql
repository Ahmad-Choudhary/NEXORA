USE nexora_db;
INSERT INTO users (full_name, email, password_hash)
VALUES ('Test User', 'test@nexora.com', 'TEST_HASH_ONLY')
ON DUPLICATE KEY UPDATE email = VALUES(email);