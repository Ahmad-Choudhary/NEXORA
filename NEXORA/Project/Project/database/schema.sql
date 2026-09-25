USE nexora_db;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS psychologists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    contact VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    experience VARCHAR(100) NULL,
    photo_url VARCHAR(500) NULL,
    availability VARCHAR(50) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ///////////Upgradig the existing assessment results table
ALTER TABLE assessment_results 
    ADD COLUMN IF NOT EXISTS phq_score INT NULL AFTER user_id,
    ADD COLUMN IF NOT EXISTS phq_severity VARCHAR(50) NULL AFTER phq_score,
    ADD COLUMN IF NOT EXISTS phq9_score INT NULL AFTER phq_severity,
    ADD COLUMN IF NOT EXISTS depression_level VARCHAR(50) NULL AFTER phq9_score;

-- ////////////////////for no column is left NULL
UPDATE assessment_results 
SET phq_score = phq9_score 
WHERE phq_score IS NULL AND phq9_score IS NOT NULL;

UPDATE assessment_results 
SET phq9_score = phq_score 
WHERE phq9_score IS NULL AND phq_score IS NOT NULL;

UPDATE assessment_results 
SET phq_severity = depression_level 
WHERE phq_severity IS NULL AND depression_level IS NOT NULL;

UPDATE assessment_results 
SET depression_level = phq_severity 
WHERE depression_level IS NULL AND phq_severity IS NOT NULL;