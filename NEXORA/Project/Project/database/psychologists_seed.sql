USE nexora_db;

-- Idempotent seed for the profiles originally shown in psychologists.html.
INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Dr. Sadia Yasir', 'Consultant psychologist', '+92 331 4444255', NULL, '15+ years experience', NULL, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Dr. Sadia Yasir');

INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Ms. Aqila Unbrin', 'Principal clinical psychology', '+92 306 9286011', NULL, '12+ years experience', NULL, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Ms. Aqila Unbrin');

INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Dr. Yasmeen Naeem', 'Principal Psychologist', '+92 331 474175', NULL, '8 years experience', NULL, 'Busy'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Dr. Yasmeen Naeem');

INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Dr. Junaid Rasool', 'Consultant Psychologist', '+92 309 5990667', NULL, '12+ years experience', NULL, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Dr. Junaid Rasool');

INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Dr. Alina', 'Child Psychologist', '+92 336 3340001', NULL, '8 years experience', NULL, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Dr. Alina');

-- Dr. Saima Batool: Consultant Psychologist, 8 years, +92 320 4455147,
-- originally displayed with initials SB and Anxiety, Schizophrenia, and OCD tags.
INSERT INTO psychologists
    (full_name, specialization, contact, email, experience, photo_url, availability)
SELECT 'Dr. Saima Batool', 'Consultant Psychologist', '+92 320 4455147', NULL, '8 years experience', NULL, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM psychologists WHERE full_name = 'Dr. Saima Batool');
