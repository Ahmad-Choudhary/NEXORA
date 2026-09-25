USE nexora_db;

DROP TABLE IF EXISTS assessment_results;

CREATE TABLE assessment_results (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    phq_score      INT NOT NULL,
    phq_severity   VARCHAR(50) NOT NULL,
    lifestyle_risk VARCHAR(50) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DESCRIBE assessment_results;
SELECT * FROM nexora_db.assessment_results;