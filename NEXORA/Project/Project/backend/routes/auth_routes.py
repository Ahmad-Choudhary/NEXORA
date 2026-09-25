import bcrypt
from flask import Blueprint, jsonify, request, session

from models.user_model import create_user, find_user_by_email, DuplicateEmailError
from models.user_model import update_user_password  # Forgot Password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out.'}), 200


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}

    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')

    if not full_name or not email or not password:
        return jsonify({'status': 'error', 'message': 'All fields are required.'}), 400

    # Never store plain-text passwords - hash it first.
    hashed_password = bcrypt.hashpw(
        password.encode('utf-8'), bcrypt.gensalt()
    ).decode('utf-8')

    try:
        create_user(full_name, email, hashed_password)
    except DuplicateEmailError:
        return jsonify({'status': 'error', 'message': 'Email already registered.'}), 400
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500

    return jsonify({'status': 'success', 'message': 'Account created successfully!'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required.'}), 400

    try:
        user = find_user_by_email(email)
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500

    password_is_correct = user and bcrypt.checkpw(
        password.encode('utf-8'),
        user['password_hash'].encode('utf-8')
    )

    if not password_is_correct:
        return jsonify({'status': 'error', 'message': 'Invalid email or password.'}), 401

    session['user_id'] = user['id']

    return jsonify({
        'status': 'success',
        'message': 'Login successful!',
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'is_admin': bool(user.get('is_admin', 0))
        }
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}

    email = (data.get('email') or '').strip()
    new_password = data.get('new_password') or data.get('password') or ''

    if not email or not new_password:
        return jsonify({'status': 'error', 'message': 'Email and new password are required.'}), 400

    if len(new_password) < 6:
        return jsonify({'status': 'error', 'message': 'New password must be at least 6 characters.'}), 400

    try:
        user = find_user_by_email(email)
        if not user:
            return jsonify({'status': 'error', 'message': 'No account found with this email address.'}), 404

        # Never store plain-text passwords - hash it first.
        hashed_password = bcrypt.hashpw(
            new_password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

        update_user_password(user['id'], hashed_password)
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500

    return jsonify({
        'status': 'success',
        'message': 'Password reset successful! You can now log in with your new password.'
    }), 200
