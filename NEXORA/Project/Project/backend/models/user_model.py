import mysql.connector
from config import DB_CONFIG


class DuplicateEmailError(Exception):
    pass


def get_connection():
    # opening 
    return mysql.connector.connect(**DB_CONFIG)


def create_user(full_name, email, hashed_password):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
            (full_name, email, hashed_password)
        )
        conn.commit()
    except mysql.connector.Error as err:
        if err.errno == 1062:  # MySQL's "duplicate entry" error code
            raise DuplicateEmailError()
        raise
    finally:
        cursor.close()
        conn.close()


def find_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def update_user_password(user_id, hashed_password):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (hashed_password, user_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def find_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, full_name, email, is_admin FROM users WHERE id = %s",
            (user_id,)
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
