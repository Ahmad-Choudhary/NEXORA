import mysql.connector

from config import DB_CONFIG


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def list_psychologists():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
                 SELECT id, full_name, specialization, contact, email, experience,
                   photo_url, availability, created_at
            FROM psychologists
                 ORDER BY full_name
            """
        )
        rows = cursor.fetchall()
        for row in rows:
            if row.get('created_at'):
                row['created_at'] = str(row['created_at'])
        return rows
    finally:
        cursor.close()
        conn.close()


def create_psychologist(data):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO psychologists
                (full_name, specialization, contact, email, experience, photo_url, availability)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data['name'], data['specialization'], data.get('contact'),
                data.get('email'), data.get('experience'), data.get('photo_url'),
                data.get('availability', 'Available')
            )
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()


def delete_psychologist(psychologist_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM psychologists WHERE id = %s", (psychologist_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()


def update_psychologist(psychologist_id, data):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE psychologists
            SET full_name = %s, specialization = %s, contact = %s, email = %s,
                experience = %s, photo_url = %s, availability = %s
            WHERE id = %s
            """,
            (
                data['name'], data['specialization'], data.get('contact'),
                data.get('email'), data.get('experience'), data.get('photo_url'),
                data.get('availability', 'Available'), psychologist_id
            )
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()


def list_users_with_latest_assessment():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email, u.created_at,
                   a.phq_score, a.phq_severity, a.lifestyle_risk, a.created_at AS assessment_at
            FROM users u
            LEFT JOIN assessment_results a ON a.id = (
                SELECT latest.id
                FROM assessment_results latest
                WHERE latest.user_id = u.id
                ORDER BY latest.created_at DESC, latest.id DESC
                LIMIT 1
            )
            WHERE COALESCE(u.is_admin, 0) = 0
            ORDER BY u.created_at DESC
            """
        )
        rows = cursor.fetchall()
        for row in rows:
            for key in ('created_at', 'assessment_at'):
                if row.get(key):
                    row[key] = str(row[key])
        return rows
    finally:
        cursor.close()
        conn.close()


def delete_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        cursor.execute("DELETE FROM assessment_results WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = %s AND COALESCE(is_admin, 0) = 0", (user_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()