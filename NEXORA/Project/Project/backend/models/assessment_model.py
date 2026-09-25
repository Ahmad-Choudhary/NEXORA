import mysql.connector
from config import DB_CONFIG


def get_connection():
# opening connection
    return mysql.connector.connect(**DB_CONFIG)


def save_assessment(user_id, phq_score, phq_severity, lifestyle_risk):
    # for the completed assessment result
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO assessment_results (user_id, phq_score, phq_severity, lifestyle_risk)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, phq_score, phq_severity, lifestyle_risk)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def get_history_for_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, user_id, phq_score, phq_severity, lifestyle_risk, created_at
            FROM assessment_results
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()

        # Converting datetime objects to plain strings for JSON 
        for row in rows:
            row['created_at'] = str(row['created_at'])

        return rows
    finally:
        cursor.close()
        conn.close()